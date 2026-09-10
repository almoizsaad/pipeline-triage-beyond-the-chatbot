import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Mission, MissionStatus, MissionTimelineEntry, MissionOutcome } from '@/agent/types/mission';
import type { Plan, AgentIdentity, Thought, Task } from '@/agent/types/agent';
import type { ReflectionResult } from '@/agent/types/reflection';

export interface MissionStoreState {
  activeMissionId: string | null;
  missions: Record<string, Mission>;
  
  // Actions
  setActiveMission: (id: string | null) => void;
  addMission: (mission: Mission) => void;
  updateMissionStatus: (id: string, status: MissionStatus) => void;
  addTimelineEntry: (id: string, entry: MissionTimelineEntry) => void;
  addPlan: (id: string, plan: Plan) => void;
  addRunningAgent: (id: string, agent: AgentIdentity) => void;
  removeRunningAgent: (id: string, agentId: string) => void;
  addThought: (id: string, thought: Thought) => void;
  addReflection: (id: string, reflection: ReflectionResult) => void;
  addMemoryUpdate: (id: string, update: { key: string; value: unknown; timestamp: number }) => void;
  addKnowledgeUpdate: (id: string, update: { id: string; type: string; summary: string; timestamp: number }) => void;
  updateTaskStatus: (missionId: string, planId: string, taskId: string, status: Task['status']) => void;
  setMissionOutcome: (id: string, outcome: MissionOutcome) => void;
  reset: () => void;
}

export const useMissionStore = create<MissionStoreState>()(
  persist(
    (set) => ({
      activeMissionId: null,
      missions: {},

      setActiveMission: (id) => set({ activeMissionId: id }),

      reset: () => set({ activeMissionId: null, missions: {} }),

      addMission: (mission) => set((state) => ({
        missions: { ...state.missions, [mission.id]: mission }
      })),

      updateMissionStatus: (id, status) => set((state) => {
        const mission = state.missions[id];
        if (!mission) return state;
        return {
          missions: {
            ...state.missions,
            [id]: { ...mission, status, updatedAt: Date.now() }
          }
        };
      }),

      updateTaskStatus: (missionId, planId, taskId, status) => set((state) => {
        const mission = state.missions[missionId];
        if (!mission) return state;

        const updatedPlans = mission.plans.map(plan => {
          if (plan.id === planId) {
            return {
              ...plan,
              tasks: plan.tasks.map(task => 
                task.id === taskId ? { ...task, status } : task
              )
            };
          }
          return plan;
        });

        return {
          missions: {
            ...state.missions,
            [missionId]: {
              ...mission,
              plans: updatedPlans,
              updatedAt: Date.now()
            }
          }
        };
      }),

      addTimelineEntry: (id, entry) => set((state) => {
        const mission = state.missions[id];
        if (!mission) return state;
        return {
          missions: {
            ...state.missions,
            [id]: {
              ...mission,
              timeline: [...mission.timeline, entry],
              updatedAt: Date.now()
            }
          }
        };
      }),

      addPlan: (id, plan) => set((state) => {
        const mission = state.missions[id];
        if (!mission) return state;
        
        // Prevent duplicate plans
        if (mission.plans.some(p => p.id === plan.id)) {
          return {
            missions: {
              ...state.missions,
              [id]: {
                ...mission,
                plans: mission.plans.map(p => p.id === plan.id ? plan : p),
                updatedAt: Date.now()
              }
            }
          };
        }

        return {
          missions: {
            ...state.missions,
            [id]: {
              ...mission,
              plans: [...mission.plans, plan],
              updatedAt: Date.now()
            }
          }
        };
      }),

      addRunningAgent: (id, agent) => set((state) => {
        const mission = state.missions[id];
        if (!mission) return state;
        return {
          missions: {
            ...state.missions,
            [id]: {
              ...mission,
              runningAgents: [...mission.runningAgents, agent],
              updatedAt: Date.now()
            }
          }
        };
      }),

      removeRunningAgent: (id, agentId) => set((state) => {
        const mission = state.missions[id];
        if (!mission) return state;
        return {
          missions: {
            ...state.missions,
            [id]: {
              ...mission,
              runningAgents: mission.runningAgents.filter((a) => a.id !== agentId),
              updatedAt: Date.now()
            }
          }
        };
      }),

      addThought: (id, thought) => set((state) => {
        const mission = state.missions[id];
        if (!mission) return state;
        return {
          missions: {
            ...state.missions,
            [id]: {
              ...mission,
              thoughts: [...mission.thoughts, thought],
              updatedAt: Date.now()
            }
          }
        };
      }),

      addReflection: (id, reflection) => set((state) => {
        const mission = state.missions[id];
        if (!mission) return state;
        return {
          missions: {
            ...state.missions,
            [id]: {
              ...mission,
              reflections: [...mission.reflections, reflection],
              updatedAt: Date.now()
            }
          }
        };
      }),

      addMemoryUpdate: (id, update) => set((state) => {
        const mission = state.missions[id];
        if (!mission) return state;
        return {
          missions: {
            ...state.missions,
            [id]: {
              ...mission,
              memoryUpdates: [...mission.memoryUpdates, update],
              updatedAt: Date.now()
            }
          }
        };
      }),

      addKnowledgeUpdate: (id, update) => set((state) => {
        const mission = state.missions[id];
        if (!mission) return state;
        return {
          missions: {
            ...state.missions,
            [id]: {
              ...mission,
              knowledgeUpdates: [...mission.knowledgeUpdates, update],
              updatedAt: Date.now()
            }
          }
        };
      }),

      setMissionOutcome: (id, outcome) => set((state) => {
        const mission = state.missions[id];
        if (!mission) return state;
        return {
          missions: {
            ...state.missions,
            [id]: {
              ...mission,
              outcome,
              status: outcome.success ? 'completed' : 'failed',
              updatedAt: Date.now()
            }
          }
        };
      }),
    }),
    {
      name: 'nexus-mission-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
