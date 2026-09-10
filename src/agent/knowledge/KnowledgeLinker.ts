import type { 
  IKnowledgeGraph, 
  RelationType
} from '../types/knowledge';
import type { LLMProvider } from '../providers/LLMProvider';

/**
 * KnowledgeLinker manages the structural relationships in the Knowledge Graph.
 * It uses LLMs to autonomously infer semantic connections between disparate facts.
 */
export class KnowledgeLinker {
  private graph: IKnowledgeGraph;
  private provider?: LLMProvider;

  constructor(graph: IKnowledgeGraph, provider?: LLMProvider) {
    this.graph = graph;
    this.provider = provider;
  }

  public async linkNodes(
    sourceId: string, 
    targetId: string, 
    type: RelationType, 
    weight: number = 0.5,
    properties: Record<string, unknown> = {}
  ): Promise<void> {
    await this.graph.createRelation(sourceId, targetId, type, weight, properties);
  }

  /**
   * Uses LLM to autonomously discover connections between a new node and existing graph knowledge.
   */
  public async inferRelations(nodeId: string): Promise<void> {
    if (!this.provider) return;

    const node = await this.graph.getNode(nodeId);
    if (!node) return;

    // 1. Get recent/relevant nodes for context
    const existingNodes = Array.from(this.graph.nodes.values())
      .filter(n => n.id !== nodeId)
      .slice(-10); // Check against last 10 nodes for efficiency

    if (existingNodes.length === 0) return;

    const prompt = `
      As a Knowledge Graph Architect, analyze the relationship between a NEW discovery and EXISTING knowledge.
      
      NEW DISCOVERY:
      Label: ${node.label}
      Properties: ${JSON.stringify(node.properties)}
      
      EXISTING NODES:
      ${existingNodes.map(n => `- ID: ${n.id}, Label: ${n.label}`).join('\n')}
      
      TASK:
      Identify if the NEW discovery relates to any of the EXISTING nodes.
      Possible relations: 'references', 'depends_on', 'causes', 'contradicts', 'refines'.
      
      OUTPUT:
      Return a JSON array of relations: [{ "targetId": "...", "type": "...", "reason": "...", "weight": 0.0-1.0 }]
      Return empty array if no clear relation exists.
    `;

    try {
      const relations = await this.provider.generateStructuredOutput<any[]>(prompt, {});
      if (Array.isArray(relations)) {
        for (const rel of relations) {
          await this.linkNodes(nodeId, rel.targetId, rel.type, rel.weight || 0.6, { reason: rel.reason });
          console.info(`[KnowledgeLinker] Inferred relation: ${node.label} --(${rel.type})--> ${rel.targetId}`);
        }
      }
    } catch (e) {
      console.warn(`[KnowledgeLinker] Failed to infer relations for ${nodeId}:`, e);
    }
  }

  public async linkDocumentToConcepts(docNodeId: string, conceptNodeIds: string[]): Promise<void> {
    for (const conceptId of conceptNodeIds) {
      await this.linkNodes(docNodeId, conceptId, 'references', 0.8);
    }
  }

  public async linkPlanToTools(planNodeId: string, toolNodeIds: string[]): Promise<void> {
    for (const toolId of toolNodeIds) {
      await this.linkNodes(planNodeId, toolId, 'depends_on', 1.0);
    }
  }

  public async linkAgentToPlans(agentNodeId: string, planNodeIds: string[]): Promise<void> {
    for (const planId of planNodeIds) {
      await this.linkNodes(agentNodeId, planId, 'causes', 0.9);
    }
  }
}
