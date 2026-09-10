import { z } from 'zod';
import type { Tool, ToolMetadata, ToolPermissions, ToolExecutionOptions, ToolHealth } from '../Tool';

/**
 * Tool for interacting with Git repositories.
 * Note: Requires git to be installed in the environment.
 */
export class GitTool implements Tool<any, any> {
  public readonly name = 'git';
  public readonly description = 'Perform git operations like clone, commit, push, pull, status, etc.';
  
  public readonly metadata: ToolMetadata = {
    version: '1.0.0',
    category: 'git',
    tags: ['git', 'vcs', 'repo'],
    author: 'Nexus OS'
  };

  public readonly permissions: ToolPermissions = {
    requiredPermissions: ['git_read', 'git_write'],
    requiresApproval: true
  };

  public readonly options: ToolExecutionOptions = {
    timeout: 60000 // 1 minute default
  };

  public readonly inputSchema = z.discriminatedUnion('operation', [
    z.object({
      operation: z.literal('status'),
      cwd: z.string().optional()
    }).passthrough(),
    z.object({
      operation: z.literal('clone'),
      url: z.string(),
      path: z.string().optional()
    }).passthrough(),
    z.object({
      operation: z.literal('commit'),
      message: z.string(),
      all: z.boolean().default(true),
      cwd: z.string().optional()
    }).passthrough(),
    z.object({
      operation: z.literal('push'),
      remote: z.string().default('origin'),
      branch: z.string().optional(),
      cwd: z.string().optional()
    }).passthrough(),
    z.object({
      operation: z.literal('pull'),
      remote: z.string().default('origin'),
      branch: z.string().optional(),
      cwd: z.string().optional()
    }).passthrough(),
    z.object({
      operation: z.literal('log'),
      limit: z.number().default(10),
      cwd: z.string().optional()
    }).passthrough()
  ]);
  
  public readonly outputSchema = z.any();

  public async execute(input: any): Promise<any> {
    const { exec } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const execAsync = promisify(exec);

    let command = '';
    const cwd = input.cwd || process.cwd();

    switch (input.operation) {
      case 'status':
        command = 'git status';
        break;
      case 'clone':
        command = `git clone ${input.url} ${input.path || ''}`;
        break;
      case 'commit':
        command = `git commit ${input.all ? '-a' : ''} -m "${input.message.replace(/"/g, '\\"')}"`;
        break;
      case 'push':
        command = `git push ${input.remote} ${input.branch || ''}`;
        break;
      case 'pull':
        command = `git pull ${input.remote} ${input.branch || ''}`;
        break;
      case 'log':
        command = `git log -n ${input.limit} --oneline`;
        break;
      default:
        throw new Error(`Unsupported operation: ${input.operation}`);
    }

    try {
      const { stdout, stderr } = await execAsync(command, { cwd });
      return { success: true, stdout, stderr };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message, 
        stdout: error.stdout, 
        stderr: error.stderr 
      };
    }
  }

  public async checkHealth(): Promise<ToolHealth> {
    try {
      const { exec } = await import('node:child_process');
      const { promisify } = await import('node:util');
      const execAsync = promisify(exec);
      await execAsync('git --version');
      return { status: 'healthy', lastChecked: new Date(), errorCount: 0 };
    } catch {
      return { status: 'degraded', lastChecked: new Date(), errorCount: 1 };
    }
  }
}
