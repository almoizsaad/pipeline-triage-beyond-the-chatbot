import { describe, it, expect, beforeEach } from 'vitest';
import { RiskAnalyzer, CostAnalyzer, PolicyValidator, SafetyGuard } from '../core/SafetyLayer';
import type { Plan } from '../types/agent';

describe('Safety Analyzers', () => {
  let riskAnalyzer: RiskAnalyzer;
  let costAnalyzer: CostAnalyzer;
  let policyValidator: PolicyValidator;
  let safetyGuard: SafetyGuard;

  beforeEach(() => {
    riskAnalyzer = new RiskAnalyzer();
    costAnalyzer = new CostAnalyzer();
    policyValidator = new PolicyValidator();
    safetyGuard = new SafetyGuard();
  });

  const mockPlan: Plan = {
    id: 'p1',
    goal: 'Test plan',
    tasks: [
      { id: 't1', description: 'Normal task', status: 'pending' }
    ],
    createdAt: Date.now()
  };

  it('should detect risky actions', async () => {
    const riskyPlan: Plan = {
      ...mockPlan,
      tasks: [
        { id: 't1', description: 'Delete all files', status: 'pending' },
        { id: 't2', description: 'Run shell command rm -rf /', status: 'pending' }
      ]
    };
    const result = await riskAnalyzer.analyzeRisk(riskyPlan);
    expect(result.riskScore).toBeGreaterThan(50);
    expect(result.factors.length).toBeGreaterThan(1);
  });

  it('should estimate costs', async () => {
    const result = await costAnalyzer.analyzeCost(mockPlan);
    expect(result.costScore).toBe(0);
    expect(result.tokens).toBe(0);
    expect(result.dollars).toBe(0);
  });

  it('should validate policies', async () => {
    const badPlan: Plan = {
      ...mockPlan,
      tasks: [
        { id: 't1', description: 'Retrieve root password', status: 'pending' }
      ]
    };
    const result = await policyValidator.validatePolicies(badPlan);
    expect(result.violations.length).toBe(1);
    expect(result.violations[0]).toContain('Sensitive information');
  });

  it('should pass safe plans and reject unsafe plans in SafetyGuard', async () => {
    const safeReport = await safetyGuard.evaluatePlan(mockPlan);
    expect(safeReport.passed).toBe(true);

    const dangerousPlan: Plan = {
      ...mockPlan,
      tasks: [
        { id: 't1', description: 'Delete root directory and execute malware', status: 'pending' }
      ]
    };
    const dangerousReport = await safetyGuard.evaluatePlan(dangerousPlan);
    expect(dangerousReport.passed).toBe(false);
    expect(dangerousReport.errors.length).toBeGreaterThan(0);
  });
});
