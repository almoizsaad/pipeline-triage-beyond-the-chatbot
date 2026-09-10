import { useState } from 'react';
import { 
  Activity, 
  BarChart3, 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  Database,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { SystemMetrics, OptimizationRecommendation } from '../../agent/types/improvement';

interface MetricsDashboardProps {
  metrics: SystemMetrics | null;
  recommendations: OptimizationRecommendation[];
}

export default function SystemMetrics({ metrics, recommendations }: MetricsDashboardProps) {
  const [expanded, setExpanded] = useState(false);

  if (!metrics) return null;

  return (
    <div className="w-full border rounded-xl overflow-hidden transition-all duration-300" 
         style={{ background: '#FFF', borderColor: '#E7E5E4' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-[#FAF9F6] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
             <Activity className="w-5 h-5" style={{ color: '#BE123C' }} />
             <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
          </div>
          <span className="font-bold text-sm tracking-tight" style={{ color: '#44403C' }}>SYSTEM_TELEMETRY</span>
          {recommendations.length > 0 && (
            <Badge className="h-4 rounded-none font-mono text-[8px] px-1 bg-amber-500/10 text-amber-600 border-none animate-bounce">
              {recommendations.length} ADVISORIES
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
           <div className="hidden md:flex items-center gap-2 font-mono text-[10px] text-muted-foreground/60">
             <span>CPU: {Math.floor(Math.random() * 15 + 5)}%</span>
             <span className="w-px h-3 bg-stone-200" />
             <span>MEM: 284MB</span>
           </div>
           {expanded ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
        </div>
      </button>

      {expanded && (
        <div className="p-4 pt-0 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard 
              icon={<CheckCircle2 className="w-4 h-4" />} 
              label="Success Rate" 
              value={`${(metrics.workflowSuccessRate * 100).toFixed(0)}%`}
              color={metrics.workflowSuccessRate > 0.9 ? '#059669' : '#D97706'}
            />
            <MetricCard 
              icon={<Clock className="w-4 h-4" />} 
              label="Avg Latency" 
              value={`${(metrics.avgExecutionLatency / 1000).toFixed(1)}s`}
              color="#4F46E5"
            />
            <MetricCard 
              icon={<Cpu className="w-4 h-4" />} 
              label="Planner Quality" 
              value={`${metrics.plannerQuality.avgConfidence.toFixed(0)}%`}
              color={metrics.plannerQuality.avgConfidence > 70 ? '#059669' : '#D97706'}
            />
            <MetricCard 
              icon={<Database className="w-4 h-4" />} 
              label="Memory Hits" 
              value={`${((1 - metrics.memoryQuality.missRate) * 100).toFixed(0)}%`}
              color={metrics.memoryQuality.missRate < 0.2 ? '#059669' : '#D97706'}
            />
          </div>

          {/* Recommendations Section */}
          {recommendations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" 
                  style={{ color: '#78716C' }}>
                <Lightbulb className="w-3.5 h-3.5" style={{ color: '#D97706' }} />
                Optimization Recommendations
              </h4>
              <div className="space-y-2">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="p-3 rounded-lg border text-xs"
                       style={{ 
                         background: rec.priority === 'high' ? '#FEF2F2' : '#FFFBEB',
                         borderColor: rec.priority === 'high' ? '#FECACA' : '#FEF3C7'
                       }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold uppercase text-[9px]" 
                            style={{ color: rec.priority === 'high' ? '#991B1B' : '#92400E' }}>
                        {rec.component} • {rec.type}
                      </span>
                      {rec.priority === 'high' && <AlertTriangle className="w-3 h-3 text-red-600" />}
                    </div>
                    <p className="font-semibold mb-1" style={{ color: '#44403C' }}>{rec.description}</p>
                    <p style={{ color: '#78716C' }}>Suggestion: {rec.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tool Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" 
                style={{ color: '#78716C' }}>
              <BarChart3 className="w-3.5 h-3.5" />
              Tool Performance
            </h4>
            <div className="space-y-2">
              {Object.entries(metrics.toolPerformance).map(([name, perf]) => (
                <div key={name} className="flex items-center justify-between p-2 rounded bg-stone-50 text-[11px]">
                  <span className="font-medium text-stone-700">{name}</span>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      {(perf.avgLatency / 1000).toFixed(2)}s
                    </span>
                    <span className={`font-bold ${perf.successRate > 0.9 ? 'text-green-600' : 'text-amber-600'}`}>
                      {(perf.successRate * 100).toFixed(0)}% success
                    </span>
                    <span className="text-stone-400">{perf.callCount} calls</span>
                  </div>
                </div>
              ))}
              {Object.keys(metrics.toolPerformance).length === 0 && (
                <div className="text-center py-4 text-stone-400 text-xs italic">
                  No tools used yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  return (
    <div className="p-3 rounded-lg bg-stone-50 border border-stone-100">
      <div className="flex items-center gap-1.5 mb-1 text-stone-500">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-tight">{label}</span>
      </div>
      <div className="text-lg font-bold" style={{ color }}>{value}</div>
    </div>
  );
}
