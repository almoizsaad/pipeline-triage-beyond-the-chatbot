import React, { useState } from 'react';
import type { Mission } from '@/agent/types/mission';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Loader2, AlertCircle, Terminal, ChevronRight, ChevronDown, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MissionProgressProps {
  mission: Mission;
}

export const MissionProgress: React.FC<MissionProgressProps> = ({ mission }) => {
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  const toggleTask = (id: string) => {
    setExpandedTasks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-8">
      {mission.plans.map((plan, planIdx) => (
        <section key={plan.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center text-[8px] text-primary">
                {planIdx + 1}
              </span>
              Operational Plan: {plan.goal}
            </h3>
            <Badge variant="outline" className="text-[10px] font-mono">
              {plan.tasks.filter(t => t.status === 'completed').length} / {plan.tasks.length}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {plan.tasks.map((task) => {
              const resultEntry = mission.timeline.find(e => e.type === 'knowledge' && (e.data as any)?.taskId === task.id);
              const isExpanded = !!expandedTasks[task.id];

              return (
                <Card key={task.id} className={cn(
                  "bg-white/5 border-white/5 transition-all duration-300 overflow-hidden cursor-pointer hover:border-white/10",
                  task.status === 'running' && "border-primary/50 shadow-lg shadow-primary/10"
                )} onClick={() => toggleTask(task.id)}>
                  <div className="p-4 flex items-start gap-3">
                    <div className="mt-0.5">
                      {task.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                      {task.status === 'running' && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                      {task.status === 'pending' && <Circle className="w-4 h-4 text-muted-foreground/30" />}
                      {task.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-500" />}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-sm font-medium",
                          task.status === 'completed' && "text-muted-foreground line-through decoration-primary/30"
                        )}>
                          {task.description}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase text-muted-foreground">
                            {task.status}
                          </span>
                          {isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                        </div>
                      </div>

                      {task.status === 'running' && (
                        <div className="space-y-1">
                          <Progress value={0} className="h-0.5" />
                          <div className="text-[8px] font-mono text-primary/70 animate-pulse uppercase">
                            AGENT_EXECUTING_TASK_ID_{task.id.substring(0, 8)} • TOOL: {task.tool}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-white/5 bg-black/20 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="pt-4 space-y-3">
                         <div className="space-y-1">
                           <div className="text-[9px] font-mono text-muted-foreground uppercase flex items-center gap-1">
                             <Package className="w-2.5 h-2.5" />
                             Tool Configuration
                           </div>
                           <pre className="p-2 rounded bg-black/40 text-[10px] font-mono text-primary/60 border border-white/5">
                             {JSON.stringify({ tool: task.tool, metadata: task.metadata }, null, 2)}
                           </pre>
                         </div>

                         {resultEntry && (
                            <div className="space-y-1">
                              <div className="text-[9px] font-mono text-blue-500 uppercase flex items-center gap-1">
                                <Terminal className="w-2.5 h-2.5" />
                                Execution Result
                              </div>
                              <pre className="p-2 rounded bg-blue-500/5 text-[10px] font-mono text-blue-400/80 border border-blue-500/10 overflow-x-auto">
                                {JSON.stringify(resultEntry.data, null, 2)}
                              </pre>
                            </div>
                         )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      ))}

      {mission.plans.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
          <div className="text-[10px] font-mono uppercase tracking-[0.2em]">
            Formulating Operational Plan...
          </div>
        </div>
      )}
    </div>
  );
};
