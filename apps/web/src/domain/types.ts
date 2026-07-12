// ============================================================
// Pulse26 — Shared Domain Types (Frontend mirror of server types)
// ============================================================



export interface Coordinates { lat: number; lng: number; }

export interface VenueEntrance {
  id: string;
  name: string;
  label: string;
  coordinates: Coordinates;
  accessible: boolean;
  zones: string[];
}

export interface Venue {
  id: string;
  name: string;
  city: string;
  country: 'USA' | 'Canada' | 'Mexico';
  coordinates: Coordinates;
  capacity: number;
  entrances: VenueEntrance[];
  timezone: string;
  primaryLanguages: string[];
}

export interface Match {
  id: string;
  venueId: string;
  homeTeam: string;
  awayTeam: string;
  kickoffUtc: string;
  round: 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final';
  capacity: number;
}

export type MatchPhase =
  | 'pre_match' | 'arrival' | 'kickoff_surge'
  | 'first_half' | 'halftime' | 'second_half'
  | 'final_whistle' | 'exit_surge' | 'post_match';

export type ZoneType = 'gate' | 'concourse' | 'concession' | 'parking' | 'accessible' | 'transit_hub';
export type OccupancyLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface ZoneStatus {
  zoneId: string;
  zoneName: string;
  zoneType: ZoneType;
  occupancyPct: number;
  occupancyLevel: OccupancyLevel;
  queueDepth: number;
  waitTimeMin: number;
  trend: 'rising' | 'stable' | 'falling';
  lastUpdatedUtc: string;
}

export interface VenueTelemetry {
  venueId: string;
  matchId: string;
  matchPhase: MatchPhase;
  matchMinute: number | null;
  timestampUtc: string;
  zones: ZoneStatus[];
  overallOccupancyPct: number;
  activeAlertCount: number;
}

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface AlertTriggerData {
  zoneId: string;
  zoneName: string;
  occupancyPct: number;
  waitTimeMin: number;
  trend: string;
  durationMinutes: number;
}

export interface Alert {
  id: string;
  venueId: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  recommendedAction: string;
  explainer: string;
  triggerData: AlertTriggerData;
  affectedZones: string[];
  suggestedAlternateZones: string[];
  createdUtc: string;
  acknowledgedUtc?: string;
  resolvedUtc?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  language: string;
  timestampUtc: string;
}

export interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
  weatherDescription: string;
  windSpeedKmh: number;
  humidity: number;
  isDay: boolean;
  crowdRiskModifier: 'none' | 'heat_advisory' | 'rain_advisory' | 'storm_warning';
}

export type WsMessageType =
  | 'telemetry_update'
  | 'alert_new'
  | 'alert_acknowledged'
  | 'alert_resolved'
  | 'match_phase_change'
  | 'connection_ack'
  | 'heartbeat';

export interface WsMessage<T = unknown> {
  type: WsMessageType;
  payload: T;
  timestampUtc: string;
}

export interface ApiSuccess<T> { ok: true; data: T; }
export interface ApiError { ok: false; error: string; code: string; }
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
