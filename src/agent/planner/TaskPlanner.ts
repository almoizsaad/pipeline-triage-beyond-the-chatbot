import type { Planner, Plan } from '../types/agent';
import type { StructuredTask } from './schemas';

/**
 * TaskPlanner provides a basic, deterministic implementation of the Planner interface.
 * It uses simple keyword matching to decompose a goal into a set of predefined tasks.
 */
export class TaskPlanner implements Planner {
  /**
   * Generates a Plan based on a user goal and current agent state.
   */
  public async generatePlan(goal: string): Promise<Plan> {
    const tasks: StructuredTask[] = this.decomposeGoal(goal);
    
    return {
      id: crypto.randomUUID(),
      goal,
      tasks,
      createdAt: Date.now(),
    };
  }

  /**
   * Decomposes a goal into a list of tasks using basic pattern matching.
   */
  private decomposeGoal(goal: string): StructuredTask[] {
    const normalizedGoal = goal.toLowerCase();
    const taskData: Array<{ desc: string, tool: string }> = [];

    // Basic heuristic rules for decomposition
    if (normalizedGoal.includes('trip') || normalizedGoal.includes('plan')) {
      if (normalizedGoal.includes('trip')) {
        taskData.push(
          { desc: 'Search Flights', tool: 'search_flights' },
          { desc: 'Find Hotels', tool: 'find_hotels' },
          { desc: 'Check Weather', tool: 'get_current_weather' }
        );
      }
    }

    if (normalizedGoal.includes('convert') || normalizedGoal.includes('exchange')) {
      taskData.push({ desc: 'Lookup Exchange Rate', tool: 'exchange_rate_lookup' });
    }

    if (normalizedGoal.includes('weather')) {
      taskData.push({ desc: 'Get Weather', tool: 'get_current_weather' });
    }

    // Default task if no rules match
    if (taskData.length === 0) {
      taskData.push({ desc: `Process: ${goal}`, tool: 'clock' });
    }

    return taskData.map((data) => ({
      id: crypto.randomUUID(),
      description: data.desc,
      tool: data.tool,
      dependencies: [],
      status: 'pending',
    }));
  }
}
