import type { 
  MemoryRetrievalPipeline, 
  MemoryEntry, 
  MemoryQuery, 
  IMemoryIndex, 
  IMemoryStorage, 
  IMemoryScorer 
} from '../types/memory';

export class MemoryRetriever implements MemoryRetrievalPipeline {
  private index: IMemoryIndex;
  private storage: IMemoryStorage;
  private scorer: IMemoryScorer;

  constructor(index: IMemoryIndex, storage: IMemoryStorage, scorer: IMemoryScorer) {
    this.index = index;
    this.storage = storage;
    this.scorer = scorer;
  }

  public async retrieve(query: MemoryQuery): Promise<MemoryEntry[]> {
    // 1. Search index
    const ids = await this.index.search(query);
    
    let entries: MemoryEntry[] = [];

    if (ids.length > 0) {
      // 2. Load matched entries
      const results = await Promise.all(ids.map(id => this.storage.load(id)));
      entries = results.filter((e): e is MemoryEntry => e !== null);
    } else if (!query.text && !query.tags) {
      // If no text/tags, fall back to list (e.g. for "get latest session memories")
      entries = await this.storage.list(query);
    }

    // 3. Rank entries
    const scoredEntries = entries.map(entry => ({
      entry,
      score: this.scorer.score(entry, query)
    }));

    scoredEntries.sort((a, b) => b.score - a.score);

    const finalEntries = scoredEntries.map(s => s.entry);

    return query.limit ? finalEntries.slice(0, query.limit) : finalEntries;
  }
}
