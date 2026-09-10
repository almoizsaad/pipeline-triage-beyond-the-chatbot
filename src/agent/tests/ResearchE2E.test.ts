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
import { ResearchAgent } from '../research/ResearchAgent';

describe('Research Agent End-to-End Mission Validation', () => {
  let agent: ReturnType<typeof createAgent>;
  let brain: ExecutiveBrain;
  let coordinator: CoordinatorAgent;
  let provider: MockLLMProvider;
  let researchAgent: ResearchAgent;

  beforeEach(() => {
    const container = new ServiceContainer();
    provider = new MockLLMProvider();
    container.registerSingleton('LLMProvider', provider);
    
    agent = createAgent(container);
    const factory = agent.container.resolve(AgentFactory);
    const registry = agent.container.resolve(AgentRegistry);
    const eventBus = agent.container.resolve(EventBus);
    
    const messageBus = new AgentMessageBus(eventBus);
    const router = new MessageRouter(registry, messageBus);
    
    const researchIdentity = { id: 'researcher', name: 'Research Specialist', role: 'worker' as AgentRole, capabilities: ['research', 'search', 'analysis'] };
    const researchInbox = new AgentInbox();
    const researchOutbox = new AgentOutbox(router);
    const researchChannel = new AgentChannel(researchIdentity.id, researchInbox, researchOutbox);
    messageBus.subscribe(researchIdentity.id, (msg) => researchInbox.push(msg));

    researchAgent = factory.createResearchAgent(researchIdentity, researchChannel);
    // REGISTER RESEARCHER FIRST
    registry.register(researchIdentity, researchAgent);

    const coordinatorIdentity = { id: 'coordinator', name: 'Coordinator', role: 'coordinator' as AgentRole, capabilities: ['coordination'] };
    const coordinatorInbox = new AgentInbox();
    const coordinatorOutbox = new AgentOutbox(router);
    const coordinatorChannel = new AgentChannel(coordinatorIdentity.id, coordinatorInbox, coordinatorOutbox);
    messageBus.subscribe(coordinatorIdentity.id, (msg) => coordinatorInbox.push(msg));
    
    coordinator = factory.createCoordinator(coordinatorIdentity, coordinatorChannel);
    registry.register(coordinatorIdentity, coordinator);
    
    // Wire up research agent to handle tasks
    researchChannel.onMessage(async (message) => {
      console.log(`[TestWorker] Received message: ${message.type}`);
      if (message.type === 'TASK_ASSIGNMENT') {
        const payload = message.payload as { taskId: string; description: string; tool: string; metadata?: Record<string, unknown>; planId: string };
        console.log(`[TestWorker] Executing task ${payload.taskId} using tool ${payload.tool}`);
        
        // Execute task via the research agent's executor
        const result = await researchAgent.executor?.executeTask({
          id: payload.taskId,
          description: payload.description,
          tool: payload.tool,
          metadata: payload.metadata,
          dependencies: [],
          status: 'pending'
        } as StructuredTask, {});
        
        console.log(`[TestWorker] Task ${payload.taskId} result: ${result?.success}`);
        
        // If it was a search tool, record a fact automatically for the E2E test
        if (payload.tool === 'search' && result?.success) {
          const searchData = result.data as any;
          if (searchData.results) {
            for (const res of searchData.results) {
              console.log(`[TestWorker] Recording fact: ${res.title}`);
              await researchAgent.research.recordFact({
                claim: res.snippet,
                source: res.title,
                url: res.url,
                timestamp: Date.now(),
                confidence: 0.9,
                provider: res.source
              });
            }
          }
        }

        await researchChannel.sendDirect('coordinator', result?.success ? 'TASK_COMPLETED' : 'TASK_FAILED', {
          taskId: payload.taskId,
          planId: payload.planId,
          result: result?.data,
          error: result?.error
        });
      }
    });
    
    brain = new ExecutiveBrain(agent.eventBus, coordinator);
  });

  it('Autonomous Research Mission: Deep analysis with fact verification', async () => {
    // 1. Setup Mock LLM Response for the research mission
    provider.setMockResponse({
      id: 'research-plan-1',
      goal: 'Research the impact of AI on software engineering productivity',
      reasoning: 'Need to search for recent studies and then verify the findings.',
      tasks: [
        { 
          id: 'T1', 
          description: 'Search for AI productivity studies', 
          tool: 'search', 
          metadata: { query: 'AI software engineering productivity impact 2024' }, 
          dependencies: [] 
        },
        { 
          id: 'T2', 
          description: 'Analyze and verify findings', 
          tool: 'json_parser', 
          metadata: { operation: 'parse', text: '{"analysis": "completed"}' }, 
          dependencies: ['T1'] 
        }
      ]
    });

    // 2. Create the mission
    const missionId = await brain.createMission('AI Productivity Research', {
      description: 'Analyze how AI tools like Copilot and Gemini impact SE productivity.',
      successCriteria: ['Key studies identified', 'Facts verified in knowledge graph'],
      priority: 'high'
    });

    // 3. Monitor for completion
    let completed = false;
    let failed = false;
    
    const unsub = agent.eventBus.subscribe('agent:events', (event) => {
      if (event.type === AgentEventType.AGENT_UPDATE) {
        const payload = event.payload as any;
        if (payload.missionId === missionId) {
          if (payload.status === 'PLAN_COMPLETED') completed = true;
          if (payload.status === 'PLAN_FAILED') failed = true;
        }
      }
    });

    // 4. Wait for mission to finish
    const startWait = Date.now();
    while (!completed && !failed && Date.now() - startWait < 15000) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    unsub();

    expect(completed).toBe(true);
    expect(failed).toBe(false);

    // 5. Verify Knowledge Graph State
    const allNodes = await researchAgent.knowledgeGraph.searchNodes('AI');
    const entityNodes = allNodes.filter(n => n.type === 'entity');
    console.log(`[TestE2E] Found ${entityNodes.length} entity nodes with 'AI' in label`);
    entityNodes.forEach(n => console.log(`  - Node: ${n.label} (Type: ${n.type})`));
    
    expect(entityNodes.length).toBeGreaterThan(0);

    // 6. Verify Fact Verification logic
    const factNode = entityNodes[0];
    const verification = await researchAgent.research.verifyFact(factNode.id);
    expect(verification).toHaveProperty('status');
    expect(verification.confidence).toBeGreaterThan(0);
    
    console.log(`[E2E] Research mission completed. Verified fact confidence: ${verification.confidence}`);
  }, 20000);
});
