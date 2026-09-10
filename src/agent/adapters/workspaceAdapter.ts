import { AgentActionType, AgentEventType, SystemTelemetryType } from '../types/agent';
import type { AgentProtocolAction, AgentLifecycleEvent } from '../types/agent';
import { EventBus } from '../core/EventBus';
import { useWorkspaceStore } from '../../workspace/state/workspaceStore';
import { useSystemStore } from '../../stores/systemStore';
import type { WorkspaceComponent } from '../../workspace/state/workspaceTypes';
import { globalWorkspaceBus } from '../../workspace/events/WorkspaceEventBus';

/**
 * WorkspaceAdapter maps Agent actions into Workspace state changes
 * and bridges Workspace events back to the Agent.
 */
export class WorkspaceAdapter {
  private eventBus: EventBus;
  private unsubscribers: Array<() => void> = [];

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    const workspace = useWorkspaceStore.getState();
    const system = useSystemStore.getState();

    // 1. Agent -> Workspace (Actions)
    const unsubActions = this.eventBus.subscribe<AgentProtocolAction>('agent:actions', (action: AgentProtocolAction) => {
      switch (action.type) {
        case AgentActionType.UPDATE_WORKSPACE:
          if (action.payload.metadata?.components) {
            const components = action.payload.metadata.components as WorkspaceComponent[];
            workspace.setComponents(components);
          }
          break;

        case AgentActionType.AGENT_UPDATE:
          // Handle global agent status if needed
          break;

        case AgentActionType.RENDER_COMPONENT:
          workspace.addComponent(action.payload as unknown as WorkspaceComponent);
          break;

        case AgentActionType.UPDATE_COMPONENT: {
          const { id, updates } = action.payload as { id: string; updates: Partial<WorkspaceComponent> };
          workspace.updateComponent(id, updates);
          break;
        }

        case AgentActionType.UPDATE_ENTITY:
          // This could be mapped to a specific entity in the workspace or knowledge graph
          console.log('[WorkspaceAdapter] Agent updating entity:', action.payload);
          break;
      }
    });
    this.unsubscribers.push(unsubActions);

    // 1.1 Agent Lifecycle -> SystemStore
    const unsubLifecycle = this.eventBus.subscribe<AgentLifecycleEvent>('agent:lifecycle', (event) => {
      const { agentId, action, identity } = event.payload;
      if (action === 'spawned') {
        system.upsertAgent({
          id: agentId,
          name: identity.name,
          role: identity.role,
          status: 'idle',
          latency: Math.floor(Math.random() * 50 + 20),
          tasksCompleted: 0,
          cpuTime: 0,
        });
      } else if (action === 'destroyed') {
        system.removeAgent(agentId);
      }
    });
    this.unsubscribers.push(unsubLifecycle);

    // 1.2 System Telemetry -> SystemStore
    const unsubTelemetry = this.eventBus.subscribe<any>('system:telemetry', (event) => {
      if (event.type === SystemTelemetryType.MESSAGE_BUS_STATS) {
        system.updateTelemetry({
          totalMessages: event.payload.totalMessages,
          activeSubscribers: event.payload.activeSubscribers,
          lastMessageTimestamp: event.payload.lastMessageTimestamp,
          // Simulate some dynamic metrics for visualization
          tokensPerSec: Math.floor(Math.random() * 500 + 200),
          cpuUsage: Math.floor(Math.random() * 30 + 10),
          memoryUsage: Math.floor(Math.random() * 40 + 20),
          activeThreads: event.payload.activeSubscribers * 2,
        });
      } else if (event.type === SystemTelemetryType.TASK_ASSIGNED) {
        const agentId = event.payload.agentId;
        if (agentId) {
          const agent = system.agents[agentId];
          if (agent) {
            system.upsertAgent({
              ...agent,
              status: 'executing',
              cpuTime: agent.cpuTime + Math.random() * 2,
            });
          }
        }
      } else if (event.type === SystemTelemetryType.TASK_COMPLETED) {
        const agentId = event.payload.agentId;
        if (agentId) {
          const agent = system.agents[agentId];
          if (agent) {
            system.upsertAgent({
              ...agent,
              status: 'idle',
              tasksCompleted: agent.tasksCompleted + 1,
              cpuTime: agent.cpuTime + Math.random() * 5,
            });
          }
        }
      }
    });
    this.unsubscribers.push(unsubTelemetry);

    // 2. Workspace -> Agent (Bridge)
    const unsubWorkspace = globalWorkspaceBus.onEvent((event) => {
      if (event.type === 'REQUEST_AGENT_ACTION') {
        this.eventBus.publish('agent:events', {
          type: AgentEventType.WORKSPACE_ACTION,
          payload: {
            action: event.payload.actionType as string,
            metadata: event.payload.args as Record<string, unknown>,
          },
          timestamp: Date.now(),
        });
      }
    });
    
    if (typeof unsubWorkspace === 'function') {
      this.unsubscribers.push(unsubWorkspace);
    }
  }

  public destroy() {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
  }
}
