export const WorkspaceEventType = {
  SELECT_COMPONENT: 'SELECT_COMPONENT',
  UPDATE_COMPONENT: 'UPDATE_COMPONENT',
  SUBMIT_FORM: 'SUBMIT_FORM',
  REQUEST_AGENT_ACTION: 'REQUEST_AGENT_ACTION',
} as const;

export type WorkspaceEventType = typeof WorkspaceEventType[keyof typeof WorkspaceEventType];

export interface WorkspaceEvent<T = Record<string, unknown>> {
  type: WorkspaceEventType;
  payload: T;
  source: string; // ID of the component that triggered the event
  timestamp: number;
}
