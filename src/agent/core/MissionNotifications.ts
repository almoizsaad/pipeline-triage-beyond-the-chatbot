import { EventBus } from './EventBus';
import { AgentEventType, AgentActionType } from '../types/agent';

/**
 * MissionNotifications service handles system-wide notifications for mission events.
 */
export class MissionNotifications {
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.setupListeners();
  }

  private setupListeners(): void {
    this.eventBus.subscribe('agent:events', (event) => {
      if (event.type === AgentEventType.MISSION_CREATED as any) {
        this.notify('Mission Created', `New mission: ${(event.payload as any).mission.title}`, 'info');
      }

      if (event.type === AgentEventType.MISSION_STATUS_UPDATED as any) {
        const { status, mission } = event.payload as any;
        if (status === 'completed') {
          this.notify('Mission Completed', `Mission "${mission.title}" succeeded.`, 'success');
        } else if (status === 'failed') {
          this.notify('Mission Failed', `Mission "${mission.title}" failed.`, 'error');
        }
      }
    });
  }

  private notify(title: string, message: string, level: 'info' | 'warning' | 'error' | 'success'): void {
    this.eventBus.publish('agent:actions', {
      type: AgentActionType.SHOW_NOTIFICATION,
      payload: { title, message, level }
    });
  }
}
