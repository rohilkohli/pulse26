// ============================================================
// Pulse26 — Alert Store Tests
// ============================================================

import { AlertStore } from '../services/alertStore';
import type { Alert } from '../domain/types';

function makeAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: `alert_${Math.random().toString(36).slice(2, 8)}`,
    venueId: 'metlife',
    severity: 'warning',
    status: 'active',
    title: 'Gate A congestion',
    recommendedAction: 'Open Gate 3B',
    explainer: 'Gate A at 88% for 10 minutes',
    triggerData: {
      zoneId: 'gate_a',
      zoneName: 'Gate A',
      occupancyPct: 88,
      waitTimeMin: 12,
      trend: 'rising',
      durationMinutes: 10,
    },
    affectedZones: ['gate_a'],
    suggestedAlternateZones: ['gate_b', 'gate_c'],
    createdUtc: new Date().toISOString(),
    ...overrides,
  };
}

describe('AlertStore', () => {
  let store: AlertStore;

  beforeEach(() => {
    store = new AlertStore();
  });

  it('adds alerts and retrieves them', () => {
    const alert = makeAlert();
    store.addAlerts([alert]);
    expect(store.getActive()).toHaveLength(1);
    expect(store.getActive()[0].id).toBe(alert.id);
  });

  it('deduplicates alerts for same zone', () => {
    const alert1 = makeAlert({ affectedZones: ['gate_a'] });
    const alert2 = makeAlert({ affectedZones: ['gate_a'] });
    store.addAlerts([alert1]);
    store.addAlerts([alert2]);
    expect(store.getActive()).toHaveLength(1);
  });

  it('allows alerts for different zones', () => {
    const alert1 = makeAlert({ affectedZones: ['gate_a'] });
    const alert2 = makeAlert({ affectedZones: ['gate_b'] });
    store.addAlerts([alert1, alert2]);
    expect(store.getActive()).toHaveLength(2);
  });

  it('acknowledges an active alert', () => {
    const alert = makeAlert();
    store.addAlerts([alert]);
    const updated = store.acknowledge(alert.id);
    expect(updated).not.toBeNull();
    expect(updated?.status).toBe('acknowledged');
    expect(updated?.acknowledgedUtc).toBeTruthy();
    expect(store.getActive()).toHaveLength(0);
  });

  it('returns null when acknowledging a non-existent alert', () => {
    expect(store.acknowledge('nonexistent')).toBeNull();
  });

  it('resolves an alert', () => {
    const alert = makeAlert();
    store.addAlerts([alert]);
    const resolved = store.resolve(alert.id);
    expect(resolved?.status).toBe('resolved');
    expect(resolved?.resolvedUtc).toBeTruthy();
  });

  it('auto-resolves when zone is clear', () => {
    const alert = makeAlert({ affectedZones: ['gate_a'] });
    store.addAlerts([alert]);
    expect(store.getActive()).toHaveLength(1);
    // Simulate zone dropping below threshold
    store.autoResolveIfClear('metlife', { gate_a: 40 });
    expect(store.getActive()).toHaveLength(0);
  });

  it('does NOT auto-resolve when zone is still high', () => {
    const alert = makeAlert({ affectedZones: ['gate_a'] });
    store.addAlerts([alert]);
    store.autoResolveIfClear('metlife', { gate_a: 80 });
    expect(store.getActive()).toHaveLength(1);
  });

  it('sorts active alerts by severity (critical first)', () => {
    const warning = makeAlert({ severity: 'warning', affectedZones: ['gate_a'] });
    const critical = makeAlert({ severity: 'critical', affectedZones: ['gate_b'] });
    const info = makeAlert({ severity: 'info', affectedZones: ['gate_c'] });
    store.addAlerts([info, warning, critical]);
    const active = store.getActive();
    expect(active[0].severity).toBe('critical');
    expect(active[1].severity).toBe('warning');
    expect(active[2].severity).toBe('info');
  });
});
