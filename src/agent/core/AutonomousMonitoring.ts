import { EventBus } from './EventBus';
import { AgentEventType } from '../types/agent';

export interface SystemHealth {
  status: 'optimal' | 'degraded' | 'critical';
  uptime: number;
  activeMissions: number;
  completedMissions: number;
  failedMissions: number;
  averageLatency: number;
  memoryUsage: number;
}

/**
 * AutonomousMonitoring observes the system state and detects anomalies.
 */
export class AutonomousMonitoring {
  private eventBus: EventBus;
  private startTime: number;
  private stats = {
    completed: 0,
    failed: 0,
    totalLatency: 0,
    count: 0
  };

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.startTime = Date.now();
    this.setupListeners();
  }

  private setupListeners(): void {
    this.eventBus.subscribe('agent:events', (event) => {
      if (event.type === AgentEventType.MISSION_STATUS_UPDATED as any) {
        const { status } = event.payload as any;
        if (status === 'completed') this.stats.completed++;
        if (status === 'failed') this.stats.failed++;
      }

      if (event.type === AgentEventType.TOOL_RESULT) {
        const { latency } = event.payload as any;
        if (latency) {
          this.stats.totalLatency += latency;
          this.stats.count++;
        }
      }
    });

    this.eventBus.subscribe('system:heartbeat', () => {
      this.publishHealth();
    });

    this.eventBus.subscribe('system:shutdown', () => {
      this.resetStats();
    });
  }

  private resetStats(): void {
    this.stats = {
      completed: 0,
      failed: 0,
      totalLatency: 0,
      count: 0
    };
    this.startTime = Date.now();
    console.info('[AutonomousMonitoring] System statistics reset due to shutdown/recovery.');
  }

  private publishHealth(): void {
    const health: SystemHealth = {
      status: this.calculateStatus(),
      uptime: Date.now() - this.startTime,
      activeMissions: 0, // Should be fetched from GoalManager
      completedMissions: this.stats.completed,
      failedMissions: this.stats.failed,
      averageLatency: this.stats.count > 0 ? this.stats.totalLatency / this.stats.count : 0,
      memoryUsage: (performance as any)?.memory?.usedJSHeapSize || 0
    };

    this.eventBus.publish('system:health', health as any);

    if (health.status === 'critical') {
      this.eventBus.publish('system:anomaly', {
        type: 'HEALTH_CRITICAL',
        details: health,
        timestamp: Date.now()
      } as any);
    }
  }

  private calculateStatus(): SystemHealth['status'] {
    if (this.stats.failed > 5 && (this.stats.failed / (this.stats.completed + this.stats.failed)) > 0.2) {
      return 'critical';
    }
    if (this.stats.failed > 2) {
      return 'degraded';
    }
    return 'optimal';
  }
}
