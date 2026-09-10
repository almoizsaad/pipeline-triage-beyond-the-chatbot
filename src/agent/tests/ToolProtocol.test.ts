import { describe, it, expect } from 'vitest';
import { ToolRegistry } from '../tools/ToolRegistry';
import type { Tool, ToolMetadata, ToolPermissions, ToolExecutionOptions, ToolHealth } from '../tools/Tool';
import { z } from 'zod';

class MockTool implements Tool<{ id: number }, { ok: boolean }> {
  name = 'mock_tool';
  description = 'A mock tool for testing';
  metadata: ToolMetadata = { version: '1.0.0', category: 'utility' };
  permissions: ToolPermissions = { requiredPermissions: [] };
  options: ToolExecutionOptions = { timeout: 1000 };
  inputSchema = z.object({ id: z.number() });
  outputSchema = z.object({ ok: z.boolean() });

  async execute(input: { id: number }) {
    return { ok: input.id > 0 };
  }

  async checkHealth(): Promise<ToolHealth> {
    return { status: 'healthy', lastChecked: new Date(), errorCount: 0 };
  }
}

describe('ToolRegistry', () => {
  it('should validate input and execute tool successfully', async () => {
    const registry = new ToolRegistry();
    registry.register(new MockTool());
    
    const result = await registry.executeTool('mock_tool', { id: 1 });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ ok: true });
    expect(result.latency).toBeGreaterThanOrEqual(0);
  });

  it('should fail if input validation fails', async () => {
    const registry = new ToolRegistry();
    registry.register(new MockTool());
    
    const result = await registry.executeTool('mock_tool', { id: 'not-a-number' });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle timeouts', async () => {
    const registry = new ToolRegistry();
    class SlowTool extends MockTool {
      override options: ToolExecutionOptions = { timeout: 50 };
      override async execute() {
        await new Promise(resolve => setTimeout(resolve, 200));
        return { ok: true };
      }
    }
    registry.register(new SlowTool());

    const result = await registry.executeTool('mock_tool', { id: 1 });
    expect(result.success).toBe(false);
    expect(result.error).toContain('timed out');
  });

  it('should handle retries', async () => {
    const registry = new ToolRegistry();
    let attempts = 0;
    class FlakyTool extends MockTool {
      override options: ToolExecutionOptions = { 
        retry: { attempts: 3, delay: 10 } 
      };
      override async execute() {
        attempts++;
        if (attempts < 3) throw new Error('Flaky failure');
        return { ok: true };
      }
    }
    registry.register(new FlakyTool());

    const result = await registry.executeTool('mock_tool', { id: 1 });
    expect(result.success).toBe(true);
    expect(attempts).toBe(3);
  });
});
