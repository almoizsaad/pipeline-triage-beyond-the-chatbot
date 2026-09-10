import type { IMemoryIndex, MemoryEntry, MemoryQuery } from '../types/memory';

/**
 * MemoryIndex provides a searchable index for memory entries.
 * For this implementation, we use a simple keyword-based inverted index.
 */
export class MemoryIndex implements IMemoryIndex {
  private indexMap: Map<string, Set<string>> = new Map();

  public async index(entry: MemoryEntry): Promise<void> {
    const text = this.extractText(entry);
    const keywords = this.tokenize(text);

    keywords.forEach(word => {
      if (!this.indexMap.has(word)) {
        this.indexMap.set(word, new Set());
      }
      this.indexMap.get(word)!.add(entry.id);
    });

    // Also index tags
    entry.tags.forEach(tag => {
      const normalizedTag = `tag:${tag.toLowerCase()}`;
      if (!this.indexMap.has(normalizedTag)) {
        this.indexMap.set(normalizedTag, new Set());
      }
      this.indexMap.get(normalizedTag)!.add(entry.id);
    });
  }

  public async search(query: MemoryQuery): Promise<string[]> {
    if (!query.text && (!query.tags || query.tags.length === 0)) {
      return []; // Requires some search criteria
    }

    let results: Set<string> | null = null;

    if (query.text) {
      const keywords = this.tokenize(query.text);
      keywords.forEach(word => {
        const matches = this.indexMap.get(word);
        if (matches) {
          if (results === null) {
            results = new Set(matches);
          } else {
            // Intersection for multiple keywords
            results = new Set([...results].filter(id => matches.has(id)));
          }
        } else {
          results = new Set(); // One keyword failed to match
        }
      });
    }

    if (query.tags && query.tags.length > 0) {
      const tagResults = new Set<string>();
      query.tags.forEach(tag => {
        const normalizedTag = `tag:${tag.toLowerCase()}`;
        const matches = this.indexMap.get(normalizedTag);
        if (matches) {
          matches.forEach(id => tagResults.add(id));
        }
      });

      if (results === null) {
        results = tagResults;
      } else {
        // Intersect with existing results if text query was also present
        results = new Set([...results].filter(id => tagResults.has(id)));
      }
    }

    return results ? Array.from(results) : [];
  }

  public async remove(id: string): Promise<void> {
    this.indexMap.forEach(ids => ids.delete(id));
  }

  public clear(): void {
    this.indexMap.clear();
  }

  private extractText(entry: MemoryEntry): string {
    if (typeof entry.content === 'string') return entry.content;
    return JSON.stringify(entry.content);
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }
}
