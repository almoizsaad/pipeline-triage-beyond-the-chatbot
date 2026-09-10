import { describe, it, expect, beforeEach } from 'vitest';
import { createAgent } from '../bootstrap/createAgent';
import { KnowledgeGraph } from '../knowledge/KnowledgeGraph';
import { MemoryManager } from '../memory/MemoryManager';
import { ServiceContainer } from '../core/ServiceContainer';
import { MockLLMProvider } from '../providers/MockLLMProvider';
import { ToolRegistry } from '../tools/ToolRegistry';
import { createTestTool } from './testUtils';
import type { Planner } from '../types/agent';

interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

describe('Phase 8.4 — Performance Benchmarks', () => {
  let agent: ReturnType<typeof createAgent>;

  beforeEach(() => {
    const container = new ServiceContainer();
    container.registerSingleton('LLMProvider', new MockLLMProvider());
    agent = createAgent(container);
    
    const toolRegistry = agent.container.resolve(ToolRegistry);
    toolRegistry.register(createTestTool({ name: 'search_flights', description: 'Search flights', execute: async () => ({}) }));
    toolRegistry.register(createTestTool({ name: 'find_hotels', description: 'Find hotels', execute: async () => ({}) }));
  });

  it('Benchmark: System Startup (Cold)', async () => {
    const start = performance.now();
    createAgent();
    const duration = performance.now() - start;
    
    console.log(`[Benchmark] Cold Startup: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(500); // Expect < 500ms for bootstrap
  });

  it('Benchmark: Planner Latency (Mock)', async () => {
    const start = performance.now();
    await (agent.planner as Planner).generatePlan('Plan a simple trip', agent.runtime.getState());
    const duration = performance.now() - start;
    
    console.log(`[Benchmark] Planner Latency: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(2000); // Expect < 2000ms for planning process
  });

  it('Benchmark: Knowledge Graph Search (1000 nodes)', async () => {
    const graph = new KnowledgeGraph();
    
    // Seed 1000 nodes
    for (let i = 0; i < 1000; i++) {
      await graph.createNode({
        type: 'entity',
        label: `Entity ${i}`,
        properties: { index: i }
      });
    }

    const start = performance.now();
    const results = await graph.searchNodes('Entity 999');
    const duration = performance.now() - start;
    
    console.log(`[Benchmark] KG Search (1000 nodes): ${duration.toFixed(2)}ms`);
    expect(results.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(50); // Expect < 50ms for in-memory search
  });

  it('Benchmark: Memory Footprint (Episodic)', async () => {
    const memoryManager = agent.container.resolve(MemoryManager);
    const perf = performance as PerformanceWithMemory;
    const initialMemory = perf.memory?.usedJSHeapSize || 0;
    
    // Store 500 events (the new limit)
    for (let i = 0; i < 500; i++) {
      await memoryManager.store('session', { event: i }, ['test'], 0.5);
    }
    
    const finalMemory = perf.memory?.usedJSHeapSize || 0;
    const diff = (finalMemory - initialMemory) / 1024 / 1024;
    
    console.log(`[Benchmark] Memory Delta (500 events): ${diff.toFixed(2)}MB`);
    if (initialMemory > 0) {
      expect(diff).toBeLessThan(50); // Expect < 50MB growth for metadata + content
    }
  });
});
