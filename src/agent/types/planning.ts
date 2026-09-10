import type { Plan, Task, AgentRole } from './agent';

export interface DelegatedTask extends Task {
  assigneeId?: string;
  assignedRole?: AgentRole;
  subPlan?: CooperativePlan;
  tool?: string;
}

export interface CooperativePlan extends Plan {
  tasks: DelegatedTask[];
  parentId?: string;
  coordinatorId: string;
}

export interface TaskAssignment {
  taskId: string;
  agentId: string;
  role: AgentRole;
}

export interface ConflictResolution {
  type: 'retry' | 'reassign' | 'replan';
  reason: string;
  affectedTasks: string[];
}

export interface PlannerConsensus {
  planId: string;
  approvals: string[]; // agentIds
  status: 'pending' | 'agreed' | 'rejected';
}
