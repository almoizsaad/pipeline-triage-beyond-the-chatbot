import { globalContainer } from '../agent/core/ServiceContainer';
import { DependencyRegistry } from '../agent/core/DependencyRegistry';
import { ExecutiveBrain } from '../agent/core/ExecutiveBrain';
import { AgentManager } from '../agent/core/AgentManager';
import { AgentRuntime } from '../agent/core/AgentRuntime';
import { ThoughtManager } from '../agent/reflection/ThoughtManager';
import { ComponentRegistry } from '../registry/ComponentRegistry';
import { WorkspaceAdapter } from '../agent/adapters/workspaceAdapter';
import { KnowledgeGraph } from '../agent/knowledge/KnowledgeGraph';
import { MemoryManager } from '../agent/memory/MemoryManager';
import { KnowledgeDatabase } from '../agent/knowledge/KnowledgeDatabase';
import { EventBus } from '../agent/core/EventBus';
import { initializeRegistry } from '../registry/defaultRegistry';
import { MockLLMProvider } from '../agent/providers/MockLLMProvider';
import { ToolRegistry } from '../agent/tools/ToolRegistry';
import { registerDefaultTools } from '../agent/tools/registerTools';
import type { LLMProvider } from '../agent/providers/LLMProvider';

/**
 * Bootstraps the Agent OS runtime for CLI/Headless use.
 * Replaces browser-specific dependencies with Node-compatible ones if necessary.
 */
export function bootstrapHeadlessRuntime() {
  console.info('[HeadlessRuntime] Bootstrapping Agent OS Runtime...');

  // 0. Polyfill localStorage for Node.js
  if (typeof global.localStorage === 'undefined') {
    const storage: Record<string, string> = {};
    const localStoragePolyfill = {
      getItem: (key: string) => storage[key] || null,
      setItem: (key: string, value: string) => { storage[key] = value; },
      removeItem: (key: string) => { delete storage[key]; },
      key: (index: number) => Object.keys(storage)[index] || null,
      clear: () => { for (const key in storage) delete storage[key]; },
      get length() { return Object.keys(storage).length; }
    };
    Object.defineProperty(global, 'localStorage', {
      value: localStoragePolyfill,
      writable: true,
      configurable: true
    });
  }

  // 1. Register all services in the container
  DependencyRegistry.registerCoreServices(globalContainer);

  // 3. Initialize Registries
  initializeRegistry();
  
  // 4. Register tools explicitly for headless environment
  const toolRegistry = globalContainer.resolve(ToolRegistry);
  const knowledgeDb = globalContainer.resolve(KnowledgeDatabase);
  const llmProvider = globalContainer.resolve<LLMProvider>('LLMProvider');
  registerDefaultTools(toolRegistry, knowledgeDb, llmProvider);

  // 5. Eagerly instantiate core singletons
  try {
    globalContainer.resolve(EventBus);
    globalContainer.resolve(KnowledgeGraph);
    globalContainer.resolve(MemoryManager);
    globalContainer.resolve('Safety');
    globalContainer.resolve('Planner');
    globalContainer.resolve('Executor');
    globalContainer.resolve('Workflow');
    globalContainer.resolve('Reflection');
    globalContainer.resolve(ThoughtManager);
    globalContainer.resolve(AgentManager);
    const manager = globalContainer.resolve(AgentManager);
    globalContainer.resolve(ExecutiveBrain);
    globalContainer.resolve(AgentRuntime);
    globalContainer.resolve(ComponentRegistry);
    globalContainer.resolve(WorkspaceAdapter);

    // 6. Spawn worker agents for missions
    console.info('[HeadlessRuntime] Spawning worker agents...');
    manager.spawnAgent('Worker 1', 'worker', ['filesystem', 'clock']);
    manager.spawnAgent('Researcher 1', 'specialist', ['search', 'browser', 'clock']);

    console.info('[HeadlessRuntime] Runtime bootstrap complete.');
  } catch (error) {
    console.error('[HeadlessRuntime] Critical failure during runtime bootstrap:', error);
    throw error;
  }

  return globalContainer;
}

export const getHeadlessRuntime = () => {
  return globalContainer;
};
