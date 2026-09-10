import React from 'react';
import type { Mission, MissionPriority } from '@/agent/types/mission';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Target, Shield, Clock, Brain, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MissionSummaryProps {
  mission: Mission;
}

const priorityColors: Record<MissionPriority, string> = {
  low: 'text-blue-500 border-blue-500/20',
  medium: 'text-yellow-500 border-yellow-500/20',
  high: 'text-orange-500 border-orange-500/20',
  critical: 'text-red-500 border-red-500/20',
};

export const MissionSummary: React.FC<MissionSummaryProps> = ({ mission }) => {
  const formattedDate = React.useMemo(() => {
    return new Date(mission.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [mission.createdAt]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">{mission.title}</h2>
            <Badge variant="outline" className={cn("text-[10px] uppercase font-mono", priorityColors[mission.goal.priority])}>
              {mission.goal.priority} PRIORITY
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {mission.goal.description}
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] mb-1">Status</div>
          <Badge className="capitalize font-mono text-xs">{mission.status}</Badge>
        </div>
      </div>

      {mission.outcome && (
        <Card className="p-4 bg-primary/5 border-primary/20 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-tight">
            <CheckCircle2 className="w-4 h-4" />
            Mission Outcome
          </div>
          <p className="text-sm leading-relaxed">
            {mission.outcome.summary}
          </p>
          {mission.outcome.deliverables.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {mission.outcome.deliverables.map((d, i) => (
                <Badge key={i} variant="outline" className="text-[9px] font-mono bg-background/50">
                  DELIVERABLE: {d}
                </Badge>
              ))}
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
          <div className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1.5">
            <Target className="w-3 h-3" />
            Success Criteria
          </div>
          <div className="text-xs font-medium">{mission.goal.successCriteria.length} Points</div>
        </div>
        <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
          <div className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1.5">
            <Shield className="w-3 h-3" />
            Constraints
          </div>
          <div className="text-xs font-medium">{mission.constraints.length} Active</div>
        </div>
        <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
          <div className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1.5">
            <Brain className="w-3 h-3" />
            Active Agents
          </div>
          <div className="text-xs font-medium">{mission.runningAgents.length} Units</div>
        </div>
        <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
          <div className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Started At
          </div>
          <div className="text-xs font-medium">
            Started at {formattedDate}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {mission.goal.successCriteria.map((item, i) => (
          <Badge key={i} variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] py-0.5">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
};

const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);
