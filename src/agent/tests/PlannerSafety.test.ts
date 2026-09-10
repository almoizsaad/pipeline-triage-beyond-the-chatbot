import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMPlanner } from '../planner/LLMPlanner';
import { MockLLMProvider } from '../providers/MockLLMProvider';
import { ToolRegistry } from '../tools/ToolRegistry';
import { SafetyGuard } from '../core/SafetyLayer';
import { createTestTool } from './testUtils';

describe('Planner Safety Integration', () => {
  let provider: MockLLMProvider;
  let registry: ToolRegistry;
  let safetyGuard: SafetyGuard;

  beforeEach(() => {
    provider = new MockLLMProvider();
    registry = new ToolRegistry();
    safetyGuard = new SafetyGuard();
    
    // Register mock tools to pass validation
    registry.register(createTestTool({ name: 'delete_logs', description: 'Delete logs' }));
    registry.register(createTestTool({ name: 'exec_malware', description: 'Exec malware' }));
    registry.register(createTestTool({ name: 'get_weather', description: 'Get weather' }));
  });

  it('LLMPlanner should reject unsafe plans', async () => {
    const planner = new LLMPlanner(provider, registry, undefined, undefined, undefined, safetyGuard);
    
    // Mock the provider to return a dangerous plan
    vi.spyOn(provider, 'generateStructuredOutput').mockResolvedValue(JSON.stringify({
      id: 'p-dangerous',
      goal: 'Hack system',
      reasoning: 'I need to hack',
      tasks: [
        { id: 't1', description: 'Delete all logs', status: 'pending', tool: 'delete_logs' },
        { id: 't2', description: 'Execute shell malware', status: 'pending', tool: 'exec_malware' }
      ]
    }));

    await expect(planner.generatePlan('Dangerous Goal', { status: 'idle', history: [] }))
      .rejects.toThrow('Safety Violation');
  });

  it('should allow safe plans', async () => {
    const planner = new LLMPlanner(provider, registry, undefined, undefined, undefined, safetyGuard);
    
    vi.spyOn(provider, 'generateStructuredOutput').mockResolvedValue(JSON.stringify({
      id: 'p-safe',
      goal: 'Read weather',
      reasoning: 'Check if sunny',
      tasks: [
        { id: 't1', description: 'Get weather for Tokyo', status: 'pending', tool: 'get_weather' }
      ]
    }));

    const plan = await planner.generatePlan('Weather Tokyo', { status: 'idle', history: [] });
    expect(plan.id).toBe('p-safe');
  });
});
