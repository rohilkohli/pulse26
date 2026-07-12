// ============================================================
// Pulse26 — Server Entry Point
// ============================================================

import 'dotenv/config';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { DigitalTwinSimulator } from './infrastructure/digitalTwin.js';
import { GeminiAlertEngine, MockAlertEngine } from './infrastructure/geminiAlertEngine.js';
import { GeminiConciergeService, CannedResponseConcierge } from './infrastructure/geminiConcierge.js';
import { StaticVenueRepository } from './infrastructure/venueRepository.js';
import { PulseWebSocketServer } from './websocket/wsServer.js';
import { AlertStore } from './services/alertStore.js';
import { createApiRouter } from './routes/api.js';

// ─── Config ───────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
const TWIN_INTERVAL = parseInt(process.env.TWIN_UPDATE_INTERVAL_MS ?? '5000', 10);
const ALERT_INTERVAL = parseInt(process.env.ALERT_ENGINE_INTERVAL_MS ?? '30000', 10);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

const hasGeminiKey = Boolean(GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here');

if (!hasGeminiKey) {
  console.warn('[Server] ⚠️  No GEMINI_API_KEY set — using mock/canned fallbacks. Set GEMINI_API_KEY for live AI features.');
}

// ─── Dependency Setup ─────────────────────────────────────────

const app = express();
const httpServer = createServer(app);

// Services
const twin = new DigitalTwinSimulator(TWIN_INTERVAL);
const alertStore = new AlertStore();
const venueRepo = new StaticVenueRepository();

const alertEngine = hasGeminiKey
  ? new GeminiAlertEngine(GEMINI_API_KEY, GEMINI_MODEL)
  : new MockAlertEngine();

const concierge = hasGeminiKey
  ? new GeminiConciergeService(GEMINI_API_KEY, GEMINI_MODEL)
  : new CannedResponseConcierge();

// WebSocket
const wsServer = new PulseWebSocketServer(httpServer);

// ─── Middleware ───────────────────────────────────────────────

app.use(cors({
  origin: [CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────

app.use('/api', createApiRouter({ twin, alertStore, venueRepo, concierge }));

// ─── Real-Time Loop ───────────────────────────────────────────

// Forward telemetry updates to WebSocket clients
twin.onUpdate((telemetry) => {
  wsServer.broadcastTelemetry(telemetry);

  // Auto-resolve alerts for cleared zones
  const occupancyByZone: Record<string, number> = {};
  for (const zone of telemetry.zones) {
    occupancyByZone[zone.zoneId] = zone.occupancyPct;
  }
  const resolved = alertStore.autoResolveIfClear(telemetry.venueId, occupancyByZone);
  for (const alert of resolved) {
    wsServer.broadcastAlertUpdate(alert);
  }
});

// Run alert engine on a separate interval
let alertEngineRunning = false;
const runAlertEngine = async (): Promise<void> => {
  if (alertEngineRunning) return;
  alertEngineRunning = true;
  try {
    // Analyze all venues that have active telemetry
    const venueIds = ['metlife', 'sofi', 'azteca', 'atandt', 'gillette', 'nrg', 'arrowhead', 'levis', 'hardrock'];
    for (const venueId of venueIds) {
      const snapshot = twin.getSnapshot(venueId);
      if (!snapshot) continue;

      const newAlerts = await alertEngine.analyzeAndAlert(snapshot);
      const added = alertStore.addAlerts(newAlerts);
      for (const alert of added) {
        wsServer.broadcastAlert(alert);
        console.log(`[AlertEngine] New ${alert.severity} alert: ${alert.title}`);
      }
    }
  } catch (err) {
    console.error('[AlertEngine] Error during analysis:', err);
  } finally {
    alertEngineRunning = false;
  }
};

setInterval(() => {
  void runAlertEngine();
}, ALERT_INTERVAL);

// ─── Start ────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║  🏟️  Pulse26 Server                       ║
║  FIFA World Cup 2026 · July 9, 2026       ║
╠═══════════════════════════════════════════╣
║  HTTP  → http://localhost:${PORT}            ║
║  WS    → ws://localhost:${PORT}/ws           ║
║  AI    → ${hasGeminiKey ? 'Gemini ' + GEMINI_MODEL : 'Mock/Canned fallbacks  '}     ║
║  Twin  → ${TWIN_INTERVAL}ms update interval         ║
╚═══════════════════════════════════════════╝
  `);
  // Start the digital twin AFTER the server is up
  twin.start();
  // Run first alert analysis after a brief warm-up
  setTimeout(() => void runAlertEngine(), 8000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down...');
  twin.stop();
  wsServer.close();
  httpServer.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, shutting down...');
  twin.stop();
  wsServer.close();
  httpServer.close(() => process.exit(0));
});

export { app, httpServer };
