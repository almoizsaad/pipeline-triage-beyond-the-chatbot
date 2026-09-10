import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAgent } from '../bootstrap/createAgent';
import { AgentFactory } from '../core/AgentFactory';
import { ExecutiveBrain } from '../core/ExecutiveBrain';
import { CoordinatorAgent } from '../core/CoordinatorAgent';
import { MockLLMProvider } from '../providers/MockLLMProvider';
import type { AgentRole } from '../types/agent';
import type { StructuredTask } from '../planner/schemas';
import { AgentInbox } from '../core/AgentInbox';
import { AgentOutbox } from '../core/AgentOutbox';
import { MessageRouter } from '../core/MessageRouter';
import { AgentMessageBus } from '../core/AgentMessageBus';
import { AgentChannel } from '../core/AgentChannel';
import { EventBus } from '../core/EventBus';
import { AgentRegistry } from '../core/AgentRegistry';
import { ToolRegistry } from '../tools/ToolRegistry';
import { UnifiedEventBus } from '../core/UnifiedEventBus';
import { ServiceContainer } from '../core/ServiceContainer';
import { createTestTool } from './testUtils';

describe('Phase 8.3 — Failure Testing', () => {
  let agent: ReturnType<typeof createAgent>;
  let brain: ExecutiveBrain;
  let coordinator: CoordinatorAgent;
  let provider: MockLLMProvider;
  let eventBus: EventBus;

  beforeEach(() => {
    const container = new ServiceContainer();
    provider = new MockLLMProvider();
    container.registerSingleton('LLMProvider', provider);

    const localUnifiedBus = new UnifiedEventBus();
    eventBus = new EventBus(localUnifiedBus);
    container.registerSingleton(EventBus, eventBus);
    
    agent = createAgent(container, { disableSafety: true });
    const factory = agent.container.resolve(AgentFactory);
    const registry = agent.container.resolve(AgentRegistry);
    
    const messageBus = new AgentMessageBus(eventBus);
    const router = new MessageRouter(registry, messageBus);
    
    const identity = { id: 'coordinator', name: 'Coordinator', role: 'coordinator' as AgentRole, capabilities: ['coordination'] };
    const channel = new AgentChannel(identity.id, new AgentInbox(), new AgentOutbox(router));
    messageBus.subscribe(identity.id, (msg) => channel.receive(msg));
    coordinator = factory.createCoordinator(identity, channel);
    
    const workerIdentity = { id: 'worker', name: 'Worker', role: 'worker' as AgentRole, capabilities: ['execution'] };
    const workerChannel = new AgentChannel(workerIdentity.id, new AgentInbox(), new AgentOutbox(router));
    messageBus.subscribe(workerIdentity.id, (msg) => workerChannel.receive(msg));
    const worker = factory.createAgent(workerIdentity, workerChannel);
    
    registry.register(workerIdentity, worker);
    registry.register(identity, coordinator);

    const toolRegistry = agent.container.resolve(ToolRegistry);
    
    const registerSafe = (tool: any) => {
      if (toolRegistry.hasTool(tool.name)) toolRegistry.unregister(tool.name);
      toolRegistry.register(createTestTool(tool));
    };

    registerSafe({ name: 'search_flights', description: 'Search flights' });
    registerSafe({ name: 'find_hotels', description: 'Find hotels' });
    
    workerChannel.onMessage(async (message) => {
      if (message.type === 'TASK_ASSIGNMENT') {
        const payload = message.payload as { taskId: string; description: string; tool: string; metadata?: Record<string, unknown>; planId: string };
        const result = await worker.executor?.executeTask({
          id: payload.taskId,
          description: payload.description,
          tool: payload.tool,
          metadata: payload.metadata,
          dependencies: [],
          status: 'pending'
        } as StructuredTask, {});
        
        await workerChannel.sendDirect('coordinator', result?.success ? 'TASK_COMPLETED' : 'TASK_FAILED', {
          taskId: payload.taskId,
          planId: payload.planId,
          result: result?.data,
          error: result?.error
        });
      }
    });
    
    brain = new ExecutiveBrain(eventBus, coordinator);
  });

  const waitForStatus = async (missionId: string, statuses: string[], timeout = 10000) => {
    return new Promise<string>((resolve) => {
      const unsubscribe = eventBus.subscribe('agent:events', (event: { payload?: Record<string, unknown> }) => {
        const payload = (event.payload || event) as Record<string, unknown>;
        if (payload.missionId === missionId && statuses.includes(payload.status as string)) {
          unsubscribe();
          resolve(payload.status as string);
        }
      });
      setTimeout(() => { unsubscribe(); resolve('timeout'); }, timeout);
    });
  };

  it('Failure: Missing Tool (Graceful Error Handling)', async () => {
    provider.setMockResponse({
      id: 'fail-tool',
      goal: 'Missing Tool',
      reasoning: 'Use ghost tool.',
      tasks: [{ id: 'T1', description: 'Ghost task', tool: 'ghost_tool', dependencies: [] }]
    });

    const missionId = await brain.createMission('Ghost Mission Test', {
      description: 'Use the ghost tool.',
      successCriteria: [],
      priority: 'medium'
    });

    const status = await waitForStatus(missionId, ['PLAN_FAILED', 'failed']);
    expect(['PLAN_FAILED', 'failed']).toContain(status);
    
    let mission = brain.getGoalManager().getMission(missionId);
    let attempts = 0;
    while (mission?.status !== 'failed' && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      mission = brain.getGoalManager().getMission(missionId);
      attempts++;
    }
    expect(mission?.status).toBe('failed');
  }, 15000);

  it('Failure: Invalid Plan (Circular Dependency Detection)', async () => {
    provider.setMockResponse({
      id: 'fail-cycle',
      goal: 'Circular Dependency',
      reasoning: 'Create a cycle.',
      tasks: [
        { id: 'T1', description: 'Task 1', tool: 'clock', dependencies: ['T2'] },
        { id: 'T2', description: 'Task 2', tool: 'clock', dependencies: ['T1'] }
      ]
    });

    const missionId = await brain.createMission('Cycle Mission Test', {
      description: 'Create a circular dependency.',
      successCriteria: [],
      priority: 'medium'
    });

    const status = await waitForStatus(missionId, ['PLAN_FAILED', 'failed']);
    expect(['PLAN_FAILED', 'failed']).toContain(status);
    
    let mission = brain.getGoalManager().getMission(missionId);
    let attempts = 0;
    while (mission?.status !== 'failed' && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      mission = brain.getGoalManager().getMission(missionId);
      attempts++;
    }
    expect(mission?.status).toBe('failed');
  }, 15000);

  it('Failure: LLM Provider Outage (Planning Resilience)', async () => {
    vi.spyOn(provider, 'generateStructuredOutput').mockRejectedValue(new Error('LLM Service Down'));

    const missionId = await brain.createMission('Outage Mission Test', {
      description: 'Should fail gracefully when LLM is down.',
      successCriteria: [],
      priority: 'medium'
    });

    let mission = brain.getGoalManager().getMission(missionId);
    let attempts = 0;
    while (mission?.status !== 'failed' && attempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 200));
      mission = brain.getGoalManager().getMission(missionId);
      attempts++;
    }
    expect(mission?.status).toBe('failed');
  }, 15000);

  it('Failure: Slow Tool (Timeout and Recovery)', async () => {
    const toolRegistry = agent.container.resolve(ToolRegistry);
    if (toolRegistry.hasTool('slow_tool')) toolRegistry.unregister('slow_tool');
    toolRegistry.register(createTestTool({
      name: 'slow_tool',
      description: 'Takes too long',
      execute: async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { done: true };
      }
    }));

    provider.setMockResponse({
      id: 'slow-plan',
      goal: 'Slow Tool',
      reasoning: 'Use slow tool.',
      tasks: [{ id: 'T1', description: 'Slow task', tool: 'slow_tool', dependencies: [] }]
    });

    const missionId = await brain.createMission('Slow Mission Test', {
      description: 'Use slow tool.',
      successCriteria: [],
      priority: 'medium'
    });

    const status = await waitForStatus(missionId, ['PLAN_COMPLETED', 'completed', 'PLAN_FAILED', 'failed']);
    expect(['PLAN_COMPLETED', 'completed', 'PLAN_FAILED', 'failed']).toContain(status);
  }, 20000);

  it('Failure: Message Loss Simulation', async () => {
    // Inject packet loss into the event bus for this mission
    let lostCount = 0;
    const originalPublish = eventBus.publish.bind(eventBus);
    vi.spyOn(eventBus, 'publish').mockImplementation((topic, message) => {
      if (topic === 'agent.communication' && Math.random() > 0.7) {
        lostCount++;
        return;
      }
      return originalPublish(topic, message);
    });

    provider.setMockResponse({
      id: 'lossy-plan',
      goal: 'Message Loss',
      reasoning: 'Resilient goal.',
      tasks: [{ id: 'T1', description: 'Safe task', tool: 'search_flights', dependencies: [] }]
    });

    const missionId = await brain.createMission('Lossy Mission Test', {
      description: 'Resilient goal with message loss.',
      successCriteria: [],
      priority: 'medium'
    });

    const status = await waitForStatus(missionId, ['PLAN_COMPLETED', 'completed', 'PLAN_FAILED', 'failed'], 15000);
    expect(status).not.toBe('timeout');
  }, 20000);
});
