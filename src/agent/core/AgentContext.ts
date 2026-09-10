export interface AgentContextData {
  workspacePath: string;
  environment: 'development' | 'production' | 'test';
  config: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export class AgentContext {
  private data: AgentContextData;

  constructor(initialData: Partial<AgentContextData> = {}) {
    this.data = {
      workspacePath: initialData.workspacePath || '/',
      environment: initialData.environment || 'development',
      config: initialData.config || {},
      metadata: initialData.metadata || {},
    };
  }

  public get<K extends keyof AgentContextData>(key: K): AgentContextData[K] {
    return this.data[key];
  }

  public set<K extends keyof AgentContextData>(key: K, value: AgentContextData[K]): void {
    this.data[key] = value;
  }

  public updateConfig(config: Record<string, unknown>): void {
    this.data.config = { ...this.data.config, ...config };
  }

  public updateMetadata(metadata: Record<string, unknown>): void {
    this.data.metadata = { ...this.data.metadata, ...metadata };
  }

  public getAll(): AgentContextData {
    return { ...this.data };
  }
}
