import { AgentRuntime } from './AgentRuntime';
import { CoordinatorAgent } from './CoordinatorAgent';
import { EventBus } from './EventBus';
import { AgentChannel } from './AgentChannel';
import type { AgentIdentity, Planner, Executor } from '../types/agent';
import type { IServiceContainer } from '../types/di';
import type { IPerformanceMonitor, IImprovementEngine } from '../types/improvement';
import { OptimizationSuggestions } from '../improvement/OptimizationSuggestions';
import { KnowledgeGraph } from '../knowledge/KnowledgeGraph';
import { AgentRegistry } from './AgentRegistry';
import { ResearchAgent } from '../research/ResearchAgent';

export class AgentFactory {
  private container: IServiceContainer;

  constructor(container: IServiceContainer) {
    this.container = container;
  }

  public createAgent(identity?: AgentIdentity, channel?: AgentChannel): AgentRuntime {
    const eventBus = this.container.resolve(EventBus);
    const planner = this.container.resolve<Planner>('Planner');
    const executor = this.container.resolve<Executor>('Executor');
    const monitor = this.container.resolve<IPerformanceMonitor>('PerformanceMonitor');
    const improvementEngine = this.container.resolve<IImprovementEngine>('ImprovementEngine');
    const suggestions = this.container.resolve(OptimizationSuggestions);
    const knowledgeGraph = this.container.resolve(KnowledgeGraph);

    return new AgentRuntime(
      eventBus,
      planner,
      executor,
      monitor,
      improvementEngine,
      suggestions,
      identity,
      channel,
      knowledgeGraph
    );
  }

  public createResearchAgent(identity?: AgentIdentity, channel?: AgentChannel): ResearchAgent {
    const eventBus = this.container.resolve(EventBus);
    const planner = this.container.resolve<Planner>('Planner');
    const executor = this.container.resolve<Executor>('Executor');
    const monitor = this.container.resolve<IPerformanceMonitor>('PerformanceMonitor');
    const improvementEngine = this.container.resolve<IImprovementEngine>('ImprovementEngine');
    const suggestions = this.container.resolve(OptimizationSuggestions);
    const knowledgeGraph = this.container.resolve(KnowledgeGraph);

    return new ResearchAgent(
      eventBus,
      planner,
      executor,
      monitor,
      improvementEngine,
      suggestions,
      identity!, // ResearchAgent constructor handles undefined
      channel!,
      knowledgeGraph
    );
  }

  public createCoordinator(identity?: AgentIdentity, channel?: AgentChannel): CoordinatorAgent {
    const eventBus = this.container.resolve(EventBus);
    const registry = this.container.resolve(AgentRegistry);
    const planner = this.container.resolve<Planner>('Planner');
    const executor = this.container.resolve<Executor>('Executor');
    const monitor = this.container.resolve<IPerformanceMonitor>('PerformanceMonitor');
    const improvementEngine = this.container.resolve<IImprovementEngine>('ImprovementEngine');
    const suggestions = this.container.resolve(OptimizationSuggestions);
    const knowledgeGraph = this.container.resolve(KnowledgeGraph);

    return new CoordinatorAgent(
      eventBus,
      registry,
      planner,
      executor,
      monitor,
      improvementEngine,
      suggestions,
      identity,
      channel,
      knowledgeGraph
    );
  }
}
