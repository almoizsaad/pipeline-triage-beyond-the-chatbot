export type ThoughtType = 
  | 'reasoning' 
  | 'observation' 
  | 'plan' 
  | 'decision' 
  | 'reflection' 
  | 'error' 
  | 'correction' 
  | 'alternative_plan' 
  | 'trace';

export interface Thought {
  id: string;
  timestamp: number;
  content: string;
  type: ThoughtType;
  agentId: string;
  parentId?: string; // For chaining
  workflowId?: string; // Link to specific workflow
  taskId?: string; // Link to specific task
  metadata?: Record<string, unknown>;
}

export interface ThoughtChain {
  id: string;
  thoughts: Thought[];
  agentId: string;
  workflowId?: string;
  startTime: number;
  endTime?: number;
}

export interface ThoughtEvent {
  thought: Thought;
  chain?: ThoughtChain;
}

export interface ThoughtQuery {
  agentId?: string;
  workflowId?: string;
  taskId?: string;
  type?: ThoughtType;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export interface IThoughtPersistence {
  saveThought(thought: Thought): Promise<void>;
  saveChain(chain: ThoughtChain): Promise<void>;
  getThought(id: string): Promise<Thought | null>;
  getChain(id: string): Promise<ThoughtChain | null>;
  findThoughts(query: ThoughtQuery): Promise<Thought[]>;
  findChains(query: { agentId?: string; workflowId?: string }): Promise<ThoughtChain[]>;
}

export interface ThoughtAnalysis {
  coherence: number; // 0-1
  depth: number; // nesting level or chain length
  patterns: string[];
  suggestions: string[];
  impact?: number; // Estimated impact on success
}

export interface IThoughtAnalyzer {
  analyzeChain(chain: ThoughtChain): Promise<ThoughtAnalysis>;
  detectAnomalies(thoughts: Thought[]): Promise<string[]>;
}
