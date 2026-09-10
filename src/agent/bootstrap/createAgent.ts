import { globalContainer, ServiceContainer } from '../core/ServiceContainer';
import { DependencyRegistry } from '../core/DependencyRegistry';
import { EventBus } from '../core/EventBus';
import { ToolRegistry } from '../tools/ToolRegistry';
import { registerDefaultTools } from '../tools/registerTools';
import { AgentFactory } from '../core/AgentFactory';
import { AgentManager } from '../core/AgentManager';
import { KnowledgeGraph } from '../knowledge/KnowledgeGraph';
import { KnowledgeDatabase } from '../knowledge/KnowledgeDatabase';
import { KnowledgeIndexer } from '../knowledge/KnowledgeIndexer';
import { PerformanceMonitor } from '../improvement/PerformanceMonitor';
import { ImprovementEngine } from '../improvement/ImprovementEngine';
import { OptimizationSuggestions } from '../improvement/OptimizationSuggestions';
import { AgentRuntime } from '../core/AgentRuntime';
import { ExecutiveBrain } from '../core/ExecutiveBrain';
import { APIMetricsManager } from '../core/APIMetricsManager';
import type { LLMProvider } from '../providers/LLMProvider';

/**
 * Bootstraps and returns a fully configured Agent OS instance using DI.
 * Defaults to a new container for isolation (important for tests).
 */
export function createAgent(container: ServiceContainer = new ServiceContainer(), options: { disableSafety?: boolean } = {}) {
  // Register all core services
  DependencyRegistry.registerCoreServices(container);

  // Resolve main components
  const eventBus = container.resolve(EventBus);
  const toolRegistry = container.resolve(ToolRegistry);
  const knowledgeDb = container.resolve(KnowledgeDatabase);
  const knowledgeIndexer = container.resolve(KnowledgeIndexer);
  const llmProvider = container.resolve<LLMProvider>('LLMProvider');
  const apiMetrics = container.resolve(APIMetricsManager);

  // Register default production tools
  registerDefaultTools(toolRegistry, knowledgeDb, llmProvider, apiMetrics, knowledgeIndexer);

  const monitor = container.resolve(PerformanceMonitor);
  const improvementEngine = container.resolve(ImprovementEngine);
  const suggestions = container.resolve(OptimizationSuggestions);
  const knowledgeGraph = container.resolve(KnowledgeGraph);
  const manager = container.resolve(AgentManager);

  // Get or create default runtime instance
  const runtime = container.resolve(AgentRuntime);
  const executiveBrain = container.resolve(ExecutiveBrain);

  if (options.disableSafety) {
    const coordinator = executiveBrain.getCoordinator();
    (coordinator as any).safety = {
      evaluatePlan: async (plan: any) => ({
        planId: plan.id,
        timestamp: Date.now(),
        score: { riskScore: 0, costScore: 0, safetyScore: 100, confidence: 100 },
        passed: true,
        warnings: [],
        errors: [],
        riskAnalysis: { level: 'low', factors: [] },
        costAnalysis: { estimatedTokens: 0, estimatedDollars: 0, limitExceeded: false },
        policyViolations: []
      })
    };
  }

  return {
    runtime,
    manager,
    eventBus,
    executiveBrain,
    toolRegistry,
    planner: container.resolve('Planner'),
    executor: container.resolve('Executor'),
    provider: container.resolve('LLMProvider'),
    monitor,
    improvementEngine,
    suggestions,
    knowledgeGraph,
    container
  };
}

// Global agent instance (legacy support, now points to global container's runtime)
export const agent = createAgent(globalContainer);
