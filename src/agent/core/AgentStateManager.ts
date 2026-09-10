import type { AgentState, AgentStatus } from '../types/agent';
import { AgentRegistry } from './AgentRegistry';

export class AgentStateManager {
  private registry: AgentRegistry;

  constructor(registry: AgentRegistry) {
    this.registry = registry;
  }

  public getAgentState(agentId: string): AgentState | undefined {
    const agent = this.registry.getAgent(agentId);
    return agent?.runtime.getState();
  }

  public getAgentStatus(agentId: string): AgentStatus | undefined {
    const agent = this.registry.getAgent(agentId);
    return agent?.runtime.getStatus();
  }

  public getAllAgentStates(): Record<string, AgentState> {
    const states: Record<string, AgentState> = {};
    for (const agent of this.registry.listAgents()) {
      states[agent.identity.id] = agent.runtime.getState();
    }
    return states;
  }

  public getSystemMetrics(): Record<string, unknown> {
    const metrics: Record<string, unknown> = {};
    for (const agent of this.registry.listAgents()) {
      metrics[agent.identity.id] = agent.runtime.getMetrics();
    }
    return metrics;
  }
}
