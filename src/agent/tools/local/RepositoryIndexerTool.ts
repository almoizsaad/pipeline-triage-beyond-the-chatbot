import { z } from 'zod';
import type { Tool, ToolMetadata, ToolPermissions, ToolExecutionOptions, ToolHealth } from '../Tool';
import { KnowledgeIndexer } from '../../knowledge/KnowledgeIndexer';
import { glob } from 'glob';
import * as path from 'path';

/**
 * Tool for indexing local git repositories into the knowledge base.
 * Real implementation using glob and KnowledgeIndexer.
 */
export class RepositoryIndexerTool implements Tool<any, any> {
  public readonly name = 'repo_indexer';
  public readonly description = 'Index a local directory or git repository, processing code and documentation for RAG.';
  
  private indexer: KnowledgeIndexer | undefined;

  constructor(indexer?: KnowledgeIndexer) {
    this.indexer = indexer;
  }

  public readonly metadata: ToolMetadata = {
    version: '1.1.0',
    category: 'knowledge',
    tags: ['rag', 'git', 'index', 'code', 'glob'],
    author: 'Nexus OS'
  };

  public readonly permissions: ToolPermissions = {
    requiredPermissions: ['fs_read', 'knowledge_write'],
    requiresApproval: true
  };

  public readonly options: ToolExecutionOptions = {
    timeout: 600000 // 10 minutes for large repos
  };

  public readonly inputSchema = z.object({
    repoPath: z.string().describe('Local path to the repository'),
    pattern: z.string().default('**/*.{ts,tsx,js,jsx,md,py,go,rs,java,c,cpp}').describe('Glob pattern for files to index'),
    recursive: z.boolean().default(true)
  }).passthrough();
  
  public readonly outputSchema = z.object({
    indexedFiles: z.number(),
    totalChunks: z.number(),
    status: z.string(),
    errors: z.array(z.string()).optional()
  });

  public async execute(input: { repoPath: string; pattern: string; recursive: boolean }): Promise<any> {
    if (!this.indexer) {
      throw new Error('KnowledgeIndexer is required for repo_indexer');
    }

    const absoluteRepoPath = path.isAbsolute(input.repoPath) ? input.repoPath : path.join(process.cwd(), input.repoPath);
    console.info(`[RepoIndexer] Starting real index of ${absoluteRepoPath} with pattern ${input.pattern}`);
    
    try {
      const files = await glob(input.pattern, { cwd: absoluteRepoPath, nodir: true, absolute: true });
      console.info(`[RepoIndexer] Found ${files.length} files to index.`);

      let totalChunks = 0;
      let indexedFiles = 0;
      const errors: string[] = [];

      for (const file of files) {
        try {
          const extension = path.extname(file).slice(1);
          const format = this.mapExtensionToFormat(extension);
          
          const chunks = await this.indexer.indexDocument(file, 'file', format as any);
          totalChunks += chunks.length;
          indexedFiles++;
          
          if (indexedFiles % 10 === 0) {
            console.debug(`[RepoIndexer] Progress: ${indexedFiles}/${files.length} files indexed.`);
          }
        } catch (e: any) {
          console.error(`[RepoIndexer] Failed to index file: ${file}`, e);
          errors.push(`${file}: ${e.message}`);
        }
      }

      return {
        indexedFiles,
        totalChunks,
        status: 'completed',
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (e: any) {
      console.error(`[RepoIndexer] Fatal error during indexing:`, e);
      throw e;
    }
  }

  private mapExtensionToFormat(ext: string): string {
    const mapping: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'md': 'markdown',
      'py': 'python',
      'go': 'go',
      'json': 'json',
      'txt': 'txt'
    };
    return mapping[ext] || 'txt';
  }

  public async checkHealth(): Promise<ToolHealth> {
    return {
      status: this.indexer ? 'healthy' : 'degraded',
      lastChecked: new Date(),
      errorCount: 0,
      message: this.indexer ? undefined : 'KnowledgeIndexer not available'
    };
  }
}
