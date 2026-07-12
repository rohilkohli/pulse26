// ============================================================
// Pulse26 — Digital Twin Simulator
// ============================================================
// Generates plausible real-time crowd telemetry with realistic
// patterning. This is the ONLY file that needs to change when
// switching from simulated to real venue IoT data.
//
// Realistic patterning:
//   • Slow rise starting T-90min before kickoff
//   • Kickoff surge
//   • Stable first half
//   • Halftime spike (concessions/restrooms)
//   • Second half stabilizes
//   • Exit surge at final whistle
//   • Post-match drain over 30min
//
// DISCLAIMER: All data is simulated. Real venue systems at WC26
// operate actual digital twins for crowd-flow modeling.
// ============================================================

import { EventEmitter } from 'events';
import type { ITelemetryProvider } from '../domain/interfaces.js';
import type {
  VenueTelemetry,
  ZoneStatus,
  ZoneId,
  ZoneType,
  MatchPhase,
  OccupancyLevel,
} from '../domain/types.js';
import { VENUES, MATCHES } from './venueRepository.js';

// ─── Zone Definitions ─────────────────────────────────────────

interface ZoneConfig {
  id: ZoneId;
  name: string;
  type: ZoneType;
  /** Relative capacity weight vs overall venue (0–1) */
  capacityFactor: number;
  /** Phase-based base occupancy modifiers */
  phaseModifiers: Partial<Record<MatchPhase, number>>;
}

const DEFAULT_ZONES: ZoneConfig[] = [
  {
    id: 'gate_a',
    name: 'Gate A',
    type: 'gate',
    capacityFactor: 0.3,
    phaseModifiers: { arrival: 0.9, kickoff_surge: 1.0, halftime: 0.2, exit_surge: 0.95 },
  },
  {
    id: 'gate_b',
    name: 'Gate B',
    type: 'gate',
    capacityFactor: 0.25,
    phaseModifiers: { arrival: 0.75, kickoff_surge: 0.85, halftime: 0.15, exit_surge: 0.8 },
  },
  {
    id: 'gate_c',
    name: 'Gate C (Accessible)',
    type: 'accessible',
    capacityFactor: 0.1,
    phaseModifiers: { arrival: 0.6, kickoff_surge: 0.7, halftime: 0.15, exit_surge: 0.65 },
  },
  {
    id: 'gate_d',
    name: 'Gate D',
    type: 'gate',
    capacityFactor: 0.2,
    phaseModifiers: { arrival: 0.65, kickoff_surge: 0.75, halftime: 0.1, exit_surge: 0.7 },
  },
  {
    id: 'north_concourse',
    name: 'North Concourse',
    type: 'concourse',
    capacityFactor: 0.5,
    phaseModifiers: { arrival: 0.55, kickoff_surge: 0.7, halftime: 0.8, second_half: 0.55, exit_surge: 0.75 },
  },
  {
    id: 'south_concourse',
    name: 'South Concourse',
    type: 'concourse',
    capacityFactor: 0.5,
    phaseModifiers: { arrival: 0.5, kickoff_surge: 0.65, halftime: 0.75, second_half: 0.5, exit_surge: 0.7 },
  },
  {
    id: 'east_concourse',
    name: 'East Concourse',
    type: 'concourse',
    capacityFactor: 0.45,
    phaseModifiers: { arrival: 0.4, kickoff_surge: 0.6, halftime: 0.7, exit_surge: 0.65 },
  },
  {
    id: 'west_concourse',
    name: 'West Concourse',
    type: 'concourse',
    capacityFactor: 0.45,
    phaseModifiers: { arrival: 0.45, kickoff_surge: 0.65, halftime: 0.72, exit_surge: 0.68 },
  },
  {
    id: 'concessions_north',
    name: 'Concessions — North',
    type: 'concession',
    capacityFactor: 0.15,
    phaseModifiers: { arrival: 0.3, halftime: 0.95, second_half: 0.4, post_match: 0.2 },
  },
  {
    id: 'concessions_south',
    name: 'Concessions — South',
    type: 'concession',
    capacityFactor: 0.15,
    phaseModifiers: { arrival: 0.25, halftime: 0.9, second_half: 0.35, post_match: 0.15 },
  },
  {
    id: 'parking_north',
    name: 'Parking — North',
    type: 'parking',
    capacityFactor: 0.6,
    phaseModifiers: { pre_match: 0.2, arrival: 0.75, kickoff_surge: 0.9, first_half: 0.92, halftime: 0.92, second_half: 0.92, exit_surge: 0.88, post_match: 0.5 },
  },
  {
    id: 'transit_hub',
    name: 'Transit Hub',
    type: 'transit_hub',
    capacityFactor: 0.4,
    phaseModifiers: { arrival: 0.65, kickoff_surge: 0.8, halftime: 0.2, exit_surge: 0.9, post_match: 0.7 },
  },
];

// ─── Phase Determination ──────────────────────────────────────

