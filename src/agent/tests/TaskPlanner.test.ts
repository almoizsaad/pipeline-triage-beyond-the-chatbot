import { describe, it, expect } from 'vitest';
import { TaskPlanner } from '../planner/TaskPlanner';
import type { StructuredTask } from '../planner/schemas';

describe('TaskPlanner', () => {
  it('should decompose "Plan a trip to Dubai" into expected tasks', async () => {
    const planner = new TaskPlanner();
    const plan = await planner.generatePlan('Plan a trip to Dubai');
    
    const taskTools = (plan.tasks as StructuredTask[]).map(t => t.tool);
    expect(taskTools).toContain('search_flights');
    expect(taskTools).toContain('find_hotels');
    expect(taskTools).toContain('get_current_weather');
  });
});
