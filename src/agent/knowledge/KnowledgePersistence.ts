import type { GraphNode, GraphEdge } from '../types/knowledge';
import { PersistenceManager } from '../core/PersistenceManager';

export interface SerializedGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * KnowledgePersistence handles saving and loading the KnowledgeGraph.
 */
export class KnowledgePersistence {
  private persistence: PersistenceManager;
  private storageKey = 'knowledge_graph';
  private STORE_NAME = 'settings';

  constructor() {
    this.persistence = PersistenceManager.getInstance();
  }

  public async save(nodes: GraphNode[], edges: GraphEdge[]): Promise<void> {
    const data: SerializedGraph = { nodes, edges };
    await this.persistence.save(this.STORE_NAME, { key: this.storageKey, data });
  }

  public async load(): Promise<SerializedGraph | null> {
    const entry = await this.persistence.get(this.STORE_NAME, this.storageKey);
    return entry ? entry.data : null;
  }

  public async clear(): Promise<void> {
    await this.persistence.delete(this.STORE_NAME, this.storageKey);
  }
}
