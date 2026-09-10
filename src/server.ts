import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { globalContainer } from './agent/core/ServiceContainer';
import { DependencyRegistry } from './agent/core/DependencyRegistry';
import { ExecutiveBrain } from './agent/core/ExecutiveBrain';
import { APIMetricsManager } from './agent/core/APIMetricsManager';
import { AgentRegistry } from './agent/core/AgentRegistry';
import { EventBus } from './agent/core/EventBus';
import { AgentEventType } from './agent/types/agent';

const app = express();
const port = process.env.PORT || 3001;

// 1. Security & Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for easier dev-production parity
}));
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// 2. Authentication Middleware (Simple API Key)
const API_KEY = process.env.NEXUS_API_KEY || 'nexus-secret-key';
const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// 3. Initialize Agent OS Runtime
DependencyRegistry.registerCoreServices(globalContainer);
const brain = globalContainer.resolve(ExecutiveBrain);
const metrics = globalContainer.resolve(APIMetricsManager);
const registry = globalContainer.resolve(AgentRegistry);
const eventBus = globalContainer.resolve(EventBus);

// 4. API Endpoints

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime(), timestamp: Date.now() });
});

// Metrics Endpoint (Prometheus-style or JSON)
app.get('/metrics', authenticate, (req, res) => {
  const stats = metrics.getAllStats();
  res.json({
    metrics: stats,
    agents: registry.listAgents().length,
    timestamp: Date.now()
  });
});

// Mission Management
app.post('/api/missions', authenticate, async (req, res) => {
  const { goal, requirements } = req.body;
  if (!goal) return res.status(400).json({ error: 'Goal is required' });

  try {
    const mission = await brain.createMission(goal, requirements);
    res.status(201).json(mission);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/missions/:id', authenticate, (req, res) => {
  const mission = brain.getMission(req.params.id);
  if (!mission) return res.status(404).json({ error: 'Mission not found' });
  res.json(mission);
});

// 5. Start Server
app.listen(port, () => {
  console.log(`[NexusServer] Production runtime listening on port ${port}`);
  console.log(`[NexusServer] Health check: http://localhost:${port}/health`);
});
