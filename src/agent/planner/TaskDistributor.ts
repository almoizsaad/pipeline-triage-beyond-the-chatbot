import type { DelegatedTask } from '../types/planning';
import { AgentRegistry } from '../core/AgentRegistry';

export class TaskDistributor {
  private registry: AgentRegistry;

  constructor(registry: AgentRegistry) {
    this.registry = registry;
  }

  public findBestAssignee(task: DelegatedTask): string | undefined {
    const requiredRole = task.assignedRole;
    const requiredCapability = (task.metadata?.requiredCapability as string) || '';

    let candidates = this.registry.listAgents();

    if (requiredRole) {
      candidates = candidates.filter(a => a.identity.role === requiredRole);
    } else {
      // By default, strictly assign to workers/specialists
      const workers = candidates.filter(a => a.identity.role === 'worker' || a.identity.role === 'specialist');
      if (workers.length > 0) {
        candidates = workers;
      } else {
        // Fallback to non-coordinators
        candidates = candidates.filter(a => a.identity.role !== 'coordinator' && a.identity.role !== 'orchestrator');
      }
    }

    if (requiredCapability) {
      candidates = candidates.filter(a => a.identity.capabilities.includes(requiredCapability));
    }

    // Simple heuristic: pick the first available candidate
    // In a more advanced version, we could check agent load or performance metrics
    return candidates[0]?.identity.id;
  }

  public distributeTasks(tasks: DelegatedTask[]): DelegatedTask[] {
    return tasks.map(task => ({
      ...task,
      assigneeId: task.assigneeId || this.findBestAssignee(task)
    }));
  }
}
