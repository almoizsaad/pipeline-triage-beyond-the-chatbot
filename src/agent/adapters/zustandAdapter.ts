import { agent } from '../bootstrap/createAgent';
import { AgentActionType } from '../types/agent';
import type { AgentProtocolAction } from '../types/agent';
import { useIntentStore } from '../../stores/intentStore';
import { useLogStore } from '../../stores/logStore';
import type { LogLevel } from '../../stores/logStore';

/**
 * The ZustandAdapter synchronizes Agent OS actions with the application's
 * global stores.
 */
export function setupZustandAdapter() {
  const intentStore = useIntentStore.getState();
  const logStore = useLogStore.getState();

  agent.eventBus.subscribe<AgentProtocolAction>('agent:actions', (action: AgentProtocolAction) => {
    switch (action.type) {
      case AgentActionType.AGENT_UPDATE:
        // Update loading state in intentStore
        if (action.payload.status === 'thinking' || action.payload.status === 'executing') {
          intentStore.setLoading(true);
        } else {
          intentStore.setLoading(false);
        }

        // Add log entry
        logStore.addEntry({
          level: (action.payload.status === 'error' ? 'error' : 'info') as LogLevel,
          source: 'AgentRuntime',
          message: action.payload.message || `Status updated to ${action.payload.status}`,
          metadata: action.payload.data as Record<string, unknown>,
        });
        break;

      case AgentActionType.SHOW_NOTIFICATION:
        logStore.addEntry({
          level: (action.payload.level === 'success' ? 'info' : action.payload.level) as LogLevel,
          source: 'Agent',
          message: action.payload.message,
        });
        break;

      case AgentActionType.UPDATE_PLAN:
        // Optionally update reasoning in intentStore based on plan
        if (action.payload.tasks) {
          intentStore.setReasoning(`Current Plan: ${action.payload.tasks.map((t: { id: string }) => t.id).join(', ')}`);
        }
        break;

      case AgentActionType.UPDATE_WORKSPACE:
        logStore.addEntry({
          level: 'info',
          source: 'AgentExecutor',
          message: `Workspace updated: ${action.payload.files?.length || 0} files modified`,
        });
        break;
    }
  });
}
