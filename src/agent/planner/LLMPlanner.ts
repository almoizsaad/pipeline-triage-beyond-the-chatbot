import type { Planner, AgentState, Plan } from '../types/agent';
import type { LLMProvider } from '../providers/LLMProvider';
import type { ToolRegistry } from '../tools/ToolRegistry';
import { PlanSchema } from './schemas';
import type { StructuredPlan } from './schemas';
import { PlannerParser } from './PlannerParser';
import { PlanValidator } from './PlanValidator';
import type { IPerformanceMonitor } from '../types/improvement';
import type { IKnowledgeGraph } from '../types/knowledge';
import { KnowledgeLinker } from '../knowledge/KnowledgeLinker';
import type { ISafetyGuard } from '../types/safety';
import { SafetyGuard } from '../core/SafetyLayer';
import { AgentStream } from '../events/AgentStream';
import { PromptOptimizer } from '../improvement/PromptOptimizer';

/**
 * LLMPlanner uses a Large Language Model to generate autonomous plans.
 * It includes robust parsing, validation, and fallback mechanisms.
 */
export class LLMPlanner implements Planner {
  private provider: LLMProvider;
  private toolRegistry: ToolRegistry;
  private parser: PlannerParser;
  private validator: PlanValidator;
  private fallbackPlanner?: Planner;
  private monitor?: IPerformanceMonitor;
  private graph?: IKnowledgeGraph;
  private linker?: KnowledgeLinker;
  private safetyGuard: ISafetyGuard;
  private stream?: AgentStream;
  private promptOptimizer?: PromptOptimizer;

  constructor(
    provider: LLMProvider, 
    toolRegistry: ToolRegistry,
    fallbackPlanner?: Planner,
    monitor?: IPerformanceMonitor,
    graph?: IKnowledgeGraph,
    safetyGuard?: ISafetyGuard,
    stream?: AgentStream,
    promptOptimizer?: PromptOptimizer
  ) {
    this.provider = provider;
    this.toolRegistry = toolRegistry;
    this.parser = new PlannerParser();
    this.validator = new PlanValidator(toolRegistry);
    this.fallbackPlanner = fallbackPlanner;
    this.monitor = monitor;
    this.graph = graph;
    this.stream = stream;
    this.promptOptimizer = promptOptimizer;
    if (graph) {
      this.linker = new KnowledgeLinker(graph);
    }
    this.safetyGuard = safetyGuard || new SafetyGuard();
  }

  /**
   * Generates a structured plan using the LLM.
   */
  public async generatePlan(goal: string, state: AgentState): Promise<Plan> {
    this.stream?.thought(`Generating autonomous plan for goal: ${goal}`, 'plan');

    // Phase 9: Continuous Learning - Query Knowledge Graph for context
    let knowledgeContext = '';
    if (this.graph) {
      this.stream?.thought('Querying Knowledge Graph for relevant past experiences and facts...', 'reasoning');
      const relatedNodes = await this.graph.searchNodes(goal);
      if (relatedNodes.length > 0) {
        knowledgeContext = relatedNodes.map(n => `- ${n.label}: ${JSON.stringify(n.properties)}`).join('\n');
        this.stream?.thought(`Found ${relatedNodes.length} relevant knowledge entries.`, 'observation');
      }
    }

    // Phase 9.7: Self-Improvement - Get learned system instructions
    const promptOverlay = this.promptOptimizer?.getPromptOverlay() || '';
    if (promptOverlay) {
      this.stream?.thought('Applying learned system improvements and policies to the planner prompt.', 'reasoning');
    }

    const toolsDescription = this.toolRegistry.describeTools();
    const prompt = this.buildPrompt(goal, state, toolsDescription, knowledgeContext, promptOverlay);

    try {
      this.stream?.thought('Consulting LLM provider for structured task decomposition.', 'reasoning');
      // 1. Generate output from LLM
      const response = await this.provider.generateStructuredOutput<string>(
        prompt,
        PlanSchema
      );

      // 2. Parse the response
      const structuredPlan = typeof response === 'string' 
        ? this.parser.parsePlan<StructuredPlan>(response)
        : response as unknown as StructuredPlan;

      this.stream?.thought(`Generated plan reasoning: ${structuredPlan.reasoning}`, 'observation');

      // 3. Validate the plan
      const validation = this.validator.validate(structuredPlan);
      if (!validation.valid) {
        this.stream?.thought('Plan validation failed. Re-evaluating strategy.', 'reflection');
        console.warn('[LLMPlanner] Plan validation failed:', validation.errors);
        this.monitor?.trackPlanner(0, structuredPlan.tasks?.length || 0);
        throw new Error(`Invalid plan generated: ${validation.errors.join(', ')}`);
      }

      const confidence = structuredPlan.confidence || 85;
      this.monitor?.trackPlanner(confidence, structuredPlan.tasks.length);

      // 4. Return as standard Plan
      const plan: Plan = {
        id: structuredPlan.id || crypto.randomUUID(),
        goal: structuredPlan.goal || goal,
        reasoning: structuredPlan.reasoning,
        tasks: structuredPlan.tasks.map(t => ({
          ...t,
          status: 'pending' as const,
          metadata: t.metadata || {}
        })),
        createdAt: Date.now()
      };

      // Phase 6.3: Safety Evaluation
      const safetyReport = await this.safetyGuard.evaluatePlan(plan);
      if (!safetyReport.passed) {
        console.error('[LLMPlanner] Plan rejected by Safety Layer:', safetyReport.errors);
        throw new Error(`Safety Violation: ${safetyReport.errors.join('; ')}`);
      }

      if (this.graph && this.linker) {
        await this.recordPlanInGraph(plan);
      }

      return plan;

    } catch (error) {
      console.error('[LLMPlanner] LLM Planning failed:', error);
      
      if (this.fallbackPlanner) {
        console.info('[LLMPlanner] Attempting fallback planning...');
        return this.fallbackPlanner.generatePlan(goal, state);
      }
      
      throw error;
    }
  }

