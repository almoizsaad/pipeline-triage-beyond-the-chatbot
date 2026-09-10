import { useCallback } from 'react';
import { useAgent } from './useAgent';
import { useWorkspaceStore } from '../workspace/state/workspaceStore';
import { globalWorkspaceBus } from '../workspace/events/WorkspaceEventBus';
import { WorkspaceEventType } from '../workspace/events/types';
import { globalApprovalManager } from '../agent/approval/ApprovalManager';

/**
 * useWorkspaceAgent provides a unified interface for interacting with the 
 * autonomous workspace and the underlying agent.
 */
export function useWorkspaceAgent() {
  const agent = useAgent();
  const workspace = useWorkspaceStore();

  const sendEvent = useCallback((type: WorkspaceEventType, payload: Record<string, unknown>, source: string = 'ui') => {
    globalWorkspaceBus.emit({
      type,
      payload,
      source,
      timestamp: Date.now(),
    });
  }, []);

  const approve = useCallback((id: string) => {
    globalApprovalManager.approve(id);
  }, []);

  const reject = useCallback((id: string) => {
    globalApprovalManager.reject(id);
  }, []);

  return {
    // Agent state
    agentStatus: agent.status,
    agentPlan: agent.currentPlan,
    metrics: agent.metrics,
    recommendations: agent.recommendations,
    sendMessage: agent.sendMessage,

    // Workspace state
    components: workspace.components,
    selectedId: workspace.selectedId,
    isLocked: workspace.isLocked,
    
    // Actions
    sendEvent,
    selectComponent: workspace.selectComponent,
    approve,
    reject,
  };
}
