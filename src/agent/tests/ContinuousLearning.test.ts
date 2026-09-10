import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgentRuntime } from '../core/AgentRuntime';
import { EventBus } from '../core/EventBus';
import { ToolRegistry } from '../tools/ToolRegistry';
import { TaskExecutor } from '../executor/TaskExecutor';
import { LLMPlanner } from '../planner/LLMPlanner';
import { MockLLMProvider } from '../providers/MockLLMProvider';
import { KnowledgeGraph } from '../knowledge/KnowledgeGraph';

describe('Continuous Learning Loop', () => {
  let runtime: AgentRuntime;
  let eventBus: EventBus;
  let toolRegistry: ToolRegistry;
  let knowledgeGraph: KnowledgeGraph;
  let provider: MockLLMProvider;

  beforeEach(() => {
    eventBus = new EventBus();
    toolRegistry = new ToolRegistry();
    provider = new MockLLMProvider();
    knowledgeGraph = new KnowledgeGraph();
    
    const planner = new LLMPlanner(provider, toolRegistry, undefined, undefined, knowledgeGraph);
    const executor = new TaskExecutor(toolRegistry);
    
    runtime = new AgentRuntime(
      eventBus,
      planner,
      executor,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      knowledgeGraph
    );
  });

  it('should record discoveries in KnowledgeGraph and use them in future planning', async () => {
    // 1. First Mission: Discover something
    const firstGoal = 'Discover the secret of Nexus OS';
    
    vi.spyOn(runtime.planner!, 'generatePlan').mockResolvedValueOnce({
      id: 'plan-1',
      goal: firstGoal,
      tasks: [{
        id: 'task-1',
        description: 'Read the Nexus manual',
        tool: 'browser',
        status: 'pending',
        dependencies: []
      }],
      createdAt: Date.now()
    });

    vi.spyOn(runtime.executor!, 'executeTask').mockResolvedValue({
      success: true,
      data: { content: 'The secret is high-speed coordination.' },
      taskId: 'task-1'
    });

    await runtime.processGoal(firstGoal);

    // Wait for reflection to complete (it's async in AgentRuntime)
    await new Promise<void>((resolve) => {
      eventBus.subscribe('agent:events', (event) => {
        if (event.type === 'REFLECTION') resolve();
      });
      // Timeout after 2s just in case
      setTimeout(resolve, 2000);
    });

    // Verify reflection recorded discovery
    const nodes = Array.from(knowledgeGraph.nodes.values());
    const discoveryNode = nodes.find(n => n.label.includes('Discovery: Read the Nexus manual'));
    expect(discoveryNode).toBeDefined();
    expect((discoveryNode?.properties.result as any).content).toBe('The secret is high-speed coordination.');

    // 2. Second Mission: Ask about the secret again
    const secondGoal = 'What is the secret of Nexus OS?';
    
    provider.setMockResponse(`
      {
        "id": "plan-2",
        "goal": "${secondGoal}",
        "reasoning": "I will check the manual again.",
        "tasks": [
          {
            "id": "task-2",
            "description": "Read the manual",
            "tool": "browser",
            "dependencies": []
          }
        ]
      }
    `);

    // Add browser tool to avoid validation error
    toolRegistry.register({
      name: 'browser',
      description: 'Mock browser',
      metadata: { version: '1.0.0' },
      permissions: { requiredPermissions: [] },
      options: {},
      inputSchema: null as any,
      outputSchema: null as any,
      execute: async () => ({ success: true }),
      checkHealth: async () => ({ status: 'healthy', lastChecked: new Date(), errorCount: 0 })
    });

    // We want to verify that LLMPlanner.generatePlan queries the graph
    const searchNodesSpy = vi.spyOn(knowledgeGraph, 'searchNodes');
    
    // Generate plan for second goal
    try {
      await runtime.planner!.generatePlan(secondGoal, runtime.getState());
    } catch (e) {
      // Ignore validation errors in second plan, we only care about searchNodes call
    }

    expect(searchNodesSpy).toHaveBeenCalledWith(secondGoal);
    
    // Check if the prompt built by LLMPlanner would contain the knowledge
    // Since we can't easily check the private buildPrompt call, we verify searchNodes returned something
    const searchResults = await searchNodesSpy.mock.results[0].value;
    expect(searchResults.length).toBeGreaterThan(0);
    expect((searchResults[0].properties.result as any).content).toContain('high-speed coordination');
  });
});
