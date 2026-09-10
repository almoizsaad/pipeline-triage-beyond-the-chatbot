import { AgentEventType, AgentActionType } from '../types/agent';
import type { 
  AgentState, 
  AgentEvent, 
  AgentStatus, 
  Planner, 
  Executor, 
  Plan, 
  Task, 
  AgentIdentity,
  AgentReflectionEvent
} from '../types/agent';
import type { AgentProtocolEvent } from '../protocol/events';
import type { AgentProtocolAction } from '../protocol/actions';
import { EventBus } from './EventBus';
import { WorkflowEngine } from '../workflow/WorkflowEngine';
import { MemoryManager } from '../memory/MemoryManager';
import { SelfCorrection } from './SelfCorrection';
import { AgentStream } from '../events/AgentStream';
import { OptimizationSuggestions } from '../improvement/OptimizationSuggestions';
import { AgentChannel } from './AgentChannel';
import { Logger } from '../../lib/utils/logger';
import { ReflectionEngine } from '../reflection/ReflectionEngine';
import { ExecutionAnalyzer } from '../reflection/ExecutionAnalyzer';
import { KnowledgeGraph } from '../knowledge/KnowledgeGraph';
import { ThoughtManager } from '../reflection/ThoughtManager';
import { PersistentMemory } from '../memory/PersistentMemory';
import { PersistenceManager } from './PersistenceManager';
import type { 
  IPerformanceMonitor, 
  IImprovementEngine, 
  SystemMetrics,
  OptimizationRecommendation
} from '../types/improvement';
import type { 
  ISelfReflectionEngine, 
  IExecutionAnalyzer,
  ExecutionEvent
} from '../types/reflection';

export class AgentRuntime {
  protected _state: AgentState;
  protected _eventBus: EventBus;
  protected _stream: AgentStream;
  
  protected _planner: Planner | null = null;
  protected _executor: Executor | null = null;
  protected _memory: MemoryManager;
  protected _workflowEngine: WorkflowEngine | null = null;
  protected _selfCorrection: SelfCorrection;
  protected _knowledgeGraph: KnowledgeGraph;
  protected _thoughtManager: ThoughtManager;
  
  protected _monitor?: IPerformanceMonitor;
  protected _improvementEngine?: IImprovementEngine;
  protected _suggestions?: OptimizationSuggestions;
  protected _reflectionEngine: ISelfReflectionEngine;
  protected _executionAnalyzer: IExecutionAnalyzer;
  protected _identity?: AgentIdentity;
  protected _channel?: AgentChannel;
  private _unsubscribers: Array<() => void> = [];
  
  protected persistence: PersistenceManager;
  protected readonly STORE_NAME = 'agent_states';

  public get planner(): Planner | null { return this._planner; }
  public get executor(): Executor | null { return this._executor; }
  public get monitor(): IPerformanceMonitor | undefined { return this._monitor; }
  public get improvementEngine(): IImprovementEngine | undefined { return this._improvementEngine; }
  public get suggestions(): OptimizationSuggestions | undefined { return this._suggestions; }
  public get identity(): AgentIdentity | undefined { return this._identity; }
  public get channel(): AgentChannel | undefined { return this._channel; }
  public get knowledgeGraph(): KnowledgeGraph { return this._knowledgeGraph; }
  public get memory(): MemoryManager { return this._memory; }

  constructor(
    eventBus: EventBus, 
    planner?: Planner, 
    executor?: Executor,
    monitor?: IPerformanceMonitor,
    improvementEngine?: IImprovementEngine,
    suggestions?: OptimizationSuggestions,
    identity?: AgentIdentity,
    channel?: AgentChannel,
    knowledgeGraph?: KnowledgeGraph
  ) {
    this._eventBus = eventBus;
    this._stream = new AgentStream(eventBus);
    this._planner = planner || null;
    this._executor = executor || null;
    this._monitor = monitor;
    this._improvementEngine = improvementEngine;
    this._suggestions = suggestions;
    this._identity = identity;
    this._channel = channel;
    this.persistence = PersistenceManager.getInstance();

    this._knowledgeGraph = knowledgeGraph || new KnowledgeGraph();
    this._memory = new MemoryManager(monitor);
    this._selfCorrection = new SelfCorrection(this);
    
    const persistentMemory = new PersistentMemory();
    this._thoughtManager = new ThoughtManager(this._eventBus, persistentMemory);
    
    this._reflectionEngine = new ReflectionEngine(this._knowledgeGraph, this._stream);
    this._executionAnalyzer = new ExecutionAnalyzer();

    if (this._executor) {
      this._workflowEngine = new WorkflowEngine(this._executor, monitor);
    }

    this._state = this.getInitialState();
    this.init();
  }

