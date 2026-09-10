import type { AgentProtocolEvent } from '../protocol/events';
import type { AgentProtocolAction } from '../protocol/actions';
import type { IUnifiedEventBus } from '../types/events';
import { globalUnifiedBus } from './UnifiedEventBus';

/**
 * A union type of all possible messages that can be sent over the EventBus.
 */
export type AgentMessage = AgentProtocolEvent | AgentProtocolAction;

/**
 * A callback function that handles a message.
 */
export type MessageListener<T> = (message: T) => void;

/**
 * EventBus compatibility adapter that wraps UnifiedEventBus.
 */
export class EventBus<M extends { type: string; payload: unknown } = AgentMessage> {
  private unifiedBus: IUnifiedEventBus;

  constructor(unifiedBus: IUnifiedEventBus = globalUnifiedBus) {
    this.unifiedBus = unifiedBus;
  }

  /**
   * Subscribes to a specific topic.
   * Maps old topic names to unified namespaces.
   */
  public subscribe<T extends M>(
    topic: string,
    listener: MessageListener<T>
  ): () => void {
    const pattern = this.mapTopicToPattern(topic);
    return this.unifiedBus.subscribe(pattern, (event) => {
      listener(event.payload as T);
    });
  }

  /**
   * Unsubscribes a listener from a topic.
   */
  public unsubscribe<T extends M>(
    topic: string,
    listener: MessageListener<T>
  ): void {
    void topic;
    void listener;
    // In current UnifiedEventBus, we might need a more complex tracking 
    // if we want to support manual unsubscribe by function ref.
    // For now, the return function from subscribe handles it.
    console.warn('[EventBus] Manual unsubscribe by function reference is deprecated. Use the function returned by subscribe().');
  }

  /**
   * Publishes a message to all subscribers of a topic.
   */
  public publish<T extends M>(topic: string, message: T): void {
    const topicPath = this.mapTopicToPattern(topic);
    this.unifiedBus.publish({
      type: topicPath,
      payload: message,
      timestamp: Date.now(),
      source: 'legacy_event_bus'
    });
  }

  /**
   * Maps legacy topics to unified namespaces.
   */
  private mapTopicToPattern(topic: string): string {
    if (topic === 'agent:events') return 'agent.events';
    if (topic === 'agent:actions') return 'agent.actions';
    if (topic === 'agent:communication') return 'agent.communication';
    if (topic === 'workspace:events') return 'workspace.events';
    
    // Default fallback: replace colon with dot
    return topic.replace(':', '.');
  }

  public clear(): void {
    this.unifiedBus.clear();
  }
}

// Export a singleton instance for global use
export const globalEventBus = new EventBus();
