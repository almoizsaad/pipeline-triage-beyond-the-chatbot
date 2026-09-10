import { z } from 'zod';
import type { Tool, ToolMetadata, ToolPermissions, ToolExecutionOptions, ToolHealth } from '../Tool';

/**
 * Tool for executing shell commands.
 * Note: Requires a Node.js environment.
 */
export class TerminalTool implements Tool<{ command: string; cwd?: string }, { stdout: string; stderr: string; exitCode: number }> {
  public readonly name = 'terminal';
  public readonly description = 'Execute shell commands in the local environment.';
  
  public readonly metadata: ToolMetadata = {
    version: '1.0.0',
    category: 'utility',
    tags: ['shell', 'bash', 'cmd', 'terminal'],
    author: 'Nexus OS'
  };

  public readonly permissions: ToolPermissions = {
    requiredPermissions: ['terminal_execute'],
    requiresApproval: true
  };

  public readonly options: ToolExecutionOptions = {
    timeout: 30000 // 30 seconds default
  };

  public readonly inputSchema = z.object({
    command: z.string(),
    cwd: z.string().optional()
  }).passthrough();
  
  public readonly outputSchema = z.object({
    stdout: z.string(),
    stderr: z.string(),
    exitCode: z.number()
  });

  public async execute(input: { command: string; cwd?: string }): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    let exec;
    try {
      const childProcess = await import('node:child_process');
      exec = childProcess.exec;
    } catch {
      throw new Error('TerminalTool is only available in a Node.js environment.');
    }

    return new Promise((resolve, reject) => {
      exec(input.command, { cwd: input.cwd }, (error, stdout, stderr) => {
        if (error && !error.code) {
          reject(error);
          return;
        }
        resolve({
          stdout,
          stderr,
          exitCode: error?.code || 0
        });
      });
    });
  }

  public async checkHealth(): Promise<ToolHealth> {
    try {
      await import('node:child_process');
      return { status: 'healthy', lastChecked: new Date(), errorCount: 0 };
    } catch {
      return { status: 'degraded', lastChecked: new Date(), errorCount: 1 };
    }
  }
}
