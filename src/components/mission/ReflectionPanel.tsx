import React from 'react';
import type { ReflectionResult } from '@/agent/types/reflection';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  AlertCircle, 
  Lightbulb, 
  ArrowUpCircle, 
  History,
  TrendingUp,
  Brain
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ReflectionPanelProps {
  reflections: ReflectionResult[];
}

export const ReflectionPanel: React.FC<ReflectionPanelProps> = ({ reflections }) => {
  if (reflections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 opacity-50">
        <Brain className="w-12 h-12 text-muted-foreground/20" />
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          No reflections generated yet
        </p>
      </div>
    );
  }

  const latestReflection = reflections[reflections.length - 1];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Latest Analysis */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <TrendingUp className="w-3 h-3 text-primary" />
          Latest Performance Analysis
        </h3>
        
        <Card className="p-6 bg-white/5 border-white/5 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4">
            {latestReflection.success ? (
              <CheckCircle2 className="w-8 h-8 text-green-500/20" />
            ) : (
              <AlertCircle className="w-8 h-8 text-red-500/20" />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold uppercase tracking-tight">Execution Confidence</span>
                  <span className="text-2xl font-black tabular-nums">
                    {latestReflection.confidenceScore.toFixed(0)}%
                  </span>
                </div>
                <Progress value={latestReflection.confidenceScore} className="h-2 bg-white/5" />
              </div>

              <div className="flex gap-4">
                <Badge variant={latestReflection.success ? "default" : "destructive"} className="rounded-none font-mono text-[10px] uppercase">
                  {latestReflection.success ? 'Optimal' : 'Sub-Optimal'}
                </Badge>
                <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                  <History className="w-3 h-3" />
                  {new Date(latestReflection.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                <div className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Total Tasks</div>
                <div className="text-xl font-bold">{(latestReflection.metadata?.totalTasks as number) || 0}</div>
              </div>
              <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                <div className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Duration</div>
                <div className="text-xl font-bold">
                  {((latestReflection.metadata?.duration as number || 0) / 1000).toFixed(1)}s
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className="space-y-4">
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Lightbulb className="w-3 h-3 text-amber-500" />
            Lessons Learned
          </h3>
          <div className="space-y-2">
            {latestReflection.lessonsLearned.map((lesson, i) => (
              <div key={i} className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-xs text-amber-200/70 leading-relaxed">
                {lesson}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <AlertCircle className="w-3 h-3 text-red-500" />
            Identified Mistakes
          </h3>
          <div className="space-y-2">
            {latestReflection.mistakes.map((mistake, i) => (
              <div key={i} className="p-3 rounded-lg bg-red-500/5 border border-red-500/10 text-xs text-red-200/70 leading-relaxed">
                {mistake}
              </div>
            ))}
            {latestReflection.mistakes.length === 0 && (
              <div className="text-[10px] font-mono text-muted-foreground/30 italic">No critical mistakes detected</div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <ArrowUpCircle className="w-3 h-3 text-blue-500" />
            Self-Improvements
          </h3>
          <div className="space-y-2">
            {latestReflection.improvements.map((improvement, i) => (
              <div key={i} className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 text-xs text-blue-200/70 leading-relaxed">
                {improvement}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* History Timeline */}
      <section className="pt-8 border-t border-white/5">
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-6">Reflection History</h3>
        <div className="space-y-3">
          {reflections.slice(0, -1).reverse().map((reflection, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-1.5 h-1.5 rounded-full ${reflection.success ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs font-medium">Confidence: {reflection.confidenceScore.toFixed(0)}%</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground opacity-50">
                {new Date(reflection.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
