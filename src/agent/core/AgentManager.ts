import type { AgentIdentity, AgentRole, AgentState, AgentStatus } from '../types/agent';
import type { AgentDefinition } from './AgentRegistry';
import { AgentRegistry } from './AgentRegistry';
import { AgentLifecycleManager } from './AgentLifecycleManager';
import { AgentStateManager } from './AgentStateManager';
import { AgentRuntime } from './AgentRuntime';
import { CoordinatorAgent } from './CoordinatorAgent';
import { EventBus } from './EventBus';
import { AgentMessageBus } from './AgentMessageBus';
import { MessageRouter } from './MessageRouter';
import { AgentInbox } from './AgentInbox';
import { AgentOutbox } from './AgentOutbox';
import { AgentChannel } from './AgentChannel';
import { PersistenceManager } from './PersistenceManager';

export class AgentManager {
  private registry: AgentRegistry;
  private lifecycleManager: AgentLifecycleManager;
  private stateManager: AgentStateManager;
  private messageBus: AgentMessageBus;
  private messageRouter: MessageRouter;
  private persistence: PersistenceManager;
  private readonly STORE_NAME = 'settings';
  private readonly AGENTS_KEY = 'spawned_agents';
  private isInitialized = false;

  constructor(
    eventBus: EventBus,
    runtimeFactory: (identity: AgentIdentity, channel: AgentChannel) => AgentRuntime,
    registry?: AgentRegistry,
    messageBus?: AgentMessageBus
  ) {
    this.registry = registry || new AgentRegistry();
    this.messageBus = messageBus || new AgentMessageBus(eventBus);
    this.messageRouter = new MessageRouter(this.registry, this.messageBus);
    this.persistence = PersistenceManager.getInstance();
    
    const communicationRuntimeFactory = (identity: AgentIdentity) => {
      const inbox = new AgentInbox();
      const outbox = new AgentOutbox(this.messageRouter);
      const channel = new AgentChannel(identity.id, inbox, outbox);
      
      // Wire up the inbox to the message bus
      this.messageBus.subscribe(identity.id, (message) => {
        inbox.push(message);
      });
      
      const runtime = runtimeFactory(identity, channel);

      if (identity.role === 'coordinator') {
        return new CoordinatorAgent(
          eventBus,
          this.registry,
          runtime.planner || undefined,
          runtime.executor || undefined,
          runtime.monitor,
          runtime.improvementEngine,
          runtime.suggestions,
          identity,
          channel,
          runtime.knowledgeGraph
        );
      }
      
      return runtime;
    };

    this.lifecycleManager = new AgentLifecycleManager(this.registry, eventBus, communicationRuntimeFactory);
    this.stateManager = new AgentStateManager(this.registry);
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    await this.recoverAgents();
    this.isInitialized = true;
  }

  private async recoverAgents(): Promise<void> {
    try {
      const entry = await this.persistence.get(this.STORE_NAME, this.AGENTS_KEY);
      if (entry && Array.isArray(entry.data)) {
        console.info(`[AgentManager] Recovering ${entry.data.length} agents...`);
        for (const agentData of entry.data) {
          // Skip if already registered (e.g. system coordinator)
          if (this.registry.getAgent(agentData.id)) continue;
          
          this.spawnAgent(
            agentData.name,
            agentData.role,
            agentData.capabilities,
            agentData.metadata
          );
        }
      }
    } catch (e) {
      console.warn('[AgentManager] Failed to recover agents:', e);
    }
  }

  private async persistAgents(): Promise<void> {
    const agents = this.registry.listAgents()
      .filter(a => a.identity.id !== 'system-coordinator') // Don't persist system coordinator as it's registered on boot
      .map(a => ({
        id: a.identity.id,
        name: a.identity.name,
        role: a.identity.role,
        capabilities: a.identity.capabilities,
        metadata: a.identity.metadata
      }));
    
    await this.persistence.save(this.STORE_NAME, { key: this.AGENTS_KEY, data: agents });
  }

  // Lifecycle Operations
  public spawnAgent(name: string, role: AgentRole, capabilities: string[], metadata?: Record<string, unknown>): AgentRuntime {
    const runtime = this.lifecycleManager.spawnAgent(name, role, capabilities, metadata);
    this.persistAgents().catch(e => console.error('[AgentManager] Failed to persist agents:', e));
    return runtime;
  }

  public destroyAgent(agentId: string): void {
    this.lifecycleManager.destroyAgent(agentId);
    this.persistAgents().catch(e => console.error('[AgentManager] Failed to persist agents:', e));
  }

  public pauseAgent(agentId: string): void {
    this.lifecycleManager.pauseAgent(agentId);
  }

  public resumeAgent(agentId: string): void {
    this.lifecycleManager.resumeAgent(agentId);
  }

  public restartAgent(agentId: string): void {
    this.lifecycleManager.restartAgent(agentId);
  }

  // Query Operations
  public listAgents(): AgentDefinition[] {
    return this.registry.listAgents();
  }

  public findAgent(agentId: string): AgentDefinition | undefined {
    return this.registry.getAgent(agentId);
  }

  public findAgentsByRole(role: AgentRole): AgentDefinition[] {
    return this.registry.findAgentsByRole(role);
  }

  // State Operations
  public getAgentState(agentId: string): AgentState | undefined {
    return this.stateManager.getAgentState(agentId);
  }

  public getAgentStatus(agentId: string): AgentStatus | undefined {
    return this.stateManager.getAgentStatus(agentId);
  }

  public getAllAgentStates(): Record<string, AgentState> {
    return this.stateManager.getAllAgentStates();
  }

  public getSystemMetrics(): Record<string, unknown> {
    return this.stateManager.getSystemMetrics();
  }

  public getMessageBusStats(): Record<string, unknown> {
    return (this.messageBus as any).stats || {};
  }
}
