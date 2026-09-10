import { z } from 'zod';
import type { Tool, ToolMetadata, ToolPermissions, ToolExecutionOptions, ToolHealth } from '../Tool';

/**
 * Tool for parsing and formatting JSON data.
 */
export class JSONTool implements Tool<any, any> {
  public readonly name = 'json_parser';
  public readonly description = 'Parse JSON strings into objects or format objects into JSON strings.';
  
  public readonly metadata: ToolMetadata = {
    version: '1.0.0',
    category: 'utility',
    tags: ['json', 'parse', 'format', 'stringify'],
    author: 'Nexus OS'
  };

  public readonly permissions: ToolPermissions = {
    requiredPermissions: [],
    requiresApproval: false
  };

  public readonly options: ToolExecutionOptions = {
    timeout: 1000
  };

  public readonly inputSchema = z.discriminatedUnion('operation', [
    z.object({
      operation: z.literal('parse'),
      text: z.any() // Allow any, we will stringify if needed or handle objects
    }).passthrough(),
    z.object({
      operation: z.literal('format'),
      data: z.any(),
      space: z.number().default(2)
    }).passthrough(),
    z.object({
      operation: z.literal('stringify'),
      data: z.any(),
      space: z.number().default(2)
    }).passthrough()
  ]);
  
  public readonly outputSchema = z.any();

  public async execute(input: any): Promise<any> {
    switch (input.operation) {
      case 'parse':
        if (typeof input.text !== 'string') {
          // If already an object/array, just return it (no-op parse)
          return input.text;
        }
        return JSON.parse(input.text);
      case 'format':
      case 'stringify':
        return JSON.stringify(input.data, null, input.space || 2);
      default:
        throw new Error(`Unsupported operation: ${input.operation}`);
    }
  }

  public async checkHealth(): Promise<ToolHealth> {
    return {
      status: 'healthy',
      lastChecked: new Date(),
      errorCount: 0
    };
  }
}
