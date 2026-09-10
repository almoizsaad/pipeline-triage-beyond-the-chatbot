import type { IMemoryScorer, MemoryEntry, MemoryQuery } from '../types/memory';

export class MemoryScorer implements IMemoryScorer {
  public score(entry: MemoryEntry, query: MemoryQuery): number {
    let score = 0;

    // 1. Importance (Base score)
    score += entry.metadata.importance * 0.5;

    // 2. Recency
    const now = Date.now();
    const age = now - entry.timestamp;
    const recencyScore = Math.max(0, 1 - age / (1000 * 60 * 60 * 24 * 7)); // 1 week decay
    score += recencyScore * 0.3;

    // 3. Relevance (Text match)
    if (query.text) {
      const contentStr = JSON.stringify(entry.content).toLowerCase();
      if (contentStr.includes(query.text.toLowerCase())) {
        score += 0.2;
      }
    }

    return Math.min(1, score);
  }
}
