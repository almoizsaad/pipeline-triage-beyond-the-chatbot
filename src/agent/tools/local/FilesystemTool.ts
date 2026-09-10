import { z } from 'zod';
import type { Tool, ToolMetadata, ToolPermissions, ToolExecutionOptions, ToolHealth } from '../Tool';

/**
 * Tool for interacting with the local filesystem.
 * Note: Requires a Node.js environment.
 */
export class FilesystemTool implements Tool<any, any> {
  public readonly name = 'filesystem';
  public readonly description = 'Read, write, list, and manage files and directories.';
  
  public readonly metadata: ToolMetadata = {
    version: '1.0.0',
    category: 'filesystem',
    tags: ['fs', 'files', 'io'],
    author: 'Nexus OS'
  };

  public readonly permissions: ToolPermissions = {
    requiredPermissions: ['fs_read', 'fs_write'],
    requiresApproval: true
  };

  public readonly options: ToolExecutionOptions = {
    timeout: 5000
  };

  public readonly inputSchema = z.object({
    operation: z.string().optional(),
    path: z.string().optional().default('.'),
    content: z.any().optional(),
    encoding: z.string().optional().default('utf8'),
    recursive: z.boolean().optional().default(true)
  }).passthrough();
  
  public readonly outputSchema = z.any();

  public async execute(input: any): Promise<any> {
    // Dynamic import to avoid breaking browser environments if they don't use this tool
    let fs;
    try {
      fs = await import('node:fs/promises');
    } catch {
      throw new Error('FilesystemTool is only available in a Node.js environment.');
    }

    let operation = input.operation;
    const path = input.path || '.';

    // Smarter inference and mapping
    if (!operation) {
      if (input.content !== undefined) operation = 'write_file';
      else if (path.includes('.')) operation = 'read_file';
      else operation = 'list_directory';
    }

    // Map common synonyms
    if (operation === 'write' || operation === 'save') operation = 'write_file';
    if (operation === 'read' || operation === 'load') operation = 'read_file';
    if (operation === 'ls' || operation === 'list') operation = 'list_directory';
    if (operation === 'rm' || operation === 'remove' || operation === 'delete') operation = 'delete_file';
    if (operation === 'mkdir' || operation === 'mkdirp') operation = 'make_directory';

    switch (operation) {
      case 'read_file':
        return await fs.readFile(path, { encoding: input.encoding as any });
      
      case 'write_file':
        const fileContent = typeof input.content === 'string' 
          ? input.content 
          : JSON.stringify(input.content, null, 2);
        await fs.writeFile(path, fileContent || '', { encoding: input.encoding as any });
        return { success: true, path };
      
      case 'list_directory':
        return await fs.readdir(path);
      
      case 'delete_file':
        await fs.unlink(path);
        return { success: true };
      
      case 'make_directory':
        await fs.mkdir(path, { recursive: input.recursive });
        return { success: true, path };
      
      case 'exists':
        try {
          await fs.access(path);
          return { exists: true };
        } catch {
          return { exists: false };
        }
      
      default:
        throw new Error(`Unsupported operation: ${operation}. Valid operations: read_file, write_file, list_directory, delete_file, make_directory, exists`);
    }
  }

  public async checkHealth(): Promise<ToolHealth> {
    try {
      await import('node:fs/promises');
      return { status: 'healthy', lastChecked: new Date(), errorCount: 0 };
    } catch {
      return { status: 'degraded', lastChecked: new Date(), errorCount: 1 };
    }
  }
}
