import type { IMemorySummarizer, MemoryEntry } from '../types/memory';

/**
 * MemorySummarizer creates high-level summaries of memory groups.
 */
export class MemorySummarizer implements IMemorySummarizer {
  public async summarize(entries: MemoryEntry[]): Promise<string> {
    if (entries.length === 0) return 'No memories to summarize.';
    
    // In a real implementation, this would call an LLM.
    // Here we generate a structural summary.
    const types = new Set(entries.map(e => e.type));
    const tags = new Set(entries.flatMap(e => e.tags));
    
    return `Summary of ${entries.length} memories (Types: ${Array.from(types).join(', ')}). 
            Key themes: ${Array.from(tags).slice(0, 5).join(', ')}. 
            Time span: ${new Date(entries[entries.length - 1].timestamp).toLocaleString()} to ${new Date(entries[0].timestamp).toLocaleString()}.`;
  }
}
