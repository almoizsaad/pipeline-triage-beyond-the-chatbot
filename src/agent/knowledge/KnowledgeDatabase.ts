import type { 
  IKnowledgeDatabase, 
  KnowledgeEntry, 
  SearchOptions, 
  VectorSearchResult, 
  IVectorSearch,
  KnowledgeRankingResult,
  KnowledgeVersion
} from '../types/knowledge';
import type { LLMProvider } from '../providers/LLMProvider';
import { PersistenceManager } from '../core/PersistenceManager';

export class KnowledgeDatabase implements IKnowledgeDatabase {
  private STORE_NAME = 'knowledge';
  private vectorSearch: IVectorSearch;
  private llmProvider: LLMProvider;
  private persistence: PersistenceManager;
  private embeddingStore?: IEmbeddingStore;

  constructor(vectorSearch: IVectorSearch, llmProvider: LLMProvider, embeddingStore?: IEmbeddingStore) {
    this.vectorSearch = vectorSearch;
    this.llmProvider = llmProvider;
    this.persistence = PersistenceManager.getInstance();
    this.embeddingStore = embeddingStore;
  }

  public async add(entry: KnowledgeEntry): Promise<void> {
    try {
      // 1. Generate and save embedding
      if (this.embeddingStore) {
        const embedding = await this.llmProvider.embed(entry.content);
        await this.embeddingStore.save(entry.id, embedding);
        entry.embedding = embedding;
      }

      const existing = await this.get(entry.id);

      if (existing) {
        // Handle Evolution & Versioning
        const history: KnowledgeVersion[] = existing.history || [];
        const oldVersion = existing.metadata.version || 1;
        
        history.push({
          version: oldVersion,
          content: existing.content,
          timestamp: existing.metadata.updatedAt || Date.now(),
          author: existing.metadata.author
        });

        entry.metadata.version = oldVersion + 1;
        entry.history = history;
        console.info(`[KnowledgeDatabase] Evolving knowledge entry: ${entry.id} to v${entry.metadata.version}`);
      } else {
        entry.metadata.version = entry.metadata.version || 1;
      }

      await this.persistence.save(this.STORE_NAME, entry);
    } catch (e) {
      console.error('[KnowledgeDatabase] Failed to save entry:', e);
    }
  }

  public async get(id: string): Promise<KnowledgeEntry | null> {
    try {
      return await this.persistence.get(this.STORE_NAME, id);
    } catch (e) {
      console.error('[KnowledgeDatabase] Failed to load entry:', e);
      return null;
    }
  }

  public async update(id: string, entry: Partial<KnowledgeEntry>): Promise<void> {
    const existing = await this.get(id);
    if (!existing) return;

    // Use add to handle versioning automatically if content changes
    const updatedEntry: KnowledgeEntry = {
      ...existing,
      ...entry,
      metadata: {
        ...existing.metadata,
        ...(entry.metadata || {}),
        updatedAt: Date.now()
      }
    };

    await this.add(updatedEntry);
  }

  public async delete(id: string): Promise<void> {
    await this.persistence.delete(this.STORE_NAME, id);
  }

  public async search(query: string, options: SearchOptions = {}): Promise<VectorSearchResult[]> {
    const queryEmbedding = await this.llmProvider.embed(query);
    const vectorResults = await this.vectorSearch.search(queryEmbedding, options.limit || 20);
    
    const allEntries = await this.listAll();
    const filteredEntries = this.filterEntries(allEntries, options);

    if (options.threshold === undefined) options.threshold = 0.2;
    
    const candidates: VectorSearchResult[] = [];
    
    for (const vr of vectorResults) {
      const entry = filteredEntries.find(e => e.id === vr.id);
      if (entry && vr.score >= (options.threshold || 0)) {
        candidates.push({
          id: vr.id,
          score: vr.score,
          entry
        });
      }
    }

    return this.rankResults(candidates).slice(0, options.limit || 10);
  }

  /**
   * Advanced Knowledge Ranking Algorithm
   * Combines Semantic Score (LLM) + Importance + Recency + Confidence
   */
  private rankResults(results: VectorSearchResult[]): KnowledgeRankingResult[] {
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    return results.map(r => {
      const { entry, score: semanticScore } = r;
      const { importance, confidence, updatedAt } = entry.metadata;

      // Recency boost (exponential decay)
      const ageInDays = (now - updatedAt) / ONE_DAY;
      const recencyScore = Math.exp(-ageInDays / 7); // Half-life of ~5 days

      // Weighted Ranking
      const rankScore = 
        (semanticScore * 0.5) +  // LLM context match
        (importance * 0.2) +     // Human/System manual weight
        (recencyScore * 0.15) +  // Up-to-date information
        (confidence * 0.15);     // Verification/Reflection score

      return {
        ...r,
        rankScore
      };
    }).sort((a, b) => b.rankScore - a.rankScore);
  }

  private async listAll(): Promise<KnowledgeEntry[]> {
    return await this.persistence.getAll(this.STORE_NAME);
  }

  private filterEntries(entries: KnowledgeEntry[], options: SearchOptions): KnowledgeEntry[] {
    const { filters } = options;
    if (!filters) return entries;

    return entries.filter(entry => {
      if (filters.tags && !filters.tags.every(tag => entry.metadata.tags.includes(tag))) return false;
      if (filters.sourceType && !filters.sourceType.includes(entry.metadata.sourceType)) return false;
      if (filters.startTime && entry.metadata.createdAt < filters.startTime) return false;
      if (filters.endTime && entry.metadata.createdAt > filters.endTime) return false;
      if (filters.minImportance && entry.metadata.importance < filters.minImportance) return false;
      return true;
    });
  }
}
