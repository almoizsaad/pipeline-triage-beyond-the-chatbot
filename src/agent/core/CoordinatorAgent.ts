import { AgentRuntime } from './AgentRuntime';
import { PlannerCoordinator } from '../planner/PlannerCoordinator';
import { PlannerConsensus } from '../planner/PlannerConsensus';
import { AgentRegistry } from './AgentRegistry';
import type { Mission } from '../types/mission';
import type { CooperativePlan } from '../types/planning';
import type { AgentCommunicationMessage } from '../types/communication';
import { EventBus } from './EventBus';
import type { Planner, Executor, AgentIdentity } from '../types/agent';
import { AgentEventType, SystemTelemetryType } from '../types/agent';
import type { IPerformanceMonitor, IImprovementEngine } from '../types/improvement';
import { OptimizationSuggestions } from '../improvement/OptimizationSuggestions';
import { AgentChannel } from './AgentChannel';
import { KnowledgeGraph } from '../knowledge/KnowledgeGraph';
import { AgentManager } from './AgentManager';

export class CoordinatorAgent extends AgentRuntime {
  private coordinator: PlannerCoordinator;
  private consensus: PlannerConsensus;
  private manager?: AgentManager;
  private activePlans: Map<string, CooperativePlan> = new Map();
  private maxRetries = 3;

  constructor(
    eventBus: EventBus,
    registry: AgentRegistry,
    planner?: Planner,
    executor?: Executor,
    monitor?: IPerformanceMonitor,
    improvementEngine?: IImprovementEngine,
    suggestions?: OptimizationSuggestions,
    identity?: AgentIdentity,
    channel?: AgentChannel,
    knowledgeGraph?: KnowledgeGraph,
    manager?: AgentManager
  ) {
    super(eventBus, planner, executor, monitor, improvementEngine, suggestions, identity, channel, knowledgeGraph);
    this.coordinator = new PlannerCoordinator(registry, this.channel);
    this.consensus = new PlannerConsensus();
    this.manager = manager;
    
    this.initResumption();
  }

  private async initResumption(): Promise<void> {
    // Wait for state to be fully loaded (handled by bootstrap sequence)
    // If we have a current plan, re-activate it as an active plan
    if (this._state.currentPlan) {
      console.info(`[CoordinatorAgent] Resuming persistent plan: ${this._state.currentPlan.id}`);
      this.activePlans.set(this._state.currentPlan.id, this._state.currentPlan as CooperativePlan);
      
      // If the plan was still running, re-trigger coordination
      if (this._state.status === 'executing' || this._state.status === 'idle') {
         // Use a small delay to ensure all agents are re-spawned by AgentManager first
         setTimeout(() => {
           this.coordinator.coordinatePlan(this._state.currentPlan as CooperativePlan);
         }, 2000);
      }
    }
  }

  public setManager(manager: AgentManager): void {
    this.manager = manager;
  }

  protected setupMessageHandlers(): void {
    if (!this.channel) return;

    this.channel.onMessage(async (message: AgentCommunicationMessage) => {
      switch (message.type) {
        case 'TASK_COMPLETED':
          await this.handleTaskResult(message, true);
          break;
        case 'TASK_FAILED':
          await this.handleTaskResult(message, false);
          break;
        case 'SUBPLAN_PROPOSED':
          this.handleSubPlan(message);
          break;
        case 'PLAN_APPROVAL':
          this.handleApproval(message);
          break;
        case 'PLAN_REJECTION':
          this.handleRejection(message);
          break;
      }
    });
  }

