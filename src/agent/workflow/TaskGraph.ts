import type { StructuredTask } from '../planner/schemas';

/**
 * TaskGraph manages the dependency graph for a plan.
 */
export class TaskGraph {
  private tasks: Map<string, StructuredTask>;
  private completed: Set<string> = new Set();
  private failed: Set<string> = new Set();
  private running: Set<string> = new Set();

  constructor(tasks: StructuredTask[]) {
    this.tasks = new Map(tasks.map(t => [t.id, t]));
  }

  public getNextExecutableTasks(): StructuredTask[] {
    return Array.from(this.tasks.values()).filter(task => {
      // Not already completed, failed or running
      if (this.completed.has(task.id) || this.failed.has(task.id) || this.running.has(task.id)) {
        return false;
      }
      
      // All dependencies must be completed
      return task.dependencies.every(depId => this.completed.has(depId));
    });
  }

  public markRunning(taskId: string): void {
    this.running.add(taskId);
  }

  public markCompleted(taskId: string): void {
    this.running.delete(taskId);
    this.completed.add(taskId);
  }

  public markFailed(taskId: string): void {
    this.running.delete(taskId);
    this.failed.add(taskId);
  }

  public isComplete(): boolean {
    return this.completed.size + this.failed.size === this.tasks.size;
  }

  public hasFailed(): boolean {
    return this.failed.size > 0;
  }

  public getTasks(): StructuredTask[] {
    return Array.from(this.tasks.values());
  }
}
