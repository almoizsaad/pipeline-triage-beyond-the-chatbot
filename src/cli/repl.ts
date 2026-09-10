import readline from 'readline';
import { bootstrapHeadlessRuntime } from './bootstrap';
import { ExecutiveBrain } from '../agent/core/ExecutiveBrain';
import { EventBus } from '../agent/core/EventBus';
import { AgentEventType } from '../agent/types/agent';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function repl() {
  const container = bootstrapHeadlessRuntime();
  const brain = container.resolve(ExecutiveBrain);
  const eventBus = container.resolve(EventBus);

  console.log('Nexus Agent OS REPL');
  console.log('Type a goal to start a mission, or "exit" to quit.');

  eventBus.subscribe('agent:events', (event) => {
    if (event.type === AgentEventType.THOUGHT_GENERATED) {
      const payload = event.payload as { thought: { content: string } };
      console.log(`\x1b[36m[Thought]\x1b[0m ${payload.thought.content}`);
    } else if (event.type === AgentEventType.TOOL_RESULT) {
      const payload = event.payload as { toolName: string; success: boolean };
      console.log(`\x1b[32m[Tool Result]\x1b[0m ${payload.toolName}: ${payload.success ? 'Success' : 'Failed'}`);
    } else if (event.type === AgentEventType.AGENT_UPDATE) {
       const payload = event.payload as { status: string };
       console.log(`\x1b[33m[Status]\x1b[0m ${payload.status}`);
    }
  });

  const ask = () => {
    rl.question('> ', async (input) => {
      if (input.toLowerCase() === 'exit') {
        rl.close();
        return;
      }

      if (input.trim()) {
        try {
          await brain.createMission('REPL Mission', {
            description: input,
            successCriteria: ['Completed'],
            priority: 'medium'
          });
        } catch (error) {
          console.error('Error starting mission:', error);
        }
      }
      ask();
    });
  };

  ask();
}

repl();
