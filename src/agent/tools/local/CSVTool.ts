import { z } from 'zod';
import type { Tool, ToolMetadata, ToolPermissions, ToolExecutionOptions, ToolHealth } from '../Tool';

/**
 * Tool for basic CSV parsing.
 */
export class CSVTool implements Tool<{ text: string; delimiter?: string }, { rows: string[][] }> {
  public readonly name = 'csv_parser';
  public readonly description = 'Parse CSV text into a 2D array of strings.';
  
  public readonly metadata: ToolMetadata = {
    version: '1.0.0',
    category: 'utility',
    tags: ['csv', 'parse', 'data'],
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
    text: z.string(),
    delimiter: z.string().default(',')
  }).passthrough();
  
  public readonly outputSchema = z.object({
    rows: z.array(z.array(z.string()))
  });

  public async execute(input: { text: string; delimiter?: string }): Promise<{ rows: string[][] }> {
    const delimiter = input.delimiter || ',';
    const lines = input.text.split(/\r?\n/);
    const rows = lines
      .filter(line => line.trim().length > 0)
      .map(line => {
        // Simple CSV parsing that handles quotes
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === delimiter && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      });
    
    return { rows };
  }

  public async checkHealth(): Promise<ToolHealth> {
    return {
      status: 'healthy',
      lastChecked: new Date(),
      errorCount: 0
    };
  }
}
