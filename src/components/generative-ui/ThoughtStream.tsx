import React, { useState, useEffect } from 'react';
import { useMissionStore } from '@/stores/missionStore';
import { Brain, Sparkles, MessageSquare, Terminal } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const ThoughtStream: React.FC = () => {
  const { missions } = useMissionStore();
  const allThoughts = Object.values(missions)
    .flatMap(m => m.thoughts)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 50);

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-primary/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-widest font-mono">Neural Stream (Live)</h2>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-mono text-emerald-500/80">RECEIVING</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {allThoughts.map((thought, i) => (
            <div key={i} className="group relative pl-6 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-primary/20 hover:before:bg-primary transition-all">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                   <Badge variant="outline" className="text-[8px] h-4 rounded-none border-primary/20 bg-primary/5 font-mono text-primary px-1">
                     {thought.type.toUpperCase()}
                   </Badge>
                   <span className="text-[9px] font-mono text-muted-foreground opacity-50 uppercase">
                     Agent: {thought.agentId}
                   </span>
                </div>
                <span className="text-[8px] font-mono text-muted-foreground/30">
                  {new Date(thought.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors">
                {thought.content}
              </p>
              {thought.taskId && (
                <div className="mt-1 flex items-center gap-1 text-[9px] font-mono text-primary/40">
                  <Terminal className="w-2.5 h-2.5" />
                  TASK_REF_{thought.taskId.substring(0, 8)}
                </div>
              )}
            </div>
          ))}
          {allThoughts.length === 0 && (
            <div className="py-20 text-center space-y-4 opacity-30">
              <Sparkles className="w-10 h-10 mx-auto animate-pulse" />
              <p className="text-[10px] font-mono uppercase tracking-widest">Awaiting Neural Activity...</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-2 border-t border-white/5 bg-black/20">
         <div className="flex items-center justify-between text-[8px] font-mono text-muted-foreground/40 px-2 uppercase tracking-tighter">
           <span>Subscribed to agent:thoughts</span>
           <span>Latency: 12ms</span>
         </div>
      </div>
    </div>
  );
};
