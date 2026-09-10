import { describe, it, expect, beforeEach } from 'vitest';
import { KnowledgeGraph } from '../knowledge/KnowledgeGraph';
import { KnowledgeLinker } from '../knowledge/KnowledgeLinker';
import type { NodeType, RelationType } from '../types/knowledge';

describe('KnowledgeGraph & Linker', () => {
  let graph: KnowledgeGraph;
  let linker: KnowledgeLinker;

  beforeEach(() => {
    graph = new KnowledgeGraph();
    linker = new KnowledgeLinker(graph);
  });

  it('should create and retrieve nodes', async () => {
    const node = await graph.createNode({
      type: 'entity' as NodeType,
      label: 'Gemini',
      properties: { version: '1.5' }
    });

    expect(node.id).toBeDefined();
    expect(node.label).toBe('Gemini');

    const retrieved = await graph.getNode(node.id);
    expect(retrieved).toEqual(node);
  });

  it('should create and retrieve relations', async () => {
    const n1 = await graph.createNode({ type: 'document', label: 'Doc 1', properties: {} });
    const n2 = await graph.createNode({ type: 'concept', label: 'AI', properties: {} });

    const edge = await graph.createRelation(n1.id, n2.id, 'references' as RelationType, 0.9);

    expect(edge.id).toBeDefined();
    expect(edge.sourceId).toBe(n1.id);
    expect(edge.targetId).toBe(n2.id);

    const retrieved = await graph.getRelation(edge.id);
    expect(retrieved).toEqual(edge);
  });

  it('should find related nodes', async () => {
    const root = await graph.createNode({ type: 'entity', label: 'Root', properties: {} });
    const c1 = await graph.createNode({ type: 'entity', label: 'Child 1', properties: {} });
    const c2 = await graph.createNode({ type: 'entity', label: 'Child 2', properties: {} });

    await graph.createRelation(root.id, c1.id, 'supports' as RelationType);
    await graph.createRelation(root.id, c2.id, 'supports' as RelationType);

    const related = await graph.findRelated(root.id);
    expect(related.length).toBe(2);
    expect(related.map(r => r.node.label)).toContain('Child 1');
    expect(related.map(r => r.node.label)).toContain('Child 2');
  });

  it('should find shortest path', async () => {
    const a = await graph.createNode({ type: 'entity', label: 'A', properties: {} });
    const b = await graph.createNode({ type: 'entity', label: 'B', properties: {} });
    const c = await graph.createNode({ type: 'entity', label: 'C', properties: {} });
    const d = await graph.createNode({ type: 'entity', label: 'D', properties: {} });

    await graph.createRelation(a.id, b.id, 'references' as RelationType);
    await graph.createRelation(b.id, c.id, 'references' as RelationType);
    await graph.createRelation(c.id, d.id, 'references' as RelationType);
    await graph.createRelation(a.id, d.id, 'references' as RelationType); // Direct link

    const path = await graph.shortestPath(a.id, d.id);
    expect(path.length).toBe(2); // A -> D
    expect(path[0].id).toBe(a.id);
    expect(path[1].id).toBe(d.id);

    const longPath = await graph.shortestPath(a.id, c.id);
    expect(longPath.length).toBe(3); // A -> B -> C
  });

  it('should calculate importance score', async () => {
    const center = await graph.createNode({ type: 'entity', label: 'Center', properties: {} });
    const n1 = await graph.createNode({ type: 'entity', label: 'N1', properties: {} });
    const n2 = await graph.createNode({ type: 'entity', label: 'N2', properties: {} });

    await graph.createRelation(center.id, n1.id, 'references' as RelationType);
    await graph.createRelation(center.id, n2.id, 'references' as RelationType);

    const score = await graph.importanceScore(center.id);
    expect(score).toBe(1.0); // 2 relations / (3 nodes - 1)
  });

  it('should search nodes by label and type', async () => {
    await graph.createNode({ type: 'document', label: 'Technical Spec', properties: {} });
    await graph.createNode({ type: 'concept', label: 'Technical Debt', properties: {} });
    await graph.createNode({ type: 'tool', label: 'Linter', properties: {} });

    const results = await graph.searchNodes('Technical');
    expect(results.length).toBe(2);

    const toolResults = await graph.searchNodes('Linter', 'tool');
    expect(toolResults.length).toBe(1);
    expect(toolResults[0].label).toBe('Linter');
  });

  it('should link nodes via linker', async () => {
    const agent = await graph.createNode({ type: 'agent', label: 'Orchestrator', properties: {} });
    const plan = await graph.createNode({ type: 'plan', label: 'Task A', properties: {} });

    await linker.linkAgentToPlans(agent.id, [plan.id]);

    const related = await graph.findRelated(agent.id, { type: 'causes' });
    expect(related.length).toBe(1);
    expect(related[0].node.label).toBe('Task A');
  });
});
