import { describe, it, expect, beforeEach } from 'vitest';
import { KnowledgeDatabase } from '../knowledge/KnowledgeDatabase';
import { EmbeddingStore } from '../knowledge/EmbeddingStore';
import { VectorSearch } from '../knowledge/VectorSearch';
import { KnowledgeIndexer } from '../knowledge/KnowledgeIndexer';
import { MockLLMProvider } from '../providers/MockLLMProvider';
import type { KnowledgeMetadata } from '../types/knowledge';

describe('Knowledge Store', () => {
  let db: KnowledgeDatabase;
  let embeddingStore: EmbeddingStore;
  let vectorSearch: VectorSearch;
  let indexer: KnowledgeIndexer;
  let llmProvider: MockLLMProvider;

  beforeEach(() => {
    localStorage.clear();
    embeddingStore = new EmbeddingStore();
    vectorSearch = new VectorSearch(embeddingStore);
    llmProvider = new MockLLMProvider();
    db = new KnowledgeDatabase(vectorSearch, llmProvider);
    indexer = new KnowledgeIndexer(db, embeddingStore, llmProvider, { maxChunkSize: 100, overlap: 20 });
  });

  it('should index a document and search for it', async () => {
    const content = 'The capital of France is Paris. It is known for the Eiffel Tower.';
    await indexer.indexDocument('test_doc', 'file', 'txt', content);

    const results = await db.search('Paris');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].entry.content).toContain('Paris');
  });

  it('should chunk large documents', async () => {
    const content = 'Part 1: ' + 'A'.repeat(80) + '\nPart 2: ' + 'B'.repeat(80);
    const ids = await indexer.indexDocument('large_doc', 'file', 'txt', content);
    
    expect(ids.length).toBeGreaterThan(1);
    
    const doc1 = await db.get(ids[0]);
    const doc2 = await db.get(ids[1]);
    
    expect(doc1?.metadata.chunkIndex).toBe(0);
    expect(doc2?.metadata.chunkIndex).toBe(1);
    expect(doc1?.metadata.totalChunks).toBe(ids.length);
  });

  it('should filter by tags', async () => {
    await indexer.indexDocument('doc1', 'file', 'txt', 'Content 1');
    await db.update((await db.search('Content 1'))[0].id, { metadata: { tags: ['important'] } as unknown as KnowledgeMetadata });

    await indexer.indexDocument('doc2', 'file', 'txt', 'Content 2');

    const results = await db.search('Content', { filters: { tags: ['important'] } });
    expect(results.length).toBe(1);
    expect(results[0].entry.content).toBe('Content 1');
  });

  it('should support vector similarity search (mocked)', async () => {
    // Our MockLLMProvider generates embeddings based on word overlap.
    // Similar texts with overlapping words should have higher scores.
    
    const content1 = 'Artificial Intelligence is a branch of computer science.';
    const content2 = 'Space exploration involves sending spacecraft into outer space.';
    
    await indexer.indexDocument('ai_doc', 'file', 'txt', content1);
    await indexer.indexDocument('space_doc', 'file', 'txt', content2);

    const aiEmbedding = await llmProvider.embed('Tell me about Artificial Intelligence');
    const spaceEmbedding = await llmProvider.embed('How does space exploration work');

    const aiResults = await vectorSearch.search(aiEmbedding, 1);
    const spaceResults = await vectorSearch.search(spaceEmbedding, 1);

    const aiDoc = await db.get(aiResults[0].id);
    const spaceDoc = await db.get(spaceResults[0].id);

    expect(aiDoc?.content).toContain('Artificial Intelligence');
    expect(spaceDoc?.content).toContain('Space exploration');
  });
});
