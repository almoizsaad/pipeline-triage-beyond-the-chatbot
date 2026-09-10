import type { 
  GraphNode, 
  GraphEdge, 
  RelationType, 
  NodeType, 
  IKnowledgeGraph 
} from '../types/knowledge';
import { KnowledgePersistence } from './KnowledgePersistence';

export class KnowledgeGraph implements IKnowledgeGraph {
  public nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();
  private adjacencyList: Map<string, string[]> = new Map(); // nodeId -> edgeIds
  private persistence?: KnowledgePersistence;

  constructor(persistence?: KnowledgePersistence) {
    this.persistence = persistence;
    if (this.persistence) {
      this.load();
    }
  }

  private async save(): Promise<void> {
    if (this.persistence) {
      await this.persistence.save(
        Array.from(this.nodes.values()),
        Array.from(this.edges.values())
      );
    }
  }

  private async load(): Promise<void> {
    if (this.persistence) {
      const data = await this.persistence.load();
      if (data) {
        data.nodes.forEach(node => {
          this.nodes.set(node.id, node);
          this.adjacencyList.set(node.id, []);
        });
        data.edges.forEach(edge => {
          this.edges.set(edge.id, edge);
          this.adjacencyList.get(edge.sourceId)?.push(edge.id);
          this.adjacencyList.get(edge.targetId)?.push(edge.id);
        });
      }
    }
  }

