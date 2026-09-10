import { EventBus } from './EventBus';
import { PersistenceManager } from './PersistenceManager';

export interface APIMetric {
  provider: string;
  operation: string;
  status: 'success' | 'failure';
  latency: number;
  tokens?: number;
  cost?: number;
  timestamp: number;
}

export interface ProviderStats {
  totalCalls: number;
  successRate: number;
  avgLatency: number;
  totalTokens: number;
  totalCost: number;
  lastUsed: number;
  healthStatus: 'optimal' | 'degraded' | 'critical';
}

/**
 * APIMetricsManager tracks usage, costs, and health of all external APIs.
 */
export class APIMetricsManager {
  private static instance: APIMetricsManager;
  private eventBus: EventBus;
  private metrics: APIMetric[] = [];
  private providerStats: Map<string, ProviderStats> = new Map();
  private persistence: PersistenceManager;
  private readonly STORE_NAME = 'settings';
  private readonly STATS_KEY = 'api_provider_stats';
  private isInitialized = false;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.persistence = PersistenceManager.getInstance();
  }

  public static getInstance(eventBus: EventBus): APIMetricsManager {
    if (!APIMetricsManager.instance) {
      APIMetricsManager.instance = new APIMetricsManager(eventBus);
    }
    return APIMetricsManager.instance;
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    await this.loadStats();
    this.isInitialized = true;
  }

  private async loadStats(): Promise<void> {
    try {
      const entry = await this.persistence.get(this.STORE_NAME, this.STATS_KEY);
      if (entry && typeof entry.data === 'object') {
        Object.entries(entry.data).forEach(([provider, stats]) => {
          this.providerStats.set(provider, stats as ProviderStats);
        });
        console.info(`[APIMetricsManager] Loaded stats for ${Object.keys(entry.data).length} providers.`);
      }
    } catch (e) {
      console.warn('[APIMetricsManager] Failed to load stats:', e);
    }
  }

  private async saveStats(): Promise<void> {
    const data = this.getAllStats();
    await this.persistence.save(this.STORE_NAME, { key: this.STATS_KEY, data });
  }

  public recordMetric(metric: Omit<APIMetric, 'timestamp'>): void {
    const fullMetric: APIMetric = { ...metric, timestamp: Date.now() };
    this.metrics.push(fullMetric);
    this.updateStats(fullMetric);
    
    // Broadcast for UI/Monitoring
    this.eventBus.publish('system:telemetry', {
      type: 'API_METRIC',
      payload: fullMetric
    } as any);

    // Keep memory clean
    if (this.metrics.length > 1000) this.metrics.shift();

    // Persist stats
    this.saveStats().catch(e => console.error('[APIMetricsManager] Failed to save stats:', e));
  }

  private updateStats(metric: APIMetric): void {
    const stats = this.providerStats.get(metric.provider) || {
      totalCalls: 0,
      successRate: 1,
      avgLatency: 0,
      totalTokens: 0,
      totalCost: 0,
      lastUsed: 0,
      healthStatus: 'optimal'
    };

    stats.totalCalls++;
    stats.lastUsed = metric.timestamp;
    stats.totalTokens += metric.tokens || 0;
    stats.totalCost += metric.cost || 0;
    
    // Rolling average for latency
    stats.avgLatency = (stats.avgLatency * (stats.totalCalls - 1) + metric.latency) / stats.totalCalls;

    // Recalculate health and success rate based on recent metrics
    const recentMetrics = this.metrics
      .filter(m => m.provider === metric.provider)
      .slice(-50);
    
    const successCount = recentMetrics.filter(m => m.status === 'success').length;
    // If we have recent metrics, use them for success rate, otherwise keep current
    if (recentMetrics.length > 0) {
      stats.successRate = successCount / recentMetrics.length;
    }

    const failureCount = recentMetrics.filter(m => m.status === 'failure').length;
    const failureRate = recentMetrics.length > 0 ? failureCount / recentMetrics.length : 0;

    if (failureRate > 0.3) stats.healthStatus = 'critical';
    else if (failureRate > 0.1) stats.healthStatus = 'degraded';
    else stats.healthStatus = 'optimal';

    this.providerStats.set(metric.provider, stats);
  }

  public getStats(provider: string): ProviderStats | undefined {
    return this.providerStats.get(provider);
  }

  public getAllStats(): Record<string, ProviderStats> {
    const result: Record<string, ProviderStats> = {};
    this.providerStats.forEach((stats, provider) => {
      result[provider] = stats;
    });
    return result;
  }
}