  private async init(): Promise<void> {
    await this.loadState();
    this.subscribeToCoreEvents();
    this.setupMessageHandlers();
  }

  private async loadState(): Promise<void> {
    if (!this._identity) return;
    try {
      const savedState = await this.persistence.get(this.STORE_NAME, this._identity.id);
      if (savedState) {
        this._state = {
          ...this._state,
          ...savedState,
          status: 'idle' // Reset status to idle on load
        };
        console.info(`[AgentRuntime] Restored persistent state for agent: ${this._identity.id}`);
      }
    } catch (e) {
      console.warn(`[AgentRuntime] Failed to load persistent state for ${this._identity?.id}:`, e);
    }
  }

  protected async saveState(): Promise<void> {
    if (!this._identity) return;
    try {
      await this.persistence.save(this.STORE_NAME, {
        id: this._identity.id,
        ...this._state
      });
    } catch (e) {
      console.error(`[AgentRuntime] Failed to save state for ${this._identity.id}:`, e);
    }
  }

  private subscribeToCoreEvents(): void {
    // Subscribe to incoming agent events
    const unsubEvents = this._eventBus.subscribe<AgentProtocolEvent>('agent:events', (event) => {
      this.handleEvent(event);
      this._memory.addSessionEvent(event);
    });
    this._unsubscribers.push(unsubEvents);

    // Subscribe to telemetry for history (e.g. task completions)
    const unsubTelemetry = this._eventBus.subscribe<any>('system:telemetry', (event) => {
      const telemetryEvent = {
        type: event.type,
        payload: event.payload,
        timestamp: event.timestamp || Date.now()
      } as any;
      this.recordEvent(telemetryEvent);
    });
    this._unsubscribers.push(unsubTelemetry);

    // Subscribe to incoming actions (e.g. from workspace)
    const unsubActions = this._eventBus.subscribe<AgentProtocolAction>('agent:actions', (action) => {
      this.handleAction(action);
    });
    this._unsubscribers.push(unsubActions);
  }

  private getInitialState(): AgentState {
    return {
      status: 'idle',
      history: [],
    };
  }

  public async reset(): Promise<void> {
    this._state = this.getInitialState();
    await this._memory.clear();
    await this.saveState();
    this.dispatchAction({
      type: AgentActionType.AGENT_UPDATE,
      payload: {
        status: 'idle',
        message: 'Agent state has been reset.',
      },
    });
  }

  protected setupMessageHandlers(): void {
    if (!this._channel) return;

    this._channel.onMessage(async (message) => {
      if (message.type === 'TASK_ASSIGNMENT') {
        await this.handleTaskAssignment(message);
      }
    });
  }

  private async handleTaskAssignment(message: any): Promise<void> {
    const { taskId, planId, tool, metadata } = message.payload;
    
    Logger.info(`[AgentRuntime] Executing task assignment: ${taskId} for plan ${planId}`, { tool, metadata });
    
    this._state.status = 'executing';
    await this.saveState();
    
    try {
      const taskObj = {
        id: taskId,
        description: message.payload.description,
        status: 'pending' as const,
        tool,
        metadata: metadata || {}
      };
      
      console.log(`[AgentRuntime] [DEBUG] Executing Task:`, JSON.stringify(taskObj, null, 2));

      if (!this._executor) {
        throw new Error('Agent executor not initialized');
      }

      const result = await this._executor.executeTask(taskObj, {});

      if (result.success) {
        await this._channel?.sendDirect(message.sender, 'TASK_COMPLETED', {
          taskId,
          planId,
          result: result.data
        });
      } else {
        await this._channel?.sendDirect(message.sender, 'TASK_FAILED', {
          taskId,
          planId,
          error: result.error
        });
      }
    } catch (error) {
      await this._channel?.sendDirect(message.sender, 'TASK_FAILED', {
        taskId,
        planId,
        error: String(error)
      });
    } finally {
      this._state.status = 'idle';
      await this.saveState();
    }
  }

