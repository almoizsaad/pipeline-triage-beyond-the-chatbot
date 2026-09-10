import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResearchAgent } from '../research/ResearchAgent';
import { EventBus } from '../core/EventBus';
import { ToolRegistry } from '../tools/ToolRegistry';
import { registerDefaultTools } from '../tools/registerTools';
import { TaskExecutor } from '../executor/TaskExecutor';
import { LLMPlanner } from '../planner/LLMPlanner';
import { MockLLMProvider } from '../providers/MockLLMProvider';
import { PerformanceMonitor } from '../improvement/PerformanceMonitor';
import { ImprovementEngine } from '../improvement/ImprovementEngine';
import { OptimizationSuggestions } from '../improvement/OptimizationSuggestions';
import { KnowledgeGraph } from '../knowledge/KnowledgeGraph';
import { KnowledgeDatabase } from '../knowledge/KnowledgeDatabase';
import { EmbeddingStore } from '../knowledge/EmbeddingStore';
import { VectorSearch } from '../knowledge/VectorSearch';
import { AgentChannel } from '../core/AgentChannel';
import { AgentInbox } from '../core/AgentInbox';
import { AgentOutbox } from '../core/AgentOutbox';

describe('ResearchAgent Integration', () => {
  let agent: ResearchAgent;
  let eventBus: EventBus;
  let toolRegistry: ToolRegistry;
  let knowledgeGraph: KnowledgeGraph;

  beforeEach(() => {
    eventBus = new EventBus();
    toolRegistry = new ToolRegistry();
    const embeddingStore = new EmbeddingStore();
    const vectorSearch = new VectorSearch(embeddingStore);
    const llmProvider = new MockLLMProvider();
    const knowledgeDb = new KnowledgeDatabase(vectorSearch, llmProvider);
    
    registerDefaultTools(toolRegistry, knowledgeDb);

    const monitor = new PerformanceMonitor();
    const improvementEngine = new ImprovementEngine();
    const suggestions = new OptimizationSuggestions();
    knowledgeGraph = new KnowledgeGraph();

    const planner = new LLMPlanner(llmProvider, toolRegistry);
    const executor = new TaskExecutor(toolRegistry, monitor);
    const channel = new AgentChannel('test-agent', new AgentInbox(), new AgentOutbox({ route: async () => {} }));

    agent = new ResearchAgent(
      eventBus,
      planner,
      executor,
      monitor,
      improvementEngine,
      suggestions,
      undefined as any, // Let it use default identity
      channel,
      knowledgeGraph
    );
  });

  it('should initialize with correct capabilities', () => {
    expect(agent.identity?.capabilities).toContain('search');
    expect(agent.identity?.capabilities).toContain('read');
    expect(agent.identity?.capabilities).toContain('compare');
    expect(agent.identity?.capabilities).toContain('summarize');
    expect(agent.identity?.capabilities).toContain('cite');
    expect(agent.identity?.capabilities).toContain('store');
  });

  it('should process a research goal and record facts', async () => {
    // Mock planner to return a simple plan
    const generatePlanSpy = vi.spyOn(agent.planner!, 'generatePlan').mockResolvedValue({
      id: 'plan-123',
      goal: 'Research quantum computing',
      tasks: [
        {
          id: 'task-1',
          description: 'Search for quantum computing basics',
          tool: 'search',
          dependencies: [],
          status: 'pending',
          metadata: { query: 'quantum computing basics' }
        }
      ],
      reasoning: 'Starting with a broad search.',
      createdAt: Date.now()
    });

    // Mock executor to return a result
    const executeSpy = vi.spyOn(agent.executor!, 'executeTask').mockResolvedValue({
      success: true,
      data: { results: [{ title: 'Quantum Computing 101', snippet: 'Quantum computing is a type of computing...', url: 'https://example.com' }] },
      latency: 100
    });

    // We need to mock memory.recallMemories to simulate finding facts for reflection
    vi.spyOn(agent.memory, 'recallMemories').mockResolvedValue([
      {
        id: 'mem-1',
        type: 'semantic',
        content: 'Quantum bits (qubits) can exist in multiple states simultaneously.',
        timestamp: Date.now(),
        tags: ['fact'],
        metadata: { importance: 0.9 }
      }
    ]);

    await agent.processGoal('quantum computing');

    expect(generatePlanSpy).toHaveBeenCalled();
    expect(executeSpy).toHaveBeenCalled();
    
    // Check if a fact was recorded in the graph
    const nodes = Array.from(knowledgeGraph.nodes.values());
    expect(nodes.some(n => n.type === 'entity')).toBe(true);
  });
});
