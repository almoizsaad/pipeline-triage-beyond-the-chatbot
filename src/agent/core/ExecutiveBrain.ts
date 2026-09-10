import { GoalManager } from './GoalManager';
import { PriorityManager } from './PriorityManager';
import { MissionScheduler } from './MissionScheduler';
import { CoordinatorAgent } from './CoordinatorAgent';
import { EventBus } from './EventBus';
import type { MissionGoal } from '../types/mission';
import { AgentEventType } from '../types/agent';

export class ExecutiveBrain {
  private readonly goalManager: GoalManager;
  private readonly priorityManager: PriorityManager;
  public readonly scheduler: MissionScheduler;
  private readonly coordinator: CoordinatorAgent;
  private readonly eventBus: EventBus;

  constructor(
    eventBus: EventBus,
    coordinator: CoordinatorAgent,
    goalManager?: GoalManager,
    priorityManager?: PriorityManager,
    scheduler?: MissionScheduler
  ) {
    this.eventBus = eventBus;
    this.coordinator = coordinator;
    this.goalManager = goalManager || new GoalManager(this.eventBus);
    this.priorityManager = priorityManager || new PriorityManager();
    this.scheduler = scheduler || new MissionScheduler(this.goalManager, this.priorityManager, this.eventBus);

    this.scheduler.setCallbacks({
      onStart: async (mission) => {
        await this.coordinator.startMission(mission);
      },
      onPause: async (missionId) => {
        await this.coordinator.pauseMission(missionId);
      },
      onResume: async (missionId) => {
        await this.coordinator.resumeMission(missionId);
      }
    });

    this.eventBus.subscribe('system:shutdown', async () => {
      await this.scheduler.shutdown();
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.eventBus.subscribe('agent:events', async (event) => {
      try {
        // 1. Listen for direct user messages to create missions (Bridge)
        if (event.type === AgentEventType.USER_MESSAGE) {
          const text = (event.payload as any).text;
          if (text) {
            this.createMission(text, {
              description: text,
              successCriteria: ['Task completed as requested'],
              priority: 'medium'
            }).catch(err => console.error('[ExecutiveBrain] Failed to create mission from USER_MESSAGE:', err));
          }
        }

        // 2. Listen for mission completions or failures to trigger rescheduling
        if (event.type === AgentEventType.AGENT_UPDATE) {
          const payload = event.payload as Record<string, unknown>;
          if (payload.status === 'PLAN_COMPLETED' || payload.status === 'PLAN_FAILED') {
            await this.handlePlanResult(payload);
          }
        }
      } catch (error) {
        console.error('[ExecutiveBrain] Error processing agent event:', error);
      }
    });
  }

  public async createMission(title: string, goal: MissionGoal, context: Record<string, unknown> = {}): Promise<string> {
    await this.goalManager.init();
    const mission = await this.goalManager.createMission(title, goal, context);
    try {
      await this.scheduler.schedule();
    } catch (error) {
      console.error(`[ExecutiveBrain] Critical failure during mission scheduling for "${title}":`, error);
      await this.goalManager.updateMissionStatus(mission.id, 'failed');
    }
    return mission.id;
  }

  public async cancelMission(missionId: string): Promise<void> {
    try {
      await this.scheduler.cancelMission(missionId);
      await this.scheduler.schedule();
    } catch (error) {
      console.error(`[ExecutiveBrain] Error during mission cancellation for "${missionId}":`, error);
    }
  }

  private async handlePlanResult(payload: Record<string, unknown>): Promise<void> {
    const missionId = payload.missionId as string;
    if (!missionId) return;

    const mission = this.goalManager.getMission(missionId);
    if (!mission) return;

    try {
      if (payload.status === 'PLAN_COMPLETED') {
        await this.goalManager.updateMissionStatus(missionId, 'completed');
        
        // Synthesize Outcome
        const mission = this.goalManager.getMission(missionId);
        if (mission) {
          const outcome = {
            success: true,
            summary: `Mission "${mission.title}" completed successfully. All operational plans were executed and verified.`,
            deliverables: mission.timeline
              .filter(e => e.type === 'knowledge')
              .map(e => e.title),
            lessonsLearned: mission.reflections?.[0]?.lessonsLearned || [],
            timestamp: Date.now()
          };
          
          this.eventBus.publish('agent:events', {
            type: 'MISSION_COMPLETED' as any,
            payload: { missionId, outcome },
            timestamp: Date.now()
          });
        }

        console.info(`[ExecutiveBrain] Mission completed: ${mission?.title} (${missionId})`);
      } else if (payload.status === 'PLAN_FAILED') {
        const retries = (mission.context.retries as number || 0);
        if (retries < 2) {
          console.warn(`[ExecutiveBrain] Mission failed: ${mission.title} (${missionId}). Retrying (attempt ${retries + 1})...`);
          mission.context.retries = retries + 1;
          await this.goalManager.updateMissionStatus(missionId, 'idle'); // Put back to idle for rescheduling
        } else {
          console.error(`[ExecutiveBrain] Mission failed after retries: ${mission.title} (${missionId})`);
          await this.goalManager.updateMissionStatus(missionId, 'failed');
        }
      }

      await this.scheduler.schedule();
    } catch (error) {
      console.error(`[ExecutiveBrain] Error in handlePlanResult for mission ${missionId}:`, error);
    }
  }

  public getGoalManager(): GoalManager {
    return this.goalManager;
  }

  public getCoordinator(): CoordinatorAgent {
    return this.coordinator;
  }

  public get knowledgeGraph(): any {
    return this.coordinator.knowledgeGraph;
  }
}
