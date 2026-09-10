import { ServiceContainer } from './ServiceContainer';
import { EventBus } from './EventBus';
import { ToolRegistry } from '../tools/ToolRegistry';
import { PerformanceMonitor } from '../improvement/PerformanceMonitor';
import { ImprovementEngine } from '../improvement/ImprovementEngine';
import { OptimizationSuggestions } from '../improvement/OptimizationSuggestions';
import { KnowledgeGraph } from '../knowledge/KnowledgeGraph';
import { KnowledgeDatabase } from '../knowledge/KnowledgeDatabase';
import { EmbeddingStore } from '../knowledge/EmbeddingStore';
import { VectorSearch } from '../knowledge/VectorSearch';
import { GeminiLLMProvider } from '../providers/GeminiLLMProvider';
import { MoonshotLLMProvider } from '../providers/MoonshotLLMProvider';
import { MockLLMProvider } from '../providers/MockLLMProvider';
import type { LLMProvider } from '../providers/LLMProvider';
import { LLMPlanner } from '../planner/LLMPlanner';
import { TaskExecutor } from '../executor/TaskExecutor';
import { AgentRegistry } from './AgentRegistry';
import { AgentFactory } from './AgentFactory';
import { AgentManager } from './AgentManager';
import type { AgentIdentity, Executor } from '../types/agent';
import { AgentChannel } from './AgentChannel';
import { AgentStream } from '../events/AgentStream';
import { MemoryManager } from '../memory/MemoryManager';
import { GoalManager } from './GoalManager';
import { PriorityManager } from './PriorityManager';
import { MissionScheduler } from './MissionScheduler';

// Phase 8 additions
import { ExecutiveBrain } from './ExecutiveBrain';
import { CoordinatorAgent } from './CoordinatorAgent';
import { AgentRuntime } from './AgentRuntime';
import { WorkflowEngine } from '../workflow/WorkflowEngine';
import { ReflectionEngine } from '../reflection/ReflectionEngine';
import { SafetyGuard } from './SafetyLayer';
import { ThoughtManager } from '../reflection/ThoughtManager';
import { ComponentRegistry } from '../../registry/ComponentRegistry';
import { WorkspaceAdapter } from '../adapters/workspaceAdapter';
import { MissionAdapter } from '../adapters/MissionAdapter';
import { PersistentMemory } from '../memory/PersistentMemory';
import { KnowledgePersistence } from '../knowledge/KnowledgePersistence';
import { AgentMessageBus } from './AgentMessageBus';
import { MessageRouter } from './MessageRouter';
import { AgentOutbox } from './AgentOutbox';
import { AgentInbox } from './AgentInbox';
import { BackgroundRuntime } from './BackgroundRuntime';
import { AutonomousMonitoring } from './AutonomousMonitoring';
import { SelfHealing } from './SelfHealing';
import { ContinuousLearning } from './ContinuousLearning';
import { MissionIntelligence } from './MissionIntelligence';
import { MissionNotifications } from './MissionNotifications';
import { MissionInbox } from './MissionInbox';

import { APIMetricsManager } from './APIMetricsManager';
import { PromptOptimizer } from '../improvement/PromptOptimizer';

import { KnowledgeIndexer } from '../knowledge/KnowledgeIndexer';

