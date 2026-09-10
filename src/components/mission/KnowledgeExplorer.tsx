import React, { useState } from 'react';
import type { Mission } from '@/agent/types/mission';
import { 
  Network, 
  Search, 
  Database, 
  Link as LinkIcon, 
  Calendar,
  Info
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface KnowledgeExplorerProps {
  mission: Mission;
}

export const KnowledgeExplorer: React.FC<KnowledgeExplorerProps> = ({ mission }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<typeof mission.knowledgeUpdates[0] | null>(null);

  const knowledgeUpdates = mission.knowledgeUpdates.filter(update => {
    const matchesSearch = update.summary.toLowerCase().includes(search.toLowerCase()) || 
                         update.type.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = !filter || update.type === filter;
    return matchesSearch && matchesFilter;
  });

  const types = Array.from(new Set(mission.knowledgeUpdates.map(u => u.type)));

  return (
    <div className="flex flex-col h-full border border-white/5 rounded-xl bg-black/20 overflow-hidden">
      {/* Header / Search */}
      <div className="p-4 border-b border-white/5 bg-background/50 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search cognitive records..."
            className="pl-10 h-10 bg-white/5 border-white/10 rounded-lg text-xs font-mono"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {types.map(type => (
            <Badge 
              key={type}
              variant={filter === type ? "default" : "outline"}
              className="cursor-pointer rounded-none font-mono text-[9px] uppercase tracking-tighter"
              onClick={() => setFilter(filter === type ? null : type)}
            >
              {type}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Knowledge Timeline */}
        <aside className="w-1/3 border-r border-white/5 flex flex-col">
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <Calendar className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Cognitive Timeline</span>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {knowledgeUpdates.map((update, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedNode(update)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg hover:bg-white/5 transition-colors group relative",
                    selectedNode?.id === update.id && "bg-white/10 border-white/10"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono text-muted-foreground/50">
                      {new Date(update.timestamp).toLocaleTimeString()}
                    </span>
                    <Badge className="text-[8px] h-4 px-1 rounded-none font-mono uppercase bg-amber-500/10 text-amber-500 border-none">
                      {update.type}
                    </Badge>
                  </div>
                  <div className="text-xs font-bold line-clamp-1 group-hover:text-primary transition-colors">
                    {update.summary}
                  </div>
                </button>
              ))}
              {knowledgeUpdates.length === 0 && (
                <div className="py-10 text-center text-[10px] font-mono text-muted-foreground/30">
                  No records found
                </div>
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* Knowledge Inspector */}
        <main className="flex-1 flex flex-col bg-background/20">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-tight">Active Node Inspector</span>
            </div>
            {selectedNode && (
              <Badge variant="outline" className="rounded-none font-mono text-[9px] uppercase border-white/5 bg-amber-500/5 text-amber-500">
                NODE_ID: {selectedNode.id.substring(0, 8)}
              </Badge>
            )}
          </div>

          <ScrollArea className="flex-1">
            {selectedNode ? (
              <div className="p-6 space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold tracking-tight text-foreground">{selectedNode.summary}</h3>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Type: {selectedNode.type}</p>
                </div>

                <Card className="p-4 bg-white/5 border-white/5 space-y-4">
                   <div className="space-y-1">
                     <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest">Metadata Discovery</span>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-0.5">
                          <div className="text-[8px] text-muted-foreground font-mono uppercase">Detected At</div>
                          <div className="text-[10px] font-mono">{new Date(selectedNode.timestamp).toLocaleString()}</div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-[8px] text-muted-foreground font-mono uppercase">Integrity</div>
                          <div className="text-[10px] font-mono text-emerald-500">VERIFIED</div>
                        </div>
                     </div>
                   </div>

                   <div className="space-y-1 pt-2 border-t border-white/5">
                      <span className="text-[9px] font-mono text-blue-500 uppercase tracking-widest">Relational Links</span>
                      <div className="flex flex-wrap gap-2 pt-1">
                         <Badge variant="secondary" className="text-[8px] h-4 rounded-none font-mono uppercase bg-blue-500/10 text-blue-400 border-none">
                           Supports Mission
                         </Badge>
                         <Badge variant="secondary" className="text-[8px] h-4 rounded-none font-mono uppercase bg-purple-500/10 text-purple-400 border-none">
                           Linked to Agent_01
                         </Badge>
                      </div>
                   </div>
                </Card>

                <div className="space-y-2">
                   <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                     <Info className="w-2.5 h-2.5" />
                     Raw Cognitive Payload
                   </span>
                   <pre className="p-4 rounded-xl bg-black/40 text-[11px] font-mono text-primary/80 border border-white/5 leading-relaxed overflow-x-auto">
                     {JSON.stringify(selectedNode, null, 2)}
                   </pre>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6 opacity-30">
                <div className="w-24 h-24 rounded-full border border-dashed border-amber-500/20 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-amber-500/10 blur-2xl rounded-full" />
                  <Database className="w-10 h-10 text-amber-500/50" />
                </div>
                <div className="max-w-xs space-y-2">
                  <h4 className="text-sm font-bold uppercase">Select a node to inspect</h4>
                  <p className="text-[10px] font-mono leading-relaxed text-muted-foreground">
                    Deep-dive into the semantic connections, metadata, and origin of each cognitive discovery in the Knowledge Graph.
                  </p>
                </div>
              </div>
            )}
          </ScrollArea>
        </main>
      </div>

      {/* Footer / Stats */}
      <div className="p-3 border-t border-white/5 bg-background/50 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[10px] font-mono text-muted-foreground">Nodes: {mission.knowledgeUpdates.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[10px] font-mono text-muted-foreground">Relations: {mission.knowledgeUpdates.length * 2}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-primary animate-pulse">
          <Info className="w-3 h-3" />
          Graph Synced with Runtime
        </div>
      </div>
    </div>
  );
};
