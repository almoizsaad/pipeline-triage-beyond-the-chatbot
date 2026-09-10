import { AgentRuntime } from './AgentRuntime';
import { AgentActionType } from '../types/agent';

/**
 * SelfCorrection handles autonomous recovery from task failures.
 */
export class SelfCorrection {
  private runtime: AgentRuntime;
  private recoveryAttempts: Map<string, number> = new Map();
  private maxAttempts = 1;

  constructor(runtime: AgentRuntime) {
    this.runtime = runtime;
  }

  /**
   * Attempts to recover from a failed task.
   */
  public async handleTaskFailure(taskId: string, error: string): Promise<boolean> {
    const attempts = this.recoveryAttempts.get(taskId) || 0;
    
    if (attempts >= this.maxAttempts) {
      console.error(`[SelfCorrection] Max recovery attempts reached for task ${taskId}. Bailing out.`);
      return false;
    }

    this.recoveryAttempts.set(taskId, attempts + 1);
    console.warn(`[SelfCorrection] Handling failure for task ${taskId} (Attempt ${attempts + 1}): ${error}`);
    
    this.runtime.dispatchAction({
      type: AgentActionType.AGENT_UPDATE,
      payload: {
        status: 'thinking',
        message: `Task ${taskId} failed. Attempting autonomous recovery...`,
      },
    });

    try {
      const currentPlan = this.runtime.getCurrentPlan();
      if (!currentPlan) return false;

      const recoveryGoal = `Recover from failure of task "${taskId}" with error "${error}" and complete the original goal: "${currentPlan.goal}"`;
      
      // Trigger a fresh planning and execution cycle
      await this.runtime.processGoal(recoveryGoal);
      
      return true;
    } catch (e) {
      console.error('[SelfCorrection] Recovery failed:', e);
      return false;
    } finally {
      // Clean up attempt counter after some time or when appropriate
      // For now we just leave it to prevent immediate infinite recursion
    }
  }
}
