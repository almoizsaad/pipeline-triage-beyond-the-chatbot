import { describe, it, expect } from 'vitest';
import { useMissionStore } from '../../stores/missionStore';
import type { Mission } from '../types/mission';

describe('MissionCentric Workspace', () => {
  it('should manage mission state correctly', () => {
    const { addMission, setActiveMission } = useMissionStore.getState();
    
    const mockMission: Mission = {
      id: 'test-mission',
      title: 'Test Mission',
      goal: {
        description: 'Test Goal',
        successCriteria: ['Success'],
        priority: 'high'
      },
      context: {},
      constraints: [],
      status: 'idle',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      plans: [],
      runningAgents: [],
      timeline: [],
      thoughts: [],
      reflections: [],
      memoryUpdates: [],
      knowledgeUpdates: [],
    };
    
    addMission(mockMission);
    expect(useMissionStore.getState().missions['test-mission']).toBeDefined();
    expect(useMissionStore.getState().missions['test-mission'].title).toBe('Test Mission');
    
    setActiveMission('test-mission');
    expect(useMissionStore.getState().activeMissionId).toBe('test-mission');
  });

  it('should update mission status and timeline', () => {
    const { updateMissionStatus, addTimelineEntry } = useMissionStore.getState();
    
    updateMissionStatus('test-mission', 'running');
    expect(useMissionStore.getState().missions['test-mission'].status).toBe('running');
    
    addTimelineEntry('test-mission', {
      id: 't-1',
      timestamp: Date.now(),
      type: 'thought',
      title: 'Testing',
      description: 'Testing mission timeline'
    });
    
    expect(useMissionStore.getState().missions['test-mission'].timeline.length).toBe(1);
    expect(useMissionStore.getState().missions['test-mission'].timeline[0].title).toBe('Testing');
  });
});
