import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from '../core/EventBus';
import { AgentMessageBus } from '../core/AgentMessageBus';
import { WorkspaceEventBus } from '../../workspace/events/WorkspaceEventBus';
import { globalUnifiedBus } from '../core/UnifiedEventBus';
import { AgentEventType } from '../types/agent';
import { WorkspaceEventType } from '../../workspace/events/types';
import { MessagePriority } from '../types/communication';

describe('Migration Compatibility', () => {
  beforeEach(() => {
    globalUnifiedBus.clear();
  });

  it('EventBus should adapt to UnifiedEventBus', () => {
    const legacyBus = new EventBus();
    const listener = vi.fn();
    
    legacyBus.subscribe('agent:events', listener);
    const event = { 
      type: AgentEventType.AGENT_UPDATE, 
      payload: { status: 'idle' },
      timestamp: Date.now()
    };
    legacyBus.publish('agent:events', event);

    expect(listener).toHaveBeenCalledWith(event);
  });

  it('WorkspaceEventBus should adapt to UnifiedEventBus', () => {
    const wsBus = new WorkspaceEventBus();
    const listener = vi.fn();

    wsBus.onEvent(listener);
    const event = { 
      type: WorkspaceEventType.SELECT_COMPONENT, 
      source: 'button', 
      payload: { id: 'c1' },
      timestamp: Date.now()
    };
    wsBus.emit(event);

    expect(listener).toHaveBeenCalled();
  });

  it('AgentMessageBus should adapt via underlying EventBus', async () => {
    const legacyBus = new EventBus();
    const msgBus = new AgentMessageBus(legacyBus);
    const listener = vi.fn();

    msgBus.subscribe('agent1', listener);
    await msgBus.publish({
      id: 'm1',
      type: 'DIRECT_MESSAGE',
      sender: 'agent2',
      receiver: 'agent1',
      payload: { text: 'hi' },
      timestamp: Date.now(),
      priority: MessagePriority.NORMAL,
      metadata: {}
    });

    expect(listener).toHaveBeenCalled();
  });

  it('UnifiedEventBus should receive events from legacy adapters', () => {
    const legacyBus = new EventBus();
    const unifiedListener = vi.fn();
    
    globalUnifiedBus.subscribe('agent.*', unifiedListener);
    legacyBus.publish('agent:events', { 
      type: AgentEventType.AGENT_UPDATE, 
      payload: { status: 'thinking' },
      timestamp: Date.now()
    });

    expect(unifiedListener).toHaveBeenCalled();
  });
});
