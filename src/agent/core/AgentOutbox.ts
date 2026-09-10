import type { AgentCommunicationMessage, MessageEnvelope, IMessageRouter } from '../types/communication';

export class AgentOutbox {
  private queue: MessageEnvelope[] = [];
  private router: IMessageRouter;
  private maxAttempts = 3;
  private retryDelay = 1000;

  constructor(router: IMessageRouter) {
    this.router = router;
  }

  public async send(message: AgentCommunicationMessage): Promise<void> {
    const envelope: MessageEnvelope = {
      message,
      attempts: 0,
    };
    this.queue.push(envelope);
    await this.processNext();
  }

  private async processNext(): Promise<void> {
    const envelope = this.queue.find(e => e.attempts < this.maxAttempts);
    if (!envelope) return;

    try {
      envelope.attempts++;
      envelope.lastAttempt = Date.now();
      await this.router.route(envelope.message);
      // Remove from queue on success
      this.queue = this.queue.filter(e => e.message.id !== envelope.message.id);
    } catch (error) {
      console.error(`[AgentOutbox] Failed to send message ${envelope.message.id}:`, error);
      if (envelope.attempts < this.maxAttempts) {
        setTimeout(() => this.processNext(), this.retryDelay * envelope.attempts);
      }
    }
  }

  public get pendingCount(): number {
    return this.queue.length;
  }
}
