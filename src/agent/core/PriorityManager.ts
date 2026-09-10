import type { Mission, MissionPriority } from '../types/mission';

export class PriorityManager {
  private priorityWeights: Record<MissionPriority, number> = {
    'low': 1,
    'medium': 2,
    'high': 3,
    'critical': 4
  };

  public getPriorityValue(priority: MissionPriority): number {
    return this.priorityWeights[priority];
  }

  public sortMissionsByPriority(missions: Mission[]): Mission[] {
    return [...missions].sort((a, b) => {
      const priorityA = this.getPriorityValue(a.goal.priority);
      const priorityB = this.getPriorityValue(b.goal.priority);
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Higher priority first
      }
      
      return a.createdAt - b.createdAt; // Older missions first if same priority
    });
  }

  public shouldInterrupt(activeMission: Mission, newMission: Mission): boolean {
    const activePriority = this.getPriorityValue(activeMission.goal.priority);
    const newPriority = this.getPriorityValue(newMission.goal.priority);
    
    // Interrupt if new mission is higher priority
    return newPriority > activePriority;
  }
}
