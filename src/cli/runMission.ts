import { bootstrapHeadlessRuntime } from './bootstrap';
import { ExecutiveBrain } from '../agent/core/ExecutiveBrain';
import { EventBus } from '../agent/core/EventBus';
import { AgentEventType } from '../agent/types/agent';
import type { AgentProtocolEvent } from '../agent/types/agent';
import { TraceCollector } from './traceCollector';
import * as fs from 'fs';

async function runMission() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: npm run mission -- "<title>" "<goal>"');
    process.exit(1);
  }

  const title = args[0];
  const goalDescription = args[1];

  const container = bootstrapHeadlessRuntime();
  const brain = container.resolve(ExecutiveBrain);
  const eventBus = container.resolve(EventBus);

  const collector = new TraceCollector(eventBus);
  collector.start();

  console.log('\n' + '='.repeat(50));
  console.log(`MISSION START: ${title}`);
  console.log(`GOAL: ${goalDescription}`);
  console.log('='.repeat(50) + '\n');

  // Also log to console for visibility
  eventBus.subscribe<AgentProtocolEvent>('agent:events', (event) => {
    if (event.type === AgentEventType.AGENT_UPDATE) {
      console.log(`[Status] ${event.payload.status}`);
    }
  });

  try {
    const missionId = await brain.createMission(title, {
      description: goalDescription,
      successCriteria: ['Completed'],
      priority: 'medium'
    });

    collector.record('DECISION', 'ExecutiveBrain', { action: 'createMission', missionId, title });

    // Wait for completion or failure
    const success = await new Promise<boolean>((resolve) => {
      const unsub = eventBus.subscribe<AgentProtocolEvent>('agent:events', (event) => {
        if (event.type === AgentEventType.AGENT_UPDATE) {
          const payload = event.payload as Record<string, unknown>;
          if (payload.missionId === missionId || payload.planId === missionId) {
            if (payload.status === 'PLAN_COMPLETED') {
              unsub();
              resolve(true);
            } else if (payload.status === 'PLAN_FAILED') {
              unsub();
              resolve(false);
            }
          }
        }
      });

      setTimeout(() => {
        unsub();
        resolve(false);
      }, 300000);
    });

    collector.stop();
    const traceMd = collector.exportMarkdown(title);
    fs.appendFileSync('MISSION_EXECUTION_TRACE.md', traceMd + '\n\n---\n\n');
    console.log(`\nTrace saved to MISSION_EXECUTION_TRACE.md`);

    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Failed to run mission:', error);
    process.exit(1);
  }
}

runMission();