  private async recordPlanInGraph(plan: Plan): Promise<void> {
    if (!this.graph || !this.linker) return;

    // Create plan node
    const planNode = await this.graph.createNode({
      type: 'plan',
      label: `Plan: ${plan.goal}`,
      properties: { 
        planId: plan.id,
        goal: plan.goal,
        createdAt: plan.createdAt
      }
    });

    // Create task nodes and link them
    for (const task of plan.tasks) {
      const taskNode = await this.graph.createNode({
        type: 'plan',
        label: `Task: ${task.description}`,
        properties: { taskId: task.id, description: task.description }
      });
      await this.linker.linkNodes(planNode.id, taskNode.id, 'depends_on', 1.0);
    }
  }

  private buildPrompt(goal: string, state: AgentState, toolsDescription: string, knowledgeContext: string = '', promptOverlay: string = ''): string {
    return `
      You are an autonomous Agent OS Planner. 
      Your mission is to decompose the user's goal into a logical sequence of tasks.
      
      GOAL: "${goal}"
      
      ${knowledgeContext ? `RELEVANT KNOWLEDGE FROM GRAPH:\n${knowledgeContext}\n` : ''}

      ${promptOverlay}

      AVAILABLE TOOLS:
      ${toolsDescription}

      UI CAPABILITIES:
      You can suggest UI components to render for each task.
      Supported components: 
      - flight-card, hotel-card, budget-chart, timeline, overview, weather, table, form, list, analysis, confidence-badge, system-metrics, mission-card, mission-report.

      AGENT HISTORY:
      ${JSON.stringify(state.history.slice(-5))}
      
      REQUIREMENTS:
      1. Every task MUST use one of the available tools.
      2. **CRITICAL**: You MUST provide all required input parameters for the chosen tool inside the 'metadata' field.
         - Look at the 'Input' section for each tool below.
         - Example: If a tool has Input '{ query (String) }', you MUST include '{ "metadata": { "query": "..." } }' in the task object.
      3. **DATA FLOW**: You can use placeholders to pass results between tasks.
         - Use '{{task-id.result}}' to reference the full output of a previous task.
         - Use '{{task-id.result.path.to.field}}' to reference a specific nested field.
         - **HINT**: 'search' tool returns an object '{ results: [{ title, snippet, url }, ...] }'.
         - Example: If task-1 is 'search', task-2 can use '{ "metadata": { "sources": "{{task-1.result.results}}" } }' to get the array of results directly.
      4. Define clear dependencies (e.g., task B depends on task A).
      5. Provide a brief reasoning for your plan.
      6. Estimate your confidence in this plan (0-100).

      **OUTPUT FORMAT**:
      You MUST return ONLY a valid JSON object with the following EXACT structure:
      {
        "id": "unique-uuid",
        "goal": "the original goal",
        "reasoning": "your explanation",
        "confidence": 95,
        "tasks": [
          {
            "id": "task-1",
            "description": "...",
            "tool": "tool_name",
            "dependencies": [],
            "metadata": { "param1": "value1" },
            "ui_component": "optional-ui-component"
          }
        ]
      }
    `;
  }
}
