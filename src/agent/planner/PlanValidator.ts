import type { StructuredPlan } from './schemas';
import type { ToolRegistry } from '../tools/ToolRegistry';

/**
 * PlanValidator ensures that a generated plan is safe, logical, and executable.
 */
export class PlanValidator {
  private toolRegistry: ToolRegistry;

  constructor(toolRegistry: ToolRegistry) {
    this.toolRegistry = toolRegistry;
  }

  /**
   * Validates a plan against the tool registry and dependency rules.
   */
  public validate(plan: StructuredPlan): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 1. Required fields
    if (!plan.id) errors.push('Plan is missing an ID.');
    if (!plan.tasks || plan.tasks.length === 0) errors.push('Plan must contain at least one task.');
    if (!plan.goal) errors.push('Plan is missing a goal.');

    // 2. Validate tasks
    const taskIds = new Set(plan.tasks.map(t => t.id));

    plan.tasks.forEach((task, index) => {
      const prefix = `Task[${index}] (${task.id || 'unnamed'}): `;

      // Check required fields
      if (!task.id) errors.push(`${prefix}Missing ID.`);
      if (!task.description) errors.push(`${prefix}Missing description.`);
      if (!task.tool) errors.push(`${prefix}Missing tool.`);

      // Validate tools
      if (task.tool && !this.toolRegistry.hasTool(task.tool)) {
        errors.push(`${prefix}Tool "${task.tool}" is not registered in the system.`);
      }

      // Validate dependencies
      if (task.dependencies) {
        task.dependencies.forEach(depId => {
          if (!taskIds.has(depId)) {
            errors.push(`${prefix}Dependency "${depId}" does not exist in the plan.`);
          }
          if (depId === task.id) {
            errors.push(`${prefix}Self-dependency detected.`);
          }
        });
      }
    });

    // 3. Detect cycles (Simple check for now)
    if (this.hasCycles(plan)) {
      errors.push('The plan contains circular dependencies.');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private hasCycles(plan: StructuredPlan): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const checkCycle = (taskId: string): boolean => {
      if (recStack.has(taskId)) return true;
      if (visited.has(taskId)) return false;

      visited.add(taskId);
      recStack.add(taskId);

      const task = plan.tasks.find(t => t.id === taskId);
      if (task?.dependencies) {
        for (const depId of task.dependencies) {
          if (checkCycle(depId)) return true;
        }
      }

      recStack.delete(taskId);
      return false;
    };

    for (const task of plan.tasks) {
      if (checkCycle(task.id)) return true;
    }

    return false;
  }
}
