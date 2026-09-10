import { z } from 'zod';
import type { Tool, ToolMetadata, ToolPermissions, ToolExecutionOptions, ToolHealth } from '../Tool';

/**
 * Tool for generating UUIDs (v4).
 */
export class UUIDTool implements Tool<{ version: 4 }, { uuid: string }> {
  public readonly name = 'uuid_generator';
  public readonly description = 'Generate a unique identifier (UUID v4).';
  
  public readonly metadata: ToolMetadata = {
    version: '1.0.0',
    category: 'utility',
    tags: ['uuid', 'guid', 'id'],
    author: 'Nexus OS'
  };

  public readonly permissions: ToolPermissions = {
    requiredPermissions: [],
    requiresApproval: false
  };

  public readonly options: ToolExecutionOptions = {
    timeout: 1000
  };

  public readonly inputSchema = z.object({
    version: z.literal(4).default(4)
  }).passthrough();
  
  public readonly outputSchema = z.object({
    uuid: z.string()
  });

  public async execute(): Promise<{ uuid: string }> {
    return { uuid: crypto.randomUUID() };
  }

  public async checkHealth(): Promise<ToolHealth> {
    return {
      status: 'healthy',
      lastChecked: new Date(),
      errorCount: 0
    };
  }
}