  public async pause(): Promise<void> {
    this._state.status = 'paused';
    this._stream.thinking('Agent has been paused.');
    await this.saveState();
  }

  public async resume(): Promise<void> {
    if (this._state.status === 'paused') {
      this._state.status = 'idle'; // Or return to previous state if tracked
      this._stream.thinking('Agent has been resumed.');
      await this.saveState();
    }
  }

  public getCurrentPlan(): Plan | undefined {
    return this._state.currentPlan;
  }

  public getChannel(): AgentChannel | undefined {
    return this._channel;
  }

  public async handleEvent(event: AgentProtocolEvent): Promise<void> {
    if (this._state.status === 'paused' && event.type !== AgentEventType.AGENT_UPDATE) {
      return;
    }
    
    await this.recordEvent(event);
    
    switch (event.type) {
      case AgentEventType.USER_MESSAGE:
        // Only orchestrators/coordinators should process direct user messages
        if (this._identity?.role === 'orchestrator' || this._identity?.role === 'coordinator' || !this._identity) {
          await this.onUserMessage(event.payload.text);
        }
        break;
      case AgentEventType.WORKSPACE_ACTION:
        await this.onWorkspaceAction(event.payload.action, event.payload.metadata);
        break;
      case AgentEventType.TOOL_RESULT:
        await this.onToolResult(event.payload.toolName, event.payload.result);
        break;
    }
  }

  private handleAction(action: AgentProtocolAction): void {
    // Process actions received by the agent (e.g. manual overrides or approvals)
    console.debug(`[AgentRuntime] Received action: ${action.type}`);
  }