function determineMatchPhase(kickoffUtc: string): { phase: MatchPhase; matchMinute: number | null } {
  const now = Date.now();
  const kickoff = new Date(kickoffUtc).getTime();
  const diffMin = (now - kickoff) / 60000;

  if (diffMin < -120) return { phase: 'pre_match', matchMinute: null };
  if (diffMin < 0) return { phase: 'arrival', matchMinute: null };
  if (diffMin < 3) return { phase: 'kickoff_surge', matchMinute: 0 };
  if (diffMin < 45) return { phase: 'first_half', matchMinute: Math.floor(diffMin) };
  if (diffMin < 62) return { phase: 'halftime', matchMinute: 45 };
  if (diffMin < 107) return { phase: 'second_half', matchMinute: Math.floor(diffMin - 17) };
  if (diffMin < 137) return { phase: 'exit_surge', matchMinute: 90 };
  return { phase: 'post_match', matchMinute: 90 };
}

// ─── Occupancy Calculation ────────────────────────────────────

function getBaseOccupancy(phase: MatchPhase): number {
  const baseMap: Record<MatchPhase, number> = {
    pre_match: 0.05,
    arrival: 0.45,
    kickoff_surge: 0.82,
    first_half: 0.72,
    halftime: 0.60,
    second_half: 0.70,
    final_whistle: 0.75,
    exit_surge: 0.65,
    post_match: 0.15,
  };
  return baseMap[phase] ?? 0.1;
}

function addNoise(value: number, spread = 0.06): number {
  const noise = (Math.random() - 0.5) * 2 * spread;
  return Math.min(1, Math.max(0, value + noise));
}

function classifyOccupancy(pct: number): OccupancyLevel {
  if (pct < 50) return 'low';
  if (pct < 70) return 'moderate';
  if (pct < 85) return 'high';
  return 'critical';
}

function estimateQueue(occupancyPct: number, zoneType: ZoneType): { depth: number; waitMin: number } {
  if (zoneType === 'concourse' || zoneType === 'parking') {
    return { depth: 0, waitMin: 0 };
  }
  const normalizedPct = occupancyPct / 100;
  const depth = Math.max(0, Math.floor(normalizedPct * 120 * (normalizedPct > 0.8 ? 1.5 : 1)));
  const waitMin = Math.max(0, Math.floor(depth * 0.3));
  return { depth, waitMin };
}

// ─── Trend Tracking ───────────────────────────────────────────

const previousOccupancy = new Map<string, number>();

function detectTrend(zoneKey: string, current: number): 'rising' | 'stable' | 'falling' {
  const prev = previousOccupancy.get(zoneKey);
  previousOccupancy.set(zoneKey, current);
  if (prev === undefined) return 'stable';
  const delta = current - prev;
  if (delta > 3) return 'rising';
  if (delta < -3) return 'falling';
  return 'stable';
}

// ─── Main Simulator ───────────────────────────────────────────

export class DigitalTwinSimulator extends EventEmitter implements ITelemetryProvider {
  private intervalId: NodeJS.Timeout | null = null;
  private snapshots = new Map<string, VenueTelemetry>();
  private readonly updateIntervalMs: number;

  constructor(updateIntervalMs = 5000) {
    super();
    this.updateIntervalMs = updateIntervalMs;
  }

  start(): void {
    if (this.intervalId) return;
    // Initial tick immediately
    this.tick();
    this.intervalId = setInterval(() => this.tick(), this.updateIntervalMs);
    console.log(`[DigitalTwin] Started. Update interval: ${this.updateIntervalMs}ms`);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('[DigitalTwin] Stopped.');
  }

  getSnapshot(venueId: string): VenueTelemetry | null {
    return this.snapshots.get(venueId) ?? null;
  }

  onUpdate(callback: (telemetry: VenueTelemetry) => void): () => void {
    this.on('update', callback);
    return () => this.off('update', callback);
  }

  private tick(): void {
    for (const venue of VENUES) {
      // Find the next upcoming match at this venue
      const match = MATCHES.find((m) => m.venueId === venue.id);
      if (!match) continue;

      const { phase, matchMinute } = determineMatchPhase(match.kickoffUtc);
      const baseOccupancy = getBaseOccupancy(phase);

      const zones: ZoneStatus[] = DEFAULT_ZONES.map((zc) => {
        const zoneModifier = zc.phaseModifiers[phase] ?? baseOccupancy;
        const rawPct = addNoise(zoneModifier * 100, 4);
        const roundedPct = Math.round(rawPct);
        const zoneKey = `${venue.id}:${zc.id}`;
        const trend = detectTrend(zoneKey, roundedPct);
        const { depth, waitMin } = estimateQueue(roundedPct, zc.type);

        return {
          zoneId: zc.id,
          zoneName: zc.name,
          zoneType: zc.type,
          occupancyPct: roundedPct,
          occupancyLevel: classifyOccupancy(roundedPct),
          queueDepth: depth,
          waitTimeMin: waitMin,
          trend,
          lastUpdatedUtc: new Date().toISOString(),
        };
      });

      const overallOccupancyPct = Math.round(
        zones.reduce((sum, z) => sum + z.occupancyPct * (z.zoneType !== 'parking' ? 1 : 0.3), 0) /
          zones.length,
      );

      const telemetry: VenueTelemetry = {
        venueId: venue.id,
        matchId: match.id,
        matchPhase: phase,
        matchMinute,
        timestampUtc: new Date().toISOString(),
        zones,
        overallOccupancyPct,
        activeAlertCount: 0, // Updated by alert engine
      };

      this.snapshots.set(venue.id, telemetry);
      this.emit('update', telemetry);
    }
  }
}
