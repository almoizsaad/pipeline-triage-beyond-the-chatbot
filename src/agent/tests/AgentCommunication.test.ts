import { describe, it, expect, vi } from 'vitest';
import { createAgent } from '../bootstrap/createAgent';
import { MessagePriority } from '../types/communication';
import type { AgentCommunicationMessage } from '../types/communication';
import { AgentInbox } from '../core/AgentInbox';

describe('Agent Communication Layer', () => {
  it('should support broadcast messaging', async () => {
    const { manager } = createAgent();
    const agent1 = manager.spawnAgent('Agent 1', 'worker', []);
    const agent2 = manager.spawnAgent('Agent 2', 'worker', []);
    
    const channel1 = agent1.getChannel()!;
    const channel2 = agent2.getChannel() as unknown as { inbox: AgentInbox };
    const inbox2 = channel2.inbox;
    
    const spy = vi.fn();
    inbox2.onMessage(spy);
    
    await channel1.broadcast('TEST_BROADCAST', { foo: 'bar' });
    
    // Give some time for event bus to propagate
    await new Promise(r => setTimeout(r, 10));
    
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'TEST_BROADCAST',
      payload: { foo: 'bar' },
      sender: agent1.getState().identity!.id,
      receiver: 'all'
    }));
  });

  it('should support multicast messaging by role', async () => {
    const { manager } = createAgent();
    const agent1 = manager.spawnAgent('Agent 1', 'orchestrator', []);
    const agent2 = manager.spawnAgent('Agent 2', 'worker', []);
    const agent3 = manager.spawnAgent('Agent 3', 'specialist', []);
    
    const channel1 = agent1.getChannel()!;
    const spy2 = vi.fn();
    const spy3 = vi.fn();
    
    const channel2 = agent2.getChannel() as unknown as { inbox: AgentInbox };
    const channel3 = agent3.getChannel() as unknown as { inbox: AgentInbox };
    
    channel2.inbox.onMessage(spy2);
    channel3.inbox.onMessage(spy3);
    
    await channel1.multicast(['worker'], 'ROLE_MSG', { data: 123 });
    
    await new Promise(r => setTimeout(r, 10));
    
    expect(spy2).toHaveBeenCalled();
    expect(spy3).not.toHaveBeenCalled();
  });

  it('should support direct messaging', async () => {
    const { manager } = createAgent();
    const agent1 = manager.spawnAgent('Agent 1', 'worker', []);
    const agent2 = manager.spawnAgent('Agent 2', 'worker', []);
    
    const channel1 = agent1.getChannel()!;
    const agent2Id = agent2.getState().identity!.id;
    const spy = vi.fn();
    
    const channel2 = agent2.getChannel() as unknown as { inbox: AgentInbox };
    channel2.inbox.onMessage(spy);
    
    await channel1.sendDirect(agent2Id, 'DIRECT_MSG', { secret: 'ssh' });
    
    await new Promise(r => setTimeout(r, 10));
    
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'DIRECT_MSG',
      payload: { secret: 'ssh' },
      receiver: agent2Id
    }));
  });

  it('should support request-response pattern', async () => {
    const { manager } = createAgent();
    const requester = manager.spawnAgent('Requester', 'orchestrator', []);
    const responder = manager.spawnAgent('Responder', 'worker', []);
    
    const reqChannel = requester.getChannel()!;
    const resChannel = responder.getChannel() as unknown as { 
      inbox: AgentInbox; 
      reply: (msg: AgentCommunicationMessage, payload: unknown) => Promise<void> 
    };
    const responderId = responder.getState().identity!.id;
    
    // Setup responder logic
    resChannel.inbox.onMessage(async (msg: AgentCommunicationMessage) => {
      if (msg.type === 'GIMME_DATA') {
        await resChannel.reply(msg, { data: 'here you go' });
      }
    });
    
    const response = await reqChannel.request(responderId, 'GIMME_DATA', { query: 'all' });
    
    expect(response).toEqual({ data: 'here you go' });
  });

  it('should handle request timeouts', async () => {
    const { manager } = createAgent();
    const requester = manager.spawnAgent('Requester', 'orchestrator', []);
    const responder = manager.spawnAgent('Responder', 'worker', []);
    
    const reqChannel = requester.getChannel()!;
    const responderId = responder.getState().identity!.id;
    
    // Responder does nothing
    
    await expect(reqChannel.request(responderId, 'SLOW_QUERY', {}, 100))
      .rejects.toThrow('Request timed out after 100ms');
  });

  it('should prioritize messages in inbox', () => {
    const inbox = new AgentInbox();
    
    inbox.push({ id: '1', priority: MessagePriority.NORMAL, timestamp: 100 } as unknown as AgentCommunicationMessage);
    inbox.push({ id: '2', priority: MessagePriority.HIGH, timestamp: 110 } as unknown as AgentCommunicationMessage);
    inbox.push({ id: '3', priority: MessagePriority.NORMAL, timestamp: 90 } as unknown as AgentCommunicationMessage);
    
    expect(inbox.poll()?.id).toBe('2'); // High priority first
    expect(inbox.poll()?.id).toBe('3'); // Then by timestamp
    expect(inbox.poll()?.id).toBe('1');
  });
});
