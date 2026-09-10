import { describe, it, expect } from 'vitest';
import { bootstrapRuntime } from '../bootstrap/runtimeBootstrap';
import { MissionIntelligence } from '../core/MissionIntelligence';
import { GoalManager } from '../core/GoalManager';

describe('Runtime Bootstrap', () => {
  it('should successfully bootstrap the entire runtime without missing services', () => {
    // We need to mock window since it's used in bootstrapRuntime
    (global as any).window = (global as any).window || {};
    
    const container = bootstrapRuntime();
    
    expect(container.resolve(MissionIntelligence)).toBeInstanceOf(MissionIntelligence);
    expect(container.resolve(GoalManager)).toBeInstanceOf(GoalManager);
  });
});
