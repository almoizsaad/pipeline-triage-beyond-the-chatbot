import { EventBus } from './EventBus';
import { AgentEventType } from '../types/agent';

export interface InboxItem {
  id: string;
  type: 'message' | 'task' | 'alert';
  title: string;
  content: string;
  timestamp: number;
  read: boolean;
}

/**
 * MissionInbox provides a central place for user-facing mission messages and alerts.
 */
export class MissionInbox {
  private eventBus: EventBus;
  private items: InboxItem[] = [];

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.setupListeners();
  }

  private setupListeners(): void {
    this.eventBus.subscribe('agent:events', (event) => {
      if (event.type === AgentEventType.USER_MESSAGE) {
        this.addItem({
          id: crypto.randomUUID(),
          type: 'message',
          title: 'New Message',
          content: (event.payload as any).text,
          timestamp: Date.now(),
          read: false
        });
      }
    });
  }

  private addItem(item: InboxItem): void {
    this.items.unshift(item);
    this.eventBus.publish('system:inbox_update', { item } as any);
  }

  public getItems(): InboxItem[] {
    return this.items;
  }

  public markAsRead(id: string): void {
    const item = this.items.find(i => i.id === id);
    if (item) item.read = true;
  }
}
