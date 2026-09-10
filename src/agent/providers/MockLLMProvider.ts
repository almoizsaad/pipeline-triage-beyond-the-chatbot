import type { LLMProvider } from './LLMProvider';

/**
 * A mock LLM provider for testing and development.
 */
export class MockLLMProvider implements LLMProvider {
  private mockResponse: any = null;

  public setMockResponse(response: any): void {
    this.mockResponse = response;
  }

  public async generateStructuredOutput<T>(prompt: string, _schema: any): Promise<T> {
    if (this.mockResponse) {
      return this.mockResponse as T;
    }

    // Default heuristics based on prompt keywords if no mock set
    if (prompt.toLowerCase().includes('trip') || prompt.toLowerCase().includes('tokyo') || prompt.toLowerCase().includes('china')) {
      return {
        id: 'mock-plan-trip',
        goal: 'Plan a trip',
        reasoning: 'Planning a trip requires searching for flights and hotels.',
        tasks: [
          { id: 'task_01', description: 'Search flights and hotels', tool: 'search', metadata: { query: 'flights and hotels' }, dependencies: [] },
          { id: 'task_02', description: 'Read travel guide', tool: 'search', metadata: { query: 'travel guide' }, dependencies: ['task_01'] }
        ]
      } as any as T;
    }

    if (prompt.toLowerCase().includes('diagnostic') || prompt.toLowerCase().includes('health')) {
      return {
        id: 'mock-plan-diagnostic',
        goal: 'Run diagnostics',
        reasoning: 'Evaluating system health requires running tool diagnostics.',
        tasks: [
          { id: 'task_01', description: 'Run tool diagnostics', tool: 'tool_diagnostics', dependencies: [] }
        ]
      } as any as T;
    }

    if (prompt.toLowerCase().includes('research')) {
      return {
        id: 'mock-plan-research',
        goal: 'Research topic',
        reasoning: 'Researching requires search and synthesis.',
        tasks: [
          { id: 'task_01', description: 'Search web', tool: 'search', metadata: { query: 'AI Agents' }, dependencies: [] },
          { id: 'task_02', description: 'Synthesize findings', tool: 'research_synthesis', metadata: { operation: 'summarize', sources: [] }, dependencies: ['task_01'] }
        ]
      } as any as T;
    }

    if (prompt.toLowerCase().includes('coding') || prompt.toLowerCase().includes('auth')) {
      return {
        id: 'mock-plan-coding',
        goal: 'Implement feature',
        reasoning: 'Coding requires writing files and verifying with terminal.',
        tasks: [
          { id: 'task_01', description: 'Write source code', tool: 'filesystem', metadata: { operation: 'write', path: 'src/feature.ts', content: '// Implementation' }, dependencies: [] },
          { id: 'task_02', description: 'Verify build', tool: 'terminal', metadata: { command: 'npm run build' }, dependencies: ['task_01'] }
        ]
      } as any as T;
    }

    if (prompt.toLowerCase().includes('ghost')) {
      return {
        id: 'mock-plan-fail',
        goal: 'Fail test',
        reasoning: 'Using a non-existent tool.',
        tasks: [
          { id: 'task_01', description: 'Ghost task', tool: 'ghost_tool', dependencies: [] }
        ]
      } as any as T;
    }

    if (prompt.toLowerCase().includes('cycle')) {
      return {
        id: 'mock-plan-cycle',
        goal: 'Cycle test',
        reasoning: 'Creating a circular dependency.',
        tasks: [
          { id: 'task_01', description: 'Task 1', tool: 'clock', dependencies: ['task_02'] },
          { id: 'task_02', description: 'Task 2', tool: 'clock', dependencies: ['task_01'] }
        ]
      } as any as T;
    }

    if (prompt.toLowerCase().includes('slow')) {
      return {
        id: 'mock-plan-slow',
        goal: 'Slow test',
        reasoning: 'Using a slow tool.',
        tasks: [
          { id: 'task_01', description: 'Slow task', tool: 'slow_tool', dependencies: [] }
        ]
      } as any as T;
    }

    if (prompt.toLowerCase().includes('flaky')) {
      return {
        id: 'mock-plan-flaky',
        goal: 'Flaky test',
        reasoning: 'Using a flaky tool.',
        tasks: [
          { id: 'task_01', description: 'Flaky task', tool: 'flaky_tool', dependencies: [] }
        ]
      } as any as T;
    }

    return {
      id: 'mock-plan-default',
      goal: 'Default goal',
      reasoning: 'Default mock reasoning.',
      tasks: [
        { id: 'task_01', description: 'Generic task', tool: 'clock', dependencies: [] }
      ]
    } as any as T;
  }

  public async generateText(prompt: string): Promise<string> {
    return `Mock text response for: ${prompt.substring(0, 50)}...`;
  }

  public async embed(text: string): Promise<number[]> {
    const size = 1536;
    const embedding = new Array(size).fill(0);
    const lowerText = text.toLowerCase();
    const words = lowerText.match(/\w+/g) || [];
    
    // Simple word-overlap based embedding
    words.forEach(word => {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = ((hash << 5) - hash) + word.charCodeAt(i);
        hash |= 0;
      }
      const index = Math.abs(hash) % size;
      embedding[index] += 1.0;
    });

    // Boost similarity for specific test keywords
    if (lowerText.includes('artificial intelligence') || lowerText.includes('ai')) {
      embedding[0] = 10.0;
    }
    if (lowerText.includes('space') || lowerText.includes('exploration')) {
      embedding[1] = 10.0;
    }
    if (lowerText.includes('paris') || lowerText.includes('france')) {
      embedding[2] = 10.0;
    }
    
    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(v => v / (norm || 1));
  }
}
