import { describe, it, expect, beforeEach } from 'vitest';
import { createAgent } from '../bootstrap/createAgent';
import { useMissionStore } from '../../stores/missionStore';
import { MissionAdapter } from '../adapters/MissionAdapter';
import { MockLLMProvider } from '../providers/MockLLMProvider';
import { ServiceContainer } from '../core/ServiceContainer';

describe('Mission Integration', () => {
  beforeEach(() => {
    useMissionStore.getState().reset();
  });

  it('should synchronize mission creation from ExecutiveBrain to missionStore', async () => {
    const container = new ServiceContainer();
    container.registerSingleton('LLMProvider', new MockLLMProvider());
    
    const { executiveBrain, eventBus } = createAgent(container);
    
    // Explicitly initialize MissionAdapter with the same eventBus
    new MissionAdapter(eventBus);

    const missionId = await executiveBrain.createMission('Test Integration Mission', {
      description: 'Verifying end-to-end sync. Just say hello.',
      successCriteria: ['Store is updated'],
      priority: 'medium'
    });

    const missions = useMissionStore.getState().missions;
    expect(missions[missionId]).toBeDefined();
    expect(missions[missionId].title).toBe('Test Integration Mission');
    expect(useMissionStore.getState().activeMissionId).toBe(missionId);
  });

  it('should synchronize mission status updates', async () => {
    const container = new ServiceContainer();
    container.registerSingleton('LLMProvider', new MockLLMProvider());
    
    const { executiveBrain, eventBus } = createAgent(container);
    new MissionAdapter(eventBus);

    const missionId = await executiveBrain.createMission('Status Sync Mission', {
      description: 'Verifying status sync. Just say hello.',
      successCriteria: ['Status is updated'],
      priority: 'low'
    });

    executiveBrain.getGoalManager().updateMissionStatus(missionId, 'running');

    const missions = useMissionStore.getState().missions;
    expect(missions[missionId].status).toBe('running');
  });
});
