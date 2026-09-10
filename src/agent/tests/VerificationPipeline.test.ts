import { describe, it, expect, beforeEach } from 'vitest';
import { ResearchManager } from '../research/ResearchManager';
import { KnowledgeGraph } from '../knowledge/KnowledgeGraph';

describe('Verification Pipeline', () => {
  let graph: KnowledgeGraph;
  let research: ResearchManager;

  beforeEach(() => {
    graph = new KnowledgeGraph();
    research = new ResearchManager(graph);
  });

  it('should detect supporting facts and increase confidence', async () => {
    const fact1 = {
      claim: 'The capital of France is Paris.',
      source: 'Source A',
      url: 'https://source-a.com',
      timestamp: Date.now(),
      confidence: 0.8,
      provider: 'Provider 1'
    };

    const fact2 = {
      claim: 'Paris is the capital city of France.',
      source: 'Source B',
      url: 'https://source-b.com',
      timestamp: Date.now(),
      confidence: 0.8,
      provider: 'Provider 2'
    };

    const node1 = await research.recordFact(fact1);
    const node2 = await research.recordFact(fact2);

    const result = await research.verifyFact(node2.id);
    
    expect(result.status).toBe('verified');
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.supportingFactIds).toContain(node1.id);
  });

  it('should detect contradictions and decrease confidence', async () => {
    const fact1 = {
      claim: 'The population of London is 9 million.',
      source: 'Source A',
      url: 'https://source-a.com',
      timestamp: Date.now(),
      confidence: 0.9,
      provider: 'Provider 1'
    };

    const fact2 = {
      claim: 'The population of London is not 9 million.',
      source: 'Source B',
      url: 'https://source-b.com',
      timestamp: Date.now(),
      confidence: 0.9,
      provider: 'Provider 2'
    };

    const node1 = await research.recordFact(fact1);
    const node2 = await research.recordFact(fact2);

    const result = await research.verifyFact(node2.id);
    
    expect(result.status).toBe('contradicted');
    expect(result.confidence).toBeLessThan(0.9);
    expect(result.contradictingFactIds).toContain(node1.id);
  });

  it('should debunk facts with very low confidence', async () => {
    // Adding multiple contradictions
    await research.recordFact({
      claim: 'Gravity does not exist.',
      source: 'Source A',
      url: 'https://a.com',
      timestamp: Date.now(),
      confidence: 0.9,
      provider: 'P1'
    });
    
    await research.recordFact({
      claim: 'Gravity is a hoax.',
      source: 'Source B',
      url: 'https://b.com',
      timestamp: Date.now(),
      confidence: 0.9,
      provider: 'P2'
    });

    const fact3 = {
      claim: 'Gravity exists and holds planets in orbit.',
      source: 'Source C',
      url: 'https://c.com',
      timestamp: Date.now(),
      confidence: 0.3, // Starting low
      provider: 'P3'
    };

    const node3 = await research.recordFact(fact3);
    const result = await research.verifyFact(node3.id);
    
    expect(result.status).toBe('debunked');
    expect(result.confidence).toBeLessThan(0.3);
  });

  it('should store all provenance fields correctly', async () => {
    const fact = {
      claim: 'Proven fact',
      source: 'Reliable Source',
      url: 'https://reliable.com',
      timestamp: 123456789,
      confidence: 1.0,
      provider: 'Trusted Provider'
    };

    const node = await research.recordFact(fact);
    
    expect(node.properties.source).toBe(fact.source);
    expect(node.properties.url).toBe(fact.url);
    expect(node.properties.timestamp).toBe(fact.timestamp);
    expect(node.properties.provider).toBe(fact.provider);
  });
});
