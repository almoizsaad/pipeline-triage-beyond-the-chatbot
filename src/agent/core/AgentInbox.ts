import type { AgentCommunicationMessage } from '../types/communication';

export class AgentInbox {
  private queue: AgentCommunicationMessage[] = [];
  private handlers: Set<(message: AgentCommunicationMessage) => void> = new Set();

  public push(message: AgentCommunicationMessage): void {
    this.queue.push(message);
    // Sort by priority (descending) and then by timestamp (ascending)
    this.queue.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return a.timestamp - b.timestamp;
    });

    this.notifyHandlers();
  }

  public poll(): AgentCommunicationMessage | undefined {
    return this.queue.shift();
  }

  public peek(): AgentCommunicationMessage | undefined {
    return this.queue[0];
  }

  public onMessage(handler: (message: AgentCommunicationMessage) => void): void {
    this.handlers.add(handler);
  }

  public removeHandler(handler: (message: AgentCommunicationMessage) => void): void {
    this.handlers.delete(handler);
  }

  public clear(): void {
    this.queue = [];
  }

  public get size(): number {
    return this.queue.length;
  }

  private notifyHandlers(): void {
    if (this.queue.length > 0 && this.handlers.size > 0) {
      const message = this.poll();
      if (message) {
        // Break synchronous recursion by notifying in next tick
        setTimeout(() => {
          this.handlers.forEach(handler => {
            try {
              handler(message);
            } catch (error) {
              console.error('[AgentInbox] Error in message handler:', error);
            }
          });
        }, 0);
      }
    }
  }
}
