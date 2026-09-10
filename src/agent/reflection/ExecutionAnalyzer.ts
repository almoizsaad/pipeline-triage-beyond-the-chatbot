import type { IExecutionAnalyzer, ExecutionAnalysis, ExecutionEvent } from '../types/reflection';

export class ExecutionAnalyzer implements IExecutionAnalyzer {
  public async analyze(workflowId: string, events: ExecutionEvent[]): Promise<ExecutionAnalysis> {
    const taskEvents = events.filter(e => e.taskId);
    const completed = taskEvents.filter(e => e.status === 'completed');
    const failed = taskEvents.filter(e => e.status === 'failed');
    
    // In a real system, we'd track retries and duration from timestamps
    // For now, we'll derive them from events
    const retries = events.filter(e => e.type === 'retry').length;
    const errors = failed.map(f => (f.result as { error?: string })?.error || 'Unknown error');

    // Calculate duration if timestamps are available
    let duration = 0;
    if (events.length > 1) {
      const start = events[0].timestamp || 0;
      const end = events[events.length - 1].timestamp || Date.now();
      duration = end - start;
    }

    return {
      workflowId,
      totalTasks: new Set(taskEvents.map(e => e.taskId)).size,
      completedTasks: new Set(completed.map(e => e.taskId)).size,
      failedTasks: new Set(failed.map(e => e.taskId)).size,
      retries,
      duration,
      errors,
      events
    };
  }
}
