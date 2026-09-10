import type { OptimizationRecommendation } from '../types/improvement';

export class OptimizationSuggestions {
  private suggestions: OptimizationRecommendation[] = [];

  public updateSuggestions(newSuggestions: OptimizationRecommendation[]): void {
    // Merge or replace suggestions
    // For now, let's just replace them to keep it simple, 
    // but in a real app we might want to track which ones were seen/dismissed.
    this.suggestions = newSuggestions;
  }

  public getSuggestions(): OptimizationRecommendation[] {
    return [...this.suggestions];
  }

  public getHighPrioritySuggestions(): OptimizationRecommendation[] {
    return this.suggestions.filter(s => s.priority === 'high');
  }

  public dismissSuggestion(id: string): void {
    this.suggestions = this.suggestions.filter(s => s.id !== id);
  }
}
