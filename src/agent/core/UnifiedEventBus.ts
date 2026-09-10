import type { IUnifiedEventBus, UnifiedEvent, UnifiedEventListener } from '../types/events';

export class UnifiedEventBus implements IUnifiedEventBus {
  private listeners: Map<string, Set<UnifiedEventListener>> = new Map();

  public publish<T>(event: UnifiedEvent<T>): void {
    const eventType = event.type;
    const parts = eventType.split('.');
    const namespace = parts[0];

    // 1. Direct matches (e.g. "agent.user_message")
    this.notify(eventType, event);

    // 2. Namespace wildcard matches (e.g. "agent.*")
    if (namespace) {
      this.notify(`${namespace}.*`, event);
    }

    // 3. Global wildcard matches ("*")
    this.notify('*', event);
  }

  public subscribe(pattern: string, listener: UnifiedEventListener): () => void {
    if (!this.listeners.has(pattern)) {
      this.listeners.set(pattern, new Set());
    }
    this.listeners.get(pattern)!.add(listener);

    return () => this.unsubscribe(pattern, listener);
  }

  public unsubscribe(pattern: string, listener: UnifiedEventListener): void {
    const patternListeners = this.listeners.get(pattern);
    if (patternListeners) {
      patternListeners.delete(listener);
      if (patternListeners.size === 0) {
        this.listeners.delete(pattern);
      }
    }
  }

  public clear(): void {
    this.listeners.clear();
  }

  private notify(pattern: string, event: UnifiedEvent): void {
    const patternListeners = this.listeners.get(pattern);
    if (patternListeners) {
      patternListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`[UnifiedEventBus] Error in listener for pattern "${pattern}":`, error);
        }
      });
    }
  }
}

// Global instance
export const globalUnifiedBus = new UnifiedEventBus();
