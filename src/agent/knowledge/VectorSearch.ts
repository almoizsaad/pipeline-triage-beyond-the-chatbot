import type { IEmbeddingStore, IVectorSearch } from '../types/knowledge';

export class VectorSearch implements IVectorSearch {
  private embeddingStore: IEmbeddingStore;

  constructor(embeddingStore: IEmbeddingStore) {
    this.embeddingStore = embeddingStore;
  }

  public async search(queryEmbedding: number[], topK: number = 5): Promise<{ id: string; score: number }[]> {
    const allEmbeddings = await this.embeddingStore.list();
    const scores = allEmbeddings.map(({ id, embedding }) => {
      return {
        id,
        score: this.cosineSimilarity(queryEmbedding, embedding)
      };
    });

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    return scores.slice(0, topK);
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
