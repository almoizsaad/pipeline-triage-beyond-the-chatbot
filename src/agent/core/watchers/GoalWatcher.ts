import { BaseWatcher } from './Watcher';
import { EventBus } from '../EventBus';
import { AgentEventType } from '../../types/agent';
import { ExecutiveBrain } from '../ExecutiveBrain';

/**
 * GoalWatcher monitors mission lifecycle events and triggers autonomous scheduling.
 */
export class GoalWatcher extends BaseWatcher {
  public readonly name = 'GoalWatcher';
  private brain: ExecutiveBrain;

  constructor(eventBus: EventBus, brain: ExecutiveBrain) {
    super(eventBus);
    this.brain = brain;
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    console.info(`[Watcher] ${this.name} started.`);

    // Listen for new missions to trigger immediate scheduling
    this.eventBus.subscribe('agent:events', async (event: any) => {
      if (event.type === AgentEventType.MISSION_CREATED) {
        console.info(`[GoalWatcher] New mission detected: ${event.payload.mission.id}. Triggering scheduler.`);
        await (this.brain as any).scheduler?.schedule();
      }
    });

    // Periodically check for missions that need scheduling (in case events were missed)
    this.startPolling();
  }

  private startPolling(): void {
    const POLLING_INTERVAL = 30000; // 30 seconds
    
    const poll = async () => {
      if (!this.isRunning) return;
      
      try {
        await (this.brain as any).scheduler?.schedule();
      } catch (error) {
        console.error(`[GoalWatcher] Error during autonomous scheduling:`, error);
      }
      
      setTimeout(poll, POLLING_INTERVAL);
    };

    poll();
  }
}
