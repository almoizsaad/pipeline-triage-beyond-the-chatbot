import { ToolRegistry } from './ToolRegistry';
import { ClockTool } from './local/ClockTool';
import { UUIDTool } from './local/UUIDTool';
import { FilesystemTool } from './local/FilesystemTool';
import { TerminalTool } from './local/TerminalTool';
import { GitTool } from './local/GitTool';
import { CalculatorTool } from './local/CalculatorTool';
import { BrowserTool } from './local/BrowserTool';
import { SearchTool } from './local/SearchTool';
import { HTTPTool } from './local/HTTPTool';
import { JSONTool } from './local/JSONTool';
import { MarkdownTool } from './local/MarkdownTool';
import { CSVTool } from './local/CSVTool';
import { PDFTool } from './local/PDFTool';
import { ImageMetadataTool } from './local/ImageMetadataTool';
import { KnowledgeTool } from './local/KnowledgeTool';
import { ResearchSynthesisTool } from './local/ResearchSynthesisTool';
import { DockerTool } from './local/DockerTool';
import { OpenAPITool } from './local/OpenAPITool';
import { MCPTool } from './local/MCPTool';
import { ToolDiagnosticsTool } from './local/ToolDiagnosticsTool';
import { RepositoryIndexerTool } from './local/RepositoryIndexerTool';
import { KnowledgeIndexer } from '../knowledge/KnowledgeIndexer';
import type { IKnowledgeDatabase } from '../types/knowledge';
import type { Tool } from './Tool';
import type { LLMProvider } from '../providers/LLMProvider';

import { APIMetricsManager } from '../core/APIMetricsManager';

/**
 * Registers all production-grade local tools into the registry.
 */
export function registerDefaultTools(
  registry: ToolRegistry, 
  knowledgeDb?: IKnowledgeDatabase, 
  llmProvider?: LLMProvider,
  metrics?: APIMetricsManager
): void {
  const tools: Tool<any, any>[] = [
    new ClockTool(),
    new UUIDTool(),
    new FilesystemTool(),
    new TerminalTool(),
    new GitTool(),
    new CalculatorTool(),
    new BrowserTool(),
    new SearchTool(metrics),
    new HTTPTool(metrics),
    new JSONTool(),
    new MarkdownTool(),
    new CSVTool(),
    new PDFTool(),
    new ImageMetadataTool(),
    new ResearchSynthesisTool(llmProvider),
    new DockerTool(),
    new OpenAPITool(),
    new MCPTool(),
    new ToolDiagnosticsTool(registry),
    new RepositoryIndexerTool(knowledgeDb),
  ];

  if (knowledgeDb) {
    tools.push(new KnowledgeTool(knowledgeDb));
  }

  tools.forEach(tool => {
    try {
      registry.register(tool);
    } catch (error) {
      console.warn(`[ToolRegistry] Failed to register tool "${tool.name}":`, error);
    }
  });
}
