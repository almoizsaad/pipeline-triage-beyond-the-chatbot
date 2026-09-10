import { EventBus } from './EventBus';
import { AgentEventType } from '../types/agent';
import { AgentRegistry } from './AgentRegistry';
import { KnowledgeGraph } from '../knowledge/KnowledgeGraph';
import { KnowledgeDatabase } from '../knowledge/KnowledgeDatabase';
import { ThoughtManager } from '../reflection/ThoughtManager';
import { ImprovementEngine } from '../improvement/ImprovementEngine';
import { PromptOptimizer } from '../improvement/PromptOptimizer';

/**
 * ContinuousLearning service processes reflections to evolve agent capabilities and skills.
 */
export class ContinuousLearning {
  private eventBus: EventBus;
  private graph?: KnowledgeGraph;
  private db?: KnowledgeDatabase;
  private thoughtManager?: ThoughtManager;
  private improvementEngine?: ImprovementEngine;
  private promptOptimizer?: PromptOptimizer;

  constructor(
    eventBus: EventBus, 
    _registry: AgentRegistry, 
    graph?: KnowledgeGraph, 
    db?: KnowledgeDatabase,
    thoughtManager?: ThoughtManager,
    improvementEngine?: ImprovementEngine,
    promptOptimizer?: PromptOptimizer
  ) {
    this.eventBus = eventBus;
    this.graph = graph;
    this.db = db;
    this.thoughtManager = thoughtManager;
    this.improvementEngine = improvementEngine;
    this.promptOptimizer = promptOptimizer;
    this.setupListeners();
  }

  private setupListeners(): void {
    this.eventBus.subscribe('agent:events', (event) => {
      if (event.type === AgentEventType.REFLECTION) {
        this.processReflection(event.payload);
      }
    });
  }

  private async processReflection(payload: any): Promise<void> {
    const { workflowId, reflection } = payload;
    console.info(`[ContinuousLearning] Processing reflection for ${workflowId}...`);

    // 1. Core Learning (Knowledge)
    if (reflection.success) {
      await this.learnFromSuccess(workflowId, reflection);
    } else {
      await this.learnFromFailure(workflowId, reflection);
    }

    // 2. Self-Improvement Loop (Prompt Optimization)
    if (this.thoughtManager && this.improvementEngine && this.promptOptimizer) {
      const chains = await this.thoughtManager.getChains(workflowId);
      if (chains.length > 0) {
        const analysis = await this.thoughtManager.analyzeChain(chains[0].id);
        const instructions = this.improvementEngine.analyzeForPromptOptimization(reflection, analysis);
        if (instructions.length > 0) {
          console.info(`[ContinuousLearning] Generated ${instructions.length} prompt optimizations for future missions.`);
          await this.promptOptimizer.addInstructions(instructions);
        }
      }
    }

    if (reflection.improvements.length > 0) {
      this.evolveSkills(reflection.improvements);
    }

    if (reflection.mistakes.length > 0) {
      this.updatePolicies(reflection.mistakes);
    }
  }

  private async learnFromSuccess(workflowId: string, reflection: any): Promise<void> {
    const confidence = reflection.confidenceScore || 0.9;
    
    // 1. Evolve Knowledge Graph
    if (this.graph) {
      const relatedNodes = await this.graph.searchNodes(workflowId);
      for (const node of relatedNodes) {
        await this.graph.evolveNode(node.id, 'Validated by successful execution', confidence);
      }
    }

    // 2. Evolve Knowledge Database
    if (this.db) {
      const relatedEntries = await this.db.search(workflowId, { threshold: 0.1 });
      for (const result of relatedEntries) {
        const entry = result.entry;
        const newConfidence = (entry.metadata.confidence + confidence) / 2;
        await this.db.update(entry.id, {
          metadata: {
            ...entry.metadata,
            confidence: newConfidence,
            importance: Math.min(1, entry.metadata.importance + 0.1)
          }
        });
      }
    }

    console.info(`[ContinuousLearning] Reinforced knowledge for ${workflowId} (Success).`);
  }

  private async learnFromFailure(workflowId: string, reflection: any): Promise<void> {
    const penalty = 0.3;
    
    // 1. Evolve Knowledge Graph
    if (this.graph) {
      const relatedNodes = await this.graph.searchNodes(workflowId);
      for (const node of relatedNodes) {
        await this.graph.evolveNode(node.id, `Failure: ${reflection.mistakes[0] || 'Unknown'}`, penalty);
      }
    }

    // 2. Evolve Knowledge Database
    if (this.db) {
      const relatedEntries = await this.db.search(workflowId, { threshold: 0.1 });
      for (const result of relatedEntries) {
        const entry = result.entry;
        const newConfidence = entry.metadata.confidence * penalty;
        await this.db.update(entry.id, {
          metadata: {
            ...entry.metadata,
            confidence: newConfidence
          }
        });
      }
    }

    console.warn(`[ContinuousLearning] Flagged knowledge issues for ${workflowId} (Failure).`);
  }


  private evolveSkills(improvements: string[]): void {
    improvements.forEach(improvement => {
      console.info(`[ContinuousLearning] Evolving skill based on improvement: ${improvement}`);
      // In a real system, this might update the LLM prompt with new "skills" or "tips"
      this.eventBus.publish('system:skill_evolution', { improvement, timestamp: Date.now() } as any);
    });
  }

  private updatePolicies(mistakes: string[]): void {
    mistakes.forEach(mistake => {
      console.info(`[ContinuousLearning] Updating policy based on mistake: ${mistake}`);
      // In a real system, this might add a new constraint to the agent's system prompt
      this.eventBus.publish('system:policy_update', { mistake, timestamp: Date.now() } as any);
    });
  }
}
