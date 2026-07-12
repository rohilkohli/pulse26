// ============================================================
// Pulse26 — API Routes
// ============================================================

import { Router, type Request, type Response } from 'express';
import type { DigitalTwinSimulator } from '../infrastructure/digitalTwin.js';
import type { AlertStore } from '../services/alertStore.js';
import type { StaticVenueRepository } from '../infrastructure/venueRepository.js';
import type { GeminiConciergeService, CannedResponseConcierge } from '../infrastructure/geminiConcierge.js';
import type { ChatRequest, ApiResponse } from '../domain/types.js';
import type { VenueTelemetry, Alert, Venue, Match } from '../domain/types.js';

export function createApiRouter(deps: {
  twin: DigitalTwinSimulator;
  alertStore: AlertStore;
  venueRepo: StaticVenueRepository;
  concierge: GeminiConciergeService | CannedResponseConcierge;
}): Router {
  const router = Router();
  const { twin, alertStore, venueRepo, concierge } = deps;

  // ─── Health ────────────────────────────────────────────────

  router.get('/health', (_req: Request, res: Response) => {
    res.json({ ok: true, service: 'pulse26-api', time: new Date().toISOString() });
  });

  // ─── Venues ────────────────────────────────────────────────

  router.get('/venues', async (_req: Request, res: Response) => {
    try {
      const venues = await venueRepo.getAllVenues();
      const response: ApiResponse<Venue[]> = { ok: true, data: venues };
      res.json(response);
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Failed to fetch venues', code: 'VENUE_FETCH_ERROR' });
    }
  });

  router.get('/venues/:id', async (req: Request, res: Response) => {
    try {
      const venue = await venueRepo.getVenueById(req.params.id);
      if (!venue) {
        res.status(404).json({ ok: false, error: 'Venue not found', code: 'NOT_FOUND' });
        return;
      }
      res.json({ ok: true, data: venue } satisfies ApiResponse<Venue>);
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Failed to fetch venue', code: 'VENUE_FETCH_ERROR' });
    }
  });

  // ─── Matches ───────────────────────────────────────────────

  router.get('/matches', async (_req: Request, res: Response) => {
    try {
      const matches = await venueRepo.getActiveMatches();
      res.json({ ok: true, data: matches } satisfies ApiResponse<Match[]>);
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Failed to fetch matches', code: 'MATCH_FETCH_ERROR' });
    }
  });

  // ─── Telemetry ─────────────────────────────────────────────

  router.get('/telemetry/:venueId', (req: Request, res: Response) => {
    const snapshot = twin.getSnapshot(req.params.venueId);
    if (!snapshot) {
      res.status(404).json({ ok: false, error: 'No telemetry for this venue', code: 'NOT_FOUND' });
      return;
    }
    res.json({ ok: true, data: snapshot } satisfies ApiResponse<VenueTelemetry>);
  });

  router.get('/telemetry', (_req: Request, res: Response) => {
    // Return all venue snapshots
    const allVenueIds = ['metlife', 'sofi', 'azteca', 'atandt', 'gillette', 'nrg', 'arrowhead', 'levis', 'centurylink', 'hardrock', 'lincoln', 'atlanta', 'bmo_toronto', 'bcplace', 'bbva_monterrey', 'bmostadium'];
    const snapshots = allVenueIds
      .map((id) => twin.getSnapshot(id))
      .filter((s): s is VenueTelemetry => s !== null);
    res.json({ ok: true, data: snapshots } satisfies ApiResponse<VenueTelemetry[]>);
  });

  // ─── Alerts ────────────────────────────────────────────────

  router.get('/alerts', (_req: Request, res: Response) => {
    const alerts = alertStore.getAll();
    res.json({ ok: true, data: alerts } satisfies ApiResponse<Alert[]>);
  });

  router.get('/alerts/active', (_req: Request, res: Response) => {
    const alerts = alertStore.getActive();
    res.json({ ok: true, data: alerts } satisfies ApiResponse<Alert[]>);
  });

  router.post('/alerts/:id/acknowledge', (req: Request, res: Response) => {
    const updated = alertStore.acknowledge(req.params.id);
    if (!updated) {
      res.status(404).json({ ok: false, error: 'Alert not found or not active', code: 'NOT_FOUND' });
      return;
    }
    res.json({ ok: true, data: updated } satisfies ApiResponse<Alert>);
  });

  router.post('/alerts/:id/resolve', (req: Request, res: Response) => {
    const updated = alertStore.resolve(req.params.id);
    if (!updated) {
      res.status(404).json({ ok: false, error: 'Alert not found', code: 'NOT_FOUND' });
      return;
    }
    res.json({ ok: true, data: updated } satisfies ApiResponse<Alert>);
  });

  // ─── Chat (SSE streaming) ──────────────────────────────────

  router.post('/chat', async (req: Request, res: Response) => {
    const chatReq = req.body as ChatRequest;

    if (!chatReq.message || typeof chatReq.message !== 'string') {
      res.status(400).json({ ok: false, error: 'message is required', code: 'BAD_REQUEST' });
      return;
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const sendEvent = (data: object) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      await concierge.streamResponse(chatReq, (chunk) => {
        sendEvent(chunk);
      });
    } catch (err) {
      sendEvent({ error: 'Chat service error', done: true });
    } finally {
      res.end();
    }
  });

  // ─── Weather (proxied from Open-Meteo, no key needed) ─────

  router.get('/weather', async (req: Request, res: Response) => {
    const { lat, lng } = req.query as { lat?: string; lng?: string };
    if (!lat || !lng) {
      res.status(400).json({ ok: false, error: 'lat and lng required', code: 'BAD_REQUEST' });
      return;
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m,precipitation&timezone=auto`;
      const response = await fetch(url);
      const data = await response.json() as {
        current: {
          temperature_2m: number;
          apparent_temperature: number;
          weather_code: number;
          wind_speed_10m: number;
          relative_humidity_2m: number;
          precipitation: number;
        };
      };
      const current = data.current;

      // Map WMO code to crowd risk
      let crowdRiskModifier: 'none' | 'heat_advisory' | 'rain_advisory' | 'storm_warning' = 'none';
      if (current.temperature_2m > 35) crowdRiskModifier = 'heat_advisory';
      else if (current.weather_code >= 80 && current.weather_code <= 99) crowdRiskModifier = 'storm_warning';
      else if (current.precipitation > 0.5) crowdRiskModifier = 'rain_advisory';

      res.json({
        ok: true,
        data: {
          temperature: current.temperature_2m,
          apparentTemperature: current.apparent_temperature,
          weatherCode: current.weather_code,
          weatherDescription: getWeatherDescription(current.weather_code),
          windSpeedKmh: current.wind_speed_10m,
          humidity: current.relative_humidity_2m,
          isDay: true,
          crowdRiskModifier,
        },
      });
    } catch (err) {
      // Fallback: static seasonal average for a summer WC venue
      res.json({
        ok: true,
        data: {
          temperature: 28,
          apparentTemperature: 33,
          weatherCode: 0,
          weatherDescription: 'Clear sky',
          windSpeedKmh: 15,
          humidity: 55,
          isDay: true,
          crowdRiskModifier: 'none',
        },
      });
    }
  });

  return router;
}

function getWeatherDescription(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Unknown';
}
