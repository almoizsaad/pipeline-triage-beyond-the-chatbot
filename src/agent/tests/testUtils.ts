import { z } from 'zod';
import type { Tool, ToolMetadata, ToolPermissions, ToolExecutionOptions, ToolHealth } from '../tools/Tool';

/**
 * Creates a mock tool for testing purposes.
 */
export function createTestTool(config: Partial<Tool>): Tool {
  return {
    name: config.name || 'test_tool',
    description: config.description || 'test description',
    metadata: config.metadata || { version: '1.0.0', category: 'other' } as ToolMetadata,
    permissions: config.permissions || { requiredPermissions: [] } as ToolPermissions,
    options: config.options || {} as ToolExecutionOptions,
    inputSchema: config.inputSchema || z.any(),
    outputSchema: config.outputSchema || z.any(),
    execute: config.execute || (async () => ({})),
    checkHealth: config.checkHealth || (async () => ({ 
      status: 'healthy', 
      lastChecked: new Date(), 
      errorCount: 0 
    } as ToolHealth)),
  } as Tool;
}
