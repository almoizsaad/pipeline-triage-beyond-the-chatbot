import { agent } from '../bootstrap/createAgent';
import { AgentActionType } from '../types/agent';
import { useWorkspaceStore } from '../../workspace/state/workspaceStore';

/**
 * ApprovalManager handles blocking workflows until the user provides consent.
 */
export class ApprovalManager {
  private pendingApprovals: Map<string, (approved: boolean) => void> = new Map();

  constructor() {
    this.setupListeners();
  }

  public requestApproval(id: string, message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.pendingApprovals.set(id, resolve);
      
      // Notify UI via EventBus/Zustand
      useWorkspaceStore.getState().setLocked(true);
      
      agent.runtime.dispatchAction({
        type: AgentActionType.SHOW_NOTIFICATION,
        payload: {
          message: `Approval Required: ${message}`,
          level: 'warning'
        }
      });
      
      // In a real app, this would also emit a specific SHOW_APPROVAL_MODAL action
    });
  }

  public approve(id: string): void {
    const resolve = this.pendingApprovals.get(id);
    if (resolve) {
      resolve(true);
      this.pendingApprovals.delete(id);
      this.checkIfFinished();
    }
  }

  public reject(id: string): void {
    const resolve = this.pendingApprovals.get(id);
    if (resolve) {
      resolve(false);
      this.pendingApprovals.delete(id);
      this.checkIfFinished();
    }
  }

  private checkIfFinished(): void {
    if (this.pendingApprovals.size === 0) {
      useWorkspaceStore.getState().setLocked(false);
    }
  }

  private setupListeners(): void {
    // Listen for UI approval events
  }
}

export const globalApprovalManager = new ApprovalManager();
