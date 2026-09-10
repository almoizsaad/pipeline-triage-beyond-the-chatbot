import { describe, it, expect } from 'vitest';
import { TaskExecutor } from '../executor/TaskExecutor';
import { ToolRegistry } from '../tools/ToolRegistry';
import { createTestTool } from './testUtils';

describe('TaskExecutor', () => {
  it('should execute a successful tool', async () => {
    const registry = new ToolRegistry();
    registry.register(createTestTool({
      name: 'test_tool',
      description: 'A test tool',
      execute: async (input: unknown) => ({ result: 'success', input })
    }));
    const executor = new TaskExecutor(registry);
    
    const task = { id: '1', description: 'test_tool', status: 'pending' as const };
    const result = await executor.executeTask(task, { data: 'test' });
    
    expect(result.success).toBe(true);
    expect((result.data as Record<string, unknown>).result).toBe('success');
  });

  it('should handle missing tools', async () => {
    const registry = new ToolRegistry();
    const executor = new TaskExecutor(registry);
    
    const task = { id: '1', description: 'missing_tool', status: 'pending' as const };
    const result = await executor.executeTask(task);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });
});
