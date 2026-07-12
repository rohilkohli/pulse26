// ============================================================
// Pulse26 — Gemini Alert Reasoning Engine
// ============================================================
// Uses Gemini function calling with structured output to
// analyze telemetry and produce typed, actionable alerts.
// Every alert includes its triggering data (the "explainer")
// so ops staff see WHY an alert fired, not just WHAT it says.
// ============================================================

import { GoogleGenAI } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import type { IAlertEngine } from '../domain/interfaces.js';
import type {
  VenueTelemetry,
  Alert,
  AlertSeverity,
  ZoneStatus,
} from '../domain/types.js';

const ALERT_SCHEMA = {
  type: 'object',
  properties: {
    alerts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          zoneId: { type: 'string' },
          severity: { type: 'string', enum: ['info', 'warning', 'critical'] },
          title: { type: 'string' },
          recommendedAction: { type: 'string' },
          explainer: { type: 'string' },
          suggestedAlternateZones: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['zoneId', 'severity', 'title', 'recommendedAction', 'explainer'],
      },
    },
  },
  required: ['alerts'],
};

// Thresholds for triggering analysis
const THRESHOLDS = {
  warning: 70,
  critical: 85,
};

// Canned fallback alerts when Gemini is unavailable
function buildFallbackAlert(zone: ZoneStatus, venueId: string): Alert {
  const severity: AlertSeverity = zone.occupancyPct >= THRESHOLDS.critical ? 'critical' : 'warning';
  return {
    id: uuidv4(),
    venueId,
    severity,
    status: 'active',
    title: `${zone.zoneName} — ${severity === 'critical' ? 'Critical' : 'High'} Congestion`,
    recommendedAction:
      severity === 'critical'
        ? `Deploy additional stewards to ${zone.zoneName}. Open overflow access if available.`
        : `Monitor ${zone.zoneName} closely. Alert stewards to expedite processing.`,
    explainer: `Occupancy at ${zone.occupancyPct}% (threshold: ${severity === 'critical' ? THRESHOLDS.critical : THRESHOLDS.warning}%). Wait time ~${zone.waitTimeMin}min. Trend: ${zone.trend}.`,
    triggerData: {
      zoneId: zone.zoneId,
      zoneName: zone.zoneName,
      occupancyPct: zone.occupancyPct,
      waitTimeMin: zone.waitTimeMin,
      trend: zone.trend,
      durationMinutes: 5,
    },
    affectedZones: [zone.zoneId],
    suggestedAlternateZones: [],
    createdUtc: new Date().toISOString(),
  };
}

export class GeminiAlertEngine implements IAlertEngine {
  private readonly ai: GoogleGenAI;
  private readonly model: string;

  constructor(apiKey: string, model = 'gemini-2.0-flash') {
    this.ai = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async analyzeAndAlert(telemetry: VenueTelemetry): Promise<Alert[]> {
    // Filter to only zones that exceed a threshold
    const concernZones = telemetry.zones.filter(
      (z) => z.occupancyPct >= THRESHOLDS.warning || z.waitTimeMin >= 10,
    );

    if (concernZones.length === 0) return [];


    const lowZones = telemetry.zones
      .filter((z) => z.occupancyPct < 50)
      .map((z) => z.zoneId);

    const prompt = `
You are an operational intelligence system for a FIFA World Cup 2026 venue.
Analyze this real-time crowd telemetry and produce actionable alerts for venue staff.

Current venue: ${telemetry.venueId}
Match phase: ${telemetry.matchPhase}
Match minute: ${telemetry.matchMinute ?? 'N/A'}

CONCERN ZONES (requiring attention):
${concernZones.map((z) => `- ${z.zoneName} (${z.zoneId}): ${z.occupancyPct}% full, wait: ${z.waitTimeMin}min, trend: ${z.trend}, type: ${z.zoneType}`).join('\n')}

ALL ZONES with lower occupancy (potential redirects):
${lowZones.join(', ')}

Generate alerts ONLY for the concern zones. Each alert must:
1. Have a concrete, actionable recommendedAction (specific instruction for venue staff)
2. Have an explainer that references the exact numbers that triggered the alert
3. Suggest specific alternate zones for fan rerouting where applicable
4. Match severity: "critical" if >85%, "warning" if 70-85%

Return structured JSON matching the schema.
`;

    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: ALERT_SCHEMA as any,
          temperature: 0.2, // Low temp for consistent structured output
        },
      });

      const text = response.text ?? '';
      const parsed = JSON.parse(text) as {
        alerts: Array<{
          zoneId: string;
          severity: AlertSeverity;
          title: string;
          recommendedAction: string;
          explainer: string;
          suggestedAlternateZones?: string[];
        }>;
      };

      return parsed.alerts.map((a) => {
        const zone = telemetry.zones.find((z) => z.zoneId === a.zoneId);
        return {
          id: uuidv4(),
          venueId: telemetry.venueId,
          severity: a.severity,
          status: 'active' as const,
          title: a.title,
          recommendedAction: a.recommendedAction,
          explainer: a.explainer,
          triggerData: {
            zoneId: a.zoneId,
            zoneName: zone?.zoneName ?? a.zoneId,
            occupancyPct: zone?.occupancyPct ?? 0,
            waitTimeMin: zone?.waitTimeMin ?? 0,
            trend: zone?.trend ?? 'stable',
            durationMinutes: 5,
          },
          affectedZones: [a.zoneId],
          suggestedAlternateZones: a.suggestedAlternateZones ?? [],
          createdUtc: new Date().toISOString(),
        } satisfies Alert;
      });
    } catch (err) {
      console.warn('[AlertEngine] Gemini call failed, using fallback alerts:', err);
      // Fallback: generate alerts from thresholds directly, no AI needed
      return concernZones
        .filter((z) => z.occupancyPct >= THRESHOLDS.warning)
        .map((z) => buildFallbackAlert(z, telemetry.venueId));
    }
  }
}

export class MockAlertEngine implements IAlertEngine {
  async analyzeAndAlert(telemetry: VenueTelemetry): Promise<Alert[]> {
    return telemetry.zones
      .filter((z) => z.occupancyPct >= THRESHOLDS.critical)
      .map((z) => buildFallbackAlert(z, telemetry.venueId));
  }
}
