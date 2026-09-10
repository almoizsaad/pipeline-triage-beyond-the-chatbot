export interface ToolPerformance {
  toolName: string;
  avgLatency: number;
  successRate: number;
  errorRate: number;
  lastUsed: number;
  callCount: number;
}

export interface PlannerQuality {
  avgConfidence: number;
  avgTaskCount: number;
  replanRate: number;
}

export interface MemoryRetrievalQuality {
  avgScore: number;
  missRate: number;
  avgResultsCount: number;
}

export interface SystemMetrics {
  workflowSuccessRate: number;
  avgExecutionLatency: number;
  toolPerformance: Record<string, ToolPerformance>;
  plannerQuality: PlannerQuality;
  memoryQuality: MemoryRetrievalQuality;
}

export interface OptimizationRecommendation {
  component: 'tool' | 'planner' | 'memory' | 'workflow';
  id: string;
  type: 'latency' | 'reliability' | 'quality';
  description: string;
  suggestion: string;
  priority: 'low' | 'medium' | 'high';
}

export interface IPerformanceMonitor {
  trackToolUse(toolName: string, latency: number, success: boolean): void;
  trackPlanner(confidence: number, taskCount: number): void;
  trackMemory(avgScore: number, resultsCount: number): void;
  trackWorkflow(latency: number, success: boolean): void;
  getMetrics(): SystemMetrics;
}

export interface SystemInstruction {
  id: string;
  type: 'skill' | 'policy' | 'constraint' | 'tip';
  content: string;
  source: string; // workflowId or 'manual'
  confidence: number;
  usageCount: number;
  lastUsed: number;
}

export interface PromptOptimization {
  baseInstructions: string;
  dynamicOverlays: SystemInstruction[];
}

export interface IImprovementEngine {
  generateRecommendations(metrics: SystemMetrics): OptimizationRecommendation[];
  analyzeForPromptOptimization(reflection: any, analysis?: any): SystemInstruction[];
}
