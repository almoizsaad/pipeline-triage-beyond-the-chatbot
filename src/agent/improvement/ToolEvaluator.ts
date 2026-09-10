import type { ToolPerformance, OptimizationRecommendation } from '../types/improvement';

export class ToolEvaluator {
  public evaluate(metrics: Record<string, ToolPerformance>): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    for (const [toolName, tool] of Object.entries(metrics)) {
      if (tool.callCount < 5) continue; // Need enough data

      // Success Rate Analysis
      if (tool.successRate < 0.7) {
        recommendations.push({
          component: 'tool',
          id: toolName,
          type: 'reliability',
          description: `Tool '${toolName}' success rate is critically low (${(tool.successRate * 100).toFixed(1)}%).`,
          suggestion: `Investigate '${toolName}' failure patterns. Consider adding pre-validation for its arguments or improving error recovery.`,
          priority: 'high'
        });
      } else if (tool.successRate < 0.9) {
        recommendations.push({
          component: 'tool',
          id: toolName,
          type: 'reliability',
          description: `Tool '${toolName}' success rate is below target (${(tool.successRate * 100).toFixed(1)}%).`,
          suggestion: `Check for edge cases where '${toolName}' might be failing intermittently.`,
          priority: 'medium'
        });
      }

      // Latency Analysis
      if (tool.avgLatency > 10000) {
        recommendations.push({
          component: 'tool',
          id: toolName,
          type: 'latency',
          description: `Tool '${toolName}' is extremely slow (avg ${(tool.avgLatency / 1000).toFixed(1)}s).`,
          suggestion: `Consider implementing asynchronous execution, caching results, or optimizing the tool's internal logic.`,
          priority: 'high'
        });
      } else if (tool.avgLatency > 3000) {
        recommendations.push({
          component: 'tool',
          id: toolName,
          type: 'latency',
          description: `Tool '${toolName}' latency is high (avg ${(tool.avgLatency / 1000).toFixed(1)}s).`,
          suggestion: `Review tool execution path for bottlenecks.`,
          priority: 'medium'
        });
      }
    }

    return recommendations;
  }
}
