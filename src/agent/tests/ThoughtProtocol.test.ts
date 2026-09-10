import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus } from '../core/EventBus';
import { AgentStream } from '../events/AgentStream';
import { ThoughtManager } from '../reflection/ThoughtManager';
import { PersistentMemory } from '../memory/PersistentMemory';
import { ThoughtAnalyzer } from '../reflection/ThoughtAnalyzer';
import type { Thought, ThoughtChain } from '../types/thought';

import { UnifiedEventBus } from '../core/UnifiedEventBus';

describe('Thought Protocol', () => {
  let eventBus: EventBus;
  let stream: AgentStream;
  let memory: PersistentMemory;
  let manager: ThoughtManager;
  let analyzer: ThoughtAnalyzer;

  beforeEach(() => {
    eventBus = new EventBus(new UnifiedEventBus());
    stream = new AgentStream(eventBus);
    memory = new PersistentMemory();
    memory.clear();
    manager = new ThoughtManager(eventBus, memory);
    analyzer = new ThoughtAnalyzer();
  });

  it('should emit a thought event via AgentStream', async () => {
    const listener = vi.fn();
    eventBus.subscribe('agent:thoughts', listener);

    stream.thought('I am thinking about a complex problem', 'reasoning', { workflowId: 'wf-123' });

    expect(listener).toHaveBeenCalled();
    const event = listener.mock.calls[0][0];
    expect(event.type).toBe('THOUGHT_GENERATED');
    expect(event.payload.thought.content).toBe('I am thinking about a complex problem');
    expect(event.payload.thought.type).toBe('reasoning');
    expect(event.payload.thought.workflowId).toBe('wf-123');
  });

  it('should persist thoughts via ThoughtManager', async () => {
    stream.thought('Thought 1', 'observation', { workflowId: 'wf-456' });
    
    // Wait a bit for async handling in ThoughtManager
    await new Promise(resolve => setTimeout(resolve, 10));

    const persistence = manager.getPersistence();
    const thoughts = await persistence.findThoughts({ workflowId: 'wf-456' });
    
    expect(thoughts).toHaveLength(1);
    expect(thoughts[0].content).toBe('Thought 1');
  });

  it('should create thought chains for workflows', async () => {
    stream.thought('Start thinking', 'plan', { workflowId: 'wf-789' });
    stream.thought('Step 1', 'reasoning', { workflowId: 'wf-789' });
    stream.thought('End thinking', 'decision', { workflowId: 'wf-789' });

    await new Promise(resolve => setTimeout(resolve, 50));

    const persistence = manager.getPersistence();
    const chains = await persistence.findChains({ workflowId: 'wf-789' });
    
    expect(chains).toHaveLength(1);
    expect(chains[0].thoughts).toHaveLength(3);
    expect(chains[0].thoughts[0].content).toBe('Start thinking');
    expect(chains[0].thoughts[2].content).toBe('End thinking');
  });

  it('should analyze thought chains', async () => {
    const chain: ThoughtChain = {
      id: 'chain-1',
      agentId: 'agent-1',
      workflowId: 'wf-1',
      startTime: Date.now(),
      thoughts: [
        { id: '1', timestamp: Date.now(), content: 'Obs 1', type: 'observation', agentId: 'agent-1' },
        { id: '2', timestamp: Date.now(), content: 'Plan X', type: 'plan', agentId: 'agent-1', parentId: '1' },
        { id: '3', timestamp: Date.now(), content: 'Decision Y', type: 'decision', agentId: 'agent-1', parentId: '2' }
      ]
    };

    const analysis = await analyzer.analyzeChain(chain);
    
    expect(analysis.coherence).toBeGreaterThan(0.5);
    expect(analysis.depth).toBe(3);
    expect(analysis.patterns).toContain('Structured decision making');
  });

  it('should detect anomalies in thoughts', async () => {
    const thoughts = [
      { id: '1', timestamp: Date.now(), content: 'Thinking...', type: 'reasoning', agentId: 'agent-1' },
      { id: '2', timestamp: Date.now() + 1, content: 'Thinking...', type: 'reasoning', agentId: 'agent-1' }
    ] as Thought[];

    const anomalies = await analyzer.detectAnomalies(thoughts);
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0]).toContain('Repetitive thought detected');
  });
});
