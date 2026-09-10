import React from 'react';
import { useWorkspaceStore } from '@/workspace/state/workspaceStore';
import { globalComponentRegistry } from '@/registry/ComponentRegistry';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export const CollaborativeCanvas: React.FC = () => {
  const { components } = useWorkspaceStore();

  return (
    <div className="flex-1 overflow-auto p-8 bg-black/20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
        {components.map((comp) => {
          const entry = globalComponentRegistry.resolve(comp.type);
          
          return (
            <Card key={comp.id} className="relative group overflow-hidden border-white/5 bg-white/5 backdrop-blur-sm hover:border-primary/50 transition-all duration-300">
               <div className="p-2 border-b border-white/5 flex items-center justify-between bg-white/5">
                 <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                   {comp.type}
                 </span>
                 <Badge variant="outline" className="text-[8px] h-4 uppercase px-1 border-white/10 bg-black/20">
                   {comp.status}
                 </Badge>
               </div>
               
               <div className="p-4 min-h-[100px]">
                 {comp.status === 'loading' ? (
                   <div className="space-y-2">
                     <Skeleton className="h-4 w-3/4 bg-white/5" />
                     <Skeleton className="h-20 w-full bg-white/5" />
                   </div>
                 ) : entry ? (
                   <entry.component id={comp.id} data={comp.props} />
                 ) : (
                   <div className="flex flex-col items-center justify-center h-24 text-muted-foreground space-y-2">
                     <span className="text-[10px] font-mono uppercase">Inert Process</span>
                     <span className="text-[8px] opacity-50">{comp.type}</span>
                   </div>
                 )}
               </div>

               {!!comp.metadata?.source && (
                 <div className="px-4 py-2 border-t border-white/5 bg-black/20">
                   <span className="text-[8px] font-mono text-muted-foreground uppercase">
                     Source: {comp.metadata.source as string}
                   </span>
                 </div>
               )}
               
               <div className="absolute inset-0 border-2 border-primary opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
            </Card>
          );
        })}

        {components.length === 0 && (
          <div className="col-span-full py-40 flex flex-col items-center justify-center space-y-4 text-muted-foreground/30">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-current flex items-center justify-center">
              <span className="text-4xl">+</span>
            </div>
            <p className="font-mono text-xs uppercase tracking-[0.3em]">Workspace Empty - Awaiting Commands</p>
          </div>
        )}
      </div>
    </div>
  );
};
