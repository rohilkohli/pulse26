// ============================================================
// Pulse26 — Fan Navigate Screen
// City-to-venue directions + venue map + accessible routing
// ============================================================

import React, { useState, useEffect } from 'react';
import { useFanContext } from './FanLayout';
import { useVenue } from '../../application/useVenueData';
import { usePreferences } from '../../application/usePreferences';
import { apiClient } from '../../infrastructure/apiClient';
import { Footprints, Train, Car, MapIcon, Lightbulb, MapPin, Building, SquareParking, Target, Leaf, Smartphone, Accessibility, Info } from 'lucide-react';
import type { VenueTelemetry } from '../../domain/types';

type TravelMode = 'walking' | 'transit' | 'driving';

const MODE_ICONS: Record<TravelMode, React.ReactNode> = { walking: <Footprints size={16} />, transit: <Train size={16} />, driving: <Car size={16} /> };
const MODE_LABELS: Record<TravelMode, Record<string, string>> = {
  walking: { en: 'Walk',    es: 'Caminar',  fr: 'Marcher', pt: 'Caminhar' },
  transit: { en: 'Transit', es: 'Tránsito', fr: 'Transports', pt: 'Transporte' },
  driving: { en: 'Drive',   es: 'Manejar',  fr: 'Conduire', pt: 'Dirigir' },
};

// Simulated routes (Google Maps API calls require a live key)
function getSimulatedRoute(mode: TravelMode, accessible: boolean, _venueId: string) {
  const base = {
    walking: { duration: '25 min', distance: '1.8 km', steps: [
      'Head north on stadium approach road',
      accessible ? 'Follow blue accessible signs to Accessible Entrance' : 'Follow signs to Gate A',
      'Show your ticket at the gate scanner',
      accessible ? 'Take the elevator to your section level' : 'Proceed to your section',
    ]},
    transit: { duration: '18 min', distance: '8.4 km', steps: [
      'Take the Red Line toward Stadium Station',
      'Exit at Stadium Station (2 stops)',
      'Follow the "To Stadium" signs from exit 3',
      accessible ? 'Use the accessible shuttle from the transit hub' : 'Walk 400m to the main entrance',
      'Show your ticket at the gate',
    ]},
    driving: { duration: '35 min', distance: '14.2 km', steps: [
      'Merge onto I-95 North toward the stadium',
      'Take exit 18 for Stadium Boulevard',
      accessible ? 'Follow blue signs to Accessible Parking Lot A (closer to accessible entrance)' : 'Follow signs to Parking Lot B',
      'Walk to the stadium entrance',
      accessible ? 'Follow blue accessible pathway to the accessible gate' : 'Proceed to your gate',
    ]},
  };
  return base[mode];
}

// Simulated parking lots
const PARKING_LOTS = [
  { id: 'lot_a', name: 'Lot A — North', fillPct: 78, distanceM: 300, walkMin: 4, accessible: true },
  { id: 'lot_b', name: 'Lot B — East',  fillPct: 45, distanceM: 600, walkMin: 8, accessible: false },
  { id: 'lot_c', name: 'Lot C — South', fillPct: 92, distanceM: 450, walkMin: 6, accessible: false },
  { id: 'lot_d', name: 'Lot D — West',  fillPct: 31, distanceM: 850, walkMin: 11, accessible: true },
];

