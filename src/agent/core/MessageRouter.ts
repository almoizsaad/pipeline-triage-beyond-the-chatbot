import type { AgentCommunicationMessage, IMessageRouter, IAgentMessageBus } from '../types/communication';
import type { AgentRole } from '../types/agent';
import { AgentRegistry } from './AgentRegistry';

export class MessageRouter implements IMessageRouter {
  private registry: AgentRegistry;
  private messageBus: IAgentMessageBus;

  constructor(registry: AgentRegistry, messageBus: IAgentMessageBus) {
    this.registry = registry;
    this.messageBus = messageBus;
  }

  public async route(message: AgentCommunicationMessage): Promise<void> {
    if (message.receiver === 'all') {
      await this.messageBus.publish(message);
      return;
    }

    if (Array.isArray(message.receiver)) {
      // Multicast by IDs or roles/capabilities
      const resolvedIds = this.resolveRecipients(message.receiver);
      const multicastMessage = { ...message, receiver: resolvedIds };
      await this.messageBus.publish(multicastMessage);
      return;
    }

    // Direct message
    await this.messageBus.publish(message);
  }

  private resolveRecipients(receivers: string[]): string[] {
    const ids = new Set<string>();
    
    receivers.forEach(receiver => {
      // If it's an agent ID, add it
      if (this.registry.getAgent(receiver)) {
        ids.add(receiver);
      } else {
        // Try resolving by role
        const agentsByRole = this.registry.findAgentsByRole(receiver as unknown as AgentRole);
        if (agentsByRole.length > 0) {
          agentsByRole.forEach(a => ids.add(a.identity.id));
        } else {
          // Try resolving by capability
          const agentsByCap = this.registry.findAgentsByCapability(receiver);
          agentsByCap.forEach(a => ids.add(a.identity.id));
        }
      }
    });

    return Array.from(ids);
  }
}
