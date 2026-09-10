import type { AgentCommunicationMessage, MessagePriority } from '../types/communication';
import { MessagePriority as MessagePriorityValues } from '../types/communication';
import { AgentInbox } from './AgentInbox';
import { AgentOutbox } from './AgentOutbox';

export class AgentChannel {
  private agentId: string;
  private inbox: AgentInbox;
  private outbox: AgentOutbox;

  constructor(
    agentId: string,
    inbox: AgentInbox,
    outbox: AgentOutbox
  ) {
    this.agentId = agentId;
    this.inbox = inbox;
    this.outbox = outbox;
  }

  public async broadcast(type: string, payload: unknown, priority: MessagePriority = MessagePriorityValues.NORMAL): Promise<void> {
    await this.sendMessage('all', type, payload, priority);
  }

  public async multicast(receivers: string[], type: string, payload: unknown, priority: MessagePriority = MessagePriorityValues.NORMAL): Promise<void> {
    await this.sendMessage(receivers, type, payload, priority);
  }

  public async sendDirect(receiverId: string, type: string, payload: unknown, priority: MessagePriority = MessagePriorityValues.NORMAL): Promise<void> {
    await this.sendMessage(receiverId, type, payload, priority);
  }

  public async request<T = unknown>(receiverId: string, type: string, payload: unknown, timeout = 5000): Promise<T> {
    const correlationId = crypto.randomUUID();
    const messageId = crypto.randomUUID();

    const requestMessage: AgentCommunicationMessage = {
      id: messageId,
      sender: this.agentId,
      receiver: receiverId,
      timestamp: Date.now(),
      priority: MessagePriorityValues.HIGH,
      correlationId,
      type,
      payload,
      metadata: {},
    };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.inbox.removeHandler(responseHandler);
        reject(new Error(`Request timed out after ${timeout}ms`));
      }, timeout);

      const responseHandler = (message: AgentCommunicationMessage) => {
        if (message.correlationId === correlationId && message.type === `${type}_RESPONSE`) {
          clearTimeout(timer);
          this.inbox.removeHandler(responseHandler);
          resolve(message.payload as T);
        }
      };

      this.inbox.onMessage(responseHandler);
      this.outbox.send(requestMessage);
    });
  }

  public async reply(originalMessage: AgentCommunicationMessage, payload: unknown): Promise<void> {
    const replyMessage: AgentCommunicationMessage = {
      id: crypto.randomUUID(),
      sender: this.agentId,
      receiver: originalMessage.sender,
      timestamp: Date.now(),
      priority: originalMessage.priority,
      correlationId: originalMessage.correlationId,
      type: `${originalMessage.type}_RESPONSE`,
      payload,
      metadata: {},
    };
    await this.outbox.send(replyMessage);
  }

  public onMessage(handler: (message: AgentCommunicationMessage) => void): void {
    this.inbox.onMessage(handler);
  }

  public receive(message: AgentCommunicationMessage): void {
    this.inbox.push(message);
  }

  private async sendMessage(receiver: string | string[], type: string, payload: unknown, priority: MessagePriority): Promise<void> {
    const message: AgentCommunicationMessage = {
      id: crypto.randomUUID(),
      sender: this.agentId,
      receiver,
      timestamp: Date.now(),
      priority,
      type,
      payload,
      metadata: {},
    };
    await this.outbox.send(message);
  }
}
