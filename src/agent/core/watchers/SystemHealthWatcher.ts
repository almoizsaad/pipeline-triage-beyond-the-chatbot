import { BaseWatcher } from './Watcher';
import { EventBus } from '../EventBus';
import { APIMetricsManager } from '../APIMetricsManager';

/**
 * SystemHealthWatcher monitors API health and system load to optimize autonomous operations.
 */
export class SystemHealthWatcher extends BaseWatcher {
  public readonly name = 'SystemHealthWatcher';
  private metricsManager: APIMetricsManager;

  constructor(eventBus: EventBus, metricsManager: APIMetricsManager) {
    super(eventBus);
    this.metricsManager = metricsManager;
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    console.info(`[Watcher] ${this.name} started.`);
    this.monitor();
  }

  private monitor(): void {
    const CHECK_INTERVAL = 60000; // 1 minute
    
    const check = () => {
      if (!this.isRunning) return;
      
      const stats = this.metricsManager.getAllStats();
      const criticalProviders = Object.entries(stats).filter(([_, s]) => s.healthStatus === 'critical');
      
      if (criticalProviders.length > 0) {
        console.warn(`[SystemHealthWatcher] Critical API providers detected: ${criticalProviders.map(p => p[0]).join(', ')}`);
        this.eventBus.publish('system:anomaly', {
          type: 'CRITICAL_API_HEALTH',
          providers: criticalProviders.map(p => p[0]),
          timestamp: Date.now()
        } as any);
      }
      
      setTimeout(check, CHECK_INTERVAL);
    };

    check();
  }
}
