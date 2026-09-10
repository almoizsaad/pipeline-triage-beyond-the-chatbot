import SystemMetricsOriginal from '../SystemMetrics';
import type { SystemMetrics as ISystemMetrics, OptimizationRecommendation } from '../../../agent/types/improvement';

export function SystemMetrics({ data }: { id: string; data: Record<string, unknown> }) {
  const metrics = (data?.metrics as ISystemMetrics) || null;
  const recommendations = (data?.recommendations as OptimizationRecommendation[]) || [];
  
  return (
    <div className="h-full overflow-auto">
      <SystemMetricsOriginal metrics={metrics} recommendations={recommendations} />
    </div>
  );
}
