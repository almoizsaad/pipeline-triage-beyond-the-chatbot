import type { ToolOutput } from '../tools/Tool';

export interface ToolExecutionRecord {
  id: string;
  toolName: string;
  input: any;
  output: ToolOutput;
  timestamp: number;
}

/**
 * ToolMemory tracks tool execution history to provide insights into
 * tool reliability, latency, and costs.
 */
export class ToolMemory {
  private history: ToolExecutionRecord[] = [];
  private maxHistory = 1000;

  /**
   * Logs a tool execution.
   */
  public log(record: ToolExecutionRecord): void {
    this.history.unshift(record);
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }
  }

  /**
   * Retrieves the execution history for a specific tool.
   */
  public getToolHistory(toolName: string): ToolExecutionRecord[] {
    return this.history.filter(r => r.toolName === toolName);
  }

  /**
   * Calculates the success rate for a tool.
   */
  public getSuccessRate(toolName: string): number {
    const records = this.getToolHistory(toolName);
    if (records.length === 0) return 1.0;
    
    const successes = records.filter(r => r.output.success).length;
    return successes / records.length;
  }

  /**
   * Gets the average latency for a tool.
   */
  public getAverageLatency(toolName: string): number {
    const records = this.getToolHistory(toolName);
    if (records.length === 0) return 0;
    
    const totalLatency = records.reduce((acc, r) => acc + r.output.latency, 0);
    return totalLatency / records.length;
  }

  /**
   * Gets the total history.
   */
  public getFullHistory(): ToolExecutionRecord[] {
    return [...this.history];
  }

  public clear(): void {
    this.history = [];
  }
}
