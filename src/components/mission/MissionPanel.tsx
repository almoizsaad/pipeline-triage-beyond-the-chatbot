import React from 'react';
import type { Mission } from '@/agent/types/mission';
import { MissionProgress } from './MissionProgress';
import { MissionHistory } from './MissionHistory';
import { MissionSummary } from './MissionSummary';
import { ReflectionPanel } from './ReflectionPanel';
import { KnowledgeExplorer } from './KnowledgeExplorer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Activity, History, Network, Shield, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import SystemMetrics from '../generative-ui/SystemMetrics';
import { useAgent } from '@/hooks/useAgent';

interface MissionPanelProps {
  mission: Mission;
  className?: string;
}

export const MissionPanel: React.FC<MissionPanelProps> = ({ mission, className }) => {
  const { metrics, recommendations } = useAgent();
  const thoughtsByType = mission.thoughts.reduce((acc, thought) => {
    if (!acc[thought.type]) acc[thought.type] = [];
    acc[thought.type].push(thought);
    return acc;
  }, {} as Record<string, typeof mission.thoughts>);

  return (
    <div className={`flex flex-col h-full bg-background/30 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden min-h-0 ${className}`}>
      <div className="p-6 border-b border-white/5 bg-gradient-to-br from-primary/5 to-transparent shrink-0">
        <MissionSummary mission={mission} />
      </div>

      <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
        <div className="px-6 border-b border-white/5 shrink-0">
          <TabsList className="bg-transparent border-none gap-6 h-12 overflow-x-auto no-scrollbar flex-nowrap">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 gap-2 font-mono text-xs uppercase tracking-widest"
            >
              <Activity className="w-3 h-3" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="results" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 gap-2 font-mono text-xs uppercase tracking-widest"
            >
              <Zap className="w-3 h-3" />
              Results
            </TabsTrigger>
            <TabsTrigger 
              value="timeline" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 gap-2 font-mono text-xs uppercase tracking-widest"
            >
              <History className="w-3 h-3" />
              Trace
            </TabsTrigger>
            <TabsTrigger 
              value="thoughts" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 gap-2 font-mono text-xs uppercase tracking-widest"
            >
              <Brain className="w-3 h-3" />
              Reasoning
            </TabsTrigger>
            <TabsTrigger 
              value="reflections" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 gap-2 font-mono text-xs uppercase tracking-widest"
            >
              <Shield className="w-3 h-3" />
              Reflections
            </TabsTrigger>
            <TabsTrigger 
              value="knowledge" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 gap-2 font-mono text-xs uppercase tracking-widest"
            >
              <Network className="w-3 h-3" />
              Cognitive
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden min-h-0">
          <TabsContent value="overview" className="h-full m-0 outline-none">
            <ScrollArea className="h-full p-6">
              <div className="space-y-6">
                <SystemMetrics metrics={metrics} recommendations={recommendations} />
                <MissionProgress mission={mission} />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="results" className="h-full m-0 outline-none">
            <ScrollArea className="h-full p-6 space-y-6">
              {[
                ...mission.timeline.filter(e => e.type === 'knowledge'),
                ...mission.knowledgeUpdates.map(u => ({ ...u, type: 'knowledge', title: u.summary, description: `Cognitive discovery of type ${u.type}`, data: null }))
              ].map((entry, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      {entry.title}
                    </h4>
                    <span className="text-[10px] font-mono text-muted-foreground opacity-50">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    {entry.description}
                  </div>
                  {!!entry.data && (
                    <pre className="p-3 rounded bg-black/40 text-[10px] font-mono text-primary/80 overflow-x-auto border border-white/5">
                      {JSON.stringify(entry.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
              {mission.timeline.filter(e => e.type === 'knowledge').length === 0 && mission.knowledgeUpdates.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-30">
                  <Zap className="w-12 h-12" />
                  <p className="text-xs font-mono uppercase tracking-widest">No deliverables identified yet.</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="timeline" className="h-full m-0 outline-none">
            <ScrollArea className="h-full p-6">
              <MissionHistory mission={mission} />
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="thoughts" className="h-full m-0 outline-none">
            <ScrollArea className="h-full p-6 space-y-8">
              {Object.entries(thoughtsByType).map(([type, thoughts]) => (
                <section key={type} className="space-y-4">
                  <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {type}
                  </h3>
                  <div className="space-y-3">
                    {thoughts.map((thought, i) => (
                      <div key={i} className="group relative p-4 rounded-lg bg-white/5 border border-white/5 hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-mono text-muted-foreground opacity-50">
                            {new Date(thought.timestamp).toLocaleTimeString()}
                          </span>
                          {thought.taskId && (
                            <Badge variant="outline" className="text-[8px] h-4 rounded-none border-white/10 font-mono">
                              TASK: {thought.taskId.slice(0, 8)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors">
                          {thought.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
              {mission.thoughts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-30">
                  <Brain className="w-12 h-12" />
                  <p className="text-xs font-mono uppercase tracking-widest">Awaiting Runtime Reasoning...</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="reflections" className="h-full m-0 outline-none">
            <ScrollArea className="h-full p-6">
              <ReflectionPanel reflections={mission.reflections} />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="knowledge" className="h-full m-0 outline-none">
            <div className="h-full p-6">
              <KnowledgeExplorer mission={mission} />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
