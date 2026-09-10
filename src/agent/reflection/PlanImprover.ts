import type { IPlanImprover, ReflectionResult } from '../types/reflection';

export class PlanImprover implements IPlanImprover {
  public async suggestImprovements(reflection: ReflectionResult): Promise<string[]> {
    const suggestions: string[] = [];

    if (!reflection.success) {
      suggestions.push('Review task dependencies for potential race conditions.');
      suggestions.push('Consider adding pre-validation steps for failing tasks.');
    }

    if (reflection.confidenceScore < 70) {
      suggestions.push('Increase retry limits for non-deterministic tools.');
      suggestions.push('Refine task descriptions to reduce ambiguity.');
    }

    if (typeof reflection.metadata.duration === 'number' && reflection.metadata.duration > 20000) {
      suggestions.push('Analyze bottlenecks in long-running tasks.');
    }

    return [...suggestions, ...reflection.improvements];
  }
}
