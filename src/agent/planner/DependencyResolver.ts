import type { CooperativePlan, DelegatedTask } from '../types/planning';

export class DependencyResolver {
  private getTaskDependencies(task: DelegatedTask): string[] {
    return task.dependencies || (task.metadata?.dependencies as string[]) || [];
  }

  public resolveExecutionOrder(plan: CooperativePlan): DelegatedTask[] {
    const visited = new Set<string>();
    const ordered: DelegatedTask[] = [];
    const taskMap = new Map(plan.tasks.map(t => [t.id, t]));

    const visit = (taskId: string) => {
      if (visited.has(taskId)) return;
      
      const task = taskMap.get(taskId);
      if (!task) return;

      const dependencies = this.getTaskDependencies(task);
      dependencies.forEach(depId => visit(depId));

      visited.add(taskId);
      ordered.push(task);
    };

    plan.tasks.forEach(t => visit(t.id));
    return ordered;
  }

  public getBlockedTasks(plan: CooperativePlan, completedTaskIds: Set<string>): DelegatedTask[] {
    return plan.tasks.filter(task => {
      if (completedTaskIds.has(task.id)) return false;
      
      const dependencies = this.getTaskDependencies(task);
      return dependencies.some(depId => !completedTaskIds.has(depId));
    });
  }

  public getReadyTasks(plan: CooperativePlan, completedTaskIds: Set<string>, runningTaskIds: Set<string>): DelegatedTask[] {
    return plan.tasks.filter(task => {
      if (completedTaskIds.has(task.id) || runningTaskIds.has(task.id)) return false;
      
      const dependencies = this.getTaskDependencies(task);
      return dependencies.every(depId => completedTaskIds.has(depId));
    });
  }
}
