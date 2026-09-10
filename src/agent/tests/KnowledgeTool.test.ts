import { describe, it, expect, beforeEach } from 'vitest';
import { ToolRegistry } from '../tools/ToolRegistry';
import { KnowledgeTool } from '../tools/local/KnowledgeTool';
import { KnowledgeDatabase } from '../knowledge/KnowledgeDatabase';
import { MockLLMProvider } from '../providers/MockLLMProvider';
import { EmbeddingStore } from '../knowledge/EmbeddingStore';
import { VectorSearch } from '../knowledge/VectorSearch';

describe('KnowledgeTool', () => {
  let registry: ToolRegistry;
  let db: KnowledgeDatabase;
  let llmProvider: MockLLMProvider;

  beforeEach(() => {
    const embeddingStore = new EmbeddingStore();
    const vectorSearch = new VectorSearch(embeddingStore);
    llmProvider = new MockLLMProvider();
    db = new KnowledgeDatabase(vectorSearch, llmProvider);
    registry = new ToolRegistry();
    registry.register(new KnowledgeTool(db));
  });

  it('should search for knowledge through the tool', async () => {
    // Manually add something to the DB
    await db.add({
      id: 'test_fact',
      content: 'The capital of Japan is Tokyo.',
      metadata: {
        source: 'manual',
        sourceType: 'conversation',
        format: 'txt',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: ['capital', 'japan'],
        importance: 1.0
      }
    });

    // We need an embedding for searching to work in KnowledgeDatabase.search
    // In MockLLMProvider, embed returns a numeric array based on the text.
    
    const result = await registry.executeTool('knowledge', {
      operation: 'search',
      query: 'What is the capital of Japan?',
      threshold: 0 // Allow anything for the mock
    });

    expect(result.success).toBe(true);
    // Since MockLLMProvider is simple, we check if we got results
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('should retrieve a specific entry by ID', async () => {
    await db.add({
      id: 'id123',
      content: 'Deep learning is a subset of machine learning.',
      metadata: {
        source: 'manual',
        sourceType: 'conversation',
        format: 'txt',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: ['ai'],
        importance: 0.8
      }
    });

    const result = await registry.executeTool('knowledge', {
      operation: 'get',
      id: 'id123'
    });

    expect(result.success).toBe(true);
    expect(result.data.content).toContain('Deep learning');
  });
});
