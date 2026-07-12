// ============================================================
// Pulse26 — Gate Control View
// Per-gate queue depth and wait times
// ============================================================


import { DoorOpen, Accessibility, AlertTriangle } from 'lucide-react';
import { useOpsContext } from './OpsLayout';
import { OccupancyBar, TrendIcon, EmptyState } from '../shared/components';

export function OpsGates() {
  const { telemetry, selectedVenueId } = useOpsContext();
  const snapshot = telemetry.telemetryMap.get(selectedVenueId);

  const gateZones = snapshot?.zones.filter(
    (z) => z.zoneType === 'gate' || z.zoneType === 'accessible'
  ) ?? [];

  const nonGateZones = snapshot?.zones.filter(
    (z) => z.zoneType !== 'gate' && z.zoneType !== 'accessible'
  ) ?? [];

  if (!snapshot) {
    return <EmptyState icon={<DoorOpen size={48} strokeWidth={1.5} />} title="No data" description="Waiting for venue telemetry..." />;
  }

  return (
    <div style={{ padding: 24 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-display mb-2">Gate Control</h1>
        <p className="text-sm text-secondary">
          Real-time queue depth, wait times, and flow rates per gate.
          Highlighted zones require immediate attention.
        </p>
      </div>

      {/* Gates */}
      <h2 className="text-lg font-semi mb-4">Gates & Entrances</h2>
      <div className="grid-3 mb-8">
        {gateZones.map((zone) => (
          <div
            key={zone.zoneId}
            className={`glass ${zone.occupancyLevel === 'critical' ? 'card--glow' : ''}`}
            style={{
              borderColor: zone.occupancyLevel === 'critical' ? 'var(--color-danger)' :
                zone.occupancyLevel === 'high' ? 'var(--color-warning)' : 'var(--border-default)',
              background: 'linear-gradient(135deg, rgba(79,138,255,0.05) 0%, var(--surface-01) 100%)',
              padding: 24,
              transition: 'all 0.5s ease',
            }}
            role="region"
            aria-label={`${zone.zoneName} gate status`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-base font-semi flex items-center gap-2">
                  {zone.zoneType === 'accessible' ? <Accessibility size={16} strokeWidth={2.5}/> : <DoorOpen size={16} strokeWidth={2.5}/>}
                  {zone.zoneName}
                </div>
                {zone.zoneType === 'accessible' && (
                  <span className="badge badge--blue mt-1" style={{ fontSize: 10 }}>Accessible</span>
                )}
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold font-display ${
                  zone.occupancyLevel === 'critical' ? 'text-danger' :
                  zone.occupancyLevel === 'high' ? 'text-warning' : 'text-success'
                }`}>{zone.occupancyPct}%</div>
                <div className={`text-xs font-semi ${
                  zone.trend === 'rising' ? 'text-danger' :
                  zone.trend === 'falling' ? 'text-success' : 'text-secondary'
                }`}>
                  <TrendIcon trend={zone.trend} /> {zone.trend}
                </div>
              </div>
            </div>

            <OccupancyBar pct={zone.occupancyPct} level={zone.occupancyLevel} />

            <div className="grid-2 mt-4">
              <div style={{
                background: 'var(--surface-base)',
                borderRadius: 'var(--radius-md)',
                padding: '10px',
                textAlign: 'center',
              }}>
                <div className="text-xs text-muted mb-1">Est. Wait</div>
                <div className={`text-xl font-bold font-display ${
                  zone.waitTimeMin > 15 ? 'text-danger' :
                  zone.waitTimeMin > 8 ? 'text-warning' : 'text-primary'
                }`}>{zone.waitTimeMin}m</div>
              </div>
              <div style={{
                background: 'var(--surface-base)',
                borderRadius: 'var(--radius-md)',
                padding: '10px',
                textAlign: 'center',
              }}>
                <div className="text-xs text-muted mb-1">Queue</div>
                <div className="text-xl font-bold font-display">{zone.queueDepth}</div>
              </div>
            </div>

            {zone.occupancyLevel === 'critical' && (
              <div style={{
                marginTop: 12,
                padding: '8px 12px',
                background: 'rgba(220,38,38,0.15)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(220,38,38,0.3)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-danger)',
                fontWeight: 600,
              }} role="alert">
                <span className="flex items-center gap-1"><AlertTriangle size={14} strokeWidth={2.5} /> Immediate attention required. See Alerts for recommendations.</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Other Zones */}
      <h2 className="text-lg font-semi mb-4">Other Zones</h2>
      <div className="grid-4">
        {nonGateZones.map((zone) => (
          <div key={zone.zoneId} className="glass fade-in" style={{ padding: 20, background: 'var(--surface-01)', border: '1px solid var(--border-default)' }}>
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm font-semi" style={{ maxWidth: '70%' }}>{zone.zoneName}</div>
              <span className={`text-sm font-bold ${
                zone.occupancyLevel === 'critical' ? 'text-danger' :
                zone.occupancyLevel === 'high' ? 'text-warning' : 'text-secondary'
              }`}>{zone.occupancyPct}%</span>
            </div>
            <OccupancyBar pct={zone.occupancyPct} level={zone.occupancyLevel} />
          </div>
        ))}
      </div>
    </div>
  );
}
