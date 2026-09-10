import { describe, it, expect, vi } from 'vitest';
import { createAgent } from '../bootstrap/createAgent';
import type { AgentDefinition } from '../core/AgentRegistry';

describe('Multi-Agent Orchestration', () => {
  it('should spawn multiple agents with different identities', () => {
    const { manager } = createAgent();
    
    const agent1 = manager.spawnAgent('Agent One', 'orchestrator', ['planning', 'routing']);
    const agent2 = manager.spawnAgent('Agent Two', 'worker', ['coding', 'testing']);
    
    // Total agents: 2 spawned here + 1 System Coordinator
    const agents = manager.listAgents().filter(a => a.identity.role !== 'coordinator');
    expect(agents).toHaveLength(2);
    
    expect(agents[0].identity.name).toBe('Agent One');
    expect(agents[0].identity.role).toBe('orchestrator');
    
    expect(agents[1].identity.name).toBe('Agent Two');
    expect(agents[1].identity.role).toBe('worker');
    
    expect(agent1.getState().identity?.id).toBe(agents[0].identity.id);
    expect(agent2.getState().identity?.id).toBe(agents[1].identity.id);
  });

  it('should find agents by role and capability', () => {
    const { manager } = createAgent();
    
    manager.spawnAgent('Orchestrator', 'orchestrator', ['management']);
    manager.spawnAgent('Worker 1', 'worker', ['coding']);
    manager.spawnAgent('Worker 2', 'worker', ['testing']);
    
    const workers = manager.findAgentsByRole('worker');
    expect(workers).toHaveLength(2);
    
    const coders = manager.listAgents().filter((a: AgentDefinition) => a.identity.capabilities.includes('coding'));
    expect(coders).toHaveLength(1);
    expect(coders[0].identity.name).toBe('Worker 1');
  });

  it('should manage agent lifecycle', () => {
    const { manager, eventBus } = createAgent();
    const spy = vi.fn();
    eventBus.subscribe('agent:lifecycle', spy);
    
    const agent = manager.spawnAgent('Lifecycle Agent', 'worker', []);
    const agentId = agent.getState().identity!.id;
    
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      payload: expect.objectContaining({ action: 'spawned', agentId })
    }));
    
    manager.pauseAgent(agentId);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      payload: expect.objectContaining({ action: 'paused', agentId })
    }));
    
    manager.resumeAgent(agentId);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      payload: expect.objectContaining({ action: 'resumed', agentId })
    }));
    
    manager.restartAgent(agentId);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      payload: expect.objectContaining({ action: 'restarted', agentId })
    }));
    
    manager.destroyAgent(agentId);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      payload: expect.objectContaining({ action: 'destroyed', agentId })
    }));
    
    // Remaining agent should be the coordinator
    const agents = manager.listAgents();
    expect(agents).toHaveLength(1);
    expect(agents[0].identity.role).toBe('coordinator');
  });

  it('should track agent statuses and metrics', () => {
    const { manager } = createAgent();
    const agent = manager.spawnAgent('Monitor Agent', 'worker', []);
    const agentId = agent.getState().identity!.id;
    
    const status = manager.getAgentStatus(agentId);
    expect(status).toBe('idle');
    
    const states = manager.getAllAgentStates();
    expect(states[agentId]).toBeDefined();
    expect(states[agentId].status).toBe('idle');
    
    const metrics = manager.getSystemMetrics();
    expect(metrics[agentId]).toBeDefined();
  });
});
