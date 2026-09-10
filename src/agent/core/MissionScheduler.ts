import { GoalManager } from './GoalManager';
import { PriorityManager } from './PriorityManager';
import type { Mission } from '../types/mission';
import { EventBus } from './EventBus';
import { AgentEventType } from '../types/agent';
import { MissionQueue } from './MissionQueue';

/**
 * MissionScheduler manages the mission queue, priorities, and autonomous execution state.
 */
export class MissionScheduler {
  private readonly maxConcurrentMissions = 3;
  private onStart?: (mission: Mission) => Promise<void>;
  private onPause?: (missionId: string) => Promise<void>;
  private onResume?: (missionId: string) => Promise<void>;

  private readonly goalManager: GoalManager;
  private readonly priorityManager: PriorityManager;
  private readonly eventBus: EventBus;
  private readonly queue: MissionQueue;
  private isScheduling = false;

  constructor(
    goalManager: GoalManager,
    priorityManager: PriorityManager,
    eventBus: EventBus
  ) {
    this.goalManager = goalManager;
    this.priorityManager = priorityManager;
    this.eventBus = eventBus;
    this.queue = new MissionQueue();
  }

  public setCallbacks(callbacks: {
    onStart: (mission: Mission) => Promise<void>;
    onPause: (missionId: string) => Promise<void>;
    onResume: (missionId: string) => Promise<void>;
  }): void {
    this.onStart = callbacks.onStart;
    this.onPause = callbacks.onPause;
    this.onResume = callbacks.onResume;
  }

  public async schedule(): Promise<void> {
    if (this.isScheduling) return;
    this.isScheduling = true;

    try {
      const allMissions = this.goalManager.getAllMissions();
      
      // Phase 8.9: Self-healing - Detect missions stuck in 'running' status
      this.healStuckMissions(allMissions);

      const runningMissions = allMissions.filter(m => m.status === 'running');
      const pendingMissions = allMissions.filter(m => m.status === 'idle' || m.status === 'paused');

      // Sync queue with pending missions
      this.queue.clear();
      pendingMissions.forEach(m => this.queue.enqueue(m));

      const sortedPending = this.queue.getAll();

      for (const mission of sortedPending) {
        if (runningMissions.length < this.maxConcurrentMissions) {
          if (mission.status === 'paused') {
            await this.resumeMission(mission);
          } else {
            await this.startMission(mission);
          }
          runningMissions.push(mission);
          this.queue.remove(mission.id);
        } else {
          // Check if we should interrupt a running mission (preemption)
          const sortedRunning = this.priorityManager.sortMissionsByPriority(runningMissions);
          const lowestPriorityRunning = sortedRunning[sortedRunning.length - 1];

          if (this.priorityManager.shouldInterrupt(lowestPriorityRunning, mission)) {
            console.info(`[MissionScheduler] Preempting mission: ${lowestPriorityRunning.title} for higher priority: ${mission.title}`);
            await this.pauseMission(lowestPriorityRunning);
            
            if (mission.status === 'paused') {
              await this.resumeMission(mission);
            } else {
              await this.startMission(mission);
            }
            
            // Update lists
            const index = runningMissions.indexOf(lowestPriorityRunning);
            if (index > -1) runningMissions.splice(index, 1);
            runningMissions.push(mission);
            this.queue.remove(mission.id);
          }
        }
      }

      this.eventBus.publish('system:telemetry', {
        type: 'SCHEDULER_CYCLE_COMPLETE',
        payload: {
          running: runningMissions.length,
          queued: this.queue.length
        },
        timestamp: Date.now()
      } as any);

    } finally {
      this.isScheduling = false;
    }
  }

  private healStuckMissions(missions: Mission[]): void {
    const STUCK_THRESHOLD = 600000; // 10 minutes for long-running jobs
    const now = Date.now();

    missions.forEach(m => {
      if (m.status === 'running' && (now - m.updatedAt > STUCK_THRESHOLD)) {
        console.warn(`[MissionScheduler] Detected stuck mission: ${m.title}. Resetting for recovery.`);
        this.goalManager.updateMissionStatus(m.id, 'idle');
        
        this.eventBus.publish('system:anomaly', {
          type: 'STUCK_MISSION_RECOVERY',
          missionId: m.id,
          timestamp: now
        } as any);
      }
    });
  }

  private async startMission(mission: Mission): Promise<void> {
    console.info(`[MissionScheduler] Starting mission: ${mission.title} (${mission.id})`);
    await this.goalManager.updateMissionStatus(mission.id, 'running');
    
    try {
      if (this.onStart) {
        await this.onStart(mission);
      }
    } catch (error) {
      console.error(`[MissionScheduler] Error in onStart for mission ${mission.id}:`, error);
      await this.goalManager.updateMissionStatus(mission.id, 'failed');
      this.eventBus.publish('agent:events', {
        type: AgentEventType.AGENT_UPDATE,
        payload: { 
          missionId: mission.id, 
          status: 'PLAN_FAILED',
          error: error instanceof Error ? error.message : String(error)
        },
        timestamp: Date.now()
      });
      return;
    }
  }

  private async pauseMission(mission: Mission): Promise<void> {
    console.info(`[MissionScheduler] Pausing mission: ${mission.title} (${mission.id})`);
    await this.goalManager.updateMissionStatus(mission.id, 'paused');

    try {
      if (this.onPause) {
        await this.onPause(mission.id);
      }
    } catch (error) {
      console.error(`[MissionScheduler] Error in onPause for mission ${mission.id}:`, error);
    }
  }

  private async resumeMission(mission: Mission): Promise<void> {
    console.info(`[MissionScheduler] Resuming mission: ${mission.title} (${mission.id})`);
    await this.goalManager.updateMissionStatus(mission.id, 'running');

    try {
      if (this.onResume) {
        await this.onResume(mission.id);
      }
    } catch (error) {
      console.error(`[MissionScheduler] Error in onResume for mission ${mission.id}:`, error);
      await this.goalManager.updateMissionStatus(mission.id, 'failed');
    }
  }

  public async cancelMission(missionId: string): Promise<void> {
    const mission = this.goalManager.getMission(missionId);
    if (mission) {
      console.info(`[MissionScheduler] Cancelling mission: ${mission.title} (${mission.id})`);
      await this.goalManager.updateMissionStatus(missionId, 'cancelled');
    }
  }

  public async shutdown(): Promise<void> {
    const runningMissions = this.goalManager.getAllMissions().filter(m => m.status === 'running');
    console.warn(`[MissionScheduler] Emergency shutdown: Pausing ${runningMissions.length} running missions.`);
    
    for (const mission of runningMissions) {
      await this.pauseMission(mission);
    }
  }
}
