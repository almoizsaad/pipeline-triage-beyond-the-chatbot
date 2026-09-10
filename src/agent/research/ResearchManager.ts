import type { KnowledgeGraph } from '../knowledge/KnowledgeGraph';
import type { GraphNode, RelationType } from '../types/knowledge';

export interface ResearchFact {
  id: string;
  claim: string;
  source: string;
  url: string;
  timestamp: number;
  confidence: number;
  provider: string;
  metadata?: Record<string, unknown>;
}

export interface VerificationResult {
  factId: string;
  status: 'verified' | 'contradicted' | 'uncertain' | 'debunked';
  confidence: number;
  reasoning: string;
  supportingFactIds: string[];
  contradictingFactIds: string[];
}

/**
 * ResearchManager handles the lifecycle of research facts, including
 * storage in the Knowledge Graph and verification against multiple sources.
 */
export class ResearchManager {
  private graph: KnowledgeGraph;

  constructor(graph: KnowledgeGraph) {
    this.graph = graph;
  }

  /**
   * Records a new fact discovered during research with full provenance.
   */
  public async recordFact(fact: Omit<ResearchFact, 'id'>): Promise<GraphNode> {
    // Ensure all mandatory provenance fields are present
    if (!fact.source || !fact.url || !fact.provider || !fact.timestamp) {
      throw new Error('[ResearchManager] Missing mandatory provenance fields (source, url, provider, timestamp)');
    }

    const node = await this.graph.createNode({
      type: 'entity',
      label: fact.claim.substring(0, 50) + (fact.claim.length > 50 ? '...' : ''),
      properties: {
        ...fact,
        id: crypto.randomUUID(),
        claim: fact.claim,
        source: fact.source,
        url: fact.url,
        timestamp: fact.timestamp,
        confidence: fact.confidence,
        provider: fact.provider
      }
    });

    // Auto-verify against existing knowledge
    await this.verifyFact(node.id);

    return node;
  }

  /**
   * Verifies a fact by comparing it against other facts in the knowledge graph.
   * Detects support and contradictions, then assigns a refined confidence score.
   */
  public async verifyFact(factId: string): Promise<VerificationResult> {
    const node = await this.graph.getNode(factId);
    if (!node) throw new Error(`Fact node ${factId} not found`);

    if (!node.properties.claim) {
      return {
        factId,
        status: 'uncertain',
        confidence: 0,
        reasoning: 'Node does not contain a claim to verify.',
        supportingFactIds: [],
        contradictingFactIds: []
      };
    }

    const claim = (node.properties.claim as string).toLowerCase();
    const relatedNodes = Array.from(this.graph.nodes.values());
    
    const supporting: string[] = [];
    const contradicting: string[] = [];
    const baseConfidence = (node.properties.confidence as number) || 0.5;

    for (const related of relatedNodes) {
      if (related.id === factId) continue;
      if (related.type !== 'entity' || !related.properties.claim) continue;

      const relatedClaim = (related.properties.claim as string).toLowerCase();
      
      // Heuristic comparison (In a real system, this would use an LLM or NLI model)
      const cleanWords = (text: string) => text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2);
      
      const claimWords = cleanWords(claim);
      const relatedWords = cleanWords(relatedClaim);
      const commonWords = claimWords.filter(w => relatedWords.includes(w));
      
      const similarity = commonWords.length / Math.max(claimWords.length, relatedWords.length, 1);

      const hasNegation = (text: string) => /\b(not|never|no|cannot|isnt|arent|wasnt|werent|hoax|fake|false)\b/i.test(text);
      const hasNegationConflict = hasNegation(claim) !== hasNegation(relatedClaim);

      // Detection of contradiction (negation conflict with some similarity)
      if (similarity >= 0.1 && hasNegationConflict) {
        contradicting.push(related.id);
        await this.graph.createRelation(factId, related.id, 'references' as RelationType, similarity, { type: 'contradiction' });
      } 
      // Detection of support
      else if (similarity >= 0.35) {
        supporting.push(related.id);
        await this.graph.createRelation(factId, related.id, 'supports' as RelationType, similarity);
      }
    }

    // Assign Confidence based on support/contradiction
    let refinedConfidence = baseConfidence;
    if (supporting.length > 0) refinedConfidence += 0.1 * supporting.length;
    if (contradicting.length > 0) refinedConfidence -= 0.2 * contradicting.length;
    
    refinedConfidence = Math.max(0, Math.min(1, refinedConfidence));

    const status = refinedConfidence < 0.3 ? 'debunked' : 
                   contradicting.length > 0 ? 'contradicted' : 
                   (supporting.length > 0 ? 'verified' : 'uncertain');
    
    const result: VerificationResult = {
      factId,
      status,
      confidence: refinedConfidence,
      reasoning: `Found ${supporting.length} supporting sources and ${contradicting.length} contradicting sources. Base confidence adjusted from ${baseConfidence} to ${refinedConfidence.toFixed(2)}.`,
      supportingFactIds: supporting,
      contradictingFactIds: contradicting
    };

    // Update node with verification result
    await this.graph.updateNode(factId, {
      properties: {
        ...node.properties,
        verificationStatus: status,
        refinedConfidence,
        verificationReasoning: result.reasoning
      }
    });

    return result;
  }
}
