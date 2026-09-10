import { EventBus } from './EventBus';

/**
 * Heartbeat service ensures the system is alive and triggers periodic maintenance.
 */
export class Heartbeat {
  private eventBus: EventBus;
  private interval: NodeJS.Timeout | null = null;
  private readonly TICK_MS = 5000; // 5 seconds

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  public start(): void {
    if (this.interval) return;
    
    console.info('[Heartbeat] System heartbeat started.');
    this.interval = setInterval(() => this.tick(), this.TICK_MS);
  }

  public stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.info('[Heartbeat] System heartbeat stopped.');
    }
  }

  private tick(): void {
    this.eventBus.publish('system:heartbeat', {
      timestamp: Date.now(),
      status: 'alive'
    } as any);
  }
}
