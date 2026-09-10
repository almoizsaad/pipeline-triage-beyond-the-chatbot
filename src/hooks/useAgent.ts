import { useState, useEffect, useCallback } from 'react';
import { agent } from '../agent/bootstrap/createAgent';
import { AgentActionType } from '../agent/types/agent';
import type { AgentStatus, Plan, AgentProtocolAction } from '../agent/types/agent';
import type { SystemMetrics, OptimizationRecommendation } from '../agent/types/improvement';

export function useAgent() {
  const [status, setStatus] = useState<AgentStatus>(agent.runtime.getStatus());
  const [currentPlan, setCurrentPlan] = useState<Plan | undefined>(agent.runtime.getCurrentPlan());
  const [history, setHistory] = useState<AgentProtocolAction[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(agent.runtime.getMetrics());
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>(agent.runtime.getRecommendations());

  useEffect(() => {
    // Subscribe to status and plan updates via agent:actions
    const unsubscribeActions = agent.eventBus.subscribe<AgentProtocolAction>('agent:actions', (action: AgentProtocolAction) => {
      if (action.type === AgentActionType.AGENT_UPDATE) {
        setStatus(action.payload.status as AgentStatus);
        setMetrics(agent.runtime.getMetrics());
        setRecommendations(agent.runtime.getRecommendations());
      } else if (action.type === AgentActionType.UPDATE_PLAN) {
        setCurrentPlan(agent.runtime.getCurrentPlan());
      }
      
      setHistory((prev) => [...prev, action].slice(-50));
    });

    return () => {
      unsubscribeActions();
    };
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    await agent.executiveBrain.createMission(text, {
      description: text,
      successCriteria: ['Goal accomplished'],
      priority: 'medium'
    });
  }, []);

  return {
    status,
    currentPlan,
    history,
    metrics,
    recommendations,
    sendMessage,
  };
}
