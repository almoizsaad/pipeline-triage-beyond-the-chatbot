import type { ComponentDefinition } from './ComponentDefinition';

/**
 * ComponentRegistry manages the mapping between component types (strings) 
 * and actual React component implementations.
 */
export class ComponentRegistry {
  private registry: Map<string, ComponentDefinition> = new Map();

  public register(definition: ComponentDefinition): void {
    if (this.registry.has(definition.type)) {
      console.warn(`[ComponentRegistry] Overwriting component for type: ${definition.type}`);
    }
    this.registry.set(definition.type, definition);
  }

  public unregister(type: string): void {
    this.registry.delete(type);
  }

  public resolve(type: string): ComponentDefinition | undefined {
    return this.registry.get(type);
  }

  public listComponents(): ComponentDefinition[] {
    return Array.from(this.registry.values());
  }

  public clear(): void {
    this.registry.clear();
  }
}

export const globalComponentRegistry = new ComponentRegistry();
