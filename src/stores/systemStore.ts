import { create } from 'zustand';

export interface SystemTelemetry {
  totalMessages: number;
  activeSubscribers: number;
  lastMessageTimestamp: number;
  cpuUsage: number;
  memoryUsage: number;
  tokensPerSec: number;
  activeThreads: number;
  uptime: number;
}

export interface AgentTelemetry {
  id: string;
  name: string;
  role: string;
  status: string;
  latency: number;
  tasksCompleted: number;
  cpuTime: number;
}

export interface SystemStoreState {
  telemetry: SystemTelemetry;
  agents: Record<string, AgentTelemetry>;
  
  // Actions
  updateTelemetry: (telemetry: Partial<SystemTelemetry>) => void;
  upsertAgent: (agent: AgentTelemetry) => void;
  removeAgent: (agentId: string) => void;
  updateAgentStatus: (agentId: string, status: string) => void;
}

export const useSystemStore = create<SystemStoreState>((set) => ({
  telemetry: {
    totalMessages: 0,
    activeSubscribers: 0,
    lastMessageTimestamp: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    tokensPerSec: 0,
    activeThreads: 0,
    uptime: 100,
  },
  agents: {},

  updateTelemetry: (telemetry) => set((state) => ({
    telemetry: { ...state.telemetry, ...telemetry }
  })),

  upsertAgent: (agent) => set((state) => ({
    agents: { ...state.agents, [agent.id]: agent }
  })),

  removeAgent: (agentId) => set((state) => {
    const { [agentId]: _, ...rest } = state.agents;
    return { agents: rest };
  }),

  updateAgentStatus: (agentId, status) => set((state) => {
    const agent = state.agents[agentId];
    if (!agent) return state;
    return {
      agents: {
        ...state.agents,
        [agentId]: { ...agent, status }
      }
    };
  }),
}));
