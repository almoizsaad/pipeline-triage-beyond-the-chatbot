import { EventBus } from '../../agent/core/EventBus';
import { globalUnifiedBus } from '../../agent/core/UnifiedEventBus';
import type { WorkspaceEvent } from './types';

/**
 * WorkspaceEventBus specializes the generic EventBus for UI-Agent interactions.
 */
export class WorkspaceEventBus extends EventBus<WorkspaceEvent> {
  public static TOPIC = 'workspace.events';

  constructor() {
    super(globalUnifiedBus);
  }

  public emit(event: WorkspaceEvent): void {
    console.log(`[WorkspaceEventBus] Emitting: ${event.type} from ${event.source}`);
    this.publish(WorkspaceEventBus.TOPIC, event);
  }

  public onEvent(callback: (event: WorkspaceEvent) => void): () => void {
    return this.subscribe(WorkspaceEventBus.TOPIC, callback);
  }
}

export const globalWorkspaceBus = new WorkspaceEventBus();
