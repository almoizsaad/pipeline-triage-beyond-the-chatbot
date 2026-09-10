import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutiveBrain } from '../core/ExecutiveBrain';
import { CoordinatorAgent } from '../core/CoordinatorAgent';
import { EventBus } from '../core/EventBus';
import type { MissionGoal } from '../types/mission';
import { AgentRegistry } from '../core/AgentRegistry';
import type { Planner } from '../types/agent';

describe('ExecutiveBrain', () => {
  let brain: ExecutiveBrain;
  let coordinator: CoordinatorAgent;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    const registry = new AgentRegistry();
    const mockPlanner = {
      generatePlan: vi.fn().mockResolvedValue({
        id: 'test-plan',
        goal: 'test',
        tasks: [],
        createdAt: Date.now()
      })
    };
    coordinator = new CoordinatorAgent(eventBus, registry, mockPlanner as unknown as Planner);
    brain = new ExecutiveBrain(eventBus, coordinator);
  });

  it('should create and schedule missions', async () => {
    const startMissionSpy = vi.spyOn(coordinator, 'startMission').mockResolvedValue(undefined);
    
    const goal: MissionGoal = {
      description: 'Test Goal',
      successCriteria: ['Done'],
      priority: 'high'
    };

    const missionId = await brain.createMission('Test Mission', goal);
    
    expect(missionId).toBeDefined();
    expect(startMissionSpy).toHaveBeenCalled();
    const mission = brain.getGoalManager().getMission(missionId);
    expect(mission?.status).toBe('running');
  });

  it('should handle mission recovery', async () => {
    vi.spyOn(coordinator, 'startMission').mockResolvedValue(undefined);
    
    const goal: MissionGoal = {
      description: 'Test Goal',
      successCriteria: ['Done'],
      priority: 'high'
    };

    const missionId = await brain.createMission('Test Mission', goal);
    
    // Simulate mission failure
    eventBus.publish('agent:events', {
      type: 'AGENT_UPDATE',
      payload: { missionId, status: 'PLAN_FAILED' },
      timestamp: Date.now()
    });

    const mission = brain.getGoalManager().getMission(missionId);
    // Should be back to running because it was rescheduled immediately and capacity was available
    // But status in GoalManager should have transitioned through 'idle'
    expect(mission?.context.retries).toBe(1);
    expect(mission?.status).toBe('running');
  });

  it('should handle mission cancellation', async () => {
    vi.spyOn(coordinator, 'pauseMission').mockResolvedValue(undefined);
    
    const goal: MissionGoal = {
      description: 'Test Goal',
      successCriteria: ['Done'],
      priority: 'high'
    };

    const missionId = await brain.createMission('Test Mission', goal);
    await brain.cancelMission(missionId);
    
    const mission = brain.getGoalManager().getMission(missionId);
    expect(mission?.status).toBe('cancelled');
  });
});
