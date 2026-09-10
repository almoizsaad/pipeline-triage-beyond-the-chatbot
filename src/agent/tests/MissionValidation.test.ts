import { describe, it, expect, beforeEach } from 'vitest';
import { createAgent } from '../bootstrap/createAgent';
import { AgentFactory } from '../core/AgentFactory';
import { ExecutiveBrain } from '../core/ExecutiveBrain';
import { CoordinatorAgent } from '../core/CoordinatorAgent';
import { MockLLMProvider } from '../providers/MockLLMProvider';
import { AgentEventType } from '../types/agent';
import type { AgentRole } from '../types/agent';
import type { StructuredTask } from '../planner/schemas';
import { AgentInbox } from '../core/AgentInbox';
import { AgentOutbox } from '../core/AgentOutbox';
import { MessageRouter } from '../core/MessageRouter';
import { AgentMessageBus } from '../core/AgentMessageBus';
import { AgentChannel } from '../core/AgentChannel';
import { EventBus } from '../core/EventBus';
import { AgentRegistry } from '../core/AgentRegistry';
import { ServiceContainer } from '../core/ServiceContainer';
import { createTestTool } from './testUtils';

describe('Mission Validation - End-to-End', () => {
  let agent: ReturnType<typeof createAgent>;
  let brain: ExecutiveBrain;
  let coordinator: CoordinatorAgent;
  let provider: MockLLMProvider;

  beforeEach(() => {
    const container = new ServiceContainer();
    provider = new MockLLMProvider();
    container.registerSingleton('LLMProvider', provider);
    
    agent = createAgent(container, { disableSafety: true });
    const factory = agent.container.resolve(AgentFactory);
    const registry = agent.container.resolve(AgentRegistry);
    const eventBus = agent.container.resolve(EventBus);
    
    const messageBus = new AgentMessageBus(eventBus);
    const router = new MessageRouter(registry, messageBus);
    
    const identity = { id: 'coordinator', name: 'Coordinator', role: 'coordinator' as AgentRole, capabilities: ['coordination'] };
    const inbox = new AgentInbox();
    const outbox = new AgentOutbox(router);
    const channel = new AgentChannel(identity.id, inbox, outbox);
    
    messageBus.subscribe(identity.id, (msg) => inbox.push(msg));
    coordinator = factory.createCoordinator(identity, channel);
    
    const workerIdentity = { id: 'worker', name: 'Worker', role: 'worker' as AgentRole, capabilities: ['execution', 'research', 'filesystem'] };
    const workerInbox = new AgentInbox();
    const workerOutbox = new AgentOutbox(router);
    const workerChannel = new AgentChannel(workerIdentity.id, workerInbox, workerOutbox);
    
    messageBus.subscribe(workerIdentity.id, (msg) => workerInbox.push(msg));
    const worker = factory.createAgent(workerIdentity, workerChannel);
    
    registry.register(workerIdentity, worker);
    registry.register(identity, coordinator);
    
    brain = new ExecutiveBrain(agent.eventBus, coordinator);

    const registerSafe = (tool: any) => {
      try { 
        if (agent.toolRegistry.hasTool(tool.name)) {
          agent.toolRegistry.unregister(tool.name);
        }
        agent.toolRegistry.register(createTestTool(tool)); 
      } catch (e) { console.error(`Failed to register tool ${tool.name}:`, e); }
    };

    registerSafe({ 
      name: 'search_flights', 
      description: 'Search flights', 
      execute: async () => ({ flights: [{ id: 'F1', price: 500 }] }) 
    });
    registerSafe({ 
      name: 'find_hotels', 
      description: 'Find hotels', 
      execute: async () => ({ hotels: [{ id: 'H1', price: 200 }] }) 
    });
    registerSafe({ 
      name: 'get_current_weather', 
      description: 'Get weather', 
      execute: async () => ({ weather: 'Sunny' }) 
    });
    registerSafe({ 
      name: 'filesystem', 
      description: 'Filesystem access', 
      execute: async () => ({ success: true }) 
    });
    registerSafe({ 
      name: 'clock', 
      description: 'Get current time', 
      execute: async () => ({ time: new Date().toISOString() }) 
    });
    registerSafe({ 
      name: 'research_topic', 
      description: 'Research topic', 
      execute: async (input: { topic: string }) => {
        const summary = `Summary of ${input.topic}`;
        await coordinator.knowledgeGraph.createNode({
          type: 'entity',
          label: input.topic,
          properties: { summary }
        });
        return { summary };
      }
    });
  });

  it('should execute a Trip Planning mission successfully', async () => {
    provider.setMockResponse({
      id: 'trip-plan-1',
      goal: 'Tokyo Trip',
      reasoning: 'Plan a trip to Tokyo.',
      tasks: [
        { id: 'T1', description: 'Search flights', tool: 'search_flights', dependencies: [] },
        { id: 'T2', description: 'Find hotels', tool: 'find_hotels', dependencies: ['T1'] }
      ]
    });

    const missionId = await brain.createMission('Tokyo Trip', {
      description: 'Find a flight to Tokyo and a hotel.',
      successCriteria: ['Flight found', 'Hotel found'],
      priority: 'medium'
    });

    let completed = false;
    const unsubscribe = agent.eventBus.subscribe('agent:events', (event) => {
      const payload = (event.payload || event) as Record<string, unknown>;
      if (payload.missionId === missionId && (payload.status === 'PLAN_COMPLETED' || payload.status === 'completed')) {
        completed = true;
      }
    });

    const timeout = 15000;
    const startWait = Date.now();
    while (!completed && Date.now() - startWait < timeout) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const mission = brain.getGoalManager().getMission(missionId);
      if (mission?.status === 'completed') {
        completed = true;
        break;
      }
    }
    
    unsubscribe();
    expect(completed).toBe(true);
    const mission = brain.getGoalManager().getMission(missionId);
    expect(mission?.status).toBe('completed');
  }, 20000);

  it('should execute a Research & Knowledge mission', async () => {
    provider.setMockResponse({
      id: 'research-plan-1',
      goal: 'AI Research',
      reasoning: 'Research AI.',
      tasks: [
        { id: 'T1', description: 'Research topic', tool: 'research_topic', metadata: { topic: 'AI Agents' }, dependencies: [] }
      ]
    });

    const missionId = await brain.createMission('AI Research', {
      description: 'Research AI Agents and save to knowledge graph.',
      successCriteria: ['Topic researched'],
      priority: 'medium'
    });

    let completed = false;
    const unsubscribe = agent.eventBus.subscribe('agent:events', (event) => {
      const payload = (event.payload || event) as Record<string, unknown>;
      if (payload.missionId === missionId && (payload.status === 'PLAN_COMPLETED' || payload.status === 'completed')) {
        completed = true;
      }
    });

    const timeout = 15000;
    const startWait = Date.now();
    while (!completed && Date.now() - startWait < timeout) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const mission = brain.getGoalManager().getMission(missionId);
      if (mission?.status === 'completed') {
        completed = true;
        break;
      }
    }
    
    unsubscribe();
    expect(completed).toBe(true);
    const mission = brain.getGoalManager().getMission(missionId);
    expect(mission?.status).toBe('completed');
  }, 20000);

  it('should handle mission failure and recovery via SelfCorrection', async () => {
    let callCount = 0;
    const toolName = 'flaky_tool';
    
    if (agent.toolRegistry.hasTool(toolName)) agent.toolRegistry.unregister(toolName);
    agent.toolRegistry.register(createTestTool({
      name: toolName,
      description: 'Fails first time, succeeds second time',
      execute: async () => { 
        callCount++;
        if (callCount === 1) throw new Error('First attempt failed');
        return { data: 'Success after retry' };
      }
    }));

    provider.setMockResponse({
      id: 'flaky-plan-1',
      goal: 'Flaky Recovery',
      reasoning: 'Recover from flaky tool.',
      tasks: [
        { id: 'T1', description: 'Flaky task', tool: toolName, dependencies: [] }
      ]
    });

    const missionId = await brain.createMission('Flaky Recovery Test', {
      description: `Use the flaky tool.`,
      successCriteria: ['Recovered'],
      priority: 'medium'
    });

    let completed = false;
    const unsubscribe = agent.eventBus.subscribe('agent:events', (event) => {
      const payload = (event.payload || event) as Record<string, unknown>;
      if (payload.missionId === missionId && (payload.status === 'PLAN_COMPLETED' || payload.status === 'completed')) {
        completed = true;
      }
    });

    const timeout = 25000;
    const startWait = Date.now();
    while (!completed && Date.now() - startWait < timeout) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const mission = brain.getGoalManager().getMission(missionId);
      if (mission?.status === 'completed') {
        completed = true;
        break;
      }
    }
    
    unsubscribe();
    expect(completed).toBe(true);
    expect(callCount).toBeGreaterThan(1);
  }, 30000);
});
