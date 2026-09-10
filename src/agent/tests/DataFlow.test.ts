import { describe, it, expect, vi } from 'vitest';
import { PlannerCoordinator } from '../planner/PlannerCoordinator';
import { AgentRegistry } from '../core/AgentRegistry';
import type { CooperativePlan } from '../types/planning';

describe('PlannerCoordinator Data Flow', () => {
  it('should correctly inject task results into subsequent task metadata', async () => {
    const registry = new AgentRegistry();
    const coordinator = new PlannerCoordinator(registry);
    
    const plan: CooperativePlan = {
      id: 'plan-1',
      goal: 'test data flow',
      coordinatorId: 'system',
      createdAt: Date.now(),
      tasks: [
        {
          id: 'task-1',
          description: 'fetch data',
          status: 'completed',
          metadata: {
            result: {
              items: ['apple', 'banana'],
              count: 2
            }
          }
        },
        {
          id: 'task-2',
          description: 'process data',
          status: 'pending',
          metadata: {
            inputData: '{{task-1.result}}',
            message: 'Processing {{task-1.result}} now'
          }
        }
      ]
    };

    // Access private method for testing or use delegateTask which calls it
    // Using delegateTask with mocked TaskDelegator
    const mockDelegator = (coordinator as any).taskDelegator;
    mockDelegator.delegateTask = vi.fn().mockResolvedValue(true);

    await coordinator.delegateTask(plan.tasks[1], plan.id, plan);

    expect(mockDelegator.delegateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'task-2',
        metadata: expect.objectContaining({
          inputData: {
            items: ['apple', 'banana'],
            count: 2
          },
          message: 'Processing {"items":["apple","banana"],"count":2} now'
        })
      }),
      'plan-1'
    );
  });

  it('should correctly inject specific fields using path traversal', async () => {
    const registry = new AgentRegistry();
    const coordinator = new PlannerCoordinator(registry);
    
    const plan: CooperativePlan = {
      id: 'plan-2',
      goal: 'test path traversal',
      coordinatorId: 'system',
      createdAt: Date.now(),
      tasks: [
        {
          id: 'task-1',
          description: 'fetch data',
          status: 'completed',
          metadata: {
            result: {
              data: {
                results: ['one', 'two'],
                meta: { total: 2 }
              }
            }
          }
        },
        {
          id: 'task-2',
          description: 'process items',
          status: 'pending',
          metadata: {
            items: '{{task-1.result.data.results}}',
            total: '{{task-1.result.data.meta.total}}',
            summary: 'Got {{task-1.result.data.meta.total}} items'
          }
        }
      ]
    };

    const mockDelegator = (coordinator as any).taskDelegator;
    mockDelegator.delegateTask = vi.fn().mockResolvedValue(true);

    await coordinator.delegateTask(plan.tasks[1], plan.id, plan);

    expect(mockDelegator.delegateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'task-2',
        metadata: expect.objectContaining({
          items: ['one', 'two'],
          total: 2,
          summary: 'Got 2 items'
        })
      }),
      'plan-2'
    );
  });

  it('should handle missing results gracefully', async () => {
    const registry = new AgentRegistry();
    const coordinator = new PlannerCoordinator(registry);
    
    const plan: CooperativePlan = {
      id: 'plan-1',
      goal: 'test data flow',
      coordinatorId: 'system',
      createdAt: Date.now(),
      tasks: [
        {
          id: 'task-1',
          description: 'fetch data',
          status: 'pending',
          metadata: {}
        },
        {
          id: 'task-2',
          description: 'process data',
          status: 'pending',
          metadata: {
            inputData: '{{task-1.result}}'
          }
        }
      ]
    };

    const mockDelegator = (coordinator as any).taskDelegator;
    mockDelegator.delegateTask = vi.fn().mockResolvedValue(true);

    await coordinator.delegateTask(plan.tasks[1], plan.id, plan);

    expect(mockDelegator.delegateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {
          inputData: '{{task-1.result}}'
        }
      }),
      'plan-1'
    );
  });
});
