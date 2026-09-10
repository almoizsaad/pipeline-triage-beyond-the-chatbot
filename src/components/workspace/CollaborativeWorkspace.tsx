import React, { useState } from 'react';
import { CollaborativeCanvas } from './CollaborativeCanvas';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Command, Users, Zap, Layout, Settings, Layers, Clock } from 'lucide-react';
import { agent } from '@/agent/bootstrap/createAgent';
import ParticleCanvas from '../generative-ui/ParticleCanvas';
import { useSystemStore } from '@/stores/systemStore';

export const CollaborativeWorkspace: React.FC = () => {
  const [command, setCommand] = useState('');
  const telemetry = useSystemStore(state => state.telemetry);
  const agentsCount = useSystemStore(state => Object.keys(state.agents).length);

  const handleSendCommand = async () => {
    if (!command.trim()) return;
    
    await agent.executiveBrain.createMission(command, {
      description: command,
      successCriteria: ['Task completed as requested'],
      priority: 'medium'
    });
    
    setCommand('');
  };

  return (
    <div className="relative flex flex-col h-screen w-full bg-background overflow-hidden text-foreground">
      {/* Ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <ParticleCanvas />
      </div>

      <header className="h-16 px-6 border-b border-white/5 flex items-center justify-between bg-background/50 backdrop-blur-2xl z-30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap className="w-6 h-6 text-primary-foreground fill-current" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter leading-none">NEXUS OS</h1>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Kernel v2.4.0-STABLE</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
            <Clock className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Uptime: {telemetry.uptime}% Stable</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
            <Users className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Collaborators: {agentsCount} Active Agents</span>
          </div>
          <div className="flex items-center gap-2 border-l border-white/10 pl-4">
            <Button size="icon" variant="ghost" className="rounded-xl w-10 h-10 border border-white/5">
              <Layout className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button size="icon" variant="ghost" className="rounded-xl w-10 h-10 border border-white/5">
              <Layers className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button size="icon" variant="ghost" className="rounded-xl w-10 h-10 border border-white/5">
              <Settings className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-20 flex flex-col overflow-hidden">
        <CollaborativeCanvas />
      </main>

      <footer className="p-8 border-t border-white/5 bg-background/80 backdrop-blur-3xl z-30">
        <div className="max-w-4xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-purple-500/50 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
          <div className="relative">
            <Input 
              placeholder="Input system command or mission objective..."
              className="h-16 pl-14 pr-32 bg-background border-white/10 rounded-2xl text-lg font-mono focus-visible:ring-primary/50 shadow-2xl transition-all"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendCommand()}
            />
            <Command className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            <Button 
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-11 rounded-xl px-8 font-bold tracking-tight shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              onClick={handleSendCommand}
            >
              <Send className="w-4 h-4 mr-2" />
              EXECUTE
            </Button>
          </div>
        </div>
        <p className="mt-4 text-center text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] opacity-50">
          Awaiting Neural Input for Mission Synthesis
        </p>
      </footer>
    </div>
  );
};
