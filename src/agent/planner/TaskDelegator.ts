import type { DelegatedTask } from '../types/planning';
import { AgentRegistry } from '../core/AgentRegistry';
import { MessagePriority } from '../types/communication';
import { AgentChannel } from '../core/AgentChannel';

export class TaskDelegator {
  private registry: AgentRegistry;
  private senderChannel?: AgentChannel;

  constructor(registry: AgentRegistry, senderChannel?: AgentChannel) {
    this.registry = registry;
    this.senderChannel = senderChannel;
  }

  public async delegateTask(task: DelegatedTask, planId: string): Promise<boolean> {
    if (!task.assigneeId) return false;

    const agent = this.registry.getAgent(task.assigneeId);
    if (!agent) return false;

    const channel = this.senderChannel || agent.runtime.getChannel();
    if (!channel) return false;

    try {
      console.log(`[TaskDelegator] Sending TASK_ASSIGNMENT to agent ${task.assigneeId} for task ${task.id}`);
      await channel.sendDirect(task.assigneeId, 'TASK_ASSIGNMENT', {
        taskId: task.id,
        planId,
        description: task.description,
        tool: task.tool,
        metadata: task.metadata
      }, MessagePriority.HIGH);
      
      return true;
    } catch (error) {
      console.error(`[TaskDelegator] Failed to delegate task ${task.id} to ${task.assigneeId}:`, error);
      return false;
    }
  }

  public async requestSubPlan(task: DelegatedTask, planId: string): Promise<boolean> {
    if (!task.assigneeId) return false;

    const agent = this.registry.getAgent(task.assigneeId);
    if (!agent) return false;

    const channel = this.senderChannel || agent.runtime.getChannel();
    if (!channel) return false;

    try {
      await channel.sendDirect(task.assigneeId, 'PLAN_SUBTASK', {
        taskId: task.id,
        planId,
        goal: task.description,
        context: task.metadata
      }, MessagePriority.HIGH);
      
      return true;
    } catch (error) {
      console.error(`[TaskDelegator] Failed to request subplan for task ${task.id} from ${task.assigneeId}:`, error);
      return false;
    }
  }
}