  public async processGoal(goal: string): Promise<void> {
    if (this._state.status === 'paused') {
      this._stream.error('Agent is paused. Resume to process new goals.');
      return;
    }

    if (!this._planner || !this._workflowEngine) {
      this._stream.error('Planner or WorkflowEngine not initialized.');
      return;
    }

    this._state.status = 'thinking';
    this._memory.setGoal(goal);
    this._stream.thinking('Analyzing goal and generating autonomous plan...');
    await this.saveState();

    try {
      // Recall relevant context from memory
      const context = await this._memory.recallMemories(goal);
      const enhancedGoal = context.length > 0 ? `${goal} (Context: ${JSON.stringify(context)})` : goal;

      this._stream.planning(enhancedGoal);
      const plan = await this._planner.generatePlan(enhancedGoal, this._state);
      this._state.currentPlan = JSON.parse(JSON.stringify(plan));
      
      if (!this._state.currentPlan) return;
      await this.saveState();

      this.dispatchAction({
        type: AgentActionType.UPDATE_PLAN,
        payload: {
          planId: this._state.currentPlan.id,
          tasks: this._state.currentPlan.tasks.map(t => ({ id: t.id, status: t.status })),
        },
      });

      this._state.status = 'executing';
      await this.saveState();
      
      const success = await this._workflowEngine.executePlan(this._state.currentPlan, async (taskId, status, result) => {
        if (status === 'in-progress') {
          const task = this._state.currentPlan!.tasks.find(t => t.id === taskId);
          this._stream.executingTool(task?.description || taskId);
        }

        // Phase 9: Continuous Learning - Record tool results as events for reflection
        if (status === 'completed' || status === 'failed') {
          const task = this._state.currentPlan!.tasks.find(t => t.id === taskId) as any;
          this._eventBus.publish('agent:events', {
            type: AgentEventType.TOOL_RESULT,
            payload: {
              workflowId: this._state.currentPlan!.id,
              taskId,
              toolName: task?.tool || 'unknown',
              description: task?.description || '',
              result,
              success: status === 'completed'
            },
            timestamp: Date.now()
          });

          // Phase 8.7.6: Runtime Driven Generative UI
          if (status === 'completed' && task?.ui_component) {
            this.renderComponent(task.ui_component, {
              ...(task.ui_props || {}),
              ...(result as any)?.data || {}
            }, { taskId, source: task.tool });
          }
        }

        // Sync plan state
        const taskIndex = this._state.currentPlan!.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
          this._state.currentPlan!.tasks[taskIndex].status = status as Task['status'];
        }

        await this.saveState();

        this.dispatchAction({
          type: AgentActionType.UPDATE_PLAN,
          payload: {
            planId: this._state.currentPlan!.id,
            tasks: this._state.currentPlan!.tasks.map(t => ({ id: t.id, status: t.status })),
          },
        });

        if (status === 'failed') {
          this._selfCorrection.handleTaskFailure(taskId, (result as { error?: string })?.error || 'Unknown error');
        }
      });

      // Self-Improvement: Baseline recommendations
      this.runSelfImprovement();

      if (success) {
        this._state.status = 'idle';
        await this._memory.remember(goal, { completed: true, planId: plan.id });
        
        // Phase 4.1: Consolidate session into semantic memory
        await this._memory.consolidateSession(plan.id);
        
        this._stream.completing('Goal accomplished successfully.');

        // Phase 6.1: Asynchronous Reflection (includes ImprovementEngine)
        this.runReflection(plan.id).catch(err => {
          console.error('[AgentRuntime] Reflection failed:', err);
        });
      }
      
      await this.saveState();

    } catch (error) {
      this._state.status = 'error';
      await this.saveState();
      this._stream.error(`Critical error: ${error}`, true);
    }
  }

  public dispatchAction(action: AgentProtocolAction): void {
    this._eventBus.publish('agent:actions', action);
  }

  /**
   * Renders a component directly into the shared workspace.
   */
  public renderComponent(type: string, props: Record<string, unknown>, metadata?: Record<string, unknown>): string {
    const id = (props.id as string) || crypto.randomUUID();
    this.dispatchAction({
      type: AgentActionType.RENDER_COMPONENT,
      payload: { id, type, props, status: 'ready', metadata }
    });
    return id;
  }

  /**
   * Updates an existing component in the shared workspace live.
   */
  public updateComponent(id: string, updates: Record<string, unknown>): void {
    this.dispatchAction({
      type: AgentActionType.UPDATE_COMPONENT,
      payload: { id, updates }
    });
  }

  public destroy(): void {
    Logger.info(`[AgentRuntime] Destroying agent: ${this._identity?.id || 'unknown'}`);
    this._unsubscribers.forEach(unsub => unsub());
    this._unsubscribers = [];
    this._memory.clear();
  }

  public healthCheck(): { status: 'healthy' | 'unhealthy'; details: Record<string, unknown> } {
    const details: Record<string, unknown> = {
      status: this._state.status,
      planner: !!this._planner,
      executor: !!this._executor,
      workflowEngine: !!this._workflowEngine,
      timestamp: Date.now()
    };

    const isHealthy = this._state.status !== 'error' && !!this._planner && !!this._executor;
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      details
    };
  }

  public getStatus(): AgentStatus {
    return this._state.status;
  }

  public getMetrics(): SystemMetrics | null {
    return this._monitor?.getMetrics() || null;
  }

  public getRecommendations(): OptimizationRecommendation[] {
    return this._suggestions?.getSuggestions() || [];
  }

  private runSelfImprovement(): void {
    if (this._monitor && this._improvementEngine && this._suggestions) {
      const metrics = this._monitor.getMetrics();
      const recommendations = this._improvementEngine.generateRecommendations(metrics);
      this._suggestions.updateSuggestions(recommendations);
      
      if (recommendations.length > 0) {
        Logger.info(`[AgentRuntime] Generated ${recommendations.length} optimization suggestions.`);
      }
    }
  }

  private async runReflection(workflowId: string): Promise<void> {
    try {
      this._stream.reflecting(workflowId);

      // 1. Map history to ExecutionEvents
      const events: ExecutionEvent[] = this._state.history
        .filter(e => e.payload.workflowId === workflowId || (e.payload.metadata as Record<string, unknown>)?.workflowId === workflowId)
        .map(e => ({
          type: e.type,
          workflowId: (e.payload.workflowId as string) || (e.payload.metadata as Record<string, unknown>)?.workflowId as string,
          taskId: e.payload.taskId as string,
          toolName: e.payload.toolName as string,
          description: e.payload.description as string,
          status: e.payload.status as string,
          timestamp: e.timestamp,
          result: e.payload.result
        }));

      // 2. Analyze execution
      const analysis = await this._executionAnalyzer.analyze(workflowId, events);

      // 3. Reflect on analysis
      const reflection = await this._reflectionEngine.reflect(analysis);

      // 4. Store in memory (Persistent/Semantic)
      await this._memory.consolidateWithReflection(workflowId, reflection);
      
      this._eventBus.publish('agent:events', {
        type: AgentEventType.KNOWLEDGE_UPDATED,
        payload: {
          workflowId,
          type: 'reflection',
          summary: `Reflected on workflow ${workflowId.slice(0, 8)}: ${reflection.success ? 'Success' : 'Failure'}`,
          metadata: reflection.metadata
        },
        timestamp: Date.now()
      });

      // 4b. Store in session memory (Episodic)
      await this._memory.addSessionEvent({
        type: AgentEventType.REFLECTION,
        workflowId,
        reflection,
        timestamp: Date.now()
      });

      // 5. Emit reflection event
      const reflectionEvent: AgentReflectionEvent = {
        type: AgentEventType.REFLECTION,
        payload: {
          workflowId,
          reflection: {
            success: reflection.success,
            confidenceScore: reflection.confidenceScore,
            lessonsLearned: reflection.lessonsLearned,
            mistakes: reflection.mistakes,
            improvements: reflection.improvements
          },
          metadata: reflection.metadata
        },
        timestamp: Date.now()
      };

      this._eventBus.publish('agent:events', reflectionEvent);
      
      // 6. Invoke ImprovementEngine again after reflection
      this.runSelfImprovement();

      Logger.info(`[AgentRuntime] Reflection completed for workflow: ${workflowId}`);

    } catch (error) {
      Logger.error(`[AgentRuntime] Error during reflection for ${workflowId}:`, error as Error);
      // Reflection failures should not crash the runtime
    }
  }

  public getState(): AgentState {
    return { 
      ...this._state,
      identity: this._identity,
      metrics: (this._monitor?.getMetrics() as unknown as Record<string, unknown>) || undefined
    };
  }

  private async recordEvent(event: AgentEvent): Promise<void> {
    this._state.history.push(event);
    await this.saveState();
  }

  private async onUserMessage(text: string): Promise<void> {
    // Phase 8.7: Missions are the preferred way to interact with the system.
    // The ExecutiveBrain now listens for USER_MESSAGE events and creates missions.
    this._stream.thought(`Received user message: "${text}". Delegating to ExecutiveBrain mission synthesis.`, 'observation');
  }

  private async onWorkspaceAction(action: string, metadata?: Record<string, unknown>): Promise<void> {
    Logger.info(`[AgentRuntime] Workspace action: ${action}`, metadata);
    if (action === 'REPLAN') {
      const goal = await this._memory.recallGoal();
      if (goal) await this.processGoal(goal);
    }
  }

  private async onToolResult(toolName: string, result: unknown): Promise<void> {
    Logger.info(`[AgentRuntime] Reactive tool result for ${toolName}:`, { result });
  }

  public registerPlanner(planner: Planner): void {
    this._planner = planner;
  }

  public registerExecutor(executor: Executor): void {
    this._executor = executor;
    this._workflowEngine = new WorkflowEngine(executor);
  }

  public registerMemory(memory: MemoryManager): void {
    this._memory = memory;
  }
}
