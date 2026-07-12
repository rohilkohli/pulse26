// ============================================================
// Pulse26 — API Client (Infrastructure Layer)
// All fetch calls go through here — typed, error-handled,
// with defined fallbacks. Never throws raw network errors.
// ============================================================

import type { ApiResponse, Venue, Match, VenueTelemetry, Alert, WeatherData } from '../domain/types';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const data = await res.json() as ApiResponse<T>;
    return data;
  } catch (err) {
    return { ok: false, error: 'Network error', code: 'NETWORK_ERROR' };
  }
}

export const apiClient = {
  // ─── Venues ──────────────────────────────────────────────

  async getVenues(): Promise<Venue[]> {
    const res = await request<Venue[]>('/venues');
    return res.ok ? res.data : [];
  },

  async getVenue(id: string): Promise<Venue | null> {
    const res = await request<Venue>(`/venues/${id}`);
    return res.ok ? res.data : null;
  },

  // ─── Matches ─────────────────────────────────────────────

  async getMatches(): Promise<Match[]> {
    const res = await request<Match[]>('/matches');
    return res.ok ? res.data : [];
  },

  // ─── Telemetry ───────────────────────────────────────────

  async getTelemetry(venueId: string): Promise<VenueTelemetry | null> {
    const res = await request<VenueTelemetry>(`/telemetry/${venueId}`);
    return res.ok ? res.data : null;
  },

  async getAllTelemetry(): Promise<VenueTelemetry[]> {
    const res = await request<VenueTelemetry[]>('/telemetry');
    return res.ok ? res.data : [];
  },

  // ─── Alerts ──────────────────────────────────────────────

  async getActiveAlerts(): Promise<Alert[]> {
    const res = await request<Alert[]>('/alerts/active');
    return res.ok ? res.data : [];
  },

  async acknowledgeAlert(id: string): Promise<Alert | null> {
    const res = await request<Alert>(`/alerts/${id}/acknowledge`, { method: 'POST' });
    return res.ok ? res.data : null;
  },

  async resolveAlert(id: string): Promise<Alert | null> {
    const res = await request<Alert>(`/alerts/${id}/resolve`, { method: 'POST' });
    return res.ok ? res.data : null;
  },

  // ─── Weather ─────────────────────────────────────────────

  async getWeather(lat: number, lng: number): Promise<WeatherData | null> {
    const res = await request<WeatherData>(`/weather?lat=${lat}&lng=${lng}`);
    return res.ok ? res.data : null;
  },
};

// ─── Streaming Chat ───────────────────────────────────────────

export interface ChatStreamChunk {
  sessionId: string;
  delta: string;
  done: boolean;
  detectedLanguage?: string;
  error?: string;
}

export interface ChatStreamOptions {
  sessionId: string;
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string; id: string; language: string; timestampUtc: string; }>;
  context: {
    venueId?: string;
    matchId?: string;
    userLanguage?: string;
    accessibilityNeeds?: boolean;
    currentPhase?: string;
  };
  onChunk: (chunk: ChatStreamChunk) => void;
  onDone: () => void;
  onError: (err: string) => void;
}

export async function streamChat(options: ChatStreamOptions): Promise<void> {
  const { sessionId, message, history, context, onChunk, onDone, onError } = options;

  try {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message, history, context }),
    });

    if (!res.ok || !res.body) {
      onError('Chat service unavailable');
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const chunk = JSON.parse(line.slice(6)) as ChatStreamChunk;
            if (chunk.error) {
              onError(chunk.error);
              return;
            }
            onChunk(chunk);
            if (chunk.done) {
              onDone();
              return;
            }
          } catch {
            // ignore malformed SSE line
          }
        }
      }
    }
    onDone();
  } catch (err) {
    onError(err instanceof Error ? err.message : 'Unknown error');
  }
}
