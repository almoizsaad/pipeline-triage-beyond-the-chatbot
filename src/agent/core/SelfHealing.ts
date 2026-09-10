import { EventBus } from './EventBus';
import { AgentEventType } from '../types/agent';

/**
 * SelfHealing service listens for system anomalies and triggers corrective actions.
 */
export class SelfHealing {
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.setupListeners();
  }

  private setupListeners(): void {
    this.eventBus.subscribe('system:anomaly', (anomaly) => {
      this.handleAnomaly(anomaly);
    });

    this.eventBus.subscribe('agent:events', (event) => {
      if (event.type === AgentEventType.ERROR) {
        this.handleError(event.payload);
      }
    });
  }

  private handleAnomaly(anomaly: any): void {
    console.warn(`[SelfHealing] Detected anomaly: ${anomaly.type}. Triggering recovery...`);
    
    if (anomaly.type === 'HEALTH_CRITICAL') {
      this.triggerEmergencyShutdown();
    }
  }

  private handleError(error: any): void {
    if (error.fatal) {
      console.error(`[SelfHealing] Critical error detected: ${error.message}. Attempting restart...`);
      // In a real OS, this might trigger a process restart
    }
  }

  private triggerEmergencyShutdown(): void {
    console.error('[SelfHealing] EMERGENCY SHUTDOWN TRIGGERED due to system health.');
    // Logic to gracefully stop all missions
    this.eventBus.publish('system:shutdown', { reason: 'critical_health' } as any);
  }
}
