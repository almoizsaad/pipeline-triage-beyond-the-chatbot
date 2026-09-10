import type { Mission } from '../types/mission';
import { EventBus } from './EventBus';
import { AgentEventType } from '../types/agent';

export class DecisionSupervisor {
  private readonly eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  public async authorizeMissionInterruption(activeMission: Mission, newMission: Mission): Promise<boolean> {
    // Basic logic: high/critical priority can always interrupt lower priority
    const priorities = ['low', 'medium', 'high', 'critical'];
    const activeIdx = priorities.indexOf(activeMission.goal.priority);
    const newIdx = priorities.indexOf(newMission.goal.priority);

    const authorized = newIdx > activeIdx;

    if (authorized) {
      this.eventBus.publish('agent:events', {
        type: AgentEventType.AGENT_UPDATE,
        payload: { 
          status: 'INTERRUPTION_AUTHORIZED',
          message: `Mission ${newMission.title} is authorized to interrupt ${activeMission.title}`
        },
        timestamp: Date.now()
      });
    }

    return authorized;
  }

  public async resolveConflict(missions: Mission[]): Promise<Mission[]> {
    // Simple conflict resolution: prioritize by priority and then by age
    const priorities = ['low', 'medium', 'high', 'critical'];
    return [...missions].sort((a, b) => {
      const pA = priorities.indexOf(a.goal.priority);
      const pB = priorities.indexOf(b.goal.priority);
      if (pA !== pB) return pB - pA;
      return a.createdAt - b.createdAt;
    });
  }
}