  public async createNode(node: Omit<GraphNode, 'id' | 'createdAt' | 'updatedAt'>): Promise<GraphNode> {
    const newNode: GraphNode = {
      id: crypto.randomUUID(),
      ...node,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.nodes.set(newNode.id, newNode);
    this.adjacencyList.set(newNode.id, []);
    await this.save();
    return newNode;
  }

  public async getNode(id: string): Promise<GraphNode | null> {
    return this.nodes.get(id) || null;
  }

  public async updateNode(id: string, properties: Partial<GraphNode>): Promise<GraphNode> {
    const existing = this.nodes.get(id);
    if (!existing) throw new Error(`Node with id ${id} not found`);

    // Evolution logic: Preserve history in properties
    const history = (existing.properties.history as any[]) || [];
    history.push({
      properties: { ...existing.properties, history: undefined },
      updatedAt: existing.updatedAt
    });

    const updated: GraphNode = {
      ...existing,
      ...properties,
      properties: {
        ...existing.properties,
        ...(properties.properties || {}),
        history
      },
      updatedAt: Date.now()
    };
    
    // Auto-increment version if present
    if (updated.properties.version !== undefined) {
      updated.properties.version = (updated.properties.version as number) + 1;
    }

    this.nodes.set(id, updated);
    await this.save();
    return updated;
  }

  /**
   * Evolve a node based on new insights/reflections.
   * This is called by ContinuousLearning.
   */
  public async evolveNode(id: string, insight: string, confidence: number): Promise<void> {
    const node = await this.getNode(id);
    if (!node) return;

    console.info(`[KnowledgeGraph] Evolving node ${node.label} with new insight: ${insight.slice(0, 30)}...`);
    
    await this.updateNode(id, {
      properties: {
        ...node.properties,
        lastInsight: insight,
        confidence: (Number(node.properties.confidence || 0.5) + confidence) / 2
      }
    });
  }

  public async deleteNode(id: string): Promise<void> {
    this.nodes.delete(id);
    const edgeIds = this.adjacencyList.get(id) || [];
    for (const edgeId of edgeIds) {
      await this.deleteRelation(edgeId);
    }
    this.adjacencyList.delete(id);
    await this.save();
  }

  public async createRelation(
    sourceId: string, 
    targetId: string, 
    type: RelationType, 
    weight: number = 0.5, 
    properties: Record<string, unknown> = {}
  ): Promise<GraphEdge> {
    if (!this.nodes.has(sourceId)) throw new Error(`Source node ${sourceId} not found`);
    if (!this.nodes.has(targetId)) throw new Error(`Target node ${targetId} not found`);

    const edge: GraphEdge = {
      id: crypto.randomUUID(),
      sourceId,
      targetId,
      type,
      weight,
      properties,
      createdAt: Date.now()
    };

    this.edges.set(edge.id, edge);
    this.adjacencyList.get(sourceId)?.push(edge.id);
    this.adjacencyList.get(targetId)?.push(edge.id);

    await this.save();
    return edge;
  }

  public async getRelation(id: string): Promise<GraphEdge | null> {
    return this.edges.get(id) || null;
  }

  public async deleteRelation(id: string): Promise<void> {
    const edge = this.edges.get(id);
    if (!edge) return;

    this.edges.delete(id);
    
    const sourceEdges = this.adjacencyList.get(edge.sourceId);
    if (sourceEdges) {
      this.adjacencyList.set(edge.sourceId, sourceEdges.filter(eId => eId !== id));
    }

    const targetEdges = this.adjacencyList.get(edge.targetId);
    if (targetEdges) {
      this.adjacencyList.set(edge.targetId, targetEdges.filter(eId => eId !== id));
    }
    await this.save();
  }

  public async findRelated(
    nodeId: string, 
    options?: { type?: RelationType; depth?: number; limit?: number }
  ): Promise<Array<{ node: GraphNode; edge: GraphEdge }>> {
    const depth = options?.depth || 1;
    const limit = options?.limit || 10;
    const type = options?.type;

    const results: Array<{ node: GraphNode; edge: GraphEdge }> = [];
    const visited = new Set<string>([nodeId]);
    const queue: Array<{ id: string; currentDepth: number }> = [{ id: nodeId, currentDepth: 0 }];

    while (queue.length > 0 && results.length < limit) {
      const { id, currentDepth } = queue.shift()!;
      if (currentDepth >= depth) continue;

      const edgeIds = this.adjacencyList.get(id) || [];
      for (const edgeId of edgeIds) {
        const edge = this.edges.get(edgeId)!;
        if (type && edge.type !== type) continue;

        const targetId = edge.sourceId === id ? edge.targetId : edge.sourceId;
        if (visited.has(targetId)) continue;

        visited.add(targetId);
        const node = this.nodes.get(targetId)!;
        results.push({ node, edge });
        queue.push({ id: targetId, currentDepth: currentDepth + 1 });

        if (results.length >= limit) break;
      }
    }

    return results;
  }

  public async shortestPath(startNodeId: string, endNodeId: string): Promise<GraphNode[]> {
    const queue: Array<{ id: string; path: string[] }> = [{ id: startNodeId, path: [startNodeId] }];
    const visited = new Set<string>([startNodeId]);

    while (queue.length > 0) {
      const { id, path } = queue.shift()!;
      if (id === endNodeId) {
        return path.map(nodeId => this.nodes.get(nodeId)!);
      }

      const edgeIds = this.adjacencyList.get(id) || [];
      for (const edgeId of edgeIds) {
        const edge = this.edges.get(edgeId)!;
        const nextId = edge.sourceId === id ? edge.targetId : edge.sourceId;
        
        if (!visited.has(nextId)) {
          visited.add(nextId);
          queue.push({ id: nextId, path: [...path, nextId] });
        }
      }
    }

    return [];
  }

  public async importanceScore(nodeId: string): Promise<number> {
    const node = this.nodes.get(nodeId);
    if (!node) return 0;

    const edgeIds = this.adjacencyList.get(nodeId) || [];
    if (this.nodes.size === 0) return 0;

    // Simple degree centrality for now
    return edgeIds.length / Math.max(1, this.nodes.size - 1);
  }

  public async searchNodes(query: string, type?: NodeType): Promise<GraphNode[]> {
    const keywords = query.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3);
    
    return Array.from(this.nodes.values()).filter(node => {
      const typeMatch = !type || node.type === type;
      
      const searchContent = (node.label + ' ' + JSON.stringify(node.properties)).toLowerCase();
      
      // Match if at least 2 keywords are found (or 1 if query is short)
      const matchCount = keywords.filter(kw => searchContent.includes(keywords.length > 0 ? kw : query.toLowerCase())).length;
      const isMatch = keywords.length > 0 ? (matchCount >= Math.min(2, keywords.length)) : searchContent.includes(query.toLowerCase());
      
      return typeMatch && isMatch;
    });
  }

  public clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.adjacencyList.clear();
  }
}
