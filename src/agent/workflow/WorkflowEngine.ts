import type { Executor, Plan } from '../types/agent';
import { TaskGraph } from './TaskGraph';
import type { StructuredTask } from '../planner/schemas';
import type { IPerformanceMonitor } from '../types/improvement';
import type { ExecutionEvent } from '../types/reflection';

/**
 * WorkflowEngine orchestrates the execution of a Plan using a TaskGraph.
 */
export class WorkflowEngine {
  private executor: Executor;
  private monitor?: IPerformanceMonitor;
  private maxRetries = 1;
  private events: ExecutionEvent[] = [];

  constructor(executor: Executor, monitor?: IPerformanceMonitor) {
    this.executor = executor;
    this.monitor = monitor;
  }

  public async executePlan(plan: Plan, onUpdate?: (taskId: string, status: string, result?: unknown) => void): Promise<boolean> {
    const startTime = Date.now();
    console.log(`[WorkflowEngine] Starting execution for plan: ${plan.id}`);
    this.events = [{ type: 'workflow_start', workflowId: plan.id, timestamp: Date.now() }];
    const graph = new TaskGraph(plan.tasks as StructuredTask[]);
    
    while (!graph.isComplete()) {
      const nextTasks = graph.getNextExecutableTasks();
      
      if (nextTasks.length === 0 && !graph.isComplete()) {
        const blockedTasks = graph.getTasks().filter(t => !graph.isComplete() && !nextTasks.find(nt => nt.id === t.id));
        console.error('[WorkflowEngine] Execution stalled. Blocked tasks:', blockedTasks.map(t => t.id));
        break;
      }

      // Execute available tasks in parallel
      await Promise.all(nextTasks.map(async (task) => {
        graph.markRunning(task.id);
        onUpdate?.(task.id, 'in-progress');

        let success = false;
        let result: unknown;
        let attempts = 0;

        while (!success && attempts <= this.maxRetries) {
          attempts++;
          try {
            result = await this.executor.executeTask(task, {});
            success = (result as { success?: boolean }).success !== false; // Assume success unless explicitly false
          } catch (error) {

            console.error(`[WorkflowEngine] Error executing task ${task.id}:`, error);
            result = { success: false, error: String(error) };
            success = false;
          }

          if (!success && attempts <= this.maxRetries) {
            console.warn(`[WorkflowEngine] Task ${task.id} failed, retrying (${attempts}/${this.maxRetries})...`);
            // Exponential backoff could be added here
            await new Promise(r => setTimeout(r, 500 * attempts));
          }
        }

        if (success) {
          graph.markCompleted(task.id);
          this.events.push({ taskId: task.id, status: 'completed', timestamp: Date.now(), result });
          onUpdate?.(task.id, 'completed', result);
        } else {
          graph.markFailed(task.id);
          this.events.push({ taskId: task.id, status: 'failed', timestamp: Date.now(), result });
          onUpdate?.(task.id, 'failed', result);
          this.handleTaskFailure(task, result);
        }
      }));
    }

    this.events.push({ type: 'workflow_end', workflowId: plan.id, timestamp: Date.now() });
    const finalSuccess = !graph.hasFailed();
    const latency = Date.now() - startTime;
    this.monitor?.trackWorkflow(latency, finalSuccess);
    
    console.log(`[WorkflowEngine] Execution finished. Success: ${finalSuccess}`);
    return finalSuccess;
  }

  public getExecutionEvents(): ExecutionEvent[] {
    return this.events;
  }

  private handleTaskFailure(task: StructuredTask, result: unknown): void {
    console.error(`[WorkflowEngine] Task ${task.id} failed definitively. Result:`, result);
    // Future: Trigger self-correction or re-planning
  }
}
