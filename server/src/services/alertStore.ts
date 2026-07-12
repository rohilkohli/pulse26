// ============================================================
// Pulse26 — Alert Store (in-memory)
// ============================================================
// Manages active/acknowledged/resolved alerts in memory.
// Replace with Firestore/Redis adapter for multi-instance scale.
// ============================================================

import type { Alert } from '../domain/types.js';

export class AlertStore {
  private alerts = new Map<string, Alert>();

  addAlerts(newAlerts: Alert[]): Alert[] {
    const added: Alert[] = [];
    for (const alert of newAlerts) {
      // Deduplicate by venueId + zoneId combo (don't spam same zone)
      const existingKey = Array.from(this.alerts.values()).find(
        (a) =>
          a.venueId === alert.venueId &&
          a.affectedZones.some((z) => alert.affectedZones.includes(z)) &&
          a.status === 'active',
      );
      if (existingKey) continue; // zone already has an active alert

      this.alerts.set(alert.id, alert);
      added.push(alert);
    }
    return added;
  }

  acknowledge(alertId: string): Alert | null {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.status !== 'active') return null;
    const updated: Alert = {
      ...alert,
      status: 'acknowledged',
      acknowledgedUtc: new Date().toISOString(),
    };
    this.alerts.set(alertId, updated);
    return updated;
  }

  resolve(alertId: string): Alert | null {
    const alert = this.alerts.get(alertId);
    if (!alert) return null;
    const updated: Alert = {
      ...alert,
      status: 'resolved',
      resolvedUtc: new Date().toISOString(),
    };
    this.alerts.set(alertId, updated);
    return updated;
  }

  getActive(): Alert[] {
    return Array.from(this.alerts.values())
      .filter((a) => a.status === 'active')
      .sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
  }

  getAll(): Alert[] {
    return Array.from(this.alerts.values())
      .sort((a, b) => new Date(b.createdUtc).getTime() - new Date(a.createdUtc).getTime());
  }

  getById(id: string): Alert | null {
    return this.alerts.get(id) ?? null;
  }

  /** Auto-resolve alerts for zones now back below threshold */
  autoResolveIfClear(venueId: string, occupancyByZone: Record<string, number>): Alert[] {
    const resolved: Alert[] = [];
    for (const alert of this.alerts.values()) {
      if (alert.venueId !== venueId || alert.status !== 'active') continue;
      const allClear = alert.affectedZones.every(
        (z) => (occupancyByZone[z] ?? 100) < 65,
      );
      if (allClear) {
        const updated = this.resolve(alert.id);
        if (updated) resolved.push(updated);
      }
    }
    return resolved;
  }
}
