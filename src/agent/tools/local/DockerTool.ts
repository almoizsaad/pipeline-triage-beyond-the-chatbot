import { z } from 'zod';
import type { Tool, ToolMetadata, ToolPermissions, ToolExecutionOptions, ToolHealth } from '../Tool';

/**
 * Tool for interacting with Docker.
 * Note: Requires a Node.js environment and Docker installed.
 */
export class DockerTool implements Tool<any, any> {
  public readonly name = 'docker';
  public readonly description = 'Manage Docker containers, images, and networks.';
  
  public readonly metadata: ToolMetadata = {
    version: '1.0.0',
    category: 'system',
    tags: ['docker', 'container', 'ops', 'devops'],
    author: 'Nexus OS'
  };

  public readonly permissions: ToolPermissions = {
    requiredPermissions: ['docker_access'],
    requiresApproval: true
  };

  public readonly options: ToolExecutionOptions = {
    timeout: 60000
  };

  public readonly inputSchema = z.discriminatedUnion('operation', [
    z.object({
      operation: z.literal('list_containers'),
      all: z.boolean().default(false)
    }).passthrough(),
    z.object({
      operation: z.literal('run_container'),
      image: z.string(),
      name: z.string().optional(),
      command: z.string().optional(),
      detach: z.boolean().default(true)
    }).passthrough(),
    z.object({
      operation: z.literal('stop_container'),
      containerId: z.string()
    }).passthrough(),
    z.object({
      operation: z.literal('remove_container'),
      containerId: z.string(),
      force: z.boolean().default(false)
    }).passthrough(),
    z.object({
      operation: z.literal('list_images')
    }).passthrough()
  ]);
  
  public readonly outputSchema = z.any();

  public async execute(input: any): Promise<any> {
    let exec;
    try {
      const childProcess = await import('node:child_process');
      exec = childProcess.exec;
    } catch {
      throw new Error('DockerTool is only available in a Node.js environment.');
    }

    let command = 'docker';
    switch (input.operation) {
      case 'list_containers':
        command += ` ps ${input.all ? '-a' : ''} --format json`;
        break;
      case 'run_container':
        command += ` run ${input.detach ? '-d' : ''} ${input.name ? `--name ${input.name}` : ''} ${input.image} ${input.command || ''}`;
        break;
      case 'stop_container':
        command += ` stop ${input.containerId}`;
        break;
      case 'remove_container':
        command += ` rm ${input.force ? '-f' : ''} ${input.containerId}`;
        break;
      case 'list_images':
        command += ` images --format json`;
        break;
    }

    return new Promise((resolve, reject) => {
      exec!(command, (error, stdout, stderr) => {
        if (error && !stdout) {
          reject(new Error(`Docker Error: ${stderr || error.message}`));
          return;
        }
        
        try {
          // Attempt to parse JSON if output looks like it
          if (stdout.trim().startsWith('{') || stdout.trim().startsWith('[')) {
            // Docker JSON format is often one JSON object per line
            const lines = stdout.trim().split('\n').filter(l => l.trim().length > 0);
            if (lines.length > 1) {
              resolve(lines.map(l => JSON.parse(l)));
            } else {
              resolve(JSON.parse(stdout));
            }
          } else {
            resolve({ output: stdout, stderr, exitCode: error?.code || 0 });
          }
        } catch {
          resolve({ output: stdout, stderr, exitCode: error?.code || 0 });
        }
      });
    });
  }

  public async checkHealth(): Promise<ToolHealth> {
    try {
      const { exec } = await import('node:child_process');
      return new Promise((resolve) => {
        exec('docker version', (error) => {
          if (error) {
            resolve({ status: 'degraded', lastChecked: new Date(), errorCount: 1, message: 'Docker not installed or not running' });
          } else {
            resolve({ status: 'healthy', lastChecked: new Date(), errorCount: 0 });
          }
        });
      });
    } catch {
      return { status: 'degraded', lastChecked: new Date(), errorCount: 1, message: 'No Node.js environment' };
    }
  }
}
