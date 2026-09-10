import { GoalManager } from './GoalManager';
import type { Mission } from '../types/mission';

/**
 * MissionIntelligence provides search and analytics for missions.
 */
export class MissionIntelligence {
  private goalManager: GoalManager;

  constructor(goalManager: GoalManager) {
    this.goalManager = goalManager;
  }

  public searchMissions(query: string): Mission[] {
    const all = this.goalManager.getAllMissions();
    const q = query.toLowerCase();
    return all.filter(m => 
      m.title.toLowerCase().includes(q) || 
      m.goal.description.toLowerCase().includes(q)
    );
  }

  public getAnalytics() {
    const all = this.goalManager.getAllMissions();
    const stats = {
      total: all.length,
      completed: all.filter(m => m.status === 'completed').length,
      failed: all.filter(m => m.status === 'failed').length,
      running: all.filter(m => m.status === 'running').length,
      avgDuration: 0,
      successRate: 0
    };

    if (stats.total > 0) {
      stats.successRate = (stats.completed / stats.total) * 100;
    }

    return stats;
  }
}
