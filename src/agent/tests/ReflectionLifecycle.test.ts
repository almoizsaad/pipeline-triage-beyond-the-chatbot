import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentRuntime } from '../core/AgentRuntime';
import { EventBus } from '../core/EventBus';
import { TaskPlanner } from '../planner/TaskPlanner';
import { TaskExecutor } from '../executor/TaskExecutor';
import { ToolRegistry } from '../tools/ToolRegistry';
import { AgentEventType } from '../types/agent';
import { createTestTool } from './testUtils';

describe('Reflection Lifecycle Integration', () => {
  let eventBus: EventBus;
  let planner: TaskPlanner;
  let executor: TaskExecutor;
  let registry: ToolRegistry;
  let runtime: AgentRuntime;

  beforeEach(() => {
    eventBus = new EventBus();
    planner = new TaskPlanner();
    registry = new ToolRegistry();
    
    registry.register(createTestTool({ name: 'search_flights', description: 'flights' }));
    registry.register(createTestTool({ name: 'find_hotels', description: 'hotels' }));
    registry.register(createTestTool({ name: 'get_current_weather', description: 'weather' }));
    registry.register(createTestTool({ name: 'exchange_rate_lookup', description: 'fx' }));

    executor = new TaskExecutor(registry);
    runtime = new AgentRuntime(eventBus, planner, executor);
  });

  it('should trigger reflection and emit reflection event after workflow success', async () => {
    const eventListener = vi.fn();
    eventBus.subscribe('agent:events', eventListener);
    
    const actionListener = vi.fn();
    eventBus.subscribe('agent:actions', actionListener);

    // Process a goal
    await runtime.processGoal('Plan a trip');

    // Wait for async reflection to complete
    // Since reflection is triggered with .catch() and it's async, 
    // we need to wait for the event to be published.
    await vi.waitFor(() => {
      const reflectionEvent = eventListener.mock.calls.find(call => call[0].type === AgentEventType.REFLECTION);
      if (!reflectionEvent) throw new Error('Reflection event not found');
    }, { timeout: 5000 });

    // Verify reflection event
    const reflectionCall = eventListener.mock.calls.find(call => call[0].type === AgentEventType.REFLECTION);
    expect(reflectionCall).toBeDefined();
    const reflectionEvent = reflectionCall![0];
    expect(reflectionEvent.type).toBe(AgentEventType.REFLECTION);
    expect(reflectionEvent.payload.reflection.success).toBe(true);
    expect(reflectionEvent.payload.reflection.lessonsLearned.length).toBeGreaterThan(0);

    // Verify AgentStream reflected state (via AGENT_UPDATE action)
    const reflectingAction = actionListener.mock.calls.find(call => 
      call[0].type === 'AGENT_UPDATE' && call[0].payload.message.includes('Reflecting on workflow')
    );
    expect(reflectingAction).toBeDefined();

    // Verify runtime continues (status is idle)
    expect(runtime.getStatus()).toBe('idle');
  });

  it('should persist reflection to memory', async () => {
    await runtime.processGoal('Plan a trip');

    // Wait for reflection
    await vi.waitFor(async () => {
      // @ts-expect-error - Accessing protected member for testing
      const memories = await runtime._memory.storage.list({ types: ['semantic'], tags: ['reflection'] });
      if (memories.length === 0) throw new Error('Reflection memory not found');
    }, { timeout: 5000 });

    // @ts-expect-error - Accessing protected member for testing
    const memories = await runtime._memory.storage.list({ types: ['semantic'], tags: ['reflection'] });
    expect(memories.length).toBeGreaterThan(0);
    expect((memories[0].content as { type: string }).type).toBe('reflection');
  });
});
