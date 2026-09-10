import { globalContainer } from '../core/ServiceContainer';
import { DependencyRegistry } from '../core/DependencyRegistry';
import { ExecutiveBrain } from '../core/ExecutiveBrain';
import { CoordinatorAgent } from '../core/CoordinatorAgent';
import { AgentManager } from '../core/AgentManager';
import { AgentRuntime } from '../core/AgentRuntime';
import { ThoughtManager } from '../reflection/ThoughtManager';
import { ComponentRegistry } from '../../registry/ComponentRegistry';
import { WorkspaceAdapter } from '../adapters/workspaceAdapter';
import { MissionAdapter } from '../adapters/MissionAdapter';
import { KnowledgeGraph } from '../knowledge/KnowledgeGraph';
import { MemoryManager } from '../memory/MemoryManager';
import { EventBus } from '../core/EventBus';
import { initializeRegistry } from '../../registry/defaultRegistry';
import { BackgroundRuntime } from '../core/BackgroundRuntime';
import { MissionIntelligence } from '../core/MissionIntelligence';
import { ContinuousLearning } from '../core/ContinuousLearning';
import { MissionNotifications } from '../core/MissionNotifications';
import { MissionInbox } from '../core/MissionInbox';
import { AutonomousMonitoring } from '../core/AutonomousMonitoring';
import { SelfHealing } from '../core/SelfHealing';
import { APIMetricsManager } from '../core/APIMetricsManager';
import { GoalManager } from '../core/GoalManager';
import { AgentManager } from '../core/AgentManager';

/**
 * Bootstraps the complete Agent OS runtime exactly once.
 * Ensures all core components are instantiated and registered in the ServiceContainer.
 */
export async function bootstrapRuntime() {
  const isBrowser = typeof window !== 'undefined';

  // Use a global flag to prevent multiple initializations during hot reload
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (isBrowser && (window as any).__AGENT_OS_BOOTSTRAPPED__) {
    console.debug('[AgentOS] Runtime already bootstrapped. Skipping.');
    return globalContainer;
  }

  console.info('[AgentOS] Bootstrapping Agent OS Runtime...');

  // 1. Register all services in the container
  DependencyRegistry.registerCoreServices(globalContainer);

  // 2. Initialize Registries
  initializeRegistry();

  // 3. Eagerly instantiate core singletons to establish the runtime
  try {
    // Core Infrastructure
    const eventBus = globalContainer.resolve(EventBus);
    globalContainer.resolve(KnowledgeGraph);
    globalContainer.resolve(MemoryManager);
    globalContainer.resolve('Safety');
    
    // Phase 9.3: Initialize Persistent Managers
    const metrics = globalContainer.resolve(APIMetricsManager);
    await metrics.init();

    const goalManager = globalContainer.resolve(GoalManager);
    await goalManager.init();

    const agentManager = globalContainer.resolve(AgentManager);
    await agentManager.init();
    
    // Planning & Execution
    globalContainer.resolve('Planner');
    globalContainer.resolve('Executor');
    globalContainer.resolve('Workflow');
    globalContainer.resolve('Reflection');
    
    // Management Layers
    globalContainer.resolve(ThoughtManager);
    globalContainer.resolve(CoordinatorAgent);
    globalContainer.resolve(ExecutiveBrain);
    globalContainer.resolve(MissionIntelligence);
    globalContainer.resolve(ContinuousLearning);
    globalContainer.resolve(MissionNotifications);
    globalContainer.resolve(MissionInbox);
    globalContainer.resolve(AutonomousMonitoring);
    globalContainer.resolve(SelfHealing);

    // Main Entry Point Runtime
    globalContainer.resolve(AgentRuntime);

    // External Adapters
    globalContainer.resolve(ComponentRegistry);
    globalContainer.resolve(WorkspaceAdapter);
    globalContainer.resolve(MissionAdapter);

    // Phase 8.9: Continuous OS
    const background = globalContainer.resolve(BackgroundRuntime);
    background.start().catch(err => console.error('[AgentOS] BackgroundRuntime start failed:', err));

    if (isBrowser) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__AGENT_OS_BOOTSTRAPPED__ = true;
    }
    console.info('[AgentOS] Runtime bootstrap complete.');
  } catch (error) {
    console.error('[AgentOS] Critical failure during runtime bootstrap:', error);
    throw error;
  }

  return globalContainer;
}

/**
 * Access the bootstrapped container
 */
export const getRuntime = async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(window as any).__AGENT_OS_BOOTSTRAPPED__) {
    return await bootstrapRuntime();
  }
  return globalContainer;
};