  public async startCooperativePlan(plan: CooperativePlan): Promise<void> {
    this._stream.thought(`Starting cooperative coordination for plan: ${plan.id}`, 'plan', { planId: plan.id });
    this.activePlans.set(plan.id, plan);
    this.consensus.proposePlan(plan.id);
    
    // Spawn specialized agents if needed
    if (this.manager) {
      plan.tasks.forEach(task => {
        const role = task.assignedRole || 'worker';
        const name = `${role.charAt(0).toUpperCase() + role.slice(1)} Agent ${task.id.slice(0, 4)}`;
        this.manager!.spawnAgent(
          name, 
          role, 
          task.metadata?.requiredCapabilities as string[] || ['general'],
          { missionId: plan.id }
        );
      });
    }

    // Decompose and delegate
    await this.coordinator.coordinatePlan(plan);
    
    // Check for delegation failures in initial batch
    for (const task of plan.tasks) {
      if (task.status === 'failed') {
        const error = (task.metadata?.error as string) || 'Initial delegation failed';
        await this.handleTaskFailure(plan, task.id, error);
      }
    }

    // Notify system of task assignments
    plan.tasks.filter(t => t.status === 'running').forEach(t => {
      this._eventBus.publish('system:telemetry', {
        type: SystemTelemetryType.TASK_ASSIGNED,
        payload: {
          agentId: t.assigneeId,
          taskId: t.id,
          planId: plan.id,
        },
        timestamp: Date.now()
      });
    });
    }


  private async handleTaskResult(message: AgentCommunicationMessage, success: boolean): Promise<void> {
    const payload = message.payload as Record<string, unknown>;
    const planId = payload.planId as string;
    const taskId = payload.taskId as string;
    const result = payload.result;
    const error = payload.error as string;
    
    const plan = this.activePlans.get(planId);
    if (!plan) return;

    if (success) {
      this._stream.thought(`Task ${taskId} completed by agent ${message.sender}`, 'observation', { planId, taskId });
      this.coordinator.handleTaskCompletion(plan, taskId, result);
      
      // Notify system of task completion
      this._eventBus.publish('system:telemetry', {
        type: SystemTelemetryType.TASK_COMPLETED,
        payload: {
          agentId: message.sender,
          taskId,
          planId,
          result
        },
        timestamp: Date.now()
      });

      // Check if new tasks are ready for delegation
      const readyTasks = this.coordinator.getReadyTasks(plan);
      if (readyTasks.length > 0) {
        this._stream.thought(`Decomposition revealed ${readyTasks.length} new tasks ready for delegation.`, 'reasoning', { planId });
        for (const task of readyTasks) {
          // Double check status to avoid race conditions
          if (task.status === 'pending') {
            await this.coordinator.delegateTask(task, plan.id, plan);
            
            if ((task.status as string) === 'failed') {
              const error = (task.metadata?.error as string) || 'Delegation failed';
              this._stream.thought(`Task ${task.id} delegation failed: ${error}`, 'error', { planId, taskId: task.id });
              await this.handleTaskFailure(plan, task.id, error);
            } else {
              // Notify system of task assignment
              this._eventBus.publish('system:telemetry', {
                type: SystemTelemetryType.TASK_ASSIGNED,
                payload: {
                  agentId: task.assigneeId,
                  taskId: task.id,
                  planId: plan.id,
                },
                timestamp: Date.now()
              });
            }
          }
        }
      } 
      
      // Check for plan completion after handling result
      if (this.isPlanComplete(plan)) {
        await this.finalizePlan(plan);
      }
    } else {
      this._stream.thought(`Task ${taskId} failed: ${error}`, 'error', { planId, taskId });
      await this.handleTaskFailure(plan, taskId, error);
    }
  }

  private async handleTaskFailure(plan: CooperativePlan, taskId: string, error: string): Promise<void> {
    const task = plan.tasks.find(t => t.id === taskId);
    if (!task) return;

    const retries = (task.metadata?.retries as number || 0);
    
    if (retries < this.maxRetries) {
      console.info(`[CoordinatorAgent] Retrying task ${taskId} (attempt ${retries + 1})`);
      this._stream.thought(`Retrying task ${taskId} (Attempt ${retries + 1}/${this.maxRetries}). Error: ${error}`, 'error', { planId: plan.id, taskId });
      task.metadata = { ...task.metadata, retries: retries + 1 };
      task.status = 'pending';
      await this.coordinator.delegateTask(task, plan.id, plan);
    } else {
      console.warn(`[CoordinatorAgent] Task ${taskId} failed after ${this.maxRetries} retries. Attempting replan.`);
      this._stream.thought(`Task ${taskId} failed critically after ${this.maxRetries} retries. Initiating autonomous recovery/replan.`, 'error', { planId: plan.id, taskId });
      this.coordinator.handleTaskFailure(plan, taskId, error);
      await this.replan(plan, taskId, error);
    }
  }

