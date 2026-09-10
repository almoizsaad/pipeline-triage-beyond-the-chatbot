import { Mission } from '../types/mission';

export class MissionQueue {
  private queue: Mission[] = [];

  public enqueue(mission: Mission): void {
    if (this.queue.some(m => m.id === mission.id)) return;
    this.queue.push(mission);
    this.sort();
  }

  public dequeue(): Mission | undefined {
    return this.queue.shift();
  }

  public peek(): Mission | undefined {
    return this.queue[0];
  }

  public remove(missionId: string): boolean {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(m => m.id !== missionId);
    return this.queue.length < initialLength;
  }

  public getAll(): Mission[] {
    return [...this.queue];
  }

  public clear(): void {
    this.queue = [];
  }

  private sort(): void {
    const priorityMap = { high: 3, medium: 2, low: 1 };
    this.queue.sort((a, b) => {
      const pA = priorityMap[a.goal.priority as keyof typeof priorityMap] || 0;
      const pB = priorityMap[b.goal.priority as keyof typeof priorityMap] || 0;
      if (pA !== pB) return pB - pA;
      return a.createdAt - b.createdAt;
    });
  }

  public get length(): number {
    return this.queue.length;
  }
}
