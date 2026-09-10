import { EventBus } from './EventBus';
import { ExecutiveBrain } from './ExecutiveBrain';
import { Heartbeat } from './Heartbeat';
import { AgentEventType } from '../types/agent';
import { Watcher } from './watchers/Watcher';
import { GoalWatcher } from './watchers/GoalWatcher';
import { SystemHealthWatcher } from './watchers/SystemHealthWatcher';
import { KnowledgeWatcher } from './watchers/KnowledgeWatcher';
import { APIMetricsManager } from './APIMetricsManager';
import { KnowledgeGraph } from '../knowledge/KnowledgeGraph';

/**
 * BackgroundRuntime orchestrates the continuous autonomous execution of the Agent OS.
 */
export class BackgroundRuntime {
  private eventBus: EventBus;
  private brain: ExecutiveBrain;
  private heartbeat: Heartbeat;
  private isRunning = false;
  private watchers: Watcher[] = [];
  private loopInterval: NodeJS.Timeout | null = null;
  private readonly LOOP_TICK_MS = 60000; // 1 minute core loop

  constructor(eventBus: EventBus, brain: ExecutiveBrain) {
    this.eventBus = eventBus;
    this.brain = brain;
    this.heartbeat = new Heartbeat(eventBus);
    
    this.setupWatchers();
    this.setupListeners();
  }

  private setupWatchers(): void {
    const metricsManager = APIMetricsManager.getInstance(this.eventBus);
    const knowledgeGraph = (this.brain as any).knowledgeGraph || new KnowledgeGraph();
    
    this.watchers = [
      new GoalWatcher(this.eventBus, this.brain),
      new SystemHealthWatcher(this.eventBus, metricsManager),
      new KnowledgeWatcher(this.eventBus, knowledgeGraph, this.brain)
    ];
  }

  private setupListeners(): void {
    this.eventBus.subscribe('system:heartbeat', () => {
      this.monitorHealth();
    });

    // Recovery trigger on explicit request
    this.eventBus.subscribe('system:command', async (cmd: any) => {
      if (cmd.type === 'RECOVER_MISSIONS') {
        await this.recoverMissions();
      }
    });
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    
    console.info('[BackgroundRuntime] Continuous autonomous runtime starting...');
    this.isRunning = true;
    this.heartbeat.start();
    
    // Start all watchers
    await Promise.all(this.watchers.map(w => w.start()));
    
    // Initial mission scheduling (Recovery)
    await this.recoverMissions();

    // Start core autonomous loop
    this.loopInterval = setInterval(() => this.autonomousLoop(), this.LOOP_TICK_MS);
  }

  public async stop(): Promise<void> {
    this.isRunning = false;
    this.heartbeat.stop();
    
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }

    // Stop all watchers
    this.watchers.forEach(w => w.stop());
    
    console.info('[BackgroundRuntime] Continuous runtime stopped.');
  }

  /**
   * The core autonomous loop ensures the system state is synchronized
   * and triggers high-level background tasks.
   */
  private async autonomousLoop(): Promise<void> {
    if (!this.isRunning) return;

    try {
      console.debug('[BackgroundRuntime] Core autonomous loop tick.');
      
      // 1. Trigger scheduler to process queue
      await (this.brain as any).scheduler?.schedule();
      
      // 2. Perform periodic state cleanup or consolidation if needed
      
      this.eventBus.publish('system:telemetry', {
        type: 'AUTONOMOUS_LOOP_TICK',
        timestamp: Date.now()
      } as any);

    } catch (error) {
      console.error('[BackgroundRuntime] Error in autonomous loop:', error);
    }
  }

  private async recoverMissions(): Promise<void> {
    console.info('[BackgroundRuntime] Recovering missions from persistence...');
    const goalManager = this.brain.getGoalManager();
    await goalManager.init();
    
    const missions = goalManager.getAllMissions();
    
    let recoveredCount = 0;
    missions.forEach(m => {
      // If a mission was 'running' but the runtime was restarted, 
      // it might be in an inconsistent state. Resetting to 'idle' 
      // allows the scheduler to resume it correctly.
      if (m.status === 'running') {
        console.warn(`[BackgroundRuntime] Mission "${m.title}" was interrupted. Resetting for resumption.`);
        goalManager.updateMissionStatus(m.id, 'idle');
        recoveredCount++;
      }
    });

    if (recoveredCount > 0) {
      console.info(`[BackgroundRuntime] Successfully recovered ${recoveredCount} interrupted missions.`);
    }

    // Trigger immediate scheduling
    await (this.brain as any).scheduler?.schedule();
  }

  private monitorHealth(): void {
    const goalManager = this.brain.getGoalManager();
    const active = goalManager.getActiveMissions();
    
    if (active.length > 0) {
      this.eventBus.publish('agent:events', {
        type: AgentEventType.AGENT_UPDATE,
        payload: { 
          status: 'monitoring', 
          message: `Active autonomous missions: ${active.length}`,
          activeMissionIds: active.map(m => m.id)
        },
        timestamp: Date.now()
      });
    }
  }
}
