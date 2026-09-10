import { globalWorkspaceBus } from './WorkspaceEventBus';
import { WorkspaceEventType } from './types';

/**
 * Helpers for UI components to communicate with the Workspace/Agent.
 */
export const componentEvents = {
  select: (componentId: string, data?: unknown) => {
    globalWorkspaceBus.emit({
      type: WorkspaceEventType.SELECT_COMPONENT,
      source: componentId,
      payload: data as Record<string, unknown>,
      timestamp: Date.now(),
    });
  },

  update: (componentId: string, updates: Record<string, unknown>) => {
    globalWorkspaceBus.emit({
      type: WorkspaceEventType.UPDATE_COMPONENT,
      source: componentId,
      payload: updates,
      timestamp: Date.now(),
    });
  },

  action: (componentId: string, actionType: string, args: unknown) => {
    globalWorkspaceBus.emit({
      type: WorkspaceEventType.REQUEST_AGENT_ACTION,
      source: componentId,
      payload: { actionType, args } as Record<string, unknown>,
      timestamp: Date.now(),
    });
  },
};
