import type { IThoughtPersistence, Thought, ThoughtChain, ThoughtQuery } from '../types/thought';
import { PersistenceManager } from '../core/PersistenceManager';

/**
 * ThoughtPersistence handles long-term storage of agent reasoning steps.
 */
export class ThoughtPersistence implements IThoughtPersistence {
  private persistence: PersistenceManager;
  private readonly THOUGHTS_KEY = 'thoughts';
  private readonly CHAINS_KEY = 'chains';
  private readonly STORE_NAME = 'settings';
  private saveLock: Promise<void> = Promise.resolve();

  constructor() {
    this.persistence = PersistenceManager.getInstance();
  }

  public async saveThought(thought: Thought): Promise<void> {
    this.saveLock = this.saveLock.then(async () => {
      const thoughts = await this.getAllThoughts();
      thoughts.push(thought);
      
      if (thoughts.length > 1000) {
        thoughts.shift();
      }
      
      await this.persistence.save(this.STORE_NAME, { key: this.THOUGHTS_KEY, data: thoughts });
    });
    return this.saveLock;
  }

  public async saveChain(chain: ThoughtChain): Promise<void> {
    this.saveLock = this.saveLock.then(async () => {
      const chains = await this.getAllChains();
      const index = chains.findIndex(c => c.id === chain.id);
      if (index >= 0) {
        chains[index] = { ...chain }; // Store a copy
      } else {
        chains.push({ ...chain });
        
        if (chains.length > 100) {
          chains.shift();
        }
      }
      await this.persistence.save(this.STORE_NAME, { key: this.CHAINS_KEY, data: chains });
    });
    return this.saveLock;
  }

  public async getThought(id: string): Promise<Thought | null> {
    const thoughts = await this.getAllThoughts();
    return thoughts.find(t => t.id === id) || null;
  }

  public async getChain(id: string): Promise<ThoughtChain | null> {
    const chains = await this.getAllChains();
    return chains.find(c => c.id === id) || null;
  }

  public async findThoughts(query: ThoughtQuery): Promise<Thought[]> {
    let thoughts = await this.getAllThoughts();

    if (query.agentId) thoughts = thoughts.filter(t => t.agentId === query.agentId);
    if (query.workflowId) thoughts = thoughts.filter(t => t.workflowId === query.workflowId);
    if (query.taskId) thoughts = thoughts.filter(t => t.taskId === query.taskId);
    if (query.type) thoughts = thoughts.filter(t => t.type === query.type);
    if (query.startTime) thoughts = thoughts.filter(t => t.timestamp >= query.startTime!);
    if (query.endTime) thoughts = thoughts.filter(t => t.timestamp <= query.endTime!);

    // Newest first
    thoughts.sort((a, b) => b.timestamp - a.timestamp);

    if (query.limit) thoughts = thoughts.slice(0, query.limit);

    return thoughts;
  }

  public async findChains(query: { agentId?: string; workflowId?: string }): Promise<ThoughtChain[]> {
    let chains = await this.getAllChains();

    if (query.agentId) chains = chains.filter(c => c.agentId === query.agentId);
    if (query.workflowId) chains = chains.filter(c => c.workflowId === query.workflowId);

    // Newest first
    chains.sort((a, b) => b.startTime - a.startTime);

    return chains;
  }

  private async getAllThoughts(): Promise<Thought[]> {
    const entry = await this.persistence.get(this.STORE_NAME, this.THOUGHTS_KEY);
    return entry && Array.isArray(entry.data) ? entry.data : [];
  }

  private async getAllChains(): Promise<ThoughtChain[]> {
    const entry = await this.persistence.get(this.STORE_NAME, this.CHAINS_KEY);
    return entry && Array.isArray(entry.data) ? entry.data : [];
  }
}
