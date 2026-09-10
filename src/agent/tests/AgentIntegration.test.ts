import { describe, it, expect, vi } from 'vitest';
import { createAgent } from '../bootstrap/createAgent';
import { AgentEventType } from '../types/agent';
import { ServiceContainer } from '../core/ServiceContainer';
import { MockLLMProvider } from '../providers/MockLLMProvider';
import { createTestTool } from './testUtils';

describe('Agent OS Integration', () => {
  it('should complete a full loop: User Message -> Plan -> Execute -> Actions', async () => {
    const container = new ServiceContainer();
    container.registerSingleton('LLMProvider', new MockLLMProvider());
    const { executiveBrain, eventBus, toolRegistry, manager } = createAgent(container);
    
    // Spawn workers to handle tasks
    manager.spawnAgent('Worker 1', 'worker', ['flights', 'hotels', 'weather']);
    
    // Register missing tools for the "Plan a trip" goal
    toolRegistry.register(createTestTool({ name: 'search_flights', description: 'flights', execute: async () => ({ success: true }) }));
    toolRegistry.register(createTestTool({ name: 'find_hotels', description: 'hotels', execute: async () => ({ success: true }) }));
    toolRegistry.register(createTestTool({ name: 'get_current_weather', description: 'weather', execute: async () => ({ success: true }) }));
    
    const missionListener = vi.fn();
    eventBus.subscribe('agent:events', missionListener);

    // 1. Create Mission via ExecutiveBrain
    await executiveBrain.createMission('Integration Test Mission', {
      description: 'Plan a trip',
      successCriteria: ['Completed'],
      priority: 'medium'
    });

    // Wait for the async process to complete
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 2. Verify Events Emitted
    expect(missionListener).toHaveBeenCalled();
    
    const events = missionListener.mock.calls.map(call => call[0].type);
    
    expect(events).toContain(AgentEventType.AGENT_UPDATE);
    
    // Check for running and completed status in events
    const updates = missionListener.mock.calls
      .filter(call => call[0].type === AgentEventType.AGENT_UPDATE)
      .map(call => call[0].payload.status);
    
    expect(updates).toContain('running');
    expect(updates).toContain('PLAN_COMPLETED');
  });
});
