import type { AgentIdentity, AgentRole } from '../types/agent';
import { AgentRuntime } from './AgentRuntime';

export interface AgentDefinition {
  identity: AgentIdentity;
  runtime: AgentRuntime;
}

export class AgentRegistry {
  private agents: Map<string, AgentDefinition> = new Map();

  public register(identity: AgentIdentity, runtime: AgentRuntime): void {
    this.agents.set(identity.id, { identity, runtime });
  }

  public unregister(agentId: string): void {
    this.agents.delete(agentId);
  }

  public getAgent(agentId: string): AgentDefinition | undefined {
    return this.agents.get(agentId);
  }

  public listAgents(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }

  public findAgentsByRole(role: AgentRole): AgentDefinition[] {
    return this.listAgents().filter(a => a.identity.role === role);
  }

  public findAgentsByCapability(capability: string): AgentDefinition[] {
    return this.listAgents().filter(a => a.identity.capabilities.includes(capability));
  }

  public clear(): void {
    this.agents.clear();
  }
}
