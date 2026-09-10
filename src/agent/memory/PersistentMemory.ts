/**
 * PersistentMemory handles long-term storage using localStorage.
 */
export class PersistentMemory {
  private prefix = 'agent_os_';

  public store(key: string, value: unknown): void {
    try {
      localStorage.setItem(`${this.prefix}${key}`, JSON.stringify(value));
    } catch (e) {
      console.error('[PersistentMemory] Failed to store item:', e);
    }
  }

  public recall(key: string): unknown {
    try {
      const item = localStorage.getItem(`${this.prefix}${key}`);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('[PersistentMemory] Failed to recall item:', e);
      return null;
    }
  }

  public remove(key: string): void {
    localStorage.removeItem(`${this.prefix}${key}`);
  }

  public clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Basic search in persistent keys.
   */
  public search(query: string): string[] {
    const keys = Object.keys(localStorage);
    return keys
      .filter(key => key.startsWith(this.prefix) && key.includes(query))
      .map(key => key.replace(this.prefix, ''));
  }
}
