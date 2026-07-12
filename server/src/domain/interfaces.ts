// ============================================================
// Pulse26 — Domain Interfaces (Ports)
// Every external dependency is hidden behind one of these.
// Swap the concrete implementation without touching business logic.
// ============================================================

import type {
  VenueTelemetry,
  Alert,
  ChatRequest,
  ChatChunk,
  NavigationRequest,
  NavigationRoute,
  WeatherData,
  Venue,
  Match,
} from './types.js';

/**
 * ITelemetryProvider
 * Implemented by: DigitalTwinSimulator (dev) | VenueIoTAdapter (prod)
 */
export interface ITelemetryProvider {
  /** Start emitting telemetry (call once on startup) */
  start(): void;
  /** Stop emitting telemetry */
  stop(): void;
  /** Get the latest snapshot for a venue */
  getSnapshot(venueId: string): VenueTelemetry | null;
  /** Subscribe to telemetry updates */
  onUpdate(callback: (telemetry: VenueTelemetry) => void): () => void;
}

/**
 * IAlertEngine
 * Implemented by: GeminiAlertEngine | MockAlertEngine
 */
export interface IAlertEngine {
  /** Analyze telemetry and produce actionable alerts */
  analyzeAndAlert(telemetry: VenueTelemetry): Promise<Alert[]>;
}

/**
 * IConciergeService
 * Implemented by: GeminiConciergeService | CannedResponseConcierge
 */
export interface IConciergeService {
  /** Stream a chat response chunk by chunk */
  streamResponse(
    request: ChatRequest,
    onChunk: (chunk: ChatChunk) => void,
  ): Promise<void>;
}

/**
 * INavigationAdapter
 * Implemented by: GoogleMapsAdapter | StaticRouteAdapter
 */
export interface INavigationAdapter {
  /** Compute a route from origin to venue */
  computeRoute(request: NavigationRequest): Promise<NavigationRoute>;
}

/**
 * IWeatherAdapter
 * Implemented by: OpenMeteoAdapter | StaticWeatherAdapter
 */
export interface IWeatherAdapter {
  /** Get current weather for coordinates */
  getWeather(lat: number, lng: number): Promise<WeatherData>;
}

/**
 * IVenueRepository
 * Implemented by: StaticVenueRepository | FirestoreVenueRepository
 */
export interface IVenueRepository {
  getAllVenues(): Promise<Venue[]>;
  getVenueById(id: string): Promise<Venue | null>;
  getActiveMatches(): Promise<Match[]>;
  getMatchById(id: string): Promise<Match | null>;
}
