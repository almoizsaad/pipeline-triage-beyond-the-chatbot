import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SystemMessage } from '@/lib/types/intent';

interface MissionRecord {
  id: string;
  intent: string;
  timestamp: number;
  messages: SystemMessage[];
}

interface UserState {
  preferences: Record<string, unknown>;
  missionHistory: MissionRecord[];
  currentSession: SystemMessage[];
  addToHistory: (record: MissionRecord) => void;
  updatePreference: (key: string, value: unknown) => void;
  addMessage: (message: SystemMessage) => void;
  clearSession: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      preferences: {},
      missionHistory: [],
      currentSession: [],
      addToHistory: (record) =>
        set((state) => ({
          missionHistory: [...state.missionHistory.slice(-49), record],
        })),
      updatePreference: (key, value) =>
        set((state) => ({
          preferences: { ...state.preferences, [key]: value },
        })),
      addMessage: (message) =>
        set((state) => ({
          currentSession: [...state.currentSession, message],
        })),
      clearSession: () => set({ currentSession: [] }),
    }),
    {
      name: 'nexus-user-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
