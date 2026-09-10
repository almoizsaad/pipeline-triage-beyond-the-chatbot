import React from 'react';
import { 
  Activity, 
  Cpu, 
  Database, 
  Shield, 
  Zap, 
  Users,
  HardDrive,
  Globe
} from 'lucide-react';
import { useSystemStore } from '@/stores/systemStore';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export const RuntimeHealth: React.FC = () => {
  const { telemetry, agents } = useSystemStore();
  const agentList = Object.values(agents);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-widest">Kernel Runtime Health</h2>
        </div>
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-mono text-[10px]">
          SYSTEM_ONLINE_v1.0.4
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <HealthCard 
          icon={<Cpu className="w-4 h-4" />}
          label="Process Load"
          value={`${telemetry.cpuUsage.toFixed(1)}%`}
          progress={telemetry.cpuUsage}
        />
        <HealthCard 
          icon={<HardDrive className="w-4 h-4" />}
          label="Neural Memory"
          value={`${telemetry.memoryUsage.toFixed(1)}MB`}
          progress={Math.min(100, (telemetry.memoryUsage / 1024) * 100)}
        />
        <HealthCard 
          icon={<Zap className="w-4 h-4" />}
          label="Throughput"
          value={`${telemetry.tokensPerSec.toFixed(1)} t/s`}
          progress={Math.min(100, (telemetry.tokensPerSec / 100) * 100)}
        />
        <HealthCard 
          icon={<Users className="w-4 h-4" />}
          label="Active Agents"
          value={agentList.length.toString()}
          progress={Math.min(100, (agentList.length / 10) * 100)}
        />
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          <Activity className="w-3 h-3" />
          Active Workforce Distribution
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {agentList.map(agent => (
            <div key={agent.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                  {agent.role === 'coordinator' ? <Globe className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-xs font-bold">{agent.name}</div>
                  <div className="text-[10px] font-mono text-muted-foreground uppercase">{agent.role} • {agent.status}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono text-primary">{agent.latency}ms</div>
                <div className="text-[9px] text-muted-foreground uppercase">{agent.tasksCompleted} tasks</div>
              </div>
            </div>
          ))}
          {agentList.length === 0 && (
            <div className="col-span-full py-10 text-center text-[10px] font-mono text-muted-foreground opacity-30 border border-dashed border-white/10 rounded-xl">
              No autonomous agents currently registered
            </div>
          )}
        </div>
      </section>

      <section className="p-4 rounded-xl bg-primary/5 border border-primary/10">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[10px] font-mono text-primary uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-3 h-3" />
            System Events
          </div>
          <div className="text-[9px] font-mono text-primary/50">
            LAST_MSG: {new Date(telemetry.lastMessageTimestamp).toLocaleTimeString()}
          </div>
        </div>
        <div className="space-y-2">
           <div className="flex items-center justify-between text-[10px]">
             <span className="text-muted-foreground font-mono">Total Packets Processed:</span>
             <span className="font-bold">{telemetry.totalMessages}</span>
           </div>
           <div className="flex items-center justify-between text-[10px]">
             <span className="text-muted-foreground font-mono">Active Event Subscribers:</span>
             <span className="font-bold">{telemetry.activeSubscribers}</span>
           </div>
           <div className="flex items-center justify-between text-[10px]">
             <span className="text-muted-foreground font-mono">Kernel Uptime:</span>
             <span className="font-bold">{telemetry.uptime}%</span>
           </div>
        </div>
      </section>
    </div>
  );
};

function HealthCard({ icon, label, value, progress }: { icon: React.ReactNode, label: string, value: string, progress: number }) {
  return (
    <Card className="p-4 bg-white/5 border-white/5">
      <div className="flex items-center gap-2 mb-3 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-mono uppercase tracking-tight">{label}</span>
      </div>
      <div className="text-lg font-bold mb-2">{value}</div>
      <Progress value={progress} className="h-1" />
    </Card>
  );
}
