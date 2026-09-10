import { z } from 'zod';
import type { Tool, ToolMetadata, ToolPermissions, ToolExecutionOptions, ToolHealth } from '../Tool';

/**
 * Tool for getting the current system time and date.
 */
export class ClockTool implements Tool<void, { iso: string; timestamp: number; timezone: string }> {
  public readonly name = 'clock';
  public readonly description = 'Get the current system time, date, and timezone.';
  
  public readonly metadata: ToolMetadata = {
    version: '1.0.0',
    category: 'utility',
    tags: ['time', 'date', 'clock'],
    author: 'Nexus OS'
  };

  public readonly permissions: ToolPermissions = {
    requiredPermissions: [],
    requiresApproval: false
  };

  public readonly options: ToolExecutionOptions = {
    timeout: 1000
  };

  public readonly inputSchema = z.any().optional();
  
  public readonly outputSchema = z.object({
    iso: z.string(),
    timestamp: z.number(),
    timezone: z.string()
  });

  public async execute(): Promise<{ iso: string; timestamp: number; timezone: string }> {
    const now = new Date();
    return {
      iso: now.toISOString(),
      timestamp: now.getTime(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  public async checkHealth(): Promise<ToolHealth> {
    return {
      status: 'healthy',
      lastChecked: new Date(),
      errorCount: 0
    };
  }
}
