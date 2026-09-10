import { describe, it, expect } from 'vitest';
import { createAgent } from '../bootstrap/createAgent';
import { ServiceContainer } from '../core/ServiceContainer';
import { AgentRuntime } from '../core/AgentRuntime';
import { EventBus } from '../core/EventBus';
import { AgentManager } from '../core/AgentManager';
import { KnowledgeGraph } from '../knowledge/KnowledgeGraph';

describe('Dependency Injection Integration', () => {
  it('should bootstrap Agent OS using container', () => {
    const container = new ServiceContainer();
    const agent = createAgent(container);

    expect(agent.runtime).toBeInstanceOf(AgentRuntime);
    expect(agent.manager).toBeInstanceOf(AgentManager);
    expect(agent.eventBus).toBeInstanceOf(EventBus);
    expect(agent.knowledgeGraph).toBeInstanceOf(KnowledgeGraph);
    expect(agent.container).toBe(container);
  });

  it('should share singletons across resolved components', () => {
    const agent = createAgent();
    
    // Runtime's event bus should be the same as the global one
    expect((agent.runtime as unknown as { _eventBus: EventBus })._eventBus).toBe(agent.eventBus);
    
    // Knowledge graph should be shared
    expect(agent.runtime.knowledgeGraph).toBe(agent.knowledgeGraph);
  });

  it('should allow overriding services in container', () => {
    const container = new ServiceContainer();
    const mockBus = new EventBus();
    
    // Register override before bootstrap
    container.registerSingleton(EventBus, mockBus);
    
    const agent = createAgent(container);
    expect(agent.eventBus).toBe(mockBus);
    expect((agent.runtime as unknown as { _eventBus: EventBus })._eventBus).toBe(mockBus);
  });
});
