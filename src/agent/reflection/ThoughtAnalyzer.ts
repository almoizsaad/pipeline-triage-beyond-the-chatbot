import type { IThoughtAnalyzer, Thought, ThoughtChain, ThoughtAnalysis } from '../types/thought';

/**
 * ThoughtAnalyzer provides insights into the agent's reasoning process.
 */
export class ThoughtAnalyzer implements IThoughtAnalyzer {
  public async analyzeChain(chain: ThoughtChain): Promise<ThoughtAnalysis> {
    const thoughts = chain.thoughts;
    if (thoughts.length === 0) {
      return { coherence: 0, depth: 0, patterns: [], suggestions: [] };
    }

    const coherence = this.calculateCoherence(thoughts);
    const depth = this.calculateDepth(thoughts);
    const patterns = this.identifyPatterns(thoughts);
    const suggestions = this.generateSuggestions(thoughts, patterns);

    return {
      coherence,
      depth,
      patterns,
      suggestions,
      impact: this.estimateImpact(thoughts)
    };
  }

  public async detectAnomalies(thoughts: Thought[]): Promise<string[]> {
    const anomalies: string[] = [];
    
    // Check for rapid repeats
    for (let i = 1; i < thoughts.length; i++) {
      if (thoughts[i].content === thoughts[i-1].content) {
        anomalies.push(`Repetitive thought detected at ${new Date(thoughts[i].timestamp).toISOString()}`);
      }
    }

    // Check for sudden error thoughts after long reasoning
    const errors = thoughts.filter(t => t.type === 'error');
    if (errors.length > 0 && thoughts.length > 10) {
      anomalies.push('Reasoning chain interrupted by error after significant progress.');
    }

    // Check for excessive observations without decisions
    const observations = thoughts.filter(t => t.type === 'observation');
    const decisions = thoughts.filter(t => t.type === 'decision');
    if (observations.length > 5 && decisions.length === 0) {
      anomalies.push('Agent is stuck in observation loop without making decisions.');
    }

    return anomalies;
  }

  private calculateCoherence(thoughts: Thought[]): number {
    // Ratio of thoughts that have a parentId pointing to a previous thought in the chain
    const ids = new Set(thoughts.map(t => t.id));
    const connected = thoughts.filter(t => t.parentId && ids.has(t.parentId)).length;
    return connected / (thoughts.length - 1 || 1);
  }

  private calculateDepth(thoughts: Thought[]): number {
    // For now, depth is just the length of the chain. 
    // Could be updated to calculate max path length in a tree.
    return thoughts.length;
  }

  private identifyPatterns(thoughts: Thought[]): string[] {
    const patterns: string[] = [];
    const types = thoughts.map(t => t.type);
    
    if (types.filter(t => t === 'observation').length > thoughts.length * 0.5) {
      patterns.push('Observation-heavy reasoning');
    }
    
    if (types.includes('plan') && types.includes('decision')) {
      patterns.push('Structured decision making');
    }

    if (types.filter(t => t === 'reflection').length > 2) {
      patterns.push('Self-correcting reasoning');
    }

    return patterns;
  }

  private generateSuggestions(thoughts: Thought[], patterns: string[]): string[] {
    const suggestions: string[] = [];
    
    if (patterns.includes('Observation-heavy reasoning')) {
      suggestions.push('Consider synthesizing observations into higher-level abstractions.');
    }

    if (thoughts.filter(t => t.type === 'error').length > 2) {
      suggestions.push('Multiple errors detected. Re-evaluate the core assumptions of the current plan.');
    }

    if (!patterns.includes('Structured decision making') && thoughts.length > 5) {
      suggestions.push('Reasoning seems aimless. Try defining a clear decision point.');
    }

    return suggestions;
  }

  private estimateImpact(thoughts: Thought[]): number {
    // Heuristic: success if decisions were made and errors were resolved
    const hasDecisions = thoughts.some(t => t.type === 'decision');
    const hasErrors = thoughts.some(t => t.type === 'error');
    const hasReflections = thoughts.some(t => t.type === 'reflection');

    let impact = 0.5;
    if (hasDecisions) impact += 0.2;
    if (hasReflections) impact += 0.2;
    if (hasErrors) impact -= 0.2;

    return Math.max(0, Math.min(1, impact));
  }
}
