import { describe, it, expect, beforeEach } from 'vitest';
import { PerformanceMonitor } from '../improvement/PerformanceMonitor';
import { ImprovementEngine } from '../improvement/ImprovementEngine';
import { OptimizationSuggestions } from '../improvement/OptimizationSuggestions';
import type { OptimizationRecommendation } from '../types/improvement';

describe('Self Improvement Layer', () => {
  let monitor: PerformanceMonitor;
  let engine: ImprovementEngine;
  let suggestions: OptimizationSuggestions;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    engine = new ImprovementEngine();
    suggestions = new OptimizationSuggestions();
  });

  it('should track tool performance accurately', () => {
    monitor.trackToolUse('weather', 500, true);
    monitor.trackToolUse('weather', 1500, false);
    
    const metrics = monitor.getMetrics();
    const weather = metrics.toolPerformance['weather'];
    
    expect(weather.callCount).toBe(2);
    expect(weather.avgLatency).toBe(1000);
    expect(weather.successRate).toBe(0.5);
  });

  it('should track planner and memory quality', () => {
    monitor.trackPlanner(80, 5);
    monitor.trackPlanner(60, 3);
    
    monitor.trackMemory(0.9, 5);
    monitor.trackMemory(0.5, 0); // Miss
    
    const metrics = monitor.getMetrics();
    expect(metrics.plannerQuality.avgConfidence).toBe(70);
    expect(metrics.plannerQuality.avgTaskCount).toBe(4);
    expect(metrics.memoryQuality.missRate).toBe(0.5);
  });

  it('should generate high priority recommendations for failing tools', () => {
    // Need 5 calls for ToolEvaluator to trigger
    for(let i=0; i<5; i++) monitor.trackToolUse('search', 100, false); 
    
    const metrics = monitor.getMetrics();
    const recommendations = engine.generateRecommendations(metrics);
    
    const searchRec = recommendations.find(r => r.id === 'search');
    expect(searchRec).toBeDefined();
    expect(searchRec?.priority).toBe('high');
    expect(searchRec?.type).toBe('reliability');
  });

  it('should suggest improvements for slow tools', () => {
    for(let i=0; i<5; i++) monitor.trackToolUse('heavy_task', 11000, true);
    
    const metrics = monitor.getMetrics();
    const recommendations = engine.generateRecommendations(metrics);
    
    const latencyRec = recommendations.find(r => r.id === 'heavy_task' && r.type === 'latency');
    expect(latencyRec).toBeDefined();
    expect(latencyRec?.priority).toBe('high');
  });

  it('should suggest improvements for low planner confidence', () => {
    monitor.trackPlanner(40, 5);
    
    const metrics = monitor.getMetrics();
    const recommendations = engine.generateRecommendations(metrics);
    
    const plannerRec = recommendations.find(r => r.component === 'planner');
    expect(plannerRec).toBeDefined();
    expect(plannerRec?.priority).toBe('high');
  });

  it('should manage suggestions through OptimizationSuggestions class', () => {
    const mockRecs: OptimizationRecommendation[] = [
      { component: 'tool', id: 't1', type: 'latency', description: 'desc', suggestion: 'sug', priority: 'high' }
    ];
    
    suggestions.updateSuggestions(mockRecs);
    expect(suggestions.getSuggestions().length).toBe(1);
    expect(suggestions.getHighPrioritySuggestions().length).toBe(1);
    
    suggestions.dismissSuggestion('t1');
    expect(suggestions.getSuggestions().length).toBe(0);
  });
});
