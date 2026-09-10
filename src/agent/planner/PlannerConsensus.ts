import type { PlannerConsensus as IPlannerConsensus } from '../types/planning';

export class PlannerConsensus {
  private consensuses: Map<string, IPlannerConsensus> = new Map();

  public proposePlan(planId: string): void {
    this.consensuses.set(planId, {
      planId,
      approvals: [],
      status: 'pending'
    });
  }

  public approvePlan(planId: string, agentId: string): void {
    const consensus = this.consensuses.get(planId);
    if (consensus && consensus.status === 'pending') {
      if (!consensus.approvals.includes(agentId)) {
        consensus.approvals.push(agentId);
      }
    }
  }

  public rejectPlan(planId: string): void {
    const consensus = this.consensuses.get(planId);
    if (consensus) {
      consensus.status = 'rejected';
    }
  }

  public resolveConsensus(planId: string, requiredApprovals: number): 'agreed' | 'rejected' | 'pending' {
    const consensus = this.consensuses.get(planId);
    if (!consensus) return 'rejected';

    if (consensus.status === 'rejected') return 'rejected';

    if (consensus.approvals.length >= requiredApprovals) {
      consensus.status = 'agreed';
      return 'agreed';
    }

    return 'pending';
  }

  public getConsensus(planId: string): IPlannerConsensus | undefined {
    return this.consensuses.get(planId);
  }
}
