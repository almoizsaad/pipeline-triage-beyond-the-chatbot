import { EventBus } from '../core/EventBus';

export interface Watcher {
  name: string;
  start(): Promise<void>;
  stop(): void;
}

export abstract class BaseWatcher implements Watcher {
  public abstract readonly name: string;
  protected eventBus: EventBus;
  protected isRunning = false;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  public abstract start(): Promise<void>;

  public stop(): void {
    this.isRunning = false;
    console.info(`[Watcher] ${this.name} stopped.`);
  }
}
