import type { SystemInstruction } from '../types/improvement';
import { PersistenceManager } from '../core/PersistenceManager';

/**
 * PromptOptimizer manages the dynamic evolution of system instructions.
 */
export class PromptOptimizer {
  private instructions: SystemInstruction[] = [];
  private persistence: PersistenceManager;
  private readonly STORE_NAME = 'settings';
  private readonly KEY = 'dynamic_instructions';

  constructor() {
    this.persistence = PersistenceManager.getInstance();
    this.init();
  }

  private async init() {
    const data = await this.persistence.get(this.STORE_NAME, this.KEY);
    if (data) {
      this.instructions = data;
    }
  }

  public async addInstructions(newInstructions: SystemInstruction[]): Promise<void> {
    // Add new instructions, avoiding duplicates by content
    for (const inst of newInstructions) {
      const existing = this.instructions.find(i => i.content === inst.content);
      if (existing) {
        existing.confidence = (existing.confidence + inst.confidence) / 2;
        existing.lastUsed = Date.now();
      } else {
        this.instructions.push(inst);
      }
    }

    // Keep only top 20 most confident/relevant instructions to avoid prompt bloat
    this.instructions.sort((a, b) => b.confidence - a.confidence);
    this.instructions = this.instructions.slice(0, 20);

    await this.save();
  }

  public getActiveInstructions(): SystemInstruction[] {
    return this.instructions.filter(i => i.confidence >= 0.3);
  }

  public async recordUsage(id: string): Promise<void> {
    const inst = this.instructions.find(i => i.id === id);
    if (inst) {
      inst.usageCount++;
      inst.lastUsed = Date.now();
      await this.save();
    }
  }

  private async save() {
    await this.persistence.save(this.STORE_NAME, { key: this.KEY, data: this.instructions });
  }

  /**
   * Generates a string to be injected into the LLM prompt.
   */
  public getPromptOverlay(): string {
    const active = this.getActiveInstructions();
    if (active.length === 0) return '';

    let overlay = '\n--- LEARNED SYSTEM IMPROVEMENTS ---\n';
    
    const policies = active.filter(i => i.type === 'policy');
    if (policies.length > 0) {
      overlay += '\nPOLICIES & CONSTRAINTS:\n';
      policies.forEach(i => overlay += `- ${i.content}\n`);
    }

    const tips = active.filter(i => i.type === 'tip' || i.type === 'skill');
    if (tips.length > 0) {
      overlay += '\nPRO-TIPS & STRATEGIES:\n';
      tips.forEach(i => overlay += `- ${i.content}\n`);
    }

    overlay += '\n------------------------------------\n';
    return overlay;
  }
}
