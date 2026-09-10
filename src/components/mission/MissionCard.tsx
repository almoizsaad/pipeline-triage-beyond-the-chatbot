import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Mission, MissionPriority, MissionStatus } from '@/agent/types/mission';
import { Target, AlertCircle, CheckCircle2, Clock, Play, Pause, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MissionCardProps {
  mission: Mission;
  onClick?: (mission: Mission) => void;
  className?: string;
}

const priorityColors: Record<MissionPriority, string> = {
  low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse',
};

const statusIcons: Record<MissionStatus, React.ReactNode> = {
  idle: <Clock className="w-4 h-4" />,
  running: <Play className="w-4 h-4 text-green-500 animate-pulse" />,
  paused: <Pause className="w-4 h-4 text-yellow-500" />,
  completed: <CheckCircle2 className="w-4 h-4 text-blue-500" />,
  failed: <AlertCircle className="w-4 h-4 text-red-500" />,
  cancelled: <Square className="w-4 h-4 text-gray-500" />,
};

export const MissionCard: React.FC<MissionCardProps> = ({ mission, onClick, className }) => {
  const completedTasks = mission.plans.reduce(
    (acc, plan) => acc + plan.tasks.filter((t) => t.status === 'completed').length,
    0
  );
  const totalTasks = mission.plans.reduce((acc, plan) => acc + plan.tasks.length, 0);
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Card 
      className={cn(
        "group relative cursor-pointer transition-all duration-500 hover:shadow-lg hover:border-primary/50 bg-background/50 backdrop-blur-sm border-white/5 overflow-hidden",
        mission.status === 'running' && "ring-1 ring-primary/30 border-primary/20",
        className
      )}
      onClick={() => onClick?.(mission)}
    >
      {mission.status === 'running' && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/10">
          <div className="h-full bg-primary animate-progress-glow" style={{ width: `${progress}%` }} />
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start mb-2">
          <Badge className={cn("text-[9px] uppercase tracking-wider font-bold h-4 px-1 rounded-none border-none", priorityColors[mission.goal.priority])}>
            {mission.goal.priority}
          </Badge>
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            {mission.status === 'running' ? (
               <div className="flex items-center gap-1.5 text-emerald-500">
                 <Loader2 className="w-2.5 h-2.5 animate-spin" />
                 <span className="uppercase animate-pulse">Running</span>
               </div>
            ) : (
              <div className="flex items-center gap-1.5 text-muted-foreground uppercase">
                {statusIcons[mission.status]}
                <span>{mission.status}</span>
              </div>
            )}
          </div>
        </div>
        <CardTitle className="text-base font-bold leading-tight group-hover:text-primary transition-colors line-clamp-1">
          {mission.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 pb-4">
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
            <span>Operational Integrity</span>
            <span className="text-primary font-bold">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1 bg-white/5" />
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 flex items-center justify-between text-[9px] text-muted-foreground/60 font-mono uppercase tracking-tighter">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Target className="w-3 h-3 text-primary/50" />
            {mission.runningAgents.length} Agents
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            {new Date(mission.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="flex -space-x-1.5">
            {mission.runningAgents.slice(0, 3).map((agent, i) => (
              <div key={i} className="w-4 h-4 rounded-full bg-primary/20 border border-background flex items-center justify-center text-[7px] font-bold text-primary">
                {agent.name[0]}
              </div>
            ))}
        </div>
      </CardFooter>
    </Card>
  );
};
