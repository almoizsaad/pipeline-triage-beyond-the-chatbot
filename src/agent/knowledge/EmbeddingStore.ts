import type { IEmbeddingStore } from '../types/knowledge';
import { PersistenceManager } from '../core/PersistenceManager';

export class EmbeddingStore implements IEmbeddingStore {
  private persistence: PersistenceManager;
  private readonly STORE_NAME = 'settings';
  private readonly PREFIX = 'emb_';

  constructor() {
    this.persistence = PersistenceManager.getInstance();
  }

  public async save(id: string, embedding: number[]): Promise<void> {
    try {
      await this.persistence.save(this.STORE_NAME, { key: `${this.PREFIX}${id}`, data: embedding });
    } catch (e) {
      console.error('[EmbeddingStore] Failed to save embedding:', e);
    }
  }

  public async get(id: string): Promise<number[] | null> {
    try {
      const entry = await this.persistence.get(this.STORE_NAME, `${this.PREFIX}${id}`);
      return entry ? entry.data : null;
    } catch (e) {
      console.error('[EmbeddingStore] Failed to load embedding:', e);
      return null;
    }
  }

  public async delete(id: string): Promise<void> {
    await this.persistence.delete(this.STORE_NAME, `${this.PREFIX}${id}`);
  }

  public async list(): Promise<{ id: string; embedding: number[] }[]> {
    const all = await this.persistence.getAll(this.STORE_NAME);
    return all
      .filter(item => item.key && item.key.startsWith(this.PREFIX))
      .map(item => ({
        id: item.key.replace(this.PREFIX, ''),
        embedding: item.data
      }));
  }

  public async clear(): Promise<void> {
    const all = await this.list();
    for (const item of all) {
      await this.delete(item.id);
    }
  }
}
