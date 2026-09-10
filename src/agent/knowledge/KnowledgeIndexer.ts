import type { 
  IKnowledgeDatabase, 
  KnowledgeEntry, 
  ChunkingOptions, 
  IEmbeddingStore,
  KnowledgeSourceType,
  DocumentFormat,
  KnowledgeMetadata,
  IKnowledgeGraph
} from '../types/knowledge';
import type { LLMProvider } from '../providers/LLMProvider';
import { Chunker } from './Chunker';
import { DocumentLoader } from './DocumentLoader';
import { KnowledgeLinker } from './KnowledgeLinker';

export class KnowledgeIndexer {
  private chunker = new Chunker();
  private loader = new DocumentLoader();
  private database: IKnowledgeDatabase;
  private embeddingStore: IEmbeddingStore;
  private llmProvider: LLMProvider;
  private chunkingOptions: ChunkingOptions;
  private graph?: IKnowledgeGraph;
  private linker?: KnowledgeLinker;

  constructor(
    database: IKnowledgeDatabase,
    embeddingStore: IEmbeddingStore,
    llmProvider: LLMProvider,
    chunkingOptions: ChunkingOptions = { maxChunkSize: 1000, overlap: 100 },
    graph?: IKnowledgeGraph
  ) {
    this.database = database;
    this.embeddingStore = embeddingStore;
    this.llmProvider = llmProvider;
    this.chunkingOptions = chunkingOptions;
    this.graph = graph;
    if (graph) {
      this.linker = new KnowledgeLinker(graph, llmProvider);
    }
  }

  public async indexDocument(
    source: string,
    type: KnowledgeSourceType,
    format: DocumentFormat,
    content?: string
  ): Promise<string[]> {
    const doc = await this.loader.load(source, type, format, content);
    const chunks = this.chunker.chunk(doc.content, this.chunkingOptions);
    
    const indexedIds: string[] = [];
    const originalId = crypto.randomUUID();

    // Create graph node for document
    let docNodeId: string | undefined;
    if (this.graph) {
      const node = await this.graph.createNode({
        type: 'document',
        label: doc.metadata.title || source,
        properties: {
          source,
          type,
          format,
          originalId
        }
      });
      docNodeId = node.id;
    }

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const id = `${originalId}_${i}`;
      
      const embedding = await this.llmProvider.embed(chunk);
      
      const entry: KnowledgeEntry = {
        id,
        content: chunk,
        embedding,
        metadata: {
          ...doc.metadata as KnowledgeMetadata,
          chunkIndex: i,
          totalChunks: chunks.length,
          originalId,
          updatedAt: Date.now()
        }
      };

      await this.database.add(entry);
      await this.embeddingStore.save(id, embedding);
      indexedIds.push(id);
    }

    if (this.linker && docNodeId) {
      await this.linker.inferRelations(docNodeId);
    }

    return indexedIds;
  }

  public async indexConversation(conversationId: string, messages: { role: string; content: string }[]): Promise<string> {
    const content = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const ids = await this.indexDocument(conversationId, 'conversation', 'txt', content);
    return ids[0].split('_')[0]; // Return the base UUID
  }
}
