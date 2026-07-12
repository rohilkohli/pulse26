// ============================================================
// Pulse26 — Fan Match Screen
// Seat info, venue facilities, live zone status
// ============================================================

import React from 'react';
import { useFanContext } from './FanLayout';
import { useVenue } from '../../application/useVenueData';
import { apiClient } from '../../infrastructure/apiClient';
import { useEffect, useState } from 'react';
import type { VenueTelemetry } from '../../domain/types';
import { OccupancyBar, MatchPhaseLabel, SkeletonCard } from '../shared/components';
import { Shield, Goal, Pizza, DoorOpen, Building, Accessibility, Flame, Zap, Star, Trophy, LifeBuoy, MapPin, Users, Globe, Calendar } from 'lucide-react';

const ROUND_LABELS: Record<string, React.ReactNode> = {
  r16: <span className="flex items-center gap-1 justify-center">Round of 16 <Flame size={12} className="text-pulse" /></span>,
  qf: <span className="flex items-center gap-1 justify-center">Quarter-Final <Zap size={12} className="text-accent" /></span>,
  sf: <span className="flex items-center gap-1 justify-center">Semi-Final <Star size={12} className="text-warning" /></span>,
  final: <span className="flex items-center gap-1 justify-center">THE FINAL <Trophy size={12} className="text-primary" /></span>,
  group: 'Group Stage',
};

