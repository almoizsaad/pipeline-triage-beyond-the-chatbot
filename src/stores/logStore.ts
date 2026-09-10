import { create } from 'zustand';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  metadata?: Record<string, unknown>;
}

interface LogState {
  entries: LogEntry[];
  filterLevel: LogLevel | 'all';
  addEntry: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearEntries: () => void;
  setFilterLevel: (level: LogLevel | 'all') => void;
  getFilteredEntries: () => LogEntry[];
}

export const useLogStore = create<LogState>((set, get) => ({
  entries: [
    {
      id: 'init-1',
      timestamp: new Date().toISOString(),
      level: 'info',
      source: 'System',
      message: 'Nexus workspace initialized',
    },
  ],
  filterLevel: 'all',

  addEntry: (entry) =>
    set((state) => ({
      entries: [
        ...state.entries,
        {
          ...entry,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        },
      ].slice(-200), // Keep last 200 entries
    })),

  clearEntries: () =>
    set({
      entries: [{
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        level: 'info',
        source: 'System',
        message: 'Log cleared by user',
      }],
    }),

  setFilterLevel: (level) => set({ filterLevel: level }),

  getFilteredEntries: () => {
    const { entries, filterLevel } = get();
    if (filterLevel === 'all') return entries;
    return entries.filter((e) => e.level === filterLevel);
  },
}));

// Convenience function for adding logs outside React components
export function addLog(
  level: LogLevel,
  source: string,
  message: string,
  metadata?: Record<string, unknown>
) {
  useLogStore.getState().addEntry({ level, source, message, metadata });
}
