export type KnowledgeSourceType = 'file' | 'web' | 'workspace' | 'conversation';
export type DocumentFormat = 'markdown' | 'json' | 'txt' | 'pdf';

export interface KnowledgeMetadata {
  source: string;
  sourceType: KnowledgeSourceType;
  format: DocumentFormat;
  title?: string;
  author?: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  importance: number; // 0-1
  confidence: number; // 0-1 (derived from verification/reflection)
  version: number;
  chunkIndex?: number;
  totalChunks?: number;
  originalId?: string; // Reference to the original document if this is a chunk
}

export interface KnowledgeVersion {
  version: number;
  content: string;
  timestamp: number;
  author?: string;
}

export interface KnowledgeEntry {
  id: string;
  content: string;
  metadata: KnowledgeMetadata;
  embedding?: number[];
  history?: KnowledgeVersion[];
}

export interface KnowledgeRankingResult extends VectorSearchResult {
  rankScore: number; // Combined score (semantic + importance + recency + confidence)
}

export interface VectorSearchResult {
  id: string;
  score: number;
  entry: KnowledgeEntry;
}

export type NodeType = 'entity' | 'concept' | 'document' | 'tool' | 'agent' | 'plan';
export type RelationType = 'supports' | 'contradicts' | 'depends_on' | 'causes' | 'improves' | 'references';

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  properties: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationType;
  weight: number; // 0-1
  properties: Record<string, unknown>;
  createdAt: number;
}

export interface IKnowledgeGraph {
  createNode(node: Omit<GraphNode, 'id' | 'createdAt' | 'updatedAt'>): Promise<GraphNode>;
  getNode(id: string): Promise<GraphNode | null>;
  updateNode(id: string, properties: Partial<GraphNode>): Promise<GraphNode>;
  deleteNode(id: string): Promise<void>;
  
  createRelation(
    sourceId: string, 
    targetId: string, 
    type: RelationType, 
    weight?: number, 
    properties?: Record<string, unknown>
  ): Promise<GraphEdge>;
  getRelation(id: string): Promise<GraphEdge | null>;
  deleteRelation(id: string): Promise<void>;

  findRelated(nodeId: string, options?: { type?: RelationType; depth?: number; limit?: number }): Promise<Array<{ node: GraphNode; edge: GraphEdge }>>;
  shortestPath(startNodeId: string, endNodeId: string): Promise<GraphNode[]>;
  importanceScore(nodeId: string): Promise<number>;
  
  searchNodes(query: string, type?: NodeType): Promise<GraphNode[]>;
}

export interface SearchOptions {
  limit?: number;
  threshold?: number;
  filters?: {
    tags?: string[];
    sourceType?: KnowledgeSourceType[];
    startTime?: number;
    endTime?: number;
    minImportance?: number;
  };
}

export interface ChunkingOptions {
  maxChunkSize: number;
  overlap: number;
}

export interface IEmbeddingStore {
  save(id: string, embedding: number[]): Promise<void>;
  get(id: string): Promise<number[] | null>;
  delete(id: string): Promise<void>;
  list(): Promise<{ id: string; embedding: number[] }[]>;
  clear(): Promise<void>;
}

export interface IVectorSearch {
  search(queryEmbedding: number[], topK?: number): Promise<{ id: string; score: number }[]>;
}

export interface IKnowledgeDatabase {
  add(entry: KnowledgeEntry): Promise<void>;
  get(id: string): Promise<KnowledgeEntry | null>;
  update(id: string, entry: Partial<KnowledgeEntry>): Promise<void>;
  delete(id: string): Promise<void>;
  search(query: string, options?: SearchOptions): Promise<VectorSearchResult[]>;
}
