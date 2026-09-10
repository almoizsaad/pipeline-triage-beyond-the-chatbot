import type { Mission, MissionGoal, MissionStatus } from '../types/mission';
import { EventBus } from './EventBus';
import { AgentEventType } from '../types/agent';
import { PersistenceManager } from './PersistenceManager';

export class GoalManager {
  private missions: Map<string, Mission> = new Map();
  private eventBus: EventBus;
  private persistence: PersistenceManager;
  private readonly STORE_NAME = 'missions';
  private isInitialized = false;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.persistence = PersistenceManager.getInstance();
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    await this.loadMissions();
    this.isInitialized = true;
  }

  private async loadMissions(): Promise<void> {
    const savedMissions = await this.persistence.getAll(this.STORE_NAME) as Mission[];
    if (savedMissions && Array.isArray(savedMissions)) {
      savedMissions.forEach(m => this.missions.set(m.id, m));
      console.info(`[GoalManager] Loaded ${savedMissions.length} missions from IndexedDB.`);
    }
  }

  private async saveMission(mission: Mission): Promise<void> {
    await this.persistence.save(this.STORE_NAME, mission);
  }

  public async createMission(title: string, goal: MissionGoal, context: Record<string, unknown> = {}): Promise<Mission> {
    await this.init();
    const mission: Mission = {
      id: crypto.randomUUID(),
      title,
      goal,
      context,
      constraints: [],
      status: 'idle',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      plans: [],
      runningAgents: [],
      timeline: [],
      thoughts: [],
      reflections: [],
      memoryUpdates: [],
      knowledgeUpdates: []
    };
    
    this.missions.set(mission.id, mission);
    await this.saveMission(mission);

    this.eventBus.publish('agent:events', {
      type: AgentEventType.MISSION_CREATED as any,
      payload: { mission },
      timestamp: Date.now()
    });

    return mission;
  }

  public getMission(id: string): Mission | undefined {
    return this.missions.get(id);
  }

  public async updateMissionStatus(id: string, status: MissionStatus): Promise<void> {
    await this.init();
    const mission = this.missions.get(id);
    if (mission) {
      mission.status = status;
      mission.updatedAt = Date.now();
      await this.saveMission(mission);

      this.eventBus.publish('agent:events', {
        type: AgentEventType.MISSION_STATUS_UPDATED as any,
        payload: { missionId: id, status, mission },
        timestamp: Date.now()
      });
    }
  }

  public getAllMissions(): Mission[] {
    return Array.from(this.missions.values());
  }

  public getActiveMissions(): Mission[] {
    return this.getAllMissions().filter(m => m.status === 'running');
  }

  public async deleteMission(id: string): Promise<boolean> {
    await this.init();
    const deleted = this.missions.delete(id);
    if (deleted) {
      await this.persistence.delete(this.STORE_NAME, id);
    }
    return deleted;
  }
}
