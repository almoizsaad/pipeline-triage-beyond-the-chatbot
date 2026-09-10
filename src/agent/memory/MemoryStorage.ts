import type { IMemoryStorage, MemoryEntry, MemoryQuery } from '../types/memory';
import { PersistenceManager } from '../core/PersistenceManager';

export class MemoryStorage implements IMemoryStorage {
  private STORE_NAME = 'memory';
  private persistence: PersistenceManager;

  constructor() {
    this.persistence = PersistenceManager.getInstance();
  }

  public async save(entry: MemoryEntry): Promise<void> {
    try {
      await this.persistence.save(this.STORE_NAME, entry);
    } catch (e) {
      console.error('[MemoryStorage] Failed to save entry:', e);
    }
  }

  public async load(id: string): Promise<MemoryEntry | null> {
    try {
      return await this.persistence.get(this.STORE_NAME, id);
    } catch (e) {
      console.error('[MemoryStorage] Failed to load entry:', e);
      return null;
    }
  }

  public async delete(id: string): Promise<void> {
    await this.persistence.delete(this.STORE_NAME, id);
  }

  public async list(query: MemoryQuery): Promise<MemoryEntry[]> {
    const allEntries = await this.persistence.getAll(this.STORE_NAME) as MemoryEntry[];
    const entries = allEntries.filter(entry => this.matchesQuery(entry, query));

    // Sort by timestamp desc
    entries.sort((a, b) => b.timestamp - a.timestamp);

    return query.limit ? entries.slice(0, query.limit) : entries;
  }

  public async clear(): Promise<void> {
    await this.persistence.clear(this.STORE_NAME);
  }

  private matchesQuery(entry: MemoryEntry, query: MemoryQuery): boolean {
    if (query.types && !query.types.includes(entry.type)) return false;
    if (query.startTime && entry.timestamp < query.startTime) return false;
    if (query.endTime && entry.timestamp > query.endTime) return false;
    if (query.minImportance && entry.metadata.importance < query.minImportance) return false;
    
    if (query.tags && query.tags.length > 0) {
      if (!query.tags.some(tag => entry.tags.includes(tag))) return false;
    }

    if (query.text) {
      const contentStr = JSON.stringify(entry.content).toLowerCase();
      if (!contentStr.includes(query.text.toLowerCase())) return false;
    }

    return true;
  }
}
