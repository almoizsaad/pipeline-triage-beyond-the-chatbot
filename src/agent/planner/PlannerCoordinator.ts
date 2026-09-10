import type { CooperativePlan, DelegatedTask } from '../types/planning';
import { DependencyResolver } from './DependencyResolver';
import { TaskDistributor } from './TaskDistributor';
import { TaskDelegator } from './TaskDelegator';
import { AgentRegistry } from '../core/AgentRegistry';
import { AgentChannel } from '../core/AgentChannel';

export class PlannerCoordinator {
  private dependencyResolver: DependencyResolver;
  private taskDistributor: TaskDistributor;
  private taskDelegator: TaskDelegator;

  constructor(registry: AgentRegistry, channel?: AgentChannel) {
    this.dependencyResolver = new DependencyResolver();
    this.taskDistributor = new TaskDistributor(registry);
    this.taskDelegator = new TaskDelegator(registry, channel);
  }

  public async coordinatePlan(plan: CooperativePlan): Promise<void> {
    // 1. Distribute tasks based on roles/capabilities
    plan.tasks = this.taskDistributor.distributeTasks(plan.tasks);

    // 2. Resolve dependencies and identify ready tasks
    const readyTasks = this.getReadyTasks(plan);

    // 3. Delegate ready tasks
    for (const task of readyTasks) {
      await this.delegateTask(task, plan.id, plan);
    }
  }

  public getReadyTasks(plan: CooperativePlan): DelegatedTask[] {
    const completedTaskIds = new Set(
      plan.tasks
        .filter(t => t.status === 'completed')
        .map(t => t.id)
    );
    const runningTaskIds = new Set(
      plan.tasks
        .filter(t => t.status === 'running')
        .map(t => t.id)
    );
    
    const ready = this.dependencyResolver.getReadyTasks(plan, completedTaskIds, runningTaskIds);
    console.log(`[PlannerCoordinator] Ready tasks for plan ${plan.id}: ${ready.map(t => t.id).join(', ')} (Completed: ${Array.from(completedTaskIds).join(', ')}, Running: ${Array.from(runningTaskIds).join(', ')})`);
    return ready;
  }

  public async delegateTask(task: DelegatedTask, planId: string, plan: CooperativePlan): Promise<void> {
    task.status = 'running';
    let success = false;
    
    // Phase 9: Result Injection - Inject results from previous tasks into metadata
    const enrichedMetadata = this.injectTaskResults(task.metadata || {}, plan);
    const enrichedTask = { ...task, metadata: enrichedMetadata };

    if (task.metadata?.requiresSubPlan) {
      success = await this.taskDelegator.requestSubPlan(enrichedTask, planId);
    } else {
      success = await this.taskDelegator.delegateTask(enrichedTask, planId);
    }

    if (!success) {
      task.status = 'failed';
      task.metadata = { ...task.metadata, error: 'Delegation failed' };
    }
  }

  private injectTaskResults(metadata: Record<string, any>, plan: CooperativePlan): Record<string, any> {
    const getValueByPath = (obj: any, path: string): any => {
      const parts = path.split('.');
      let current = obj;
      for (const part of parts) {
        if (current === null || current === undefined) return undefined;
        current = current[part];
      }
      return current;
    };

    const processValue = (value: any): any => {
      if (typeof value === 'string') {
        // Handle exact matches for replacement (enables object injection)
        const exactMatch = value.match(/^\{\{([^}]+)\.result(?:|\.([^}]+))\}\}$/);
        if (exactMatch) {
          const taskId = exactMatch[1];
          const path = exactMatch[2];
          const depTask = plan.tasks.find(t => t.id === taskId);
          if (depTask && depTask.status === 'completed' && depTask.metadata?.result) {
            const result = depTask.metadata.result;
            return path ? getValueByPath(result, path) : result;
          }
        }
        
        // Handle partial matches for string interpolation
        return value.replace(/\{\{([^}]+)\.result(?:|\.([^}]+))\}\}/g, (match, taskId, path) => {
          const depTask = plan.tasks.find(t => t.id === taskId);
          if (depTask && depTask.status === 'completed' && depTask.metadata?.result) {
            const result = depTask.metadata.result;
            const res = path ? getValueByPath(result, path) : result;
            return typeof res === 'string' ? res : JSON.stringify(res);
          }
          return match;
        });
      }
      
      if (Array.isArray(value)) {
        return value.map(processValue);
      }
      
      if (value !== null && typeof value === 'object') {
        const result: Record<string, any> = {};
        for (const key in value) {
          result[key] = processValue(value[key]);
        }
        return result;
      }
      
      return value;
    };

    try {
      return processValue(metadata);
    } catch (e) {
      console.error('[PlannerCoordinator] Failed to inject task results:', e);
      return metadata;
    }
  }

  public mergeSubPlan(mainPlan: CooperativePlan, taskId: string, subPlan: CooperativePlan): void {
    const taskIndex = mainPlan.tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      const task = mainPlan.tasks[taskIndex];
      task.subPlan = subPlan;
      
      // Integrate subplan tasks into main plan for easier tracking?
      // Or keep it hierarchical. Hierarchical is better for "Split large goals".
    }
  }

  public handleTaskCompletion(plan: CooperativePlan, taskId: string, result: unknown): void {
    const task = plan.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'completed';
      task.metadata = { ...task.metadata, result };
    }
  }

  public handleTaskFailure(plan: CooperativePlan, taskId: string, error: string): void {
    const task = plan.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'failed';
      task.metadata = { ...task.metadata, error };
    }
  }
}
