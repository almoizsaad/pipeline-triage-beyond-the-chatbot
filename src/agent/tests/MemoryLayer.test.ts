import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryManager } from '../memory/MemoryManager';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (index: number) => Object.keys(store)[index],
    get length() { return Object.keys(store).length; }
  };
})();

vi.stubGlobal('localStorage', localStorageMock);

describe('Autonomous Memory Layer', () => {
  let memoryManager: MemoryManager;

  beforeEach(async () => {
    localStorage.clear();
    memoryManager = new MemoryManager();
    await memoryManager.clear();
  });

  it('should store and recall episodic memories', async () => {
    const content = { action: 'test_action', result: 'success' };
    await memoryManager.store('session', content, ['test', 'action'], 0.8);
    
    const results = await memoryManager.recallMemories('test_action');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].content).toEqual(content);
    expect(results[0].type).toBe('session');
  });

  it('should filter memories by keyword', async () => {
    await memoryManager.store('semantic', 'The capital of France is Paris', ['geography']);
    await memoryManager.store('semantic', 'The capital of Spain is Madrid', ['geography']);
    
    const parisResults = await memoryManager.recallMemories('Paris');
    expect(parisResults.length).toBe(1);
    expect(parisResults[0].content).toContain('Paris');
    
    const madridResults = await memoryManager.recallMemories('Madrid');
    expect(madridResults.length).toBe(1);
    expect(madridResults[0].content).toContain('Madrid');
  });

  it('should rank results by importance and recency', async () => {
    // Low importance
    await memoryManager.store('semantic', 'Low importance memory', [], 0.1);
    // High importance
    await memoryManager.store('semantic', 'High importance memory', [], 0.9);
    
    const results = await memoryManager.recallMemories('importance');
    expect(results[0].content).toBe('High importance memory');
  });

  it('should consolidate session memories into semantic summaries', async () => {
    await memoryManager.addSessionEvent({ type: 'USER_MESSAGE', text: 'Hello' });
    await memoryManager.addSessionEvent({ type: 'TOOL_RESULT', toolName: 'test', result: 'ok' });
    
    await memoryManager.consolidateSession('test_goal_id');
    
    const semanticMemories = await memoryManager.recallMemories('Summary of 2 memories');
    expect(semanticMemories.length).toBeGreaterThan(0);
    expect(semanticMemories[0].type).toBe('semantic');
    expect(semanticMemories[0].tags).toContain('consolidation');
  });

  it('should support backward compatibility methods', async () => {
    await memoryManager.remember('old_key', 'old_value');
    const results = await memoryManager.recallMemories('old_key');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].content).toEqual({ key: 'old_key', value: 'old_value' });
  });
});
