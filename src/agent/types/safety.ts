import type { Plan } from './agent';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface SafetyScore {
  riskScore: number;       // 0-100 (lower is better)
  costScore: number;       // 0-100 (lower is better)
  safetyScore: number;     // 0-100 (higher is better)
  confidence: number;      // 0-100 (higher is better)
}

export interface SafetyReport {
  planId: string;
  timestamp: number;
  score: SafetyScore;
  passed: boolean;
  warnings: string[];
  errors: string[];
  riskAnalysis: {
    level: RiskLevel;
    factors: string[];
  };
  costAnalysis: {
    estimatedTokens: number;
    estimatedDollars: number;
    limitExceeded: boolean;
  };
  policyViolations: string[];
}

export interface ISafetyGuard {
  evaluatePlan(plan: Plan): Promise<SafetyReport>;
}

export interface IRiskAnalyzer {
  analyzeRisk(plan: Plan): Promise<{ riskScore: number; factors: string[] }>;
}

export interface ICostAnalyzer {
  analyzeCost(plan: Plan): Promise<{ costScore: number; tokens: number; dollars: number }>;
}

export interface IPolicyValidator {
  validatePolicies(plan: Plan): Promise<{ violations: string[] }>;
}
