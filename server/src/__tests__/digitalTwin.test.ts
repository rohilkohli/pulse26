// ============================================================
// Pulse26 — Digital Twin Simulator Tests
// ============================================================

import { DigitalTwinSimulator } from '../infrastructure/digitalTwin';

describe('DigitalTwinSimulator', () => {
  let sim: DigitalTwinSimulator;

  beforeEach(() => {
    sim = new DigitalTwinSimulator(999999); // Very long interval so auto-tick doesn't interfere
  });

  afterEach(() => {
    sim.stop();
  });

  it('starts and emits telemetry for known venues', (done) => {
    let updateCount = 0;
    let finished = false;
    sim.onUpdate((telemetry) => {
      if (finished) return;
      updateCount++;
      expect(telemetry.venueId).toBeTruthy();
      expect(telemetry.zones).toHaveLength(12);
      if (updateCount >= 3) {
        finished = true;
        done();
      }
    });
    sim.start();
  });

  it('produces occupancy values between 0 and 100', (done) => {
    let finished = false;
    sim.onUpdate((telemetry) => {
      if (finished) return;
      finished = true;
      for (const zone of telemetry.zones) {
        expect(zone.occupancyPct).toBeGreaterThanOrEqual(0);
        expect(zone.occupancyPct).toBeLessThanOrEqual(100);
      }
      done();
    });
    sim.start();
  });

  it('classifies occupancy level correctly', (done) => {
    let finished = false;
    sim.onUpdate((telemetry) => {
      if (finished) return;
      finished = true;
      for (const zone of telemetry.zones) {
        if (zone.occupancyPct < 50) expect(zone.occupancyLevel).toBe('low');
        else if (zone.occupancyPct < 70) expect(zone.occupancyLevel).toBe('moderate');
        else if (zone.occupancyPct < 85) expect(zone.occupancyLevel).toBe('high');
        else expect(zone.occupancyLevel).toBe('critical');
      }
      done();
    });
    sim.start();
  });

  it('getSnapshot returns null before start', () => {
    expect(sim.getSnapshot('metlife')).toBeNull();
  });

  it('getSnapshot returns data after start', (done) => {
    let finished = false;
    sim.onUpdate(() => {
      if (finished) return;
      finished = true;
      const snapshot = sim.getSnapshot('metlife');
      expect(snapshot).not.toBeNull();
      expect(snapshot?.venueId).toBe('metlife');
      done();
    });
    sim.start();
  });

  it('assigns valid zone types', (done) => {
    const validTypes = ['gate', 'concourse', 'concession', 'parking', 'accessible', 'transit_hub'];
    let finished = false;
    sim.onUpdate((telemetry) => {
      if (finished) return;
      finished = true;
      for (const zone of telemetry.zones) {
        expect(validTypes).toContain(zone.zoneType);
      }
      done();
    });
    sim.start();
  });

  it('assigns valid trends', (done) => {
    const validTrends = ['rising', 'stable', 'falling'];
    let finished = false;
    sim.onUpdate((telemetry) => {
      if (finished) return;
      finished = true;
      for (const zone of telemetry.zones) {
        expect(validTrends).toContain(zone.trend);
      }
      done();
    });
    sim.start();
  });
});
