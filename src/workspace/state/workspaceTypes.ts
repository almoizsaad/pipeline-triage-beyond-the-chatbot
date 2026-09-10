export interface WorkspaceComponent {
  id: string;
  type: string;
  props: Record<string, unknown>;
  status: 'loading' | 'ready' | 'error' | 'stale';
  metadata?: Record<string, unknown>;
}

export interface WorkspaceState {
  components: WorkspaceComponent[];
  selectedId: string | null;
  interactionHistory: unknown[];
  isLocked: boolean; // For human approval or workflow pauses
}
