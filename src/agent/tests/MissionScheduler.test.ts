import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MissionScheduler } from '../core/MissionScheduler';
import { GoalManager } from '../core/GoalManager';
import { PriorityManager } from '../core/PriorityManager';
import { EventBus } from '../core/EventBus';
import type { MissionGoal } from '../types/mission';

describe('MissionScheduler', () => {
  let scheduler: MissionScheduler;
  let goalManager: GoalManager;
  let priorityManager: PriorityManager;
  let eventBus: EventBus;

  beforeEach(() => {
    localStorage.clear();
    eventBus = new EventBus();
    goalManager = new GoalManager(eventBus);
    priorityManager = new PriorityManager();
    scheduler = new MissionScheduler(goalManager, priorityManager, eventBus);
  });

  it('should schedule missions based on priority', async () => {
    const onStart = vi.fn();
    scheduler.setCallbacks({
      onStart,
      onPause: vi.fn(),
      onResume: vi.fn()
    });

    const goalLow: MissionGoal = { description: 'Low', successCriteria: [], priority: 'low' };
    const goalHigh: MissionGoal = { description: 'High', successCriteria: [], priority: 'high' };

    goalManager.createMission('Mission 1', goalLow);
    goalManager.createMission('Mission 2', goalHigh);

    await scheduler.schedule();

    // Mission 2 (High) should be started before Mission 1 (Low) if scheduled together
    // Actually, schedule() processes all.
    expect(onStart).toHaveBeenCalledTimes(2);
    expect(onStart.mock.calls[0][0].title).toBe('Mission 2');
    expect(onStart.mock.calls[1][0].title).toBe('Mission 1');
  });

  it('should interrupt lower priority missions when capacity is reached', async () => {
    // Set max concurrent to 1 for this test
    (scheduler as unknown as { maxConcurrentMissions: number }).maxConcurrentMissions = 1;
    
    const onStart = vi.fn();
    const onPause = vi.fn();
    scheduler.setCallbacks({
      onStart,
      onPause,
      onResume: vi.fn()
    });

    const goalLow: MissionGoal = { description: 'Low', successCriteria: [], priority: 'low' };
    const goalHigh: MissionGoal = { description: 'High', successCriteria: [], priority: 'high' };

    const m1 = goalManager.createMission('Mission 1', goalLow);
    await scheduler.schedule();
    expect(onStart).toHaveBeenCalledWith(m1);
    expect(m1.status).toBe('running');

    const m2 = goalManager.createMission('Mission 2', goalHigh);
    await scheduler.schedule();

    expect(onPause).toHaveBeenCalledWith(m1.id);
    expect(m1.status).toBe('paused');
    expect(onStart).toHaveBeenCalledWith(m2);
    expect(m2.status).toBe('running');
  });
});
