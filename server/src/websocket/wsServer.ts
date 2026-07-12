// ============================================================
// Pulse26 — WebSocket Server
// ============================================================
// Broadcasts telemetry updates and alerts to all connected
// Ops Console clients. Fan Companion uses REST/SSE instead.
// ============================================================

import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { WsMessage, VenueTelemetry, Alert } from '../domain/types.js';

export class PulseWebSocketServer {
  private wss: WebSocketServer;
  private readonly heartbeatIntervalMs: number;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor(server: Server, heartbeatIntervalMs = 30000) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.heartbeatIntervalMs = heartbeatIntervalMs;
    this.setup();
  }

  private setup(): void {
    this.wss.on('connection', (ws, req) => {
      const clientIp = req.socket.remoteAddress ?? 'unknown';
      console.log(`[WS] Client connected: ${clientIp}. Total: ${this.wss.clients.size}`);

      // Send ack on connect
      this.sendToClient(ws, {
        type: 'connection_ack',
        payload: { message: 'Connected to Pulse26 real-time feed', serverTime: new Date().toISOString() },
        timestampUtc: new Date().toISOString(),
      });

      // Attach ping/pong for connection health
      (ws as WebSocket & { isAlive: boolean }).isAlive = true;
      ws.on('pong', () => {
        (ws as WebSocket & { isAlive: boolean }).isAlive = true;
      });

      ws.on('error', (err) => {
        console.warn(`[WS] Client error (${clientIp}):`, err.message);
      });

      ws.on('close', () => {
        console.log(`[WS] Client disconnected: ${clientIp}. Total: ${this.wss.clients.size}`);
      });

      // Handle messages from clients (e.g., alert acknowledgements)
      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString()) as WsMessage;
          console.log(`[WS] Received: ${msg.type}`);
        } catch {
          // ignore malformed
        }
      });
    });

    // Start heartbeat
    this.heartbeatTimer = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        const client = ws as WebSocket & { isAlive: boolean };
        if (!client.isAlive) {
          client.terminate();
          return;
        }
        client.isAlive = false;
        client.ping();
      });
    }, this.heartbeatIntervalMs);

    console.log('[WS] WebSocket server ready at path /ws');
  }

  broadcastTelemetry(telemetry: VenueTelemetry): void {
    this.broadcast({
      type: 'telemetry_update',
      payload: telemetry,
      timestampUtc: new Date().toISOString(),
    });
  }

  broadcastAlert(alert: Alert): void {
    this.broadcast({
      type: 'alert_new',
      payload: alert,
      timestampUtc: new Date().toISOString(),
    });
  }

  broadcastAlertUpdate(alert: Alert): void {
    const type = alert.status === 'acknowledged' ? 'alert_acknowledged' : 'alert_resolved';
    this.broadcast({
      type,
      payload: alert,
      timestampUtc: new Date().toISOString(),
    });
  }

  private broadcast(message: WsMessage): void {
    const data = JSON.stringify(message);
    let sent = 0;
    this.wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
        sent++;
      }
    });
    if (sent > 0) {
      console.log(`[WS] Broadcast ${message.type} to ${sent} client(s)`);
    }
  }

  private sendToClient(ws: WebSocket, message: WsMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  get clientCount(): number {
    return this.wss.clients.size;
  }

  close(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.wss.close();
  }
}
