import { z } from 'zod';
import type { Tool, ToolMetadata, ToolPermissions, ToolExecutionOptions, ToolHealth } from '../Tool';
import type { LLMProvider } from '../../providers/LLMProvider';

/**
 * Tool for synthesizing research findings, including summarization and comparison.
 */
export class ResearchSynthesisTool implements Tool<any, any> {
  public readonly name = 'research_synthesis';
  public readonly description = 'Synthesize research data: summarize multiple sources, compare facts, and generate cited reports.';
  
  public readonly metadata: ToolMetadata = {
    version: '1.2.0',
    category: 'other',
    tags: ['research', 'summary', 'compare', 'cite', 'llm'],
    author: 'Nexus OS'
  };

  public readonly permissions: ToolPermissions = {
    requiredPermissions: ['read_memory'],
    requiresApproval: false
  };

  public readonly options: ToolExecutionOptions = {
    timeout: 30000
  };

  public readonly inputSchema = z.object({
    operation: z.enum(['summarize', 'compare', 'generate_report']).optional().default('summarize'),
    sources: z.union([
      z.array(z.object({
        content: z.string().optional().nullable(),
        snippet: z.string().optional().nullable(),
        title: z.string().optional().nullable(),
        url: z.string().optional().nullable(),
        source: z.string().optional().nullable()
      }).passthrough()),
      z.object({
        results: z.array(z.any())
      }).passthrough()
    ]).optional().default([]),
    focus: z.string().optional().nullable(),
    facts: z.union([
      z.array(z.object({
        claim: z.string().optional().nullable(),
        snippet: z.string().optional().nullable(),
        content: z.string().optional().nullable(),
        source: z.string().optional().nullable(),
        url: z.string().optional().nullable()
      }).passthrough()),
      z.object({
        results: z.array(z.any())
      }).passthrough()
    ]).optional().default([]),
    topic: z.string().optional().default('General Research'),
    findings: z.array(z.any()).optional().default([]),
    includeCitations: z.boolean().optional().default(true)
  }).passthrough();
  
  public readonly outputSchema = z.any();

  private llmProvider?: LLMProvider;

  constructor(llmProvider?: LLMProvider) {
    this.llmProvider = llmProvider;
  }

  public async execute(input: any): Promise<any> {
    let operation = input.operation;

    // Smarter inference if operation is missing
    if (!operation) {
      if (input.sources && input.sources.length > 0) operation = 'summarize';
      else if (input.facts && input.facts.length > 0) operation = 'compare';
      else if (input.findings && input.findings.length > 0) operation = 'generate_report';
      else operation = 'summarize';
    }

    switch (operation) {
      case 'summarize':
        return await this.summarize(input.sources || [], input.focus);
      case 'compare':
        return await this.compare(input.facts || []);
      case 'generate_report':
        return await this.generateReport(input.topic || 'Research Report', input.findings || [], !!input.includeCitations);
      default:
        return await this.summarize(input.sources || [], input.focus);
    }
  }

  private async summarize(sources: any, focus?: string): Promise<any> {
    // Robustness: handle SearchTool output directly
    let actualSources = Array.isArray(sources) ? sources : [];
    if (sources && typeof sources === 'object' && !Array.isArray(sources)) {
      if (Array.isArray(sources.results)) {
        actualSources = sources.results;
      }
    }

    // Map fields if they have different names (e.g., snippet -> content)
    const normalizedSources = actualSources.map((s: any) => ({
      content: s.content || s.snippet || JSON.stringify(s),
      title: s.title || 'Untitled Source',
      url: s.url || ''
    }));

    if (this.llmProvider && normalizedSources.length > 0) {
      const prompt = `Synthesize the following research sources${focus ? ' with a focus on: ' + focus : ''}.
        
        SOURCES:
        ${normalizedSources.map((s, i) => `[${i+1}] ${s.title}: ${s.content}`).join('\n\n')}
        
        Provide a comprehensive and coherent summary. Include citations like [1], [2], etc.
        Return a JSON object with a "summary" field.`;
      
      try {
        const result = await this.llmProvider.generateStructuredOutput<any>(prompt, z.object({ summary: z.string() }));
        return {
          summary: result.summary,
          sourceCount: normalizedSources.length,
          citations: normalizedSources.map(s => ({ title: s.title, url: s.url }))
        };
      } catch (e) {
        console.warn('[ResearchSynthesisTool] LLM synthesis failed, falling back to mock:', e);
      }
    }

    return {
      summary: `[SUMMARY OF ${normalizedSources.length} SOURCES${focus ? ' FOCUSED ON ' + focus : ''}]`,
      sourceCount: normalizedSources.length,
      citations: normalizedSources.map(s => ({ title: s.title, url: s.url }))
    };
  }

  private async compare(facts: any): Promise<any> {
    // Robustness: handle SearchTool output directly
    let actualFacts = Array.isArray(facts) ? facts : [];
    if (facts && typeof facts === 'object' && !Array.isArray(facts)) {
      if (Array.isArray(facts.results)) {
        actualFacts = facts.results;
      }
    }

    const normalizedFacts = actualFacts.map((f: any) => ({
      claim: f.claim || f.snippet || f.content || JSON.stringify(f),
      source: f.source || f.title || 'Unknown',
      url: f.url || ''
    }));

    if (this.llmProvider && normalizedFacts.length > 0) {
      const prompt = `Compare and contrast the following research facts.
        
        FACTS:
        ${normalizedFacts.map((f, i) => `[Fact ${i+1}] Source: ${f.source}. Claim: ${f.claim}`).join('\n\n')}
        
        Identify key similarities and any contradictions.
        Return a JSON object with "comparison" (string), "similarities" (string[]), and "contradictions" (string[]).`;
      
      try {
        const result = await this.llmProvider.generateStructuredOutput<any>(prompt, z.object({
          comparison: z.string(),
          similarities: z.array(z.string()),
          contradictions: z.array(z.string())
        }));
        return {
          ...result,
          factCount: normalizedFacts.length
        };
      } catch (e) {
        console.warn('[ResearchSynthesisTool] LLM comparison failed, falling back to mock:', e);
      }
    }

    return {
      comparison: `[COMPARISON OF ${normalizedFacts.length} CLAIMS]`,
      factCount: normalizedFacts.length,
      similarities: [],
      contradictions: []
    };
  }

  private async generateReport(topic: string, findings: any[], includeCitations: boolean): Promise<any> {
    if (this.llmProvider && findings.length > 0) {
      const prompt = `Generate a detailed research report on the topic: "${topic}".
        
        FINDINGS:
        ${JSON.stringify(findings, null, 2)}
        
        Format the report in Markdown. ${includeCitations ? 'Ensure all findings are properly cited.' : ''}
        Return a JSON object with a "report" field.`;
      
      try {
        const result = await this.llmProvider.generateStructuredOutput<any>(prompt, z.object({ report: z.string() }));
        return {
          report: result.report,
          findingCount: findings.length,
          hasCitations: includeCitations
        };
      } catch (e) {
        console.warn('[ResearchSynthesisTool] LLM report generation failed, falling back to mock:', e);
      }
    }

    return {
      report: `[RESEARCH REPORT FOR: ${topic}]`,
      findingCount: findings.length,
      hasCitations: includeCitations
    };
  }

  public async checkHealth(): Promise<ToolHealth> {
    return {
      status: 'healthy',
      lastChecked: new Date(),
      errorCount: 0
    };
  }
}
