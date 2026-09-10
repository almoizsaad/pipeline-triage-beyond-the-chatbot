import type { IMemoryCompressor, MemoryEntry } from '../types/memory';

/**
 * MemoryCompressor reduces the footprint of memory by removing low-importance
 * or redundant entries when limits are reached.
 */
export class MemoryCompressor implements IMemoryCompressor {
  public async compress(entries: MemoryEntry[]): Promise<MemoryEntry[]> {
    // Basic compression: sort by importance and recency, keep top 70%
    if (entries.length < 10) return entries;

    const sorted = [...entries].sort((a, b) => {
      const scoreA = a.metadata.importance * (1 / (Date.now() - a.timestamp));
      const scoreB = b.metadata.importance * (1 / (Date.now() - b.timestamp));
      return scoreB - scoreA;
    });

    return sorted.slice(0, Math.ceil(entries.length * 0.7));
  }
}
