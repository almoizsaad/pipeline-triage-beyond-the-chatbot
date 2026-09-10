import type { Thought } from './thought';
export type { Thought };

export const AgentEventType = {
  USER_MESSAGE: 'USER_MESSAGE',
  WORKSPACE_ACTION: 'WORKSPACE_ACTION',
  TOOL_RESULT: 'TOOL_RESULT',
  AGENT_UPDATE: 'AGENT_UPDATE',
  ERROR: 'ERROR',
  AGENT_LIFECYCLE: 'AGENT_LIFECYCLE',
  REFLECTION: 'REFLECTION',
  THOUGHT_GENERATED: 'THOUGHT_GENERATED',
  MISSION_CREATED: 'MISSION_CREATED',
  MISSION_STATUS_UPDATED: 'MISSION_STATUS_UPDATED',
  KNOWLEDGE_UPDATED: 'KNOWLEDGE_UPDATED',
  MESSAGE_BUS_STATS: 'SYS_MESSAGE_BUS_STATS',
  TASK_ASSIGNED: 'SYS_TASK_ASSIGNED',
  TASK_COMPLETED: 'SYS_TASK_COMPLETED',
  AGENT_PERFORMANCE: 'SYS_AGENT_PERFORMANCE',
} as const;

export type AgentEventType = typeof AgentEventType[keyof typeof AgentEventType];

export const AgentActionType = {
  UPDATE_WORKSPACE: 'UPDATE_WORKSPACE',
  REQUEST_TOOL: 'REQUEST_TOOL',
  SHOW_NOTIFICATION: 'SHOW_NOTIFICATION',
  UPDATE_PLAN: 'UPDATE_PLAN',
  AGENT_UPDATE: 'AGENT_UPDATE',
  RENDER_COMPONENT: 'RENDER_COMPONENT',
  UPDATE_COMPONENT: 'UPDATE_COMPONENT',
  UPDATE_ENTITY: 'UPDATE_ENTITY',
  REQUIRE_APPROVAL: 'REQUIRE_APPROVAL',
  SPAWN_AGENT: 'SPAWN_AGENT',
  TERMINATE_AGENT: 'TERMINATE_AGENT',
} as const;

export type AgentActionType = typeof AgentActionType[keyof typeof AgentActionType];

export type AgentStatus = 'idle' | 'thinking' | 'executing' | 'error' | 'paused';

export interface Task {
  id: string;
  description: string;
  status: 'pending' | 'in-progress' | 'running' | 'completed' | 'failed';
  tool?: string;
  dependencies?: string[];
  metadata?: Record<string, unknown>;
}

export interface Plan {
  id: string;
  tasks: Task[];
  goal: string;
  reasoning?: string;
  createdAt: number;
}

export type AgentRole = 'orchestrator' | 'worker' | 'specialist' | 'critic' | 'coordinator';

export interface AgentIdentity {
  id: string;
  name: string;
  role: AgentRole;
  capabilities: string[];
  metadata?: Record<string, unknown>;
}

export interface AgentState {
  status: AgentStatus;
  currentPlan?: Plan;
  history: AgentEvent[];
  identity?: AgentIdentity;
  metrics?: Record<string, unknown>;
}

