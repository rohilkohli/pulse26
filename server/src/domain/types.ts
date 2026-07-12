// ============================================================
// Pulse26 — Domain Types
// Core business entities shared across all layers.
// No framework imports here — pure TypeScript.
// ============================================================

// ─── Venue & Stadium ─────────────────────────────────────────

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface VenueEntrance {
  id: string;
  name: string;
  label: string; // e.g. "Gate A", "Accessible Entrance North"
  coordinates: Coordinates;
  accessible: boolean;
  zones: ZoneId[];
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
  primaryLanguages: Language[];
}

// ─── Match & Schedule ────────────────────────────────────────

export type MatchPhase =
  | 'pre_match'       // >2h before kickoff
  | 'arrival'         // 0-2h before kickoff
  | 'kickoff_surge'   // kickoff ±15min
  | 'first_half'
  | 'halftime'
  | 'second_half'
  | 'final_whistle'
  | 'exit_surge'      // 0-30min post match
  | 'post_match';

export interface Match {
  id: string;
  venueId: string;
  homeTeam: string;
  awayTeam: string;
  kickoffUtc: string; // ISO 8601
  round: 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final';
  capacity: number;
}

// ─── Crowd Telemetry ─────────────────────────────────────────

export type ZoneId = string; // e.g. "gate_a", "north_concourse"

export type ZoneType =
  | 'gate'
  | 'concourse'
  | 'concession'
  | 'parking'
  | 'accessible'
  | 'transit_hub';

export type OccupancyLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface ZoneStatus {
  zoneId: ZoneId;
  zoneName: string;
  zoneType: ZoneType;
  occupancyPct: number;        // 0-100
  occupancyLevel: OccupancyLevel;
  queueDepth: number;          // estimated people in queue
  waitTimeMin: number;         // estimated wait in minutes
  trend: 'rising' | 'stable' | 'falling';
  lastUpdatedUtc: string;
}

export interface VenueTelemetry {
  venueId: string;
  matchId: string;
  matchPhase: MatchPhase;
  matchMinute: number | null;  // null if pre/post match
  timestampUtc: string;
  zones: ZoneStatus[];
  overallOccupancyPct: number;
  activeAlertCount: number;
}

// ─── Alerts & Operational Intelligence ───────────────────────

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface AlertTriggerData {
  zoneId: ZoneId;
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
  explainer: string;           // "Because: Gate A has been at 92%+ for 12 min..."
  triggerData: AlertTriggerData;
  affectedZones: ZoneId[];
  suggestedAlternateZones: ZoneId[];
  createdUtc: string;
  acknowledgedUtc?: string;
  resolvedUtc?: string;
}

// ─── Chat & Multilingual Concierge ───────────────────────────

export type Language = 'en' | 'es' | 'fr' | 'pt' | 'de' | 'it' | 'ar' | 'zh' | 'ja' | 'ko' | string;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  language: Language;
  timestampUtc: string;
}

export interface ChatContext {
  venueId?: string;
  matchId?: string;
  userLanguage?: Language;
  accessibilityNeeds?: boolean;
  currentPhase?: MatchPhase;
}

export interface ChatRequest {
  sessionId: string;
  message: string;
  context: ChatContext;
  history: ChatMessage[];
}

export interface ChatChunk {
  sessionId: string;
  delta: string;
  done: boolean;
  detectedLanguage?: Language;
}

// ─── Navigation & Wayfinding ─────────────────────────────────

export type TravelMode = 'walking' | 'transit' | 'driving' | 'cycling';

export interface NavigationRequest {
  origin: Coordinates | string;  // coords or "current_location"
  destinationVenueId: string;
  travelMode: TravelMode;
  accessible: boolean;
  preferredEntrance?: string;
}

export interface RouteStep {
  instruction: string;
  distanceM: number;
  durationSec: number;
  travelMode: TravelMode;
}

export interface NavigationRoute {
  totalDistanceM: number;
  totalDurationSec: number;
  travelMode: TravelMode;
  steps: RouteStep[];
  accessible: boolean;
  recommendedEntrance: VenueEntrance;
  polylineEncoded?: string;
  co2GramsEstimate?: number;
}

// ─── Transportation ───────────────────────────────────────────

export interface TransitETA {
  lineName: string;
  departureUtc: string;
  arrivalUtc: string;
  durationMin: number;
  transfers: number;
}

export interface ParkingLot {
  id: string;
  name: string;
  coordinates: Coordinates;
  totalSpaces: number;
  availableSpaces: number;
  fillPct: number;
  distanceM: number;
  walkTimeMin: number;
  accessible: boolean;
}

// ─── Weather ─────────────────────────────────────────────────

export interface WeatherData {
  temperature: number;      // Celsius
  apparentTemperature: number;
  weatherCode: number;      // WMO code
  weatherDescription: string;
  windSpeedKmh: number;
  humidity: number;
  isDay: boolean;
  crowdRiskModifier: 'none' | 'heat_advisory' | 'rain_advisory' | 'storm_warning';
}

// ─── WebSocket Message Types ──────────────────────────────────

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

// ─── API Response Wrappers ────────────────────────────────────

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: string;
  code: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
