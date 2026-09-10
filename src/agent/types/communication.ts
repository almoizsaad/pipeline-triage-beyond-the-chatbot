export const MessagePriority = {
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
  CRITICAL: 3,
} as const;

export type MessagePriority = typeof MessagePriority[keyof typeof MessagePriority];

export interface AgentCommunicationMessage<T = unknown> {
  id: string;
  sender: string;
  receiver: string | 'all' | string[]; // agentId, 'all' for broadcast, role/capabilities for multicast
  timestamp: number;
  priority: MessagePriority;
  correlationId?: string;
  type: string;
  payload: T;
  metadata: Record<string, unknown>;
  acknowledged?: boolean;
}

export interface MessageEnvelope<T = unknown> {
  message: AgentCommunicationMessage<T>;
  attempts: number;
  lastAttempt?: number;
}

export interface IAgentMessageBus {
  publish(message: AgentCommunicationMessage): Promise<void>;
  subscribe(receiverId: string, callback: (message: AgentCommunicationMessage) => void): void;
  unsubscribe(receiverId: string, callback: (message: AgentCommunicationMessage) => void): void;
}

export interface IMessageRouter {
  route(message: AgentCommunicationMessage): Promise<void>;
}
