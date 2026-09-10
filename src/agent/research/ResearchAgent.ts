import { AgentRuntime } from '../core/AgentRuntime';
import type { EventBus } from '../core/EventBus';
import type { Planner, Executor, AgentIdentity } from '../types/agent';
import type { IPerformanceMonitor, IImprovementEngine } from '../types/improvement';
import { OptimizationSuggestions } from '../improvement/OptimizationSuggestions';
import { KnowledgeGraph } from '../knowledge/KnowledgeGraph';
import type { AgentChannel } from '../core/AgentChannel';
import { ResearchManager } from './ResearchManager';

/**
 * Specialist agent for deep research, fact-checking, and knowledge synthesis.
 */
export class ResearchAgent extends AgentRuntime {
  private researchManager: ResearchManager;

  constructor(
    eventBus: EventBus,
    planner: Planner,
    executor: Executor,
    monitor: IPerformanceMonitor,
    improvementEngine: IImprovementEngine,
    suggestions: OptimizationSuggestions,
    identity: AgentIdentity,
    channel: AgentChannel,
    knowledgeGraph: KnowledgeGraph
  ) {
    super(eventBus, planner, executor, monitor, improvementEngine, suggestions, identity, channel, knowledgeGraph);
    this.researchManager = new ResearchManager(knowledgeGraph);
    
    // Set specialized identity if not provided
    if (!this._identity) {
      this._identity = {
        id: crypto.randomUUID(),
        name: 'Research Specialist',
        role: 'worker',
        capabilities: ['search', 'read', 'compare', 'summarize', 'cite', 'store']
      };
    }
  }

  /**
   * Overrides processGoal to provide specialized research capabilities.
   */
  public async processGoal(goal: string): Promise<void> {
    this._stream.thought(`Initializing research mission: ${goal}`, 'plan');
    
    // Enhance the goal with specific research instructions
    const enhancedGoal = `
      Perform a deep research mission on: "${goal}"
      
      STEPS:
      1. SEARCH: Find multiple reliable sources using the 'search' tool.
      2. READ: Extract key information from at least 3 relevant sources using 'browser'.
      3. COMPARE: Identify similarities and contradictions across sources.
      4. SUMMARIZE: Synthesize findings into a concise summary with proper citations.
      5. STORE: Save important facts and the final report in the knowledge base using 'knowledge' and 'research_manager'.
      
      Deliver a final cited report.
    `;

    await super.processGoal(enhancedGoal);
    
    // After execution, perform a summary reflection
    const memories = await this._memory.recallMemories(goal);
    if (memories.length > 0) {
      this._stream.thought('Synthesizing research findings and verifying facts...', 'reasoning');
      
      // Automatic fact recording for high-confidence discoveries
      const findings = memories.filter(m => (m.metadata?.importance as number || 0) > 0.7);
      for (const finding of findings) {
        // Record in Knowledge Graph
        await this.researchManager.recordFact({
          claim: typeof finding.content === 'string' ? finding.content : JSON.stringify(finding.content),
          source: (finding.metadata?.source as string) || 'Research Mission',
          url: (finding.metadata?.url as string) || 'internal://research-session',
          timestamp: finding.timestamp || Date.now(),
          confidence: (finding.metadata?.importance as number) || 0.9,
          provider: this._identity?.name || 'Research Agent'
        });

        // LIVE WORKSPACE EDIT: Render discovery card
        this.renderComponent('analysis', {
          title: `Discovery: ${finding.tags?.[0] || 'Fact'}`,
          content: finding.content,
          confidence: (finding.metadata?.importance as number) || 0.9,
          timestamp: new Date(finding.timestamp).toLocaleTimeString()
        }, { source: (finding.metadata?.source as string) || 'Research Agent' });
      }
    }
    
    this._stream.completing(`Research mission completed for topic: ${goal}`);
  }

  public get research(): ResearchManager {
    return this.researchManager;
  }
}
