import type { EventBus } from '../core/EventBus';
import { AgentEventType, type ThoughtGeneratedEvent } from '../types/agent';
import type { Thought, ThoughtType } from '../types/thought';

/**
 * AgentStream provides a high-level API for emitting progress events 
 * during the autonomous agent cycle.
 */
export class AgentStream {
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  public thought(content: string, type: ThoughtType = 'reasoning', metadata?: Record<string, unknown>): void {
    const thought: Thought = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      content,
      type,
      agentId: 'system', // Default, should be overridden by caller if possible
      ...metadata
    };

    this.eventBus.publish('agent:thoughts', {
      type: AgentEventType.THOUGHT_GENERATED,
      payload: { thought },
      timestamp: Date.now()
    } as unknown as ThoughtGeneratedEvent);

    // Also emit as a status update for UI visibility
    this.emitStatus('thinking', content, undefined, { thoughtId: thought.id, type });
  }

  public thinking(message: string = 'Agent is thinking...'): void {
    this.emitStatus('thinking', message);
  }

  public planning(goal: string): void {
    this.emitStatus('thinking', `Planning for: ${goal}`);
  }

  public executingTool(toolName: string, args?: Record<string, unknown>): void {
    this.emitStatus('executing', `Executing tool: ${toolName}`, 0, { toolName, args });
  }

  public completing(message: string = 'Goal accomplished.'): void {
    this.emitStatus('idle', message, 100);
  }

  public reflecting(workflowId: string): void {
    this.emitStatus('thinking', `Reflecting on workflow: ${workflowId}`);
  }

  public error(message: string, fatal: boolean = false): void {
    this.eventBus.publish('agent:events', {
      type: AgentEventType.ERROR,
      payload: {
        code: 'RUNTIME_ERROR',
        message,
        fatal
      },
      timestamp: Date.now()
    });
  }

  public event(type: string, payload: Record<string, unknown>): void {
    this.eventBus.publish('agent:events', {
      type: type as any,
      payload,
      timestamp: Date.now()
    });
  }

  private emitStatus(
    status: string, 
    message: string, 
    progress?: number, 
    data?: Record<string, unknown>
  ): void {
    this.eventBus.publish('agent:actions', {
      type: 'AGENT_UPDATE',
      payload: {
        status,
        message,
        progress,
        data
      }
    });
  }
}
