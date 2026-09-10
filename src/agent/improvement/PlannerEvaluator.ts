import type { PlannerQuality, OptimizationRecommendation } from '../types/improvement';

export class PlannerEvaluator {
  public evaluate(quality: PlannerQuality): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Confidence Analysis
    if (quality.avgConfidence < 50) {
      recommendations.push({
        component: 'planner',
        id: 'planner-core',
        type: 'quality',
        description: `Planner average confidence is very low (${quality.avgConfidence.toFixed(1)}%).`,
        suggestion: `The LLM is struggling to form clear plans. Consider simplifying the task space or enhancing the system prompt with better examples (few-shot).`,
        priority: 'high'
      });
    } else if (quality.avgConfidence < 80) {
      recommendations.push({
        component: 'planner',
        id: 'planner-core',
        type: 'quality',
        description: `Planner confidence is suboptimal (${quality.avgConfidence.toFixed(1)}%).`,
        suggestion: `Refine tool descriptions to help the planner choose tools more decisively.`,
        priority: 'medium'
      });
    }

    // Replan Rate Analysis
    if (quality.replanRate > 0.4) {
      recommendations.push({
        component: 'planner',
        id: 'planner-core',
        type: 'reliability',
        description: `High replan rate detected (${(quality.replanRate * 100).toFixed(1)}%).`,
        suggestion: `The initial plans are often failing. This could indicate over-ambitious planning. Try breaking down tasks into smaller, more manageable sub-tasks.`,
        priority: 'high'
      });
    }

    // Task Complexity Analysis
    if (quality.avgTaskCount > 10) {
      recommendations.push({
        component: 'planner',
        id: 'planner-core',
        type: 'quality',
        description: `Average task count per plan is very high (${quality.avgTaskCount.toFixed(1)}).`,
        suggestion: `Plans are becoming too complex. Consider a hierarchical planning approach or increasing the model's context window.`,
        priority: 'medium'
      });
    }

    return recommendations;
  }
}
