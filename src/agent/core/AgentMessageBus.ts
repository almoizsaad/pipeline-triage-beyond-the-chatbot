import type { AgentCommunicationMessage, IAgentMessageBus } from '../types/communication';
import { SystemTelemetryType } from '../types/agent';
import { EventBus } from './EventBus';
import type { AgentMessage as EventBusMessage } from './EventBus';

export class AgentMessageBus implements IAgentMessageBus {
  private eventBus: EventBus;
  private subscribers: Map<string, Array<(message: AgentCommunicationMessage) => void>> = new Map();
  private stats = {
    totalMessages: 0,
    activeSubscribers: 0,
    lastMessageTimestamp: 0,
    messageRates: [] as number[],
  };
  private lastStatsEmit = 0;
  private statsThrottleMs = 100;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    
    // Subscribe to a generic communication topic on the underlying event bus
    this.eventBus.subscribe('agent:communication', (message: EventBusMessage) => {
      this.notifySubscribers(message as unknown as AgentCommunicationMessage);
      this.updateStats();
    });
  }

  private updateStats() {
    this.stats.totalMessages++;
    this.stats.lastMessageTimestamp = Date.now();
    this.stats.activeSubscribers = this.subscribers.size;
    
    // Emit telemetry with throttling
    if (Date.now() - this.lastStatsEmit > this.statsThrottleMs) {
      this.eventBus.publish('system:telemetry', {
        type: SystemTelemetryType.MESSAGE_BUS_STATS,
        payload: { ...this.stats },
        timestamp: Date.now()
      });
      this.lastStatsEmit = Date.now();
    }
  }

  public async publish(message: AgentCommunicationMessage): Promise<void> {
    this.eventBus.publish('agent:communication', message as unknown as EventBusMessage);
  }

  public subscribe(receiverId: string, callback: (message: AgentCommunicationMessage) => void): void {
    const subs = this.subscribers.get(receiverId) || [];
    subs.push(callback);
    this.subscribers.set(receiverId, subs);
  }

  public unsubscribe(receiverId: string, callback: (message: AgentCommunicationMessage) => void): void {
    const subs = this.subscribers.get(receiverId);
    if (subs) {
      this.subscribers.set(receiverId, subs.filter(s => s !== callback));
    }
  }

  private notifySubscribers(message: AgentCommunicationMessage): void {
    // Handle broadcast
    if (message.receiver === 'all') {
      for (const callbacks of this.subscribers.values()) {
        callbacks.forEach(cb => cb(message));
      }
      return;
    }

    // Handle multicast
    if (Array.isArray(message.receiver)) {
      message.receiver.forEach(receiverId => {
        const callbacks = this.subscribers.get(receiverId);
        if (callbacks) {
          callbacks.forEach(cb => cb(message));
        }
      });
      return;
    }

    // Handle direct message
    const callbacks = this.subscribers.get(message.receiver);
    if (callbacks) {
      callbacks.forEach(cb => cb(message));
    }
  }
}
