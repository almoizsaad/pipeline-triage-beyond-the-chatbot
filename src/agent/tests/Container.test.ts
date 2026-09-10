import { describe, it, expect, beforeEach } from 'vitest';
import { ServiceContainer } from '../core/ServiceContainer';

describe('ServiceContainer', () => {
  let container: ServiceContainer;

  beforeEach(() => {
    container = new ServiceContainer();
  });

  it('should register and resolve singletons', () => {
    const instance = { name: 'test' };
    container.registerSingleton('test', instance);
    
    expect(container.resolve('test')).toBe(instance);
    expect(container.resolve('test')).toBe(container.resolve('test'));
  });

  it('should register and resolve transients', () => {
    let count = 0;
    container.registerTransient('test', () => ({ count: ++count }));

    const r1 = container.resolve<{ count: number }>('test');
    const r2 = container.resolve<{ count: number }>('test');

    expect(r1.count).toBe(1);
    expect(r2.count).toBe(2);
    expect(r1).not.toBe(r2);
  });

  it('should register and resolve scoped services', () => {
    let count = 0;
    container.registerScoped('test', () => ({ count: ++count }));

    const scope1 = container.createScope();
    const scope2 = container.createScope();

    const r1_s1 = scope1.resolve<{ count: number }>('test');
    const r2_s1 = scope1.resolve<{ count: number }>('test');
    const r1_s2 = scope2.resolve<{ count: number }>('test');

    expect(r1_s1.count).toBe(1);
    expect(r2_s1.count).toBe(1); // Same instance within scope
    expect(r1_s1).toBe(r2_s1);

    expect(r1_s2.count).toBe(2); // New instance in different scope
    expect(r1_s1).not.toBe(r1_s2);
  });

  it('should resolve from parent container', () => {
    container.registerSingleton('global', { val: 1 });
    const scope = container.createScope();
    
    expect(scope.resolve('global')).toBe(container.resolve('global'));
  });

  it('should throw if service not found', () => {
    expect(() => container.resolve('missing')).toThrow('Service not found: missing');
  });

  it('should support class-based registration', () => {
    class MyService {
      public id = Math.random();
    }

    container.registerSingleton(MyService, MyService);
    const s1 = container.resolve(MyService);
    const s2 = container.resolve(MyService);

    expect(s1).toBeInstanceOf(MyService);
    expect(s1).toBe(s2);
  });
});
