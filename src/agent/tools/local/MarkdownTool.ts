import { z } from 'zod';
import type { Tool, ToolMetadata, ToolPermissions, ToolExecutionOptions, ToolHealth } from '../Tool';

/**
 * Tool for Markdown processing, extraction, and chunking for RAG.
 */
export class MarkdownTool implements Tool<any, any> {
  public readonly name = 'markdown_processor';
  public readonly description = 'Extract headers, links, or chunks from markdown text for RAG ingestion.';
  
  public readonly metadata: ToolMetadata = {
    version: '1.1.0',
    category: 'knowledge',
    tags: ['markdown', 'md', 'parse', 'rag', 'chunking'],
    author: 'Nexus OS'
  };

  public readonly permissions: ToolPermissions = {
    requiredPermissions: [],
    requiresApproval: false
  };

  public readonly options: ToolExecutionOptions = {
    timeout: 5000
  };

  public readonly inputSchema = z.object({
    text: z.string(),
    operation: z.enum(['extract_headers', 'extract_links', 'chunk']),
    chunkSize: z.number().default(500).optional()
  }).passthrough();
  
  public readonly outputSchema = z.any();

  public async execute(input: { text: string; operation: 'extract_headers' | 'extract_links' | 'chunk'; chunkSize?: number }): Promise<any> {
    const results: string[] = [];
    
    if (input.operation === 'extract_headers') {
      const lines = input.text.split('\n');
      for (const line of lines) {
        if (line.startsWith('#')) {
          results.push(line.trim());
        }
      }
      return { results };
    } else if (input.operation === 'extract_links') {
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let match;
      while ((match = linkRegex.exec(input.text)) !== null) {
        results.push(match[2]); // Extract URL
      }
      return { results };
    } else if (input.operation === 'chunk') {
      const size = input.chunkSize || 500;
      const chunks: string[] = [];
      let current = '';
      
      const lines = input.text.split('\n');
      for (const line of lines) {
        if ((current.length + line.length) > size) {
          chunks.push(current.trim());
          current = line + '\n';
        } else {
          current += line + '\n';
        }
      }
      if (current) chunks.push(current.trim());
      
      return { chunks, count: chunks.length };
    }
    
    return { results };
  }

  public async checkHealth(): Promise<ToolHealth> {
    return {
      status: 'healthy',
      lastChecked: new Date(),
      errorCount: 0
    };
  }
}
