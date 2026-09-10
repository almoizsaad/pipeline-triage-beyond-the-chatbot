import { create } from 'zustand';
import type { WorkspaceComponent, WorkspaceState } from './workspaceTypes';

interface WorkspaceActions {
  addComponent: (component: WorkspaceComponent) => void;
  updateComponent: (id: string, updates: Partial<WorkspaceComponent>) => void;
  removeComponent: (id: string) => void;
  setComponents: (components: WorkspaceComponent[]) => void;
  selectComponent: (id: string | null) => void;
  setLocked: (locked: boolean) => void;
  clearWorkspace: () => void;
}

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>((set) => ({
  components: [],
  selectedId: null,
  interactionHistory: [],
  isLocked: false,

  addComponent: (component) =>
    set((state) => ({
      components: [...state.components, component],
    })),

  updateComponent: (id, updates) =>
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  removeComponent: (id) =>
    set((state) => ({
      components: state.components.filter((c) => c.id !== id),
    })),

  setComponents: (components) => set({ components }),

  selectComponent: (id) => set({ selectedId: id }),

  setLocked: (locked) => set({ isLocked: locked }),

  clearWorkspace: () => set({ components: [], selectedId: null, isLocked: false }),
}));