  private replanAttempts: Map<string, number> = new Map();

  private async replan(plan: CooperativePlan, failedTaskId: string, error: string): Promise<void> {
    const attempts = this.replanAttempts.get(plan.id) || 0;
    if (attempts >= 2) {
      console.error(`[CoordinatorAgent] Max replan attempts reached for plan ${plan.id}. Aborting.`);
      this._eventBus.publish('agent:events', {
        type: AgentEventType.AGENT_UPDATE,
        payload: { missionId: plan.id, planId: plan.id, status: 'PLAN_FAILED', error: 'Max replan attempts reached' },
        timestamp: Date.now()
      });
      return;
    }
    this.replanAttempts.set(plan.id, attempts + 1);

    if (!this.planner) return;

    console.info(`[CoordinatorAgent] Replanning for plan ${plan.id} due to failure in task ${failedTaskId}`);
    this._stream.thought(`Autonomous recovery sequence initiated. Synthesizing new operational strategy to bypass failure in ${failedTaskId}.`, 'plan', { planId: plan.id });
    
    // Logic for replanning: generate a new plan from the current state
    const remainingGoal = `Recover from failure in task ${failedTaskId}: ${error}. Original goal: ${plan.goal}`;
    try {
      const newPlan = await this.planner.generatePlan(remainingGoal, this.getState()) as CooperativePlan;
      newPlan.id = plan.id; // Keep same ID or handle as subplan
      newPlan.coordinatorId = this.identity?.id || 'unknown';
      
      this._stream.thought(`New recovery plan formulated with ${newPlan.tasks.length} tasks. Resuming mission execution.`, 'observation', { planId: plan.id });

      this.activePlans.set(plan.id, newPlan);
      await this.coordinator.coordinatePlan(newPlan);
    } catch (e) {
      console.error(`[CoordinatorAgent] Replanning failed:`, e);
      this._eventBus.publish('agent:events', {
        type: AgentEventType.AGENT_UPDATE,
        payload: { 
          missionId: plan.id,
          planId: plan.id, 
          status: 'PLAN_FAILED',
          error: 'Replanning failed'
        },
        timestamp: Date.now()
      });
      
      this._eventBus.publish('agent:events', {
        type: AgentEventType.ERROR,
        payload: { 
          message: 'Replanning failed', 
          code: 'REPLAN_FAILED', 
          fatal: false,
          details: { planId: plan.id }
        },
        timestamp: Date.now()
      });
    }
  }

  public isPlanComplete(plan: CooperativePlan): boolean {
    return plan.tasks.every(t => t.status === 'completed');
  }

