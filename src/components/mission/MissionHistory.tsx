import React from 'react';
import type { Mission, MissionTimelineEntry } from '@/agent/types/mission';
import { Brain, Zap, Search, Shield, Save, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

interface MissionHistoryProps {
  mission: Mission;
}

const entryIcons: Record<MissionTimelineEntry['type'], React.ReactNode> = {
  thought: <Brain className="w-3 h-3 text-purple-500" />,
  action: <Zap className="w-3 h-3 text-yellow-500" />,
  reflection: <Shield className="w-3 h-3 text-blue-500" />,
  memory: <Save className="w-3 h-3 text-emerald-500" />,
  knowledge: <BookOpen className="w-3 h-3 text-amber-500" />,
  event: <Search className="w-3 h-3 text-muted-foreground" />,
};

export const MissionHistory: React.FC<MissionHistoryProps> = ({ mission }) => {
  return (
    <div className="relative space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-white/5">
      {mission.timeline.map((entry, i) => (
        <div key={entry.id || i} className="relative pl-10 group">
          <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-background border border-white/10 flex items-center justify-center z-10 group-hover:border-primary/50 transition-colors">
            {entryIcons[entry.type]}
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {entry.type}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground/50">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
            </div>
            
            <h4 className="text-sm font-bold group-hover:text-primary transition-colors">
              {entry.title}
            </h4>
            
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              {entry.description}
            </p>
            
            {!!entry.data && (
              <div className="mt-2 p-2 rounded bg-white/5 border border-white/5 font-mono text-[10px] overflow-hidden truncate">
                {JSON.stringify(entry.data)}
              </div>
            )}
          </div>
        </div>
      ))}
      
      {mission.status === 'completed' && (
        <div className="relative pl-10">
          <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center z-10">
            <CheckCircle2 className="w-3 h-3 text-blue-500" />
          </div>
          <div className="text-sm font-bold text-blue-500">Mission Accomplished</div>
        </div>
      )}

      {mission.status === 'failed' && (
        <div className="relative pl-10">
          <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center z-10">
            <AlertCircle className="w-3 h-3 text-red-500" />
          </div>
          <div className="text-sm font-bold text-red-500">Mission Terminated</div>
        </div>
      )}
    </div>
  );
};
