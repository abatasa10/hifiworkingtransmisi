import express from 'express';
import cors from 'cors';
import { powerSystems } from '../data/systems';
import { jamaliUPBs } from '../data/upbs';
import { subsystems } from '../data/subsystems';
import { initialNodes500kV } from '../data/nodes500kv';
import { initialEdges500kV } from '../data/edges500kv';
import { risksData } from '../data/risks';
import { subsystemBogorNodes, subsystemBogorEdges } from '../data/subsystemSLD';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Root
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'UIP2B JAWA, MADURA DAN BALI',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 1. Systems (Peta Nasional)
app.get('/api/systems', (req, res) => {
  res.json(powerSystems);
});

app.get('/api/systems/:id', (req, res) => {
  const system = powerSystems.find((s) => s.id === req.params.id);
  if (!system) return res.status(404).json({ error: 'System not found' });
  res.json(system);
});

// 2. UPBs
app.get('/api/upbs', (req, res) => {
  const systemId = req.query.systemId as string;
  if (systemId) {
    return res.json(jamaliUPBs.filter((u) => u.systemId === systemId));
  }
  res.json(jamaliUPBs);
});

// 3. Subsystems
app.get('/api/subsystems', (req, res) => {
  const upbId = req.query.upbId as string;
  if (upbId) {
    return res.json(subsystems.filter((s) => s.upbId === upbId));
  }
  res.json(subsystems);
});

// 4. SLD 500 kV Nodes & Edges
app.get('/api/sld/500kv/nodes', (req, res) => {
  res.json(initialNodes500kV);
});

app.get('/api/sld/500kv/edges', (req, res) => {
  res.json(initialEdges500kV);
});

// 5. Risks (Kerawanan Sistem)
app.get('/api/risks', (req, res) => {
  res.json(risksData);
});

app.get('/api/risks/:id', (req, res) => {
  const riskId = parseInt(req.params.id, 10);
  const risk = risksData.find((r) => r.id === riskId || r.number === riskId);
  if (!risk) return res.status(404).json({ error: 'Risk not found' });
  res.json(risk);
});

// 6. Subsystem SLD
app.get('/api/subsystems/:id/sld', (req, res) => {
  if (req.params.id === 'sub-bogor') {
    return res.json({
      nodes: subsystemBogorNodes,
      edges: subsystemBogorEdges
    });
  }
  // Default response for other subsystems
  res.json({
    nodes: subsystemBogorNodes,
    edges: subsystemBogorEdges
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[PLN Control Room API] running on http://localhost:${PORT}`);
  });
}

export default app;