  public async startMission(mission: Mission): Promise<void> {
    this._stream.thought(`Starting coordination for mission: ${mission.title}`, 'plan', { missionId: mission.id });
    
    if (!this.planner) {
      throw new Error('Planner not initialized on CoordinatorAgent');
    }

    const goal = `${mission.goal.description}. Success criteria: ${mission.goal.successCriteria.join(', ')}`;
    
    try {
      const plan = await this.planner.generatePlan(goal, this.getState()) as CooperativePlan;
      
      plan.id = mission.id; // Using missionId as planId for simplicity
      plan.coordinatorId = this.identity?.id || 'unknown';
      
      // Track missionId in metadata of tasks
      plan.tasks.forEach(t => {
        t.metadata = { ...t.metadata, missionId: mission.id };
      });

      this._eventBus.publish('agent:events', {
        type: AgentEventType.AGENT_UPDATE,
        payload: { 
          missionId: mission.id, 
          planId: mission.id, 
          status: 'PLAN_STARTED',
          plan: plan 
        },
        timestamp: Date.now()
      });

      await this.startCooperativePlan(plan);
    } catch (error) {
      console.error(`[CoordinatorAgent] Failed to start mission ${mission.id}:`, error);
      
      this._eventBus.publish('agent:events', {
        type: AgentEventType.AGENT_UPDATE,
        payload: { 
          missionId: mission.id, 
          planId: mission.id, 
          status: 'PLAN_FAILED', 
          error: error instanceof Error ? error.message : String(error) 
        },
        timestamp: Date.now()
      });
      
      // Re-throw to inform the caller (ExecutiveBrain/Scheduler)
      throw error;
    }
  }

  public async pauseMission(missionId: string): Promise<void> {
    const plan = this.activePlans.get(missionId);
    if (plan) {
      this._stream.thought(`Pausing mission: ${missionId}`, 'observation');
      // In a real implementation, we would stop active tasks in workflow engine
      this._eventBus.publish('agent:events', {
        type: AgentEventType.AGENT_UPDATE,
        payload: { missionId, status: 'PLAN_PAUSED' },
        timestamp: Date.now()
      });
    }
  }

  public async resumeMission(missionId: string): Promise<void> {
    const plan = this.activePlans.get(missionId);
    if (plan) {
      this._stream.thought(`Resuming mission: ${missionId}`, 'observation');
      // Re-trigger coordination
      await this.coordinator.coordinatePlan(plan);
    }
  }

  public async finalizePlan(plan: CooperativePlan): Promise<void> {
    console.info(`[CoordinatorAgent] Plan ${plan.id} completed successfully.`);
    const results = plan.tasks.map(t => ({ taskId: t.id, result: t.metadata?.result }));
    this._eventBus.publish('agent:events', {
      type: AgentEventType.AGENT_UPDATE,
      payload: { missionId: plan.id, planId: plan.id, results, status: 'PLAN_COMPLETED' },
      timestamp: Date.now()
    });
    this.activePlans.delete(plan.id);
  }

  private handleSubPlan(message: AgentCommunicationMessage): void {
    const payload = message.payload as Record<string, unknown>;
    const planId = payload.planId as string;
    const taskId = payload.taskId as string;
    const subPlan = payload.subPlan as CooperativePlan;
    const mainPlan = this.activePlans.get(planId);
    
    if (mainPlan) {
      this.coordinator.mergeSubPlan(mainPlan, taskId, subPlan);
      // After merging subplan, we might need to delegate tasks from it
      this.coordinator.coordinatePlan(mainPlan);
    }
  }

  private handleApproval(message: AgentCommunicationMessage): void {
    const payload = message.payload as Record<string, unknown>;
    const planId = payload.planId as string;
    this.consensus.approvePlan(planId, message.sender as string);
    
    const required = Math.ceil((this.consensus.getConsensus(planId)?.approvals.length || 0) / 2) + 1; // Simple majority
    if (this.consensus.resolveConsensus(planId, required) === 'agreed') {
      this._eventBus.publish('agent:events', {
        type: AgentEventType.AGENT_UPDATE,
        payload: { planId, status: 'PLAN_AGREED' },
        timestamp: Date.now()
      });
    }
  }

  private handleRejection(message: AgentCommunicationMessage): void {
    const payload = message.payload as Record<string, unknown>;
    const planId = payload.planId as string;
    this.consensus.rejectPlan(planId);
    this._eventBus.publish('agent:events', {
      type: AgentEventType.AGENT_UPDATE,
      payload: { planId, status: 'PLAN_REJECTED', reason: payload.reason },
      timestamp: Date.now()
    });
  }

  public getActivePlan(planId: string): CooperativePlan | undefined {
    return this.activePlans.get(planId);
  }
}
