import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentRuntime } from '../core/AgentRuntime';
import { EventBus } from '../core/EventBus';
import { TaskPlanner } from '../planner/TaskPlanner';
import { TaskExecutor } from '../executor/TaskExecutor';
import { ToolRegistry } from '../tools/ToolRegistry';
import { AgentActionType } from '../types/agent';
import { createTestTool } from './testUtils';

describe('AgentRuntime', () => {
  let eventBus: EventBus;
  let planner: TaskPlanner;
  let executor: TaskExecutor;
  let registry: ToolRegistry;
  let runtime: AgentRuntime;

  beforeEach(() => {
    eventBus = new EventBus();
    planner = new TaskPlanner();
    registry = new ToolRegistry();
    
    // Register expected tools
    registry.register(createTestTool({ name: 'search_flights', description: 'flights', execute: async () => ({ success: true }) }));
    registry.register(createTestTool({ name: 'find_hotels', description: 'hotels', execute: async () => ({ success: true }) }));
    registry.register(createTestTool({ name: 'get_current_weather', description: 'weather', execute: async () => ({ success: true }) }));
    registry.register(createTestTool({ name: 'exchange_rate_lookup', description: 'fx', execute: async () => ({ success: true }) }));

    executor = new TaskExecutor(registry);
    runtime = new AgentRuntime(eventBus, planner, executor);
  });

  it('should process a goal and emit actions', async () => {
    const actionListener = vi.fn();
    eventBus.subscribe('agent:actions', actionListener);
    
    // Using a goal that the TaskPlanner knows
    await runtime.processGoal('Plan a trip');
    
    // Verify that at least some actions were emitted
    expect(actionListener).toHaveBeenCalled();
    
    // Verify that UPDATE_PLAN was called (at least once for initial, and once per task)
    const updatePlanActions = actionListener.mock.calls
      .filter(call => call[0].type === AgentActionType.UPDATE_PLAN);
    expect(updatePlanActions.length).toBeGreaterThan(0);
    
    // Verify status transition
    expect(runtime.getStatus()).toBe('idle');
  });

  it('should reset state correctly', () => {
    runtime.reset();
    expect(runtime.getStatus()).toBe('idle');
    expect(runtime.getCurrentPlan()).toBeUndefined();
  });
});
