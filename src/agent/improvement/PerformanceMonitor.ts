import type { 
  IPerformanceMonitor, 
  SystemMetrics, 
  ToolPerformance, 
  PlannerQuality, 
  MemoryRetrievalQuality 
} from '../types/improvement';

export class PerformanceMonitor implements IPerformanceMonitor {
  private toolMetrics: Record<string, ToolPerformance> = {};
  private plannerMetrics: PlannerQuality = { avgConfidence: 0, avgTaskCount: 0, replanRate: 0 };
  private memoryMetrics: MemoryRetrievalQuality = { avgScore: 0, missRate: 0, avgResultsCount: 0 };
  
  private workflowCount = 0;
  private workflowSuccesses = 0;
  private totalWorkflowLatency = 0;

  private plannerCount = 0;
  private memoryCount = 0;

  public trackToolUse(toolName: string, latency: number, success: boolean): void {
    if (!this.toolMetrics[toolName]) {
      this.toolMetrics[toolName] = {
        toolName,
        avgLatency: latency,
        successRate: success ? 1 : 0,
        errorRate: success ? 0 : 1,
        lastUsed: Date.now(),
        callCount: 1
      };
      return;
    }

    const m = this.toolMetrics[toolName];
    m.callCount++;
    m.avgLatency = (m.avgLatency * (m.callCount - 1) + latency) / m.callCount;
    const currentSuccessRate = success ? 1 : 0;
    m.successRate = (m.successRate * (m.callCount - 1) + currentSuccessRate) / m.callCount;
    m.errorRate = 1 - m.successRate;
    m.lastUsed = Date.now();
  }

  public trackPlanner(confidence: number, taskCount: number): void {
    this.plannerCount++;
    this.plannerMetrics.avgConfidence = (this.plannerMetrics.avgConfidence * (this.plannerCount - 1) + confidence) / this.plannerCount;
    this.plannerMetrics.avgTaskCount = (this.plannerMetrics.avgTaskCount * (this.plannerCount - 1) + taskCount) / this.plannerCount;
  }

  public trackMemory(avgScore: number, resultsCount: number): void {
    this.memoryCount++;
    this.memoryMetrics.avgScore = (this.memoryMetrics.avgScore * (this.memoryCount - 1) + avgScore) / this.memoryCount;
    this.memoryMetrics.avgResultsCount = (this.memoryMetrics.avgResultsCount * (this.memoryCount - 1) + resultsCount) / this.memoryCount;
    
    if (resultsCount === 0) {
      this.memoryMetrics.missRate = (this.memoryMetrics.missRate * (this.memoryCount - 1) + 1) / this.memoryCount;
    } else {
      this.memoryMetrics.missRate = (this.memoryMetrics.missRate * (this.memoryCount - 1)) / this.memoryCount;
    }
  }

  public trackWorkflow(latency: number, success: boolean): void {
    this.workflowCount++;
    if (success) this.workflowSuccesses++;
    this.totalWorkflowLatency += latency;
  }

  public getMetrics(): SystemMetrics {
    return {
      workflowSuccessRate: this.workflowCount > 0 ? (this.workflowSuccesses / this.workflowCount) : 1,
      avgExecutionLatency: this.workflowCount > 0 ? (this.totalWorkflowLatency / this.workflowCount) : 0,
      toolPerformance: { ...this.toolMetrics },
      plannerQuality: { ...this.plannerMetrics },
      memoryQuality: { ...this.memoryMetrics }
    };
  }
}
