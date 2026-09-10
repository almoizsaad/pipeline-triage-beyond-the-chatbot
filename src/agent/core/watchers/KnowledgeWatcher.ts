import { BaseWatcher } from './Watcher';
import { EventBus } from '../EventBus';
import { KnowledgeGraph } from '../../knowledge/KnowledgeGraph';
import { ExecutiveBrain } from '../ExecutiveBrain';

/**
 * KnowledgeWatcher proactively identifies gaps in the agent's knowledge
 * and triggers autonomous research missions to fill them.
 */
export class KnowledgeWatcher extends BaseWatcher {
  public readonly name = 'KnowledgeWatcher';
  private graph: KnowledgeGraph;
  private brain: ExecutiveBrain;

  constructor(eventBus: EventBus, graph: KnowledgeGraph, brain: ExecutiveBrain) {
    super(eventBus);
    this.graph = graph;
    this.brain = brain;
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    console.info(`[Watcher] ${this.name} started.`);
    this.startMaintenanceLoop();
  }

  private startMaintenanceLoop(): void {
    const INTERVAL = 300000; // 5 minutes
    
    const run = async () => {
      if (!this.isRunning) return;
      
      try {
        await this.identifyAndFillGaps();
      } catch (error) {
        console.error(`[KnowledgeWatcher] Error during maintenance:`, error);
      }
      
      setTimeout(run, INTERVAL);
    };

    run();
  }

  private async identifyAndFillGaps(): Promise<void> {
    // Proactive logic: look for important nodes with few connections 
    // or placeholder nodes that need detailed research.
    const nodes = Array.from(this.graph.nodes.values());
    const researchTargets = nodes.filter(n => 
      n.type === 'concept' && 
      (n.properties.needsResearch === true || Object.keys(n.properties).length < 3)
    );

    if (researchTargets.length > 0) {
      const target = researchTargets[0];
      console.info(`[KnowledgeWatcher] Identified knowledge gap: ${target.label}. Spawning proactive research mission.`);
      
      await this.brain.createMission(`Proactive Research: ${target.label}`, {
        description: `Perform detailed research on "${target.label}" to enrich the system's knowledge base.`,
        successCriteria: [`Found detailed facts about ${target.label}`, `Updated knowledge graph with new relations`],
        priority: 'low'
      }, { proactive: true, nodeId: target.id });

      // Mark as being researched to avoid duplicate missions
      target.properties.needsResearch = false;
      target.properties.researchStartedAt = Date.now();
      await this.graph.updateNode(target.id, { properties: target.properties });
    }
  }
}
