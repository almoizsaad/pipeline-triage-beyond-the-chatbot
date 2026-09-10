import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnifiedEventBus } from '../core/UnifiedEventBus';
import type { UnifiedEvent } from '../types/events';

describe('UnifiedEventBus', () => {
  let bus: UnifiedEventBus;

  beforeEach(() => {
    bus = new UnifiedEventBus();
  });

  it('should publish and subscribe to direct matches', () => {
    const listener = vi.fn();
    bus.subscribe('agent.user_message', listener);

    const event: UnifiedEvent = {
      type: 'agent.user_message',
      payload: { text: 'hello' },
      timestamp: Date.now()
    };

    bus.publish(event);
    expect(listener).toHaveBeenCalledWith(event);
  });

  it('should support namespace wildcards', () => {
    const listener = vi.fn();
    bus.subscribe('agent.*', listener);

    const event1: UnifiedEvent = {
      type: 'agent.login',
      payload: {},
      timestamp: Date.now()
    };
    const event2: UnifiedEvent = {
      type: 'agent.logout',
      payload: {},
      timestamp: Date.now()
    };
    const event3: UnifiedEvent = {
      type: 'workspace.click',
      payload: {},
      timestamp: Date.now()
    };

    bus.publish(event1);
    bus.publish(event2);
    bus.publish(event3);

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenCalledWith(event1);
    expect(listener).toHaveBeenCalledWith(event2);
  });

  it('should support global wildcards', () => {
    const listener = vi.fn();
    bus.subscribe('*', listener);

    bus.publish({ type: 'a.b', payload: {}, timestamp: Date.now() });
    bus.publish({ type: 'c.d', payload: {}, timestamp: Date.now() });

    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('should unsubscribe correctly', () => {
    const listener = vi.fn();
    const unsubscribe = bus.subscribe('test', listener);

    bus.publish({ type: 'test', payload: {}, timestamp: Date.now() });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    bus.publish({ type: 'test', payload: {}, timestamp: Date.now() });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