export function FanMatch() {
  const { venueId } = useFanContext();
  const { venue, matches } = useVenue(venueId);
  const match = matches[0];
  const [telemetry, setTelemetry] = useState<VenueTelemetry | null>(null);

  useEffect(() => {
    apiClient.getTelemetry(venueId).then(setTelemetry);
    const id = setInterval(() => apiClient.getTelemetry(venueId).then(setTelemetry), 10000);
    return () => clearInterval(id);
  }, [venueId]);

  const concessionZones = telemetry?.zones.filter((z) => z.zoneType === 'concession') ?? [];
  const gateZones = telemetry?.zones.filter((z) => z.zoneType === 'gate' || z.zoneType === 'accessible') ?? [];

  return (
    <div style={{ padding: '0 0 16px' }}>
      {/* Header */}
      <div className="topbar">
        <span className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'rgba(0, 229, 160, 0.15)', color: 'var(--color-primary)' }} aria-hidden="true">
          <Goal size={20} strokeWidth={2} />
        </span>
        <div style={{ flex: 1 }}>
          <div className="font-display font-bold text-lg leading-none mb-1">My Match</div>
          <div className="text-xs text-secondary font-semi flex items-center gap-1">
            {venue ? venue.name : 'Loading venue...'}
          </div>
        </div>
        {telemetry && (
          <div style={{ background: 'var(--surface-02)', border: '1px solid var(--border-subtle)', padding: '5px 12px', borderRadius: 'var(--radius-full)' }}>
            <MatchPhaseLabel phase={telemetry.matchPhase} matchMinute={telemetry.matchMinute} />
          </div>
        )}
      </div>

      <div style={{ padding: '16px' }}>
        {/* Match Card */}
        {!match ? (
          <div className="mb-5"><SkeletonCard lines={4} /></div>
        ) : (
          <div
            className="glass mb-6 relative overflow-hidden"
            style={{
              padding: '24px 20px',
              background: 'linear-gradient(135deg, rgba(0,229,160,0.08) 0%, rgba(79,138,255,0.08) 100%)',
              border: '1px solid var(--border-emphasis)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}
          >
            <div style={{ 
              position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', 
              background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.05) 0%, transparent 50%)', 
              pointerEvents: 'none' 
            }} />
            <div className="flex justify-center mb-6">
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', color: 'var(--color-primary)', textTransform: 'uppercase', background: 'var(--surface-02)', padding: '4px 12px', borderRadius: 'var(--radius-full)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-glass)' }}>
                {ROUND_LABELS[match.round] ?? match.round}
              </div>
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div className="text-center flex-1">
                <div className="flex justify-center text-primary mb-3" aria-hidden="true">
                  <div style={{ padding: 12, borderRadius: '50%', background: 'rgba(0, 229, 160, 0.1)', border: '1px solid rgba(0, 229, 160, 0.2)' }}>
                    <Shield size={32} strokeWidth={1.5} />
                  </div>
                </div>
                <div className="font-display font-bold text-xl tracking-tight">{match.homeTeam}</div>
              </div>
              <div className="text-center px-4 flex flex-col items-center">
                <div className="font-display font-black italic leading-none" style={{ fontSize: 28, color: 'var(--text-primary)', textShadow: '0 2px 10px rgba(0,229,160,0.3)' }}>VS</div>
                <div className="mt-2 flex items-center gap-1.5" style={{ background: 'var(--surface-02)', padding: '4px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-emphasis)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                  <Calendar size={12} className="text-primary" />
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                    {new Date(match.kickoffUtc).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
              <div className="text-center flex-1">
                <div className="flex justify-center text-accent mb-3" aria-hidden="true">
                  <div style={{ padding: 12, borderRadius: '50%', background: 'rgba(79, 138, 255, 0.1)', border: '1px solid rgba(79, 138, 255, 0.2)' }}>
                    <Shield size={32} strokeWidth={1.5} />
                  </div>
                </div>
                <div className="font-display font-bold text-xl tracking-tight">{match.awayTeam}</div>
              </div>
            </div>
          </div>
        )}

        {/* Concessions Status */}
        {concessionZones.length > 0 && (
          <div className="mb-5">
            <h2 className="text-sm font-semi text-muted uppercase tracking-wide mb-3 flex items-center gap-1">
              <Pizza size={14} /> Concessions Live Status
            </h2>
            {concessionZones.map((zone) => (
              <div key={zone.zoneId} className="card mb-2" style={{ padding: '12px 16px' }}>
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-semi">{zone.zoneName}</div>
                  <div className="flex items-center gap-3">
                    {zone.waitTimeMin > 0 && (
                      <span className={`text-sm font-semi ${zone.waitTimeMin > 15 ? 'text-danger' : zone.waitTimeMin > 8 ? 'text-warning' : 'text-success'}`}>
                        ~{zone.waitTimeMin}m wait
                      </span>
                    )}
                    <span className={`text-xs font-semi ${
                      zone.occupancyLevel === 'critical' ? 'text-danger' :
                      zone.occupancyLevel === 'high' ? 'text-warning' : 'text-success'
                    }`}>{zone.occupancyPct}%</span>
                  </div>
                </div>
                <OccupancyBar pct={zone.occupancyPct} level={zone.occupancyLevel} />
              </div>
            ))}
          </div>
        )}

        {/* Gate Status */}
        {gateZones.length > 0 && (
          <div className="mb-5">
            <h2 className="text-sm font-semi text-muted uppercase tracking-wide mb-3 flex items-center gap-1">
              <DoorOpen size={14} /> Gate Status
            </h2>
            <div className="grid-2 gap-3">
              {gateZones.map((zone) => (
                <div key={zone.zoneId} className="card" style={{ padding: '12px' }}>
                  <div className="flex items-center gap-2 mb-1">
                    {zone.zoneType === 'accessible' && <span className="badge badge--blue flex items-center" style={{ fontSize: 10, padding: '2px 6px' }}><Accessibility size={10} strokeWidth={2.5} /></span>}
                    <div className="text-xs font-semi">{zone.zoneName}</div>
                  </div>
                  <div className={`font-bold text-lg font-display ${
                    zone.occupancyLevel === 'critical' ? 'text-danger' :
                    zone.occupancyLevel === 'high' ? 'text-warning' : 'text-success'
                  }`}>{zone.occupancyPct}%</div>
                  <div className="text-xs text-muted">
                    {zone.waitTimeMin > 0 ? `${zone.waitTimeMin}m wait` : 'No wait'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Venue Info */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
            <Building size={14} className="text-primary" /> Venue Info
          </h2>
          <div className="card" style={{ padding: 20 }}>
            {!venue ? (
              <SkeletonCard lines={2} />
            ) : (
              <>
                <div className="grid-2 gap-y-6 gap-x-4">
                  <div className="flex gap-3">
                    <MapPin size={18} className="text-muted mt-0.5" />
                    <div>
                      <div className="text-xs text-muted font-semi mb-1">Venue</div>
                      <div className="text-sm font-bold text-primary">{venue.name}</div>
                      <div className="text-xs text-secondary mt-1">{venue.city}</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Users size={18} className="text-muted mt-0.5" />
                    <div>
                      <div className="text-xs text-muted font-semi mb-1">Capacity</div>
                      <div className="text-sm font-bold">{venue.capacity.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Globe size={18} className="text-muted mt-0.5" />
                    <div>
                      <div className="text-xs text-muted font-semi mb-1">Languages</div>
                      <div className="text-sm font-bold">{venue.primaryLanguages.join(', ').toUpperCase()}</div>
                    </div>
                  </div>
                </div>

                {venue.entrances && venue.entrances.length > 0 && (
                  <>
                    <div className="divider my-5" style={{ opacity: 0.5 }} />
                    <div>
                      <div className="text-xs text-muted font-semi uppercase tracking-widest mb-3">Accessible Entrances</div>
                      <div className="flex flex-wrap gap-2">
                        {venue.entrances
                          .filter((e) => e.accessible)
                          .map((e) => (
                            <div key={e.id} className="flex items-center gap-2 bg-surface-02 border border-border-default rounded-full px-4 py-2">
                              <span className="flex items-center text-accent"><Accessibility size={12} strokeWidth={2.5} /></span>
                              <span className="text-sm font-semi">{e.label}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Emergency Info */}
        <div className="card flex gap-4 items-start" style={{
          padding: 20,
          background: 'linear-gradient(135deg, rgba(255,77,106,0.1), rgba(255,77,106,0.02))',
          border: '1px solid rgba(255,77,106,0.3)',
          boxShadow: '0 8px 24px rgba(255,77,106,0.1)'
        }}>
          <div style={{ padding: 10, background: 'rgba(255,77,106,0.15)', borderRadius: '50%', color: 'var(--color-danger)' }}>
            <LifeBuoy size={24} strokeWidth={2} />
          </div>
          <div>
            <div className="text-sm font-bold tracking-wide mb-1 text-danger uppercase">Emergency Info</div>
            <p className="text-xs text-secondary font-semi" style={{ lineHeight: 1.6 }}>
              For medical emergencies, contact any orange-vested steward or call the venue emergency line.
              First aid stations are located at Gates A, B, and the Accessible Entrance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
