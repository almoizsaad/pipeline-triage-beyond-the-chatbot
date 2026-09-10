import { z } from 'zod';
import type { Tool, ToolMetadata, ToolPermissions, ToolExecutionOptions, ToolHealth } from '../Tool';
import type { IKnowledgeDatabase } from '../../types/knowledge';

/**
 * Tool for querying the agent's local knowledge base.
 */
export class KnowledgeTool implements Tool<any, any> {
  public readonly name = 'knowledge';
  public readonly description = 'Query the local knowledge base, search for facts, and retrieve context from past sessions.';
  
  public readonly metadata: ToolMetadata = {
    version: '1.0.0',
    category: 'other',
    tags: ['knowledge', 'memory', 'context', 'local'],
    author: 'Nexus OS'
  };

  public readonly permissions: ToolPermissions = {
    requiredPermissions: ['read_memory'],
    requiresApproval: false
  };

  public readonly options: ToolExecutionOptions = {
    timeout: 5000
  };

  public readonly inputSchema = z.discriminatedUnion('operation', [
    z.object({
      operation: z.literal('search'),
      query: z.string(),
      limit: z.number().default(5),
      threshold: z.number().default(0.5)
    }).passthrough(),
    z.object({
      operation: z.literal('query'),
      query: z.string(),
      limit: z.number().default(5),
      threshold: z.number().default(0.5)
    }).passthrough(),
    z.object({
      operation: z.literal('get'),
      id: z.string()
    }).passthrough(),
    z.object({
      operation: z.literal('list_tags')
    }).passthrough()
  ]);
  
  public readonly outputSchema = z.any();

  private knowledgeDb: IKnowledgeDatabase;

  constructor(knowledgeDb: IKnowledgeDatabase) {
    this.knowledgeDb = knowledgeDb;
  }

  public async execute(input: any): Promise<any> {
    switch (input.operation) {
      case 'search':
      case 'query':
        return await this.knowledgeDb.search(input.query, {
          limit: input.limit,
          threshold: input.threshold
        });
      case 'get':
        return await this.knowledgeDb.get(input.id);
      case 'list_tags':
        // This is a simplification, in a real DB we'd have a specific method
        return { success: true, tags: ['mission', 'research', 'fact', 'session'] };
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
