import type { AgentProtocolEvent, Plan } from '../types/agent';

/**
 * SessionMemory handles short-term context for the current conversation.
 */
export class SessionMemory {
  private events: AgentProtocolEvent[] = [];
  private context: Record<string, unknown> = {};
  private currentGoal: string | null = null;
  private activePlan: Plan | null = null;
  private executionState: Record<string, unknown> | null = null;

  public setGoal(goal: string): void {
    this.currentGoal = goal;
  }

  public getGoal(): string | null {
    return this.currentGoal;
  }

  public setPlan(plan: Plan): void {
    this.activePlan = plan;
  }

  public getPlan(): Plan | null {
    return this.activePlan;
  }

  public setExecutionState(state: Record<string, unknown>): void {
    this.executionState = state;
  }

  public getExecutionState(): Record<string, unknown> | null {
    return this.executionState;
  }

  public addEvent(event: AgentProtocolEvent): void {
    this.events.push({
      ...event,
      timestamp: Date.now()
    } as AgentProtocolEvent);
    // Keep only last 100 events in session
    if (this.events.length > 100) {
      this.events.shift();
    }
  }

  public setContext(key: string, value: unknown): void {
    this.context[key] = value;
  }

  public getContext(key: string): unknown {
    return this.context[key];
  }

  public getAllEvents(): AgentProtocolEvent[] {
    return [...this.events];
  }

  public clear(): void {
    this.events = [];
    this.context = {};
    this.currentGoal = null;
    this.activePlan = null;
    this.executionState = null;
  }
}