export interface AgentEvent {
  type: AgentEventType;
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface AgentAction {
  type: AgentActionType;
  payload: Record<string, unknown>;
}

// --- Protocol Actions ---

export interface UpdateWorkspaceAction {
  type: typeof AgentActionType.UPDATE_WORKSPACE;
  payload: {
    files?: Array<{ path: string; content: string }>;
    deleteFiles?: string[];
    metadata?: Record<string, unknown>;
  };
}

export interface RequestToolAction {
  type: typeof AgentActionType.REQUEST_TOOL;
  payload: {
    toolName: string;
    args: Record<string, unknown>;
  };
}

export interface ShowNotificationAction {
  type: typeof AgentActionType.SHOW_NOTIFICATION;
  payload: {
    message: string;
    level: 'info' | 'warning' | 'error' | 'success';
  };
}

export interface UpdatePlanAction {
  type: typeof AgentActionType.UPDATE_PLAN;
  payload: {
    planId: string;
    tasks: Array<{
      id: string;
      status: 'pending' | 'in-progress' | 'running' | 'completed' | 'failed';
    }>;
  };
}

export interface AgentUpdateAction {
  type: typeof AgentActionType.AGENT_UPDATE;
  payload: {
    status: string;
    message?: string;
    progress?: number;
    data?: Record<string, unknown>;
  };
}

export interface RenderComponentAction {
  type: typeof AgentActionType.RENDER_COMPONENT;
  payload: {
    id: string;
    type: string;
    props: Record<string, unknown>;
    status: 'loading' | 'ready' | 'error' | 'stale';
    metadata?: Record<string, unknown>;
  };
}

export interface RequireApprovalAction {
  type: typeof AgentActionType.REQUIRE_APPROVAL;
  payload: {
    requestId: string;
    message: string;
    action: AgentProtocolAction;
  };
}

export interface SpawnAgentAction {
  type: typeof AgentActionType.SPAWN_AGENT;
  payload: {
    name: string;
    role: AgentRole;
    capabilities: string[];
    goal?: string;
  };
}

export interface TerminateAgentAction {
  type: typeof AgentActionType.TERMINATE_AGENT;
  payload: {
    agentId: string;
  };
}

export interface UpdateComponentAction {
  type: typeof AgentActionType.UPDATE_COMPONENT;
  payload: {
    id: string;
    updates: Record<string, unknown>;
  };
}

export interface UpdateEntityAction {
  type: typeof AgentActionType.UPDATE_ENTITY;
  payload: Record<string, unknown>;
}

export type AgentProtocolAction =
  | UpdateWorkspaceAction
  | RequestToolAction
  | ShowNotificationAction
  | UpdatePlanAction
  | AgentUpdateAction
  | RenderComponentAction
  | RequireApprovalAction
  | SpawnAgentAction
  | TerminateAgentAction
  | UpdateComponentAction
  | UpdateEntityAction;

// --- Protocol Events ---

export interface UserMessageEvent extends AgentEvent {
  type: typeof AgentEventType.USER_MESSAGE;
  payload: {
    text: string;
    sender: 'user';
  };
}

export interface WorkspaceActionEvent extends AgentEvent {
  type: typeof AgentEventType.WORKSPACE_ACTION;
  payload: {
    action: string;
    path?: string;
    metadata?: Record<string, unknown>;
  };
}

export interface ToolResultEvent extends AgentEvent {
  type: typeof AgentEventType.TOOL_RESULT;
  payload: {
    toolName: string;
    result: unknown;
    success: boolean;
  };
}

export interface AgentUpdateEvent extends AgentEvent {
  type: typeof AgentEventType.AGENT_UPDATE;
  payload: {
    status: string;
    message?: string;
    progress?: number;
    agentId?: string;
  };
}

export interface ErrorEvent extends AgentEvent {
  type: typeof AgentEventType.ERROR;
  payload: {
    code: string;
    message: string;
    details?: unknown;
    fatal: boolean;
    agentId?: string;
  };
}

export interface AgentLifecycleEvent extends AgentEvent {
  type: typeof AgentEventType.AGENT_LIFECYCLE;
  payload: {
    agentId: string;
    action: 'spawned' | 'destroyed' | 'paused' | 'resumed' | 'restarted';
    identity: AgentIdentity;
  };
}

export interface AgentReflectionEvent extends AgentEvent {
  type: typeof AgentEventType.REFLECTION;
  payload: {
    workflowId: string;
    reflection: {
      success: boolean;
      confidenceScore: number;
      lessonsLearned: string[];
      mistakes: string[];
      improvements: string[];
    };
    metadata?: Record<string, unknown>;
  };
}

export interface ThoughtGeneratedEvent extends AgentEvent {
  type: typeof AgentEventType.THOUGHT_GENERATED;
  payload: {
    thought: Thought;
  };
}

export interface MissionCreatedEvent extends AgentEvent {
  type: typeof AgentEventType.MISSION_CREATED;
  payload: {
    mission: any; // Using any to avoid circular dependency with mission types
  };
}

export interface MissionStatusUpdatedEvent extends AgentEvent {
  type: typeof AgentEventType.MISSION_STATUS_UPDATED;
  payload: {
    missionId: string;
    status: string;
    mission: any;
  };
}

export interface KnowledgeUpdatedEvent extends AgentEvent {
  type: typeof AgentEventType.KNOWLEDGE_UPDATED;
  payload: {
    workflowId?: string;
    type: string;
    summary: string;
    metadata?: Record<string, unknown>;
  };
}

export const SystemTelemetryType = {
  MESSAGE_BUS_STATS: 'SYS_MESSAGE_BUS_STATS',
  TASK_ASSIGNED: 'SYS_TASK_ASSIGNED',
  TASK_COMPLETED: 'SYS_TASK_COMPLETED',
  AGENT_PERFORMANCE: 'SYS_AGENT_PERFORMANCE',
} as const;

export type SystemTelemetryType = typeof SystemTelemetryType[keyof typeof SystemTelemetryType];

export interface SystemTelemetryEvent {
  type: SystemTelemetryType;
  payload: Record<string, any>;
  timestamp: number;
}

export type AgentProtocolEvent = 
  | UserMessageEvent 
  | WorkspaceActionEvent 
  | ToolResultEvent 
  | AgentUpdateEvent
  | ErrorEvent
  | AgentLifecycleEvent
  | AgentReflectionEvent
  | ThoughtGeneratedEvent
  | MissionCreatedEvent
  | MissionStatusUpdatedEvent
  | KnowledgeUpdatedEvent
  | SystemTelemetryEvent;

// --- Extension Points ---

export interface Planner {
  generatePlan(goal: string, state: AgentState): Promise<Plan>;
}

export interface Executor {
  executeTask(task: Task, context: Record<string, unknown>): Promise<Record<string, unknown>>;
}

export interface Memory {
  store(key: string, value: unknown): Promise<void>;
  retrieve(key: string): Promise<unknown>;
  search(query: string): Promise<unknown[]>;
}
