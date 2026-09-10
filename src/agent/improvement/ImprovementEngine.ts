import type { 
  IImprovementEngine, 
  SystemMetrics, 
  OptimizationRecommendation,
  SystemInstruction
} from '../types/improvement';
import { ToolEvaluator } from './ToolEvaluator';
import { PlannerEvaluator } from './PlannerEvaluator';

export class ImprovementEngine implements IImprovementEngine {
  private toolEvaluator = new ToolEvaluator();
  private plannerEvaluator = new PlannerEvaluator();

  public generateRecommendations(metrics: SystemMetrics): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [
      ...this.toolEvaluator.evaluate(metrics.toolPerformance),
      ...this.plannerEvaluator.evaluate(metrics.plannerQuality)
    ];

    // Memory optimizations
    if (metrics.memoryQuality.missRate > 0.3) {
      recommendations.push({
        component: 'memory',
        id: 'vector-memory',
        type: 'quality',
        description: `Memory retrieval has a high miss rate (${(metrics.memoryQuality.missRate * 100).toFixed(1)}%).`,
        suggestion: 'Improve indexing strategies or adjust retrieval thresholds.',
        priority: 'medium'
      });
    }

    // Workflow optimizations
    if (metrics.workflowSuccessRate < 0.9) {
      recommendations.push({
        component: 'workflow',
        id: 'engine',
        type: 'reliability',
        description: `Overall workflow success rate is below target (${(metrics.workflowSuccessRate * 100).toFixed(1)}%).`,
        suggestion: 'Implement better self-correction and recovery loops in the WorkflowEngine.',
        priority: 'high'
      });
    }

    return recommendations;
  }

  public analyzeForPromptOptimization(reflection: any, analysis?: any): SystemInstruction[] {
    const instructions: SystemInstruction[] = [];

    // Learn from mistakes (Policy/Constraint)
    if (reflection.mistakes && reflection.mistakes.length > 0) {
      reflection.mistakes.forEach((mistake: string, index: number) => {
        instructions.push({
          id: `policy-${reflection.workflowId}-${index}`,
          type: 'policy',
          content: `AVOID THIS MISTAKE: ${mistake}`,
          source: reflection.workflowId,
          confidence: reflection.confidenceScore / 100,
          usageCount: 0,
          lastUsed: Date.now()
        });
      });
    }

    // Learn from improvements (Tips)
    if (reflection.improvements && reflection.improvements.length > 0) {
      reflection.improvements.forEach((improvement: string, index: number) => {
        instructions.push({
          id: `tip-${reflection.workflowId}-${index}`,
          type: 'tip',
          content: `PRO-TIP: ${improvement}`,
          source: reflection.workflowId,
          confidence: reflection.confidenceScore / 100,
          usageCount: 0,
          lastUsed: Date.now()
        });
      });
    }

    // Analyze Thought Analysis Suggestions
    if (analysis && analysis.suggestions) {
      analysis.suggestions.forEach((suggestion: string, index: number) => {
        instructions.push({
          id: `reasoning-${reflection.workflowId}-${index}`,
          type: 'skill',
          content: `REASONING IMPROVEMENT: ${suggestion}`,
          source: reflection.workflowId,
          confidence: (analysis.coherence + analysis.depth / 20) / 2,
          usageCount: 0,
          lastUsed: Date.now()
        });
      });
    }

    return instructions;
  }
}
