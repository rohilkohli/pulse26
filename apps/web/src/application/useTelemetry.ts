// ============================================================
// Pulse26 — useTelemetry Hook
// Manages WebSocket connection and telemetry state.
// Falls back to polling if WebSocket fails.
// ============================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import type { VenueTelemetry, Alert, WsMessage } from '../domain/types';
import { apiClient } from '../infrastructure/apiClient';

const WS_URL = import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;
const POLL_INTERVAL_MS = 8000;
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

export interface TelemetryState {
  telemetryMap: Map<string, VenueTelemetry>;
  alerts: Alert[];
  connected: boolean;
  lastUpdated: Date | null;
  error: string | null;
}

export function useTelemetry() {
  const [state, setState] = useState<TelemetryState>({
    telemetryMap: new Map(),
    alerts: [],
    connected: false,
    lastUpdated: null,
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const usingPollFallback = useRef(false);

  const handleMessage = useCallback((msg: WsMessage) => {
    switch (msg.type) {
      case 'telemetry_update': {
        const t = msg.payload as VenueTelemetry;
        setState((prev) => {
          const newMap = new Map(prev.telemetryMap);
          newMap.set(t.venueId, t);
          return { ...prev, telemetryMap: newMap, lastUpdated: new Date(), error: null };
        });
        break;
      }
      case 'alert_new': {
        const alert = msg.payload as Alert;
        setState((prev) => ({
          ...prev,
          alerts: [alert, ...prev.alerts.filter((a) => a.id !== alert.id)],
        }));
        break;
      }
      case 'alert_acknowledged':
      case 'alert_resolved': {
        const updated = msg.payload as Alert;
        setState((prev) => ({
          ...prev,
          alerts: prev.alerts.map((a) => (a.id === updated.id ? updated : a)),
        }));
        break;
      }
      case 'connection_ack': {
        setState((prev) => ({ ...prev, connected: true, error: null }));
        break;
      }
      default:
        break;
    }
  }, []);

  const startPollingFallback = useCallback(() => {
    if (usingPollFallback.current) return;
    usingPollFallback.current = true;
    console.warn('[useTelemetry] WS unavailable — falling back to polling');

    const poll = async () => {
      try {
        const [allTelemetry, activeAlerts] = await Promise.all([
          apiClient.getAllTelemetry(),
          apiClient.getActiveAlerts(),
        ]);
        setState((prev) => {
          const newMap = new Map(prev.telemetryMap);
          for (const t of allTelemetry) newMap.set(t.venueId, t);
          return { ...prev, telemetryMap: newMap, alerts: activeAlerts, lastUpdated: new Date(), error: null };
        });
      } catch {
        setState((prev) => ({ ...prev, error: 'Failed to fetch telemetry' }));
      }
    };

    void poll();
    pollTimer.current = setInterval(() => void poll(), POLL_INTERVAL_MS);
  }, []);

  const connectWs = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[useTelemetry] WS connected');
      reconnectAttempts.current = 0;
      setState((prev) => ({ ...prev, connected: true, error: null }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as WsMessage;
        handleMessage(msg);
      } catch {
        // ignore malformed
      }
    };

    ws.onclose = () => {
      setState((prev) => ({ ...prev, connected: false }));
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts.current++;
        reconnectTimer.current = setTimeout(connectWs, RECONNECT_DELAY_MS);
      } else {
        startPollingFallback();
      }
    };

    ws.onerror = () => {
      setState((prev) => ({ ...prev, error: 'Connection error' }));
    };
  }, [handleMessage, startPollingFallback]);

  useEffect(() => {
    connectWs();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (pollTimer.current) clearInterval(pollTimer.current);
      wsRef.current?.close();
    };
  }, [connectWs]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    const updated = await apiClient.acknowledgeAlert(alertId);
    if (updated) {
      setState((prev) => ({
        ...prev,
        alerts: prev.alerts.map((a) => (a.id === alertId ? updated : a)),
      }));
    }
  }, []);

  const resolveAlert = useCallback(async (alertId: string) => {
    const updated = await apiClient.resolveAlert(alertId);
    if (updated) {
      setState((prev) => ({
        ...prev,
        alerts: prev.alerts.map((a) => (a.id === alertId ? updated : a)),
      }));
    }
  }, []);

  return {
    ...state,
    acknowledgeAlert,
    resolveAlert,
  };
}
