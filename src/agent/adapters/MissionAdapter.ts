import { EventBus } from '../core/EventBus';
import { AgentEventType, SystemTelemetryType } from '../types/agent';
import type { AgentProtocolEvent, AgentLifecycleEvent } from '../types/agent';
import { useMissionStore } from '../../stores/missionStore';
import type { Mission } from '../types/mission';

/**
 * MissionAdapter synchronizes runtime mission events with the Zustand missionStore.
 */
export class MissionAdapter {
  private eventBus: EventBus;
  private unsubscribers: Array<() => void> = [];

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    // 1. Mission Lifecycle Events
    const unsubMissions = this.eventBus.subscribe<AgentProtocolEvent>('agent:events', (event) => {
      const missionStore = useMissionStore.getState();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload = event.payload as any;
      switch (event.type as string) {
        case AgentEventType.MISSION_CREATED:
          missionStore.addMission(payload.mission as Mission);
          missionStore.setActiveMission(payload.mission.id);
          break;

        case AgentEventType.MISSION_STATUS_UPDATED:
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          missionStore.updateMissionStatus(payload.missionId as string, payload.status as any);
          missionStore.addTimelineEntry(payload.missionId as string, {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            type: 'event',
            title: 'Mission Update',
            description: `Mission status updated to ${payload.status}`,
          });
          break;

        case AgentEventType.AGENT_UPDATE: {
          if (payload.missionId) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            missionStore.updateMissionStatus(payload.missionId as string, payload.status as any);
            
            if (payload.plan && payload.status === 'PLAN_STARTED') {
              missionStore.addPlan(payload.missionId as string, payload.plan);
            }

            // Add timeline entry for status change
            missionStore.addTimelineEntry(payload.missionId as string, {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: 'event',
              title: 'Status Update',
              description: `Mission status changed to ${payload.status}`,
            });
          }
          break;
        }

        case AgentEventType.REFLECTION: {
          // Find mission by workflowId if mapped
          // For now, let's assume missionId is workflowId for root missions
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          missionStore.addReflection(payload.workflowId as string, payload.reflection as any);
          break;
        }

        case AgentEventType.KNOWLEDGE_UPDATED: {
          const missionId = payload.workflowId || missionStore.activeMissionId;
          if (missionId) {
            missionStore.addKnowledgeUpdate(missionId, {
              id: crypto.randomUUID(),
              type: payload.type as string,
              summary: payload.summary as string,
              timestamp: Date.now()
            });
          }
          break;
        }
      }
    });
    this.unsubscribers.push(unsubMissions);

    // 1.1 Plan Updates
    const unsubPlan = this.eventBus.subscribe<any>('agent:actions', (action) => {
      const missionStore = useMissionStore.getState();
      if (action.type === 'UPDATE_PLAN') {
        const { planId, tasks } = action.payload;
        // Search all missions for this planId
        const missionId = Object.keys(missionStore.missions).find(id => 
          missionStore.missions[id].plans.some(p => p.id === planId)
        ) || (missionStore.activeMissionId === planId ? planId : null);

        if (missionId) {
          tasks.forEach((task: any) => {
            missionStore.updateTaskStatus(missionId, planId, task.id, task.status);
          });
        }
      } else if (action.type === 'AGENT_UPDATE') {
        const { status, message, data } = action.payload;
        const missionId = (data?.missionId as string) || (data?.planId as string) || missionStore.activeMissionId;

        if (missionId) {
          if (status === 'PLAN_STARTED' && data?.plan) {
            missionStore.addPlan(missionId, data.plan);
          }
          
          missionStore.updateMissionStatus(missionId, status as any);
          
          if (message) {
            missionStore.addTimelineEntry(missionId, {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: 'event',
              title: 'Agent Status',
              description: message,
              data
            });
          }
        }
      }
    });
    this.unsubscribers.push(unsubPlan);

    // 2. Thoughts
    const unsubThoughts = this.eventBus.subscribe<any>('agent:thoughts', (event) => {
      const missionStore = useMissionStore.getState();
      const { thought } = event.payload;
      const missionId = (thought.metadata?.missionId as string) || (thought.workflowId as string) || (thought as any).missionId || missionStore.activeMissionId;
      
      if (missionId) {
        missionStore.addThought(missionId, thought);
        missionStore.addTimelineEntry(missionId, {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type: 'thought',
          title: `Agent ${thought.type.charAt(0).toUpperCase() + thought.type.slice(1)}`,
          description: thought.content.slice(0, 100) + (thought.content.length > 100 ? '...' : ''),
          data: thought
        });
      }
    });
    this.unsubscribers.push(unsubThoughts);

    // 2. System Telemetry (Tasks)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsubTelemetry = this.eventBus.subscribe<any>('system:telemetry', (event) => {
      const missionStore = useMissionStore.getState();
      if (event.type === SystemTelemetryType.TASK_ASSIGNED) {
        const { planId, taskId, agentId } = event.payload;
        if (planId) {
          const missionId = Object.keys(missionStore.missions).find(id => 
            missionStore.missions[id].plans.some(p => p.id === planId)
          ) || planId;

          missionStore.updateTaskStatus(missionId, planId, taskId, 'running');
          missionStore.addTimelineEntry(missionId, {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            type: 'action',
            title: 'Task Assigned',
            description: `Task ${taskId} assigned to agent ${agentId}`,
            data: { taskId, agentId }
          });
        }
      } else if (event.type === SystemTelemetryType.TASK_COMPLETED) {
        const { planId, taskId, agentId, result } = event.payload;
        if (planId) {
          const missionId = Object.keys(missionStore.missions).find(id => 
            missionStore.missions[id].plans.some(p => p.id === planId)
          ) || planId;

          missionStore.updateTaskStatus(missionId, planId, taskId, 'completed');

          // Capture as deliverable if it looks like useful data
          if (result && typeof result === 'object') {
            missionStore.addTimelineEntry(missionId, {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: 'knowledge',
              title: 'Deliverable Generated',
              description: `Task ${taskId} produced new content.`,
              data: { ...(result as object), taskId }
            });
          }

          missionStore.addTimelineEntry(missionId, {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            type: 'event',
            title: 'Task Completed',
            description: `Task ${taskId} successfully completed by agent ${agentId}`,
            data: { taskId, agentId }
          });
        }
      }
    });
    this.unsubscribers.push(unsubTelemetry);

    // 2.1 Mission Outcome
    const unsubOutcome = this.eventBus.subscribe<any>('agent:events', (event) => {
      if (event.type === 'MISSION_COMPLETED' || (event.type === AgentEventType.AGENT_UPDATE && event.payload.status === 'PLAN_COMPLETED')) {
        const missionStore = useMissionStore.getState();
        const missionId = event.payload.missionId || missionStore.activeMissionId;
        if (missionId && event.payload.outcome) {
          missionStore.setMissionOutcome(missionId, event.payload.outcome);
        }
      }
    });
    this.unsubscribers.push(unsubOutcome);

    // 3. Agent Lifecycle (Running Agents)
    const unsubLifecycle = this.eventBus.subscribe<AgentLifecycleEvent>('agent:lifecycle', (event) => {
      const missionStore = useMissionStore.getState();
      const { agentId, action, identity } = event.payload;
      const missionId = (identity?.metadata?.missionId as string) || missionStore.activeMissionId;
      if (!missionId) return;

      if (action === 'spawned') {
        missionStore.addRunningAgent(missionId, identity);
      } else if (action === 'destroyed') {
        missionStore.removeRunningAgent(missionId, agentId);
      }
    });
    this.unsubscribers.push(unsubLifecycle);
  }

  public destroy() {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
  }
}
