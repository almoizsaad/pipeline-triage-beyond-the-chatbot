export type EventNamespace = 
  | 'agent' 
  | 'workspace' 
  | 'memory' 
  | 'planner' 
  | 'knowledge' 
  | 'reflection' 
  | 'workflow';

export interface UnifiedEvent<T = unknown> {
  type: string; // e.g. "agent.message_received", "workflow.task_started"
  payload: T;
  timestamp: number;
  source?: string;
  metadata?: Record<string, unknown>;
}

export type UnifiedEventListener<T = unknown> = (event: UnifiedEvent<T>) => void;

export interface IUnifiedEventBus {
  /**
   * Publishes an event to the bus.
   * @param event The event object to publish.
   */
  publish<T>(event: UnifiedEvent<T>): void;

  /**
   * Subscribes to events matching a pattern.
   * Patterns can be:
   * - Specific event type: "agent.user_message"
   * - Namespace wildcard: "agent.*"
   * - Global wildcard: "*"
   * @param pattern The pattern to match event types.
   * @param listener The callback function.
   * @returns An unsubscribe function.
   */
  subscribe(pattern: string, listener: UnifiedEventListener): () => void;

  /**
   * Unsubscribes a listener from a pattern.
   */
  unsubscribe(pattern: string, listener: UnifiedEventListener): void;

  /**
   * Clears all subscriptions.
   */
  clear(): void;
}
