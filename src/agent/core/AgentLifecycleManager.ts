import type { AgentIdentity, AgentRole, AgentLifecycleEvent } from '../types/agent';
import { AgentEventType } from '../types/agent';
import { AgentRuntime } from './AgentRuntime';
import { AgentRegistry } from './AgentRegistry';
import { EventBus } from './EventBus';

export class AgentLifecycleManager {
  private registry: AgentRegistry;
  private eventBus: EventBus;
  private runtimeFactory: (identity: AgentIdentity) => AgentRuntime;

  constructor(
    registry: AgentRegistry,
    eventBus: EventBus,
    runtimeFactory: (identity: AgentIdentity) => AgentRuntime
  ) {
    this.registry = registry;
    this.eventBus = eventBus;
    this.runtimeFactory = runtimeFactory;
  }

  public spawnAgent(name: string, role: AgentRole, capabilities: string[], metadata?: Record<string, unknown>): AgentRuntime {
    const identity: AgentIdentity = {
      id: crypto.randomUUID(),
      name,
      role,
      capabilities,
      metadata
    };

    const runtime = this.runtimeFactory(identity);
    this.registry.register(identity, runtime);

    this.emitLifecycleEvent(identity, 'spawned');
    return runtime;
  }

  public destroyAgent(agentId: string): void {
    const agent = this.registry.getAgent(agentId);
    if (agent) {
      // Cleanup runtime if needed
      this.registry.unregister(agentId);
      this.emitLifecycleEvent(agent.identity, 'destroyed');
    }
  }

  public pauseAgent(agentId: string): void {
    const agent = this.registry.getAgent(agentId);
    if (agent) {
      agent.runtime.pause();
      this.emitLifecycleEvent(agent.identity, 'paused');
    }
  }

  public resumeAgent(agentId: string): void {
    const agent = this.registry.getAgent(agentId);
    if (agent) {
      agent.runtime.resume();
      this.emitLifecycleEvent(agent.identity, 'resumed');
    }
  }

  public restartAgent(agentId: string): void {
    const agent = this.registry.getAgent(agentId);
    if (agent) {
      agent.runtime.reset();
      this.emitLifecycleEvent(agent.identity, 'restarted');
    }
  }

  private emitLifecycleEvent(identity: AgentIdentity, action: AgentLifecycleEvent['payload']['action']): void {
    const event: AgentLifecycleEvent = {
      type: AgentEventType.AGENT_LIFECYCLE,
      timestamp: Date.now(),
      payload: {
        agentId: identity.id,
        action,
        identity,
      },
    };
    this.eventBus.publish('agent:lifecycle', event);
  }
}
