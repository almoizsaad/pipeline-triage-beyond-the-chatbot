import type { AgentIdentity, Plan } from './agent';
import type { Thought } from './thought';
import type { ReflectionResult } from './reflection';

export type MissionPriority = 'low' | 'medium' | 'high' | 'critical';

export type MissionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface MissionGoal {
  description: string;
  successCriteria: string[];
  priority: MissionPriority;
}

export interface MissionTimelineEntry {
  id: string;
  timestamp: number;
  type: 'thought' | 'action' | 'reflection' | 'memory' | 'knowledge' | 'event';
  title: string;
  description: string;
  data?: unknown;
}

export interface MissionOutcome {
  success: boolean;
  summary: string;
  deliverables: string[];
  lessonsLearned: string[];
  timestamp: number;
}

export interface Mission {
  id: string;
  title: string;
  goal: MissionGoal;
  context: Record<string, unknown>;
  constraints: string[];
  status: MissionStatus;
  createdAt: number;
  updatedAt: number;
  
  // Execution data
  plans: Plan[];
  runningAgents: AgentIdentity[];
  timeline: MissionTimelineEntry[];
  
  // Insights
  thoughts: Thought[];
  reflections: ReflectionResult[];
  
  // State updates
  memoryUpdates: Array<{ key: string; value: unknown; timestamp: number }>;
  knowledgeUpdates: Array<{ id: string; type: string; summary: string; timestamp: number }>;
  
  outcome?: MissionOutcome;
}

export interface MissionState {
  activeMissionId: string | null;
  missions: Record<string, Mission>;
}
