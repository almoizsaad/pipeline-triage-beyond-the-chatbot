import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../core/EventBus';
import { AgentEventType } from '../types/agent';

describe('EventBus', () => {
  it('should subscribe and publish messages', () => {
    const bus = new EventBus();
    const listener = vi.fn();
    
    bus.subscribe('test:topic', listener);
    
    const message = { type: AgentEventType.USER_MESSAGE, payload: { text: 'hi', sender: 'user' as const }, timestamp: Date.now() };
    bus.publish('test:topic', message);
    
    expect(listener).toHaveBeenCalledWith(message);
  });

  it('should unsubscribe listeners', () => {
    const bus = new EventBus();
    const listener = vi.fn();
    
    const unsubscribe = bus.subscribe('test:topic', listener);
    unsubscribe();
    
    bus.publish('test:topic', { type: AgentEventType.USER_MESSAGE, payload: { text: 'hi', sender: 'user' }, timestamp: Date.now() });
    
    expect(listener).not.toHaveBeenCalled();
  });
});
