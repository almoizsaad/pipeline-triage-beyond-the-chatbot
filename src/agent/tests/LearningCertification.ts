import { bootstrapRuntime } from '../bootstrap/runtimeBootstrap';
import { AgentEventType } from '../types/agent';
import { ExecutiveBrain } from '../core/ExecutiveBrain';
import { KnowledgeDatabase } from '../knowledge/KnowledgeDatabase';
import { KnowledgeGraph } from '../knowledge/KnowledgeGraph';
import { EventBus } from '../core/EventBus';
import { PersistenceManager } from '../core/PersistenceManager';

// Mock environment with functional in-memory storage
const memoryStore: Record<string, Map<string, any>> = {};

if (typeof indexedDB === 'undefined') {
  (PersistenceManager.prototype as any).init = async () => {};
  
  (PersistenceManager.prototype as any).save = async (store: string, data: any) => {
    if (!memoryStore[store]) memoryStore[store] = new Map();
    const id = data.id || data.key;
    memoryStore[store].set(id, JSON.parse(JSON.stringify(data)));
  };
  
  (PersistenceManager.prototype as any).get = async (store: string, id: string) => {
    return memoryStore[store]?.get(id) || null;
  };
  
  (PersistenceManager.prototype as any).getAll = async (store: string) => {
    return Array.from(memoryStore[store]?.values() || []);
  };

  (PersistenceManager.prototype as any).delete = async (store: string, id: string) => {
    memoryStore[store]?.delete(id);
  };
}

async function runLearningCertification() {
  console.log('=== PHASE 9.6: KNOWLEDGE & LEARNING CERTIFICATION ===\n');

  // 1. Initialize Runtime
  const container = await bootstrapRuntime();
  const brain = container.resolve(ExecutiveBrain);
  const db = container.resolve(KnowledgeDatabase);
  const graph = container.resolve(KnowledgeGraph);
  const eventBus = container.resolve(EventBus);

  console.log('1. Teaching the System:');
  const fact = {
    id: 'fact-001',
    content: 'The Nexus Agent OS uses IndexedDB for long-term persistence to survive browser refreshes.',
    metadata: {
      source: 'certification',
      sourceType: 'conversation' as any,
      format: 'txt' as any,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: ['persistence', 'indexeddb', 'architecture'],
      importance: 0.9,
      confidence: 1.0,
      version: 1
    }
  };

  await db.add(fact);
  await graph.createNode({
    type: 'concept',
    label: 'IndexedDB Persistence',
    properties: { description: fact.content, importance: 0.9, version: 1 }
  });
  
  console.log(' - Fact recorded: "Nexus uses IndexedDB for persistence"');
  console.log(' - Knowledge entry v1 created.');

  // 2. Simulate Evolution
  console.log('\n2. Knowledge Evolution:');
  const updatedFact = { ...fact, content: fact.content + ' It supports versioning and ranking as of Phase 9.6.' };
  await db.add(updatedFact);
  
  const retrieved = await db.get('fact-001');
  console.log(` - Fact evolved to v${retrieved?.metadata.version}.`);
  console.log(` - History length: ${retrieved?.history?.length || 0}`);

  // 3. Knowledge Ranking Verification
  console.log('\n3. Knowledge Ranking:');
  const searchResults = await db.search('IndexedDB Persistence');
  if (searchResults.length > 0) {
    const best = searchResults[0] as any;
    console.log(` - Top Result: "${best.entry.content.slice(0, 50)}..."`);
    console.log(` - Semantic Score: ${best.score.toFixed(4)}`);
    console.log(` - Combined Rank Score: ${best.rankScore.toFixed(4)}`);
  } else {
    console.log(' - No results found (Threshold issue).');
  }

  // 4. Learning from Reflection
  console.log('\n4. Learning from Reflection (Simulation):');
  const workflowId = 'test-workflow-' + Date.now();
  
  // Create a node for this workflow in the graph
  await graph.createNode({
    type: 'plan',
    label: `Plan: ${workflowId}`,
    properties: { workflowId, confidence: 0.5 }
  });

  console.log(' - Simulating successful mission reflection...');
  eventBus.publish('agent:events', {
    type: AgentEventType.REFLECTION,
    payload: {
      workflowId,
      reflection: {
        success: true,
        confidenceScore: 0.95,
        improvements: ['Optimized IndexedDB queries'],
        mistakes: []
      }
    },
    timestamp: Date.now()
  });

  // Give it a moment to process async
  await new Promise(r => setTimeout(run, 1000));
  
  async function run() {
    const nodes = await graph.searchNodes(workflowId);
    if (nodes.length > 0) {
      console.log(` - Graph Node Confidence evolved to: ${nodes[0].properties.confidence}`);
      console.log(` - Last Insight: ${nodes[0].properties.lastInsight}`);
    }

    console.log('\n=== CERTIFICATION COMPLETE ===');
    process.exit(0);
  }
}

runLearningCertification().catch(err => {
  console.error('Certification failed:', err);
  process.exit(1);
});
