

/**
 * Definition for a UI component that can be rendered in the dynamic workspace.
 */
export interface ComponentDefinition {
  type: string;
  name: string;
  component: React.ComponentType<{ id: string; data: Record<string, unknown> }>;
  description?: string;
  icon?: string;
}
