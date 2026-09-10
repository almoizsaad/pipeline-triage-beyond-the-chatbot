import { EventBus } from '../core/EventBus';
import type { IThoughtPersistence, Thought, ThoughtChain, ThoughtAnalysis } from '../types/thought';
import { ThoughtPersistence } from './ThoughtPersistence';
import { ThoughtAnalyzer } from './ThoughtAnalyzer';
import { PersistentMemory } from '../memory/PersistentMemory';

/**
 * ThoughtManager orchestrates the persistence and chaining of agent thoughts.
 */
export class ThoughtManager {
  private persistence: IThoughtPersistence;
  private analyzer: ThoughtAnalyzer;
  private eventBus: EventBus;
  private chainPromises: Map<string, Promise<ThoughtChain>> = new Map();

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.persistence = new ThoughtPersistence();
    this.analyzer = new ThoughtAnalyzer();
    this.setupListeners();
  }

  private setupListeners(): void {
    // Listen for thought generation events
    this.eventBus.subscribe('agent:thoughts', (event: unknown) => {
      const e = event as { type: string; payload: { thought: Thought } };
      if (e.type === 'THOUGHT_GENERATED') {
        const { thought } = e.payload;
        this.handleThought(thought);
      }
    });
  }

  private async handleThought(thought: Thought): Promise<void> {
    // 1. Persist individual thought
    await this.persistence.saveThought(thought);

    // 2. Manage chains if workflowId is present
    if (thought.workflowId) {
      let chainPromise = this.chainPromises.get(thought.workflowId);
      
      if (!chainPromise) {
        chainPromise = (async () => {
          const existingChain = await this.persistence.getChain(thought.workflowId!);
          return existingChain || {
            id: thought.workflowId!, // Use workflowId as chain ID for simplicity
            thoughts: [],
            agentId: thought.agentId,
            workflowId: thought.workflowId,
            startTime: thought.timestamp
          };
        })();
        this.chainPromises.set(thought.workflowId, chainPromise);
      }
      
      const chain = await chainPromise;
      chain.thoughts.push(thought);
      chain.endTime = thought.timestamp;
      
      // Persist updated chain
      await this.persistence.saveChain(chain);
    }
  }

  public getPersistence(): IThoughtPersistence {
    return this.persistence;
  }

  public async getChains(workflowId: string): Promise<ThoughtChain[]> {
    return await this.persistence.findChains({ workflowId });
  }

  public async analyzeChain(chainId: string): Promise<ThoughtAnalysis> {
    const chain = await this.persistence.getChain(chainId);
    if (!chain) throw new Error(`Chain ${chainId} not found`);
    return await this.analyzer.analyzeChain(chain);
  }

  /**
   * Finalizes a chain and removes it from active memory.
   */
  public async finalizeChain(workflowId: string): Promise<void> {
    const chainPromise = this.chainPromises.get(workflowId);
    if (chainPromise) {
      const chain = await chainPromise;
      await this.persistence.saveChain(chain);
      this.chainPromises.delete(workflowId);
    }
  }
}
