import { useEffect } from 'react';
import { useSystemStore } from '@/stores/systemStore';
import { agent } from '@/agent/bootstrap/createAgent';
import { AgentEventType } from '@/agent/types/agent';

export function useSystemTelemetry() {
  const { updateTelemetry, upsertAgent, removeAgent, updateAgentStatus } = useSystemStore();

  useEffect(() => {
    // 1. Subscribe to system telemetry (API metrics, health, etc.)
    const unsubscribeTelemetry = agent.eventBus.subscribe('system:telemetry', (event: any) => {
      if (event.type === 'API_METRIC') {
        const metric = event.payload;
        updateTelemetry({
          totalMessages: useSystemStore.getState().telemetry.totalMessages + 1,
          lastMessageTimestamp: Date.now()
        });
      }
    });

    // 2. Subscribe to agent events (lifecycle)
    const unsubscribeAgents = agent.eventBus.subscribe('agent:events', (event: any) => {
      if (event.type === AgentEventType.AGENT_STARTED) {
        const { identity } = event.payload;
        upsertAgent({
          id: identity.id,
          name: identity.name,
          role: identity.role,
          status: 'started',
          latency: 0,
          tasksCompleted: 0,
          cpuTime: 0
        });
      } else if (event.type === AgentEventType.AGENT_STOPPED) {
        const { agentId } = event.payload;
        removeAgent(agentId);
      } else if (event.type === AgentEventType.AGENT_STATUS_CHANGED) {
        const { agentId, status } = event.payload;
        updateAgentStatus(agentId, status);
      }
    });

    // 3. Periodic Simulation of load metrics (since we don't have real OS-level access in browser)
    const interval = setInterval(() => {
      updateTelemetry({
        cpuUsage: 10 + Math.random() * 20,
        memoryUsage: 250 + Math.random() * 100,
        tokensPerSec: Math.random() * 50,
        activeThreads: Object.keys(useSystemStore.getState().agents).length + 1,
        uptime: 100
      });
    }, 2000);

    return () => {
      unsubscribeTelemetry();
      unsubscribeAgents();
      clearInterval(interval);
    };
  }, []);
}
