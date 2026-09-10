import { z } from 'zod';
import type { Tool, ToolMetadata, ToolPermissions, ToolExecutionOptions, ToolHealth } from '../Tool';
import type { ToolRegistry } from '../ToolRegistry';

/**
 * Tool for diagnosing and monitoring the health of all tools in the registry.
 */
export class ToolDiagnosticsTool implements Tool<any, any> {
  public readonly name = 'tool_diagnostics';
  public readonly description = 'Check the health and performance of all registered tools.';
  
  private registry: ToolRegistry;

  constructor(registry: ToolRegistry) {
    this.registry = registry;
  }

  public readonly metadata: ToolMetadata = {
    version: '1.0.0',
    category: 'system',
    tags: ['diagnostics', 'health', 'monitor'],
    author: 'Nexus OS'
  };

  public readonly permissions: ToolPermissions = {
    requiredPermissions: ['system_read'],
    requiresApproval: false
  };

  public readonly options: ToolExecutionOptions = {
    timeout: 30000
  };

  public readonly inputSchema = z.object({
    operation: z.enum(['check_all', 'check_one', 'get_stats']).default('check_all'),
    toolName: z.string().optional()
  }).passthrough();
  
  public readonly outputSchema = z.any();

  public async execute(input: { operation: 'check_all' | 'check_one' | 'get_stats'; toolName?: string }): Promise<any> {
    switch (input.operation) {
      case 'check_all':
        return await this.registry.checkAllHealth();
      case 'check_one':
        if (!input.toolName) throw new Error('toolName is required for check_one operation');
        const tool = this.registry.getTool(input.toolName);
        if (!tool) throw new Error(`Tool ${input.toolName} not found`);
        return await tool.checkHealth();
      case 'get_stats':
        return this.getToolStats();
      default:
        throw new Error(`Unsupported operation: ${input.operation}`);
    }
  }

  private getToolStats() {
    const memory = this.registry.toolMemory;
    const history = memory.getFullHistory();
    
    const stats: Record<string, { totalExecutions: number; successCount: number; failureCount: number; avgLatency: number }> = {};

    history.forEach((log: any) => {
      if (!stats[log.toolName]) {
        stats[log.toolName] = { totalExecutions: 0, successCount: 0, failureCount: 0, avgLatency: 0 };
      }
      
      const s = stats[log.toolName];
      s.totalExecutions++;
      if (log.output.success) {
        s.successCount++;
        s.avgLatency = (s.avgLatency * (s.successCount - 1) + log.output.latency) / s.successCount;
      } else {
        s.failureCount++;
      }
    });

    return stats;
  }

  public async checkHealth(): Promise<ToolHealth> {
    return {
      status: 'healthy',
      lastChecked: new Date(),
      errorCount: 0
    };
  }
}
