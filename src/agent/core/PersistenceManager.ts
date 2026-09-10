/**
 * PersistenceManager provides a unified interface for storage.
 * Supports IndexedDB in browsers and file-based storage in Node.js.
 */
import * as fs from 'fs';
import * as path from 'path';

export class PersistenceManager {
  private dbName: string = 'nexus_agent_os';
  private version: number = 1;
  private db: IDBDatabase | null = null;
  private isNode: boolean = typeof window === 'undefined' && typeof process !== 'undefined';
  private nodeStorageDir: string = '';

  private static instance: PersistenceManager;

  private constructor() {
    if (this.isNode) {
      this.nodeStorageDir = path.join(process.cwd(), '.nexus_storage');
      if (!fs.existsSync(this.nodeStorageDir)) {
        fs.mkdirSync(this.nodeStorageDir, { recursive: true });
      }
    }
  }

  public static getInstance(): PersistenceManager {
    if (!PersistenceManager.instance) {
      PersistenceManager.instance = new PersistenceManager();
    }
    return PersistenceManager.instance;
  }

  public async init(): Promise<void> {
    if (this.isNode) return; // No init needed for file storage
    if (this.db) return;

    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        console.warn('[PersistenceManager] indexedDB is undefined. Falling back to Node.js mode (if possible).');
        this.isNode = true;
        this.nodeStorageDir = path.join(process.cwd(), '.nexus_storage');
        if (!fs.existsSync(this.nodeStorageDir)) {
          fs.mkdirSync(this.nodeStorageDir, { recursive: true });
        }
        return resolve();
      }

      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Missions & Goals
        if (!db.objectStoreNames.contains('missions')) {
          db.createObjectStore('missions', { keyPath: 'id' });
        }

        // Knowledge Base
        if (!db.objectStoreNames.contains('knowledge')) {
          db.createObjectStore('knowledge', { keyPath: 'id' });
        }

        // Memory Entries
        if (!db.objectStoreNames.contains('memory')) {
          db.createObjectStore('memory', { keyPath: 'id' });
        }

        // Agent States
        if (!db.objectStoreNames.contains('agent_states')) {
          db.createObjectStore('agent_states', { keyPath: 'id' });
        }

        // General Settings/Metadata
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = (event) => {
        console.error('[PersistenceManager] Database error:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  private getStorePath(storeName: string): string {
    return path.join(this.nodeStorageDir, `${storeName}.json`);
  }

  private async readNodeStore(storeName: string): Promise<Record<string, any>> {
    const filePath = this.getStorePath(storeName);
    if (!fs.existsSync(filePath)) return {};
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error(`[PersistenceManager] Failed to read store ${storeName}:`, e);
      return {};
    }
  }

  private async writeNodeStore(storeName: string, data: Record<string, any>): Promise<void> {
    const filePath = this.getStorePath(storeName);
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error(`[PersistenceManager] Failed to write store ${storeName}:`, e);
    }
  }

  public async save(storeName: string, data: any): Promise<void> {
    if (this.isNode) {
      const store = await this.readNodeStore(storeName);
      const key = data.id || data.key || 'default';
      store[key] = data;
      await this.writeNodeStore(storeName, store);
      return;
    }

    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async get(storeName: string, id: string): Promise<any> {
    if (this.isNode) {
      const store = await this.readNodeStore(storeName);
      return store[id] || null;
    }

    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public async getAll(storeName: string): Promise<any[]> {
    if (this.isNode) {
      const store = await this.readNodeStore(storeName);
      return Object.values(store);
    }

    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public async delete(storeName: string, id: string): Promise<void> {
    if (this.isNode) {
      const store = await this.readNodeStore(storeName);
      delete store[id];
      await this.writeNodeStore(storeName, store);
      return;
    }

    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async clear(storeName: string): Promise<void> {
    if (this.isNode) {
      await this.writeNodeStore(storeName, {});
      return;
    }

    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

