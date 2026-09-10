import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryManager } from '../memory/MemoryManager';

describe('MemoryManager', () => {
  let memory: MemoryManager;

  beforeEach(() => {
    memory = new MemoryManager();
    localStorage.clear();
  });

  it('should store and retrieve data', async () => {
    await memory.remember('user_name', 'Alice');
    const name = await memory.recall('user_name');
    expect(name).toBe('Alice');
  });

  it('should search for keys', async () => {
    await memory.remember('pref_theme', 'dark');
    await memory.remember('pref_lang', 'en');
    const results = await memory.search('pref');
    expect(results).toContain('dark');
    expect(results).toContain('en');
  });
});
