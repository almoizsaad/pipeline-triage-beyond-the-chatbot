import type { ISelfReflectionEngine, ReflectionResult, ExecutionAnalysis } from '../types/reflection';
import type { IKnowledgeGraph } from '../types/knowledge';
import { KnowledgeLinker } from '../knowledge/KnowledgeLinker';
import { AgentStream } from '../events/AgentStream';
export class ReflectionEngine implements ISelfReflectionEngine {
  private graph?: IKnowledgeGraph;
  private linker?: KnowledgeLinker;
  private stream?: AgentStream;

  constructor(graph?: IKnowledgeGraph, stream?: AgentStream) {
    this.graph = graph;
    this.stream = stream;
    if (graph) {
      this.linker = new KnowledgeLinker(graph);
    }
  }

  public async reflect(analysis: ExecutionAnalysis): Promise<ReflectionResult> {
    this.stream?.thought(`Starting reflection for workflow: ${analysis.workflowId}`, 'reflection', { workflowId: analysis.workflowId });

    const success = analysis.failedTasks === 0;
    const confidenceScore = this.calculateConfidence(analysis);
    
    const lessonsLearned: string[] = [];
    const mistakes: string[] = [];
    const improvements: string[] = [];

    if (success) {
      this.stream?.thought('Analyzing successful workflow patterns.', 'observation', { workflowId: analysis.workflowId });
      lessonsLearned.push('Workflow completed successfully without terminal failures.');
      
      if (analysis.retries > 0) {
        lessonsLearned.push(`Recovered from ${analysis.retries} transient failures.`);
        improvements.push('Investigate transient failures to improve stability.');
      }
    } else {
      this.stream?.thought(`Analyzing ${analysis.failedTasks} task failures.`, 'error', { workflowId: analysis.workflowId });
      mistakes.push(`Workflow failed with ${analysis.failedTasks} permanent task failures.`);
      
      for (const err of analysis.errors) {
        let insight = `Task failed with error: ${err}`;
        if (err.includes('timeout')) insight = 'Task failed due to timeout. Consider increasing resource limits.';
        if (err.includes('rate limit')) insight = 'Task hit rate limits. Consider adding backoff strategy.';
        mistakes.push(insight);
      }
      
      improvements.push('Analyze permanent failures and update task handlers or tool configurations.');
    }

    if (analysis.duration > 10000) {
      improvements.push('Workflow duration exceeded 10s. Consider parallelizing more tasks or optimizing tool performance.');
    }

    const result: ReflectionResult = {
      workflowId: analysis.workflowId,
      timestamp: Date.now(),
      success,
      confidenceScore,
      lessonsLearned,
      mistakes,
      improvements,
      metadata: {
        totalTasks: analysis.totalTasks,
        duration: analysis.duration,
        retries: analysis.retries
      }
    };

    if (this.graph && this.linker) {
      await this.recordReflectionInGraph(result, analysis.events);
      
      this.stream?.event('KNOWLEDGE_UPDATED', {
        workflowId: result.workflowId,
        type: 'reflection',
        summary: `Stored reflection and ${result.mistakes.length + result.improvements.length} insights in Knowledge Graph.`
      });
    }

    return result;
  }

  private async recordReflectionInGraph(reflection: ReflectionResult, events: any[]): Promise<void> {
    if (!this.graph || !this.linker) return;

    // Create reflection node
    const reflectionNode = await this.graph.createNode({
      type: 'concept',
      label: `Reflection: ${reflection.workflowId}`,
      properties: {
        workflowId: reflection.workflowId,
        success: reflection.success,
        confidenceScore: reflection.confidenceScore,
        timestamp: reflection.timestamp
      }
    });

    // Phase 9: Knowledge Discovery - Extract "discoveries" from tool results
    for (const event of events) {
      if (event.type === 'TOOL_RESULT' && event.result?.success) {
        const discoveryLabel = event.description ? `Discovery: ${event.description}` : `Discovery: ${event.taskId}`;
        const discoveryNode = await this.graph.createNode({
          type: 'document',
          label: discoveryLabel.substring(0, 100),
          properties: {
            taskId: event.taskId,
            toolName: event.toolName,
            description: event.description,
            result: event.result.data,
            timestamp: event.timestamp
          }
        });
        await this.linker.linkNodes(reflectionNode.id, discoveryNode.id, 'supports', 0.9);
      }
    }

    // Create mistake nodes and link them
    for (const mistake of reflection.mistakes) {
      const mistakeNode = await this.graph.createNode({
        type: 'concept',
        label: `Mistake: ${mistake.substring(0, 50)}...`,
        properties: { mistake, workflowId: reflection.workflowId }
      });
      await this.linker.linkNodes(reflectionNode.id, mistakeNode.id, 'contradicts', 0.8);
    }

    // Create improvement nodes and link them
    for (const improvement of reflection.improvements) {
      const improvementNode = await this.graph.createNode({
        type: 'concept',
        label: `Improvement: ${improvement.substring(0, 50)}...`,
        properties: { improvement, workflowId: reflection.workflowId }
      });
      await this.linker.linkNodes(reflectionNode.id, improvementNode.id, 'improves', 0.9);
    }
  }

  private calculateConfidence(analysis: ExecutionAnalysis): number {
    if (analysis.totalTasks === 0) return 0;
    
    let score = (analysis.completedTasks / analysis.totalTasks) * 100;
    
    // Penalty for retries
    score -= analysis.retries * 5;
    
    // Penalty for duration (simplified)
    if (analysis.duration > 30000) score -= 10;

    return Math.max(0, Math.min(100, score));
  }
}