export class DependencyRegistry {
  public static registerCoreServices(container: ServiceContainer): void {
    // ... rest of imports
    // Singletons - only if not already registered
    if (!container.has(EventBus)) container.registerSingleton(EventBus, new EventBus());
    if (!container.has(APIMetricsManager)) container.registerSingleton(APIMetricsManager, (c) => APIMetricsManager.getInstance(c.resolve(EventBus)));
    if (!container.has(AgentMessageBus)) container.registerSingleton(AgentMessageBus, (c) => new AgentMessageBus(c.resolve(EventBus)));
    if (!container.has(AgentStream)) container.registerSingleton(AgentStream, (c) => new AgentStream(c.resolve(EventBus)));
    if (!container.has(ToolRegistry)) container.registerSingleton(ToolRegistry, new ToolRegistry());
    if (!container.has(PerformanceMonitor)) container.registerSingleton(PerformanceMonitor, new PerformanceMonitor());
    if (!container.has(MemoryManager)) container.registerSingleton(MemoryManager, (c) => new MemoryManager(c.resolve(PerformanceMonitor)));
    if (!container.has(ImprovementEngine)) container.registerSingleton(ImprovementEngine, new ImprovementEngine());
    if (!container.has(OptimizationSuggestions)) container.registerSingleton(OptimizationSuggestions, new OptimizationSuggestions());
    if (!container.has(PromptOptimizer)) container.registerSingleton(PromptOptimizer, new PromptOptimizer());
    if (!container.has(KnowledgeGraph)) {
      container.registerSingleton(KnowledgeGraph, () => {
        const persistence = new KnowledgePersistence();
        return new KnowledgeGraph(persistence);
      });
    }
    
    // Knowledge Database & Vector Search
    if (!container.has(EmbeddingStore)) container.registerSingleton(EmbeddingStore, new EmbeddingStore());
    if (!container.has(VectorSearch)) container.registerSingleton(VectorSearch, (c) => new VectorSearch(c.resolve(EmbeddingStore)));
    if (!container.has(KnowledgeDatabase)) {
      container.registerSingleton(KnowledgeDatabase, (c) => {
        return new KnowledgeDatabase(
          c.resolve(VectorSearch),
          c.resolve('LLMProvider'),
          c.resolve(EmbeddingStore)
        );
      });
    }

    if (!container.has(KnowledgeIndexer)) {
      container.registerSingleton(KnowledgeIndexer, (c) => {
        return new KnowledgeIndexer(
          c.resolve(KnowledgeDatabase),
          c.resolve(EmbeddingStore),
          c.resolve('LLMProvider'),
          undefined,
          c.resolve(KnowledgeGraph)
        );
      });
    }

    if (!container.has(AgentRegistry)) container.registerSingleton(AgentRegistry, () => new AgentRegistry());
    
    // Safety
    if (!container.has('Safety')) container.registerSingleton('Safety', new SafetyGuard());

    // Provider/Implementation mapping
    if (!container.has('LLMProvider')) {
      container.registerSingleton('LLMProvider', (c) => {
        const hasGeminiKey = !!(typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_GEMINI_API_KEY : process.env.VITE_GEMINI_API_KEY);
        const hasMoonshotKey = !!(typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_API_KEY : process.env.VITE_API_KEY);
        const metrics = c.resolve(APIMetricsManager);

        if (hasGeminiKey) {
          return new GeminiLLMProvider(undefined, undefined, undefined, metrics);
        } else if (hasMoonshotKey) {
          return new MoonshotLLMProvider();
        } else {
          console.warn('[DependencyRegistry] No LLM API keys found. Falling back to MockLLMProvider.');
          return new MockLLMProvider();
        }
      });
    }
    
    if (!container.has('Planner')) {
      container.registerSingleton('Planner', (c) => {
        const provider = c.resolve<LLMProvider>('LLMProvider');
        const toolRegistry = c.resolve(ToolRegistry);
        const monitor = c.resolve(PerformanceMonitor);
        const graph = c.resolve(KnowledgeGraph);
        const stream = c.resolve(AgentStream);
        const promptOptimizer = c.resolve(PromptOptimizer);
        return new LLMPlanner(provider, toolRegistry, undefined, monitor, graph, undefined, stream, promptOptimizer);
      });
    }

    if (!container.has('Executor')) {
      container.registerSingleton('Executor', (c) => {
        const toolRegistry = c.resolve(ToolRegistry);
        const monitor = c.resolve(PerformanceMonitor);
        return new TaskExecutor(toolRegistry, monitor);
      });
    }

    // Workflow & Reflection
    if (!container.has('Workflow')) {
      container.registerSingleton('Workflow', (c) => {
        const executor = c.resolve<Executor>('Executor');
        const monitor = c.resolve(PerformanceMonitor);
        return new WorkflowEngine(executor, monitor);
      });
    }

    if (!container.has(KnowledgeGraph)) {
      container.registerSingleton(KnowledgeGraph, () => {
        const persistence = new KnowledgePersistence();
        return new KnowledgeGraph(persistence);
      });
    }

    if (!container.has('Reflection')) {
      container.registerSingleton('Reflection', (c) => {
        const graph = c.resolve(KnowledgeGraph);
        const stream = c.resolve(AgentStream);
        return new ReflectionEngine(graph, stream);
      });
    }

    // Alias interfaces to implementations
    if (!container.has('PerformanceMonitor')) container.registerSingleton('PerformanceMonitor', (c) => c.resolve(PerformanceMonitor));
    if (!container.has('ImprovementEngine')) container.registerSingleton('ImprovementEngine', (c) => c.resolve(ImprovementEngine));
    if (!container.has('Memory')) container.registerSingleton('Memory', (c) => c.resolve(MemoryManager));

    // Factories
    if (!container.has(AgentFactory)) container.registerSingleton(AgentFactory, (c) => new AgentFactory(c));

    // Thought Management
    if (!container.has(ThoughtManager)) {
      container.registerSingleton(ThoughtManager, (c) => {
        const eventBus = c.resolve(EventBus);
        return new ThoughtManager(eventBus);
      });
    }


    // Registry & Adapters
    if (!container.has(ComponentRegistry)) container.registerSingleton(ComponentRegistry, new ComponentRegistry());
    if (!container.has(WorkspaceAdapter)) container.registerSingleton(WorkspaceAdapter, (c) => new WorkspaceAdapter(c.resolve(EventBus)));
    if (!container.has(MissionAdapter)) container.registerSingleton(MissionAdapter, (c) => new MissionAdapter(c.resolve(EventBus)));

    // Coordinator & Executive Brain
    if (!container.has(CoordinatorAgent)) {
      container.registerSingleton(CoordinatorAgent, (c) => {
        const factory = c.resolve(AgentFactory);
        const registry = c.resolve(AgentRegistry);
        const messageBus = c.resolve(AgentMessageBus);
        const eventBus = c.resolve(EventBus);
        
        // Setup communication infrastructure for coordinator
        const router = new MessageRouter(registry, messageBus);
        const outbox = new AgentOutbox(router);
        const inbox = new AgentInbox();
        
        const identity = { 
          id: 'system-coordinator', 
          name: 'System Coordinator', 
          role: 'coordinator' as const, 
          capabilities: ['orchestration', 'coordination'] 
        };
        
        const channel = new AgentChannel(identity.id, inbox, outbox);
        messageBus.subscribe(identity.id, (msg) => inbox.push(msg));
        
        // We need AgentManager for spawning, but AgentManager needs CoordinatorAgent.
        // We'll use a lazy resolution or setter if needed, but for now let's pass null and 
        // the AgentManager will set itself when it's ready.
        const coordinator = factory.createCoordinator(identity, channel);
        registry.register(identity, coordinator);
        return coordinator;
      });
    }

    if (!container.has(AgentManager)) {
      container.registerSingleton(AgentManager, (c) => {
        const eventBus = c.resolve(EventBus);
        const factory = c.resolve(AgentFactory);
        const registry = c.resolve(AgentRegistry);
        const messageBus = c.resolve(AgentMessageBus);
        const manager = new AgentManager(eventBus, (identity: AgentIdentity, channel: AgentChannel) => {
          return factory.createAgent(identity, channel);
        }, registry, messageBus);

        // Inject manager into coordinator
        const coordinator = c.resolve(CoordinatorAgent);
        coordinator.setManager(manager);

        return manager;
      });
    }

    if (!container.has(GoalManager)) {
      container.registerSingleton(GoalManager, (c) => new GoalManager(c.resolve(EventBus)));
    }

    if (!container.has(PriorityManager)) {
      container.registerSingleton(PriorityManager, new PriorityManager());
    }

    if (!container.has(MissionScheduler)) {
      container.registerSingleton(MissionScheduler, (c) => {
        return new MissionScheduler(
          c.resolve(GoalManager),
          c.resolve(PriorityManager),
          c.resolve(EventBus)
        );
      });
    }

    if (!container.has(ExecutiveBrain)) {
      container.registerSingleton(ExecutiveBrain, (c) => {
        return new ExecutiveBrain(
          c.resolve(EventBus),
          c.resolve(CoordinatorAgent),
          c.resolve(GoalManager),
          c.resolve(PriorityManager),
          c.resolve(MissionScheduler)
        );
      });
    }

    if (!container.has(BackgroundRuntime)) {
      container.registerSingleton(BackgroundRuntime, (c) => {
        return new BackgroundRuntime(c.resolve(EventBus), c.resolve(ExecutiveBrain));
      });
    }

    if (!container.has(AutonomousMonitoring)) {
      container.registerSingleton(AutonomousMonitoring, (c) => {
        return new AutonomousMonitoring(c.resolve(EventBus));
      });
    }

    if (!container.has(SelfHealing)) {
      container.registerSingleton(SelfHealing, (c) => {
        return new SelfHealing(c.resolve(EventBus));
      });
    }

    if (!container.has(ContinuousLearning)) {
      container.registerSingleton(ContinuousLearning, (c) => {
        const eventBus = c.resolve(EventBus);
        const registry = c.resolve(AgentRegistry);
        const graph = c.resolve(KnowledgeGraph);
        const db = c.resolve(KnowledgeDatabase);
        const thoughtManager = c.resolve(ThoughtManager);
        const improvementEngine = c.resolve(ImprovementEngine);
        const promptOptimizer = c.resolve(PromptOptimizer);
        return new ContinuousLearning(eventBus, registry, graph, db, thoughtManager, improvementEngine, promptOptimizer);
      });
    }

    if (!container.has(MissionIntelligence)) {
      container.registerSingleton(MissionIntelligence, (c) => {
        return new MissionIntelligence(c.resolve(GoalManager));
      });
    }

    if (!container.has(MissionNotifications)) {
      container.registerSingleton(MissionNotifications, (c) => {
        return new MissionNotifications(c.resolve(EventBus));
      });
    }

    if (!container.has(MissionInbox)) {
      container.registerSingleton(MissionInbox, (c) => {
        return new MissionInbox(c.resolve(EventBus));
      });
    }

    // Main AgentRuntime singleton
    if (!container.has(AgentRuntime)) {
      container.registerSingleton(AgentRuntime, (c) => {
        const factory = c.resolve(AgentFactory);
        return factory.createAgent();
      });
    }

    // Self registration
    if (!container.has(DependencyRegistry)) container.registerSingleton(DependencyRegistry, new DependencyRegistry());
  }
}
