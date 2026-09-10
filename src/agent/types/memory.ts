export type MemoryType = 'episodic' | 'semantic' | 'working' | 'session';

export interface MemoryEntry<T = unknown> {
  id: string;
  type: MemoryType;
  content: T;
  timestamp: number;
  tags: string[];
  metadata: {
    importance: number; // 0-1
    lastAccessed?: number;
    decayRate?: number;
    source?: string;
    goalId?: string;
    taskId?: string;
    score?: number; // Retrieval score
    [key: string]: unknown;
  };
  embedding?: number[]; // For future vector search
}

export interface MemoryQuery {
  text?: string;
  types?: MemoryType[];
  tags?: string[];
  startTime?: number;
  endTime?: number;
  limit?: number;
  minImportance?: number;
}

export interface MemorySearchResult {
  entry: MemoryEntry;
  score: number;
}

export interface IMemoryStorage {
  save(entry: MemoryEntry): Promise<void>;
  load(id: string): Promise<MemoryEntry | null>;
  delete(id: string): Promise<void>;
  list(query: MemoryQuery): Promise<MemoryEntry[]>;
  clear(): Promise<void>;
}

export interface IMemoryIndex {
  index(entry: MemoryEntry): Promise<void>;
  search(query: MemoryQuery): Promise<string[]>; // Returns IDs
  remove(id: string): Promise<void>;
}

export interface IMemoryScorer {
  score(entry: MemoryEntry, query: MemoryQuery): number;
}

export interface IMemoryCompressor {
  compress(entries: MemoryEntry[]): Promise<MemoryEntry[]>;
}

export interface IMemorySummarizer {
  summarize(entries: MemoryEntry[]): Promise<string>;
}

export interface MemoryRetrievalPipeline {
  retrieve(query: MemoryQuery): Promise<MemoryEntry[]>;
}

export interface MemoryExpirationPolicy {
  maxAge?: number; // ms
  minImportanceToKeep?: number;
}

export interface MemoryConfig {
  limits: {
    working: number;
    session: number;
    persistent: number;
  };
  expiration: MemoryExpirationPolicy;
}
