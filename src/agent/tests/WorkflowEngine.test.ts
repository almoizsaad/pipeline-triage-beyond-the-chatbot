import { describe, it, expect, vi } from 'vitest';
import { WorkflowEngine } from '../workflow/WorkflowEngine';
import { TaskExecutor } from '../executor/TaskExecutor';
import { ToolRegistry } from '../tools/ToolRegistry';
import type { StructuredPlan } from '../planner/schemas';
import type { Plan } from '../types/agent';

describe('WorkflowEngine', () => {
  it('should execute tasks in parallel based on dependencies', async () => {
    const registry = new ToolRegistry();
    const executor = new TaskExecutor(registry);
    const engine = new WorkflowEngine(executor);

    // Mock tool execution
    vi.spyOn(executor, 'executeTask').mockImplementation(async (task) => ({ success: true, taskId: task.id }));

    const plan: StructuredPlan = {
      id: '1',
      goal: 'test',
      reasoning: 'test',
      createdAt: Date.now(),
      tasks: [
        { id: 'T1', description: 'T1', tool: 'T1', dependencies: [], status: 'pending' },
        { id: 'T2', description: 'T2', tool: 'T2', dependencies: ['T1'], status: 'pending' }
      ]
    };

    const success = await engine.executePlan(plan as unknown as Plan);
    expect(success).toBe(true);
    expect(executor.executeTask).toHaveBeenCalledTimes(2);
  });
});
