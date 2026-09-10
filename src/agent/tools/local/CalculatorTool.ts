import { z } from 'zod';
import type { Tool, ToolMetadata, ToolPermissions, ToolExecutionOptions, ToolHealth } from '../Tool';

/**
 * Tool for performing mathematical calculations.
 */
export class CalculatorTool implements Tool<{ expression: string }, { result: number }> {
  public readonly name = 'calculator';
  public readonly description = 'Evaluate mathematical expressions safely.';
  
  public readonly metadata: ToolMetadata = {
    version: '1.0.0',
    category: 'utility',
    tags: ['math', 'calculate', 'calc'],
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
    expression: z.string().describe('The mathematical expression to evaluate (e.g., "2 + 2 * 3")')
  }).passthrough();
  
  public readonly outputSchema = z.object({
    result: z.number()
  });

  public async execute(input: { expression: string }): Promise<{ result: number }> {
    try {
      // Basic safety: only allow numbers and math operators
      // For a real production tool, we'd use a math library like mathjs
      // but here we'll use a safer eval alternative or just simple regex check
      const sanitized = input.expression.replace(/[^0-9+\-*/().\s]/g, '');
      
      // Still using Function to evaluate the sanitized expression
       
      const result = new Function(`return ${sanitized}`)();
      
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('Invalid calculation result');
      }
      
      return { result };
    } catch (error: any) {
      throw new Error(`Failed to evaluate expression: ${error.message}`);
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
