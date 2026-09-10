import type { ChunkingOptions } from '../types/knowledge';

export class Chunker {
  public chunk(text: string, options: ChunkingOptions): string[] {
    const { maxChunkSize, overlap } = options;
    const chunks: string[] = [];
    
    if (text.length <= maxChunkSize) {
      return [text];
    }

    let start = 0;
    while (start < text.length) {
      let end = start + maxChunkSize;
      
      // Try to find a good breaking point (newline or space)
      if (end < text.length) {
        const lastNewline = text.lastIndexOf('\n', end);
        if (lastNewline > start + maxChunkSize / 2) {
          end = lastNewline + 1;
        } else {
          const lastSpace = text.lastIndexOf(' ', end);
          if (lastSpace > start + maxChunkSize / 2) {
            end = lastSpace + 1;
          }
        }
      }

      chunks.push(text.substring(start, end).trim());
      
      start = end - overlap;
      if (start >= text.length || end >= text.length) break;
    }

    return chunks.filter(c => c.length > 0);
  }
}
