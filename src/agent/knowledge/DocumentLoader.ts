import * as fs from 'fs';
import * as path from 'path';
import type { DocumentFormat, KnowledgeMetadata, KnowledgeSourceType } from '../types/knowledge';

export interface LoadedDocument {
  content: string;
  metadata: Partial<KnowledgeMetadata>;
}

/**
 * DocumentLoader handles fetching and processing of content from various sources.
 * Supports HTTP/HTTPS for web and FileSystem for local files in Node.js.
 */
export class DocumentLoader {
  private isNode: boolean = typeof window === 'undefined' && typeof process !== 'undefined';

  public async load(source: string, type: KnowledgeSourceType, format: DocumentFormat, content?: string): Promise<LoadedDocument> {
    // 1. Handled provided content (e.g. from UI)
    if (content) {
      return {
        content: this.processContent(content, format),
        metadata: this.getInitialMetadata(source, type, format)
      };
    }

    // 2. Fetch from Web
    if (type === 'web' || source.startsWith('http')) {
      try {
        const response = await fetch(source);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const text = await response.text();
        return {
          content: this.processContent(text, format),
          metadata: this.getInitialMetadata(source, type, format)
        };
      } catch (e) {
        throw new Error(`Failed to fetch from web: ${source}. ${e}`);
      }
    }

    // 3. Load from File System (Node.js only)
    if (this.isNode && (type === 'file' || source.startsWith('/') || source.startsWith('./'))) {
      try {
        const filePath = path.isAbsolute(source) ? source : path.join(process.cwd(), source);
        if (fs.existsSync(filePath)) {
          const text = fs.readFileSync(filePath, 'utf-8');
          return {
            content: this.processContent(text, format),
            metadata: this.getInitialMetadata(source, type, format)
          };
        }
      } catch (e) {
        throw new Error(`Failed to read local file: ${source}. ${e}`);
      }
    }

    throw new Error(`Source fetching not implemented for: ${source} (type: ${type})`);
  }

  private getInitialMetadata(source: string, type: KnowledgeSourceType, format: DocumentFormat): Partial<KnowledgeMetadata> {
    return {
      source,
      sourceType: type,
      format,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: [],
      importance: 0.5,
      confidence: 0.8
    };
  }

  private processContent(content: string, format: DocumentFormat): string {
    switch (format) {
      case 'json':
        try {
          const parsed = JSON.parse(content);
          return JSON.stringify(parsed, null, 2);
        } catch {
          return content;
        }
      case 'markdown':
      case 'txt':
      case 'pdf': // Handled as text abstraction for now
      default:
        return content;
    }
  }
}
