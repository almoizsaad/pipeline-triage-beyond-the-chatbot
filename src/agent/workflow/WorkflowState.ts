/**
 * Represents the current state of a workflow execution.
 */
export interface WorkflowState {
  workflowId: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  startTime: number;
  endTime?: number;
  taskStatuses: Record<string, 'pending' | 'in-progress' | 'completed' | 'failed'>;
}

export type WorkflowUpdateCallback = (state: WorkflowState) => void;