export function FanNavigate() {
  const { venueId } = useFanContext();
  const { venue } = useVenue(venueId);
  const { prefs } = usePreferences();
  const lang = prefs.preferredLanguage;
  const accessible = prefs.accessibilityNeeds;

  const [mode, setMode] = useState<TravelMode>('transit');
  const [route, setRoute] = useState(getSimulatedRoute('transit', accessible, venueId));
  const [telemetry, setTelemetry] = useState<VenueTelemetry | null>(null);
  const [activeTab, setActiveTab] = useState<'directions' | 'venue' | 'parking'>('directions');

  useEffect(() => {
    setRoute(getSimulatedRoute(mode, accessible, venueId));
    apiClient.getTelemetry(venueId).then(setTelemetry);
  }, [mode, accessible, venueId]);

  const gateEntrance = accessible
    ? venue?.entrances.find((e) => e.accessible)
    : venue?.entrances[0];

  // Find least congested gate
  const leastCongestedGate = (() => {
    if (!telemetry) return null;
    const gateZones = telemetry.zones.filter((z) => z.zoneType === 'gate' || z.zoneType === 'accessible');
    if (!gateZones.length) return null;
    return gateZones.reduce((a, b) => a.occupancyPct < b.occupancyPct ? a : b);
  })();

  return (
    <div style={{ padding: '0 0 16px' }}>
      {/* Header */}
      <div className="topbar">
        <span className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'rgba(79, 138, 255, 0.15)', color: 'var(--color-primary)' }} aria-hidden="true">
          <MapIcon size={20} strokeWidth={2} />
        </span>
        <div>
          <div className="font-display font-bold text-lg leading-none mb-1">Navigate to {venue?.name ?? 'Venue'}</div>
          <div className="text-xs text-secondary font-semi flex items-center gap-1">{venue?.city}, {venue?.country}</div>
        </div>
      </div>

      {/* Beat the Queue Banner */}
      {leastCongestedGate && leastCongestedGate.occupancyPct < 60 && (
        <div style={{
          margin: '12px 16px 0',
          padding: '10px 14px',
          background: 'rgba(0, 229, 160, 0.10)',
          border: '1px solid rgba(0, 229, 160, 0.25)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-xs)',
        }} role="alert">
          <strong className="text-pulse flex items-center gap-1 inline-flex"><Lightbulb size={14} strokeWidth={2.5} /> Beat the Queue:</strong>{' '}
          <span className="text-primary">{leastCongestedGate.zoneName} has only {leastCongestedGate.occupancyPct}% occupancy — {leastCongestedGate.waitTimeMin}min wait.</span>
        </div>
      )}

      {/* Travel Mode Tabs */}
      <div className="flex gap-2" style={{ padding: '12px 16px 0' }}>
        {(['walking', 'transit', 'driving'] as TravelMode[]).map((m) => (
          <button
            key={m}
            className={`btn btn--sm flex-1 ${mode === m ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            aria-label={`${m} directions`}
          >
            <span aria-hidden="true">{MODE_ICONS[m]}</span>
            {MODE_LABELS[m][lang] ?? MODE_LABELS[m].en}
          </button>
        ))}
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-0" style={{ margin: '16px 16px 0', background: 'var(--surface-02)', borderRadius: 'var(--radius-md)', padding: 3 }}>
        {([
          ['directions', <><MapPin size={14} className="inline mr-1" /> Directions</>],
          ['venue', <><Building size={14} className="inline mr-1" /> Venue Map</>],
          ['parking', <><SquareParking size={14} className="inline mr-1" /> Parking</>],
        ] as const).map(([tab, label]) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '8px 4px', border: 'none', cursor: 'pointer',
              background: activeTab === tab ? 'var(--surface-03)' : 'transparent',
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-xs)',
              fontWeight: activeTab === tab ? 600 : 400,
              transition: 'all var(--transition-fast)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px' }}>
        {/* Directions Tab */}
        {activeTab === 'directions' && (
          <div className="fade-in">
            {/* Route Summary */}
            <div className="glass mb-6 relative overflow-hidden" style={{ 
              padding: '24px 20px', 
              background: 'linear-gradient(135deg, rgba(79,138,255,0.08) 0%, rgba(0,229,160,0.05) 100%)',
              border: '1px solid var(--border-emphasis)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' 
            }}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">
                    {mode === 'transit' ? 'Transit route' : mode === 'walking' ? 'Walking route' : 'Driving route'}
                    {accessible ? ' · Accessible' : ''}
                  </div>
                  <div className="font-display font-black text-3xl tracking-tight" style={{ color: 'var(--color-primary)' }}>
                    {route.duration}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted">{route.distance}</div>
                  {accessible && (
                    <span className="badge badge--blue flex items-center gap-1" style={{ marginTop: 4, fontSize: 10 }}><Accessibility size={10} strokeWidth={2.5} /> Accessible</span>
                  )}
                  {mode === 'transit' && (
                    <div className="text-xs text-pulse font-semi mt-1 flex items-center justify-end gap-1"><Leaf size={12} /> Eco</div>
                  )}
                </div>
              </div>
              {gateEntrance && (
                <div style={{
                  background: 'var(--surface-02)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  border: '1px solid var(--border-subtle)',
                  fontSize: 'var(--text-xs)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span className="text-muted uppercase tracking-widest text-[10px] font-bold">Your entrance: </span>
                  <strong className="text-primary text-sm font-semi">{gateEntrance.label}</strong>
                  {gateEntrance.accessible && <span className="text-accent ml-auto inline-flex align-middle"><Accessibility size={14} strokeWidth={2.5} /></span>}
                </div>
              )}
            </div>

            {/* Step-by-step */}
            <div>
              <h2 className="text-sm font-semi text-muted uppercase tracking-wide mb-3">Step by step</h2>
              {route.steps.map((step, i) => (
                <div key={i} className="flex gap-3 mb-4 fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: i === 0 ? 'var(--color-primary)' : 'var(--surface-03)',
                    border: '2px solid',
                    borderColor: i === 0 ? 'var(--color-primary)' : 'var(--border-default)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    color: i === 0 ? 'var(--text-inverse)' : 'var(--text-secondary)',
                  }} aria-hidden="true">{i + 1}</div>
                  <div style={{ paddingTop: 3 }}>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                      {step}
                    </p>
                    {i === route.steps.length - 1 && (
                      <span className="badge badge--pulse mt-2 flex items-center gap-1 w-max" style={{ fontSize: 10 }}><Target size={10} /> Destination</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Rideshare */}
            <div className="card mt-4" style={{ padding: 16 }}>
              <div className="text-sm font-semi mb-3 flex items-center gap-2"><Smartphone size={16} strokeWidth={2} /> Book a Ride</div>
              <div className="flex gap-2">
                <a
                  href={`uber:///?action=setPickup&pickup=my_location&dropoff[nickname]=${encodeURIComponent(venue?.name ?? 'Stadium')}&dropoff[latitude]=${venue?.coordinates.lat}&dropoff[longitude]=${venue?.coordinates.lng}`}
                  className="btn btn--secondary btn--sm flex-1"
                  aria-label="Open Uber app for a ride to the stadium"
                >
                  <Car size={16} strokeWidth={2} className="inline mr-1" /> Uber
                </a>
                <a
                  href={`lyft://ridetype?id=lyft&destination[latitude]=${venue?.coordinates.lat}&destination[longitude]=${venue?.coordinates.lng}`}
                  className="btn btn--secondary btn--sm flex-1"
                  aria-label="Open Lyft app for a ride to the stadium"
                >
                  <Car size={16} strokeWidth={2} className="inline mr-1" /> Lyft
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Venue Map Tab */}
        {activeTab === 'venue' && (
          <div className="fade-in">
            <div className="card" style={{ padding: 20 }}>
              <div className="flex justify-center text-primary mb-3" aria-hidden="true"><Building size={48} strokeWidth={1.5} /></div>
              <h2 className="text-base font-semi mb-2">{venue?.name}</h2>
              <p className="text-sm text-secondary mb-4">Capacity: {venue?.capacity.toLocaleString()} seats</p>

              <div className="mb-4">
                <div className="text-xs text-muted uppercase tracking-wide mb-3">Entrances</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {venue?.entrances.map((e) => {
                    const zoneStatus = telemetry?.zones.find((z) => z.zoneId === e.id);
                    return (
                      <div key={e.id} className="card" style={{ padding: '10px 14px' }}>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {e.accessible && <span className="badge badge--blue flex items-center" style={{ fontSize: 10, padding: '2px 6px' }}><Accessibility size={10} strokeWidth={2.5} /></span>}
                            <span className="text-sm font-semi">{e.label}</span>
                          </div>
                          {zoneStatus && (
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-semi ${
                                zoneStatus.occupancyLevel === 'critical' ? 'text-danger' :
                                zoneStatus.occupancyLevel === 'high' ? 'text-warning' : 'text-success'
                              }`}>{zoneStatus.occupancyPct}% full</span>
                              {zoneStatus.waitTimeMin > 0 && (
                                <span className="text-xs text-muted">{zoneStatus.waitTimeMin}m wait</span>
                              )}
                            </div>
                          )}
                        </div>
                        {accessible && e.accessible && (
                          <div className="text-xs text-accent mt-1">✓ Recommended for you</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{
                background: 'var(--surface-02)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                textAlign: 'center',
                border: '1px solid var(--border-subtle)',
              }}>
                <div className="text-xs text-muted mb-1">Venue Coordinates</div>
                <div className="text-sm font-semi">
                  {venue?.coordinates.lat.toFixed(4)}°N, {Math.abs(venue?.coordinates.lng ?? 0).toFixed(4)}°W
                </div>
                <div className="text-xs text-muted mt-1">Digital Twin Model Active</div>
              </div>
            </div>
          </div>
        )}

        {/* Parking Tab */}
        {activeTab === 'parking' && (
          <div className="fade-in">
            <div className="text-xs text-muted mb-3 flex items-start gap-1">
              <Info size={14} className="mt-0.5 flex-shrink-0" /> Fill levels are simulated. Check venue app for live parking guidance.
            </div>
            {PARKING_LOTS
              .filter((lot) => !accessible || lot.accessible)
              .sort((a, b) => a.fillPct - b.fillPct)
              .map((lot, i) => (
              <div key={lot.id} className={`card mb-3 fade-in`} style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-sm font-semi flex items-center gap-2">
                      {lot.accessible && <span className="badge badge--blue flex items-center" style={{ fontSize: 10, padding: '2px 6px' }}><Accessibility size={10} strokeWidth={2.5} /></span>}
                      {lot.name}
                      {i === 0 && <span className="badge badge--green" style={{ fontSize: 10 }}>Best option</span>}
                    </div>
                    <div className="text-xs text-muted mt-1">
                      {lot.distanceM}m · {lot.walkMin}min walk to entrance
                    </div>
                  </div>
                  <div className={`text-xl font-bold font-display ${
                    lot.fillPct >= 85 ? 'text-danger' :
                    lot.fillPct >= 70 ? 'text-warning' : 'text-success'
                  }`}>{lot.fillPct}%</div>
                </div>
                <div className="occ-bar">
                  <div
                    className={`occ-bar__fill occ-bar__fill--${lot.fillPct >= 85 ? 'critical' : lot.fillPct >= 70 ? 'high' : lot.fillPct >= 50 ? 'moderate' : 'low'}`}
                    style={{ width: `${lot.fillPct}%` }}
                    role="progressbar"
                    aria-valuenow={lot.fillPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Lot ${lot.name} is ${lot.fillPct}% full`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
