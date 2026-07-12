// ============================================================
// Pulse26 — Ops Dashboard (Live Heatmap)
// ============================================================

import React from 'react';
import { DoorOpen, Map, Coffee, SquareParking, Accessibility, Train, MapPin, SatelliteDish, Map as MapIcon, ChevronDown, AlertCircle } from 'lucide-react';
import { useOpsContext } from './OpsLayout';
import {
  LiveDot, MatchPhaseLabel, WeatherWidget,
  SkeletonCard, EmptyState, TrendIcon,
} from '../shared/components';
import { useWeather } from '../../application/useVenueData';
import type { ZoneStatus } from '../../domain/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

const MONITORED_VENUES = [
  { id: 'metlife', name: 'MetLife', city: 'NY/NJ' },
  { id: 'sofi', name: 'SoFi', city: 'Los Angeles' },
  { id: 'azteca', name: 'Azteca', city: 'Mexico City' },
  { id: 'atandt', name: 'AT&T', city: 'Dallas' },
  { id: 'gillette', name: 'Gillette', city: 'Boston' },
  { id: 'nrg', name: 'NRG', city: 'Houston' },
  { id: 'arrowhead', name: 'Arrowhead', city: 'Kansas City' },
  { id: 'hardrock', name: 'Hard Rock', city: 'Miami' },
  { id: 'levis', name: "Levi's", city: 'San Francisco' },
];

const ZONE_TYPE_ICONS: Record<string, React.ReactNode> = {
  gate: <DoorOpen size={16} strokeWidth={2} />,
  concourse: <Map size={16} strokeWidth={2} />,
  concession: <Coffee size={16} strokeWidth={2} />,
  parking: <SquareParking size={16} strokeWidth={2} />,
  accessible: <Accessibility size={16} strokeWidth={2} />,
  transit_hub: <Train size={16} strokeWidth={2} />,
};

function ZoneCard({ zone }: { zone: ZoneStatus }) {
  const isCritical = zone.occupancyLevel === 'critical';
  
  return (
    <div
      className={`card ${isCritical ? 'card--glow' : ''} fade-in`}
      style={{ 
        borderColor: isCritical ? 'var(--color-danger)' : 'transparent',
        background: isCritical ? 'rgba(255, 69, 58, 0.1)' : 'var(--surface-01)'
      }}
      role="region"
      aria-label={`${zone.zoneName}: ${zone.occupancyPct}% occupancy, wait ${zone.waitTimeMin} minutes`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-sm font-semi flex items-center gap-2">
            <span aria-hidden="true" className="flex items-center">{ZONE_TYPE_ICONS[zone.zoneType] ?? <MapPin size={16} strokeWidth={2} />}</span>
            <span>{zone.zoneName}</span>
          </div>
          <div className="text-xs mt-1 text-muted">{zone.zoneType.replace('_', ' ')}</div>
        </div>
        <div className="flex items-center gap-2">
          {zone.trend !== 'stable' && (
            <span
              className={`text-xs ${
                zone.trend === 'rising' ? 'text-danger' : 'text-success'
              }`}
            >
              <TrendIcon trend={zone.trend} />
            </span>
          )}
          <span
            className="font-display font-bold"
            style={{ fontSize: 'var(--text-xl)' }}
          >
            {zone.occupancyPct}%
          </span>
        </div>
      </div>

      {/* Progressive disclosure details */}
      <div className="zone-details-wrapper">
        <div className="zone-details-content flex gap-6 mt-3 pt-3" style={{ borderTop: '1px solid var(--border-glass)' }}>
          {zone.waitTimeMin > 0 && (
            <div>
              <div className="text-xs text-muted">Wait</div>
              <div className="text-sm font-bold">{zone.waitTimeMin}m</div>
            </div>
          )}
          {zone.queueDepth > 0 && (
            <div>
              <div className="text-xs text-muted">Queue</div>
              <div className="text-sm font-bold">{zone.queueDepth}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function OpsDashboard() {
  const { telemetry, selectedVenueId, setSelectedVenueId } = useOpsContext();
  const snapshot = telemetry.telemetryMap.get(selectedVenueId);
  const currentVenue = MONITORED_VENUES.find(v => v.id === selectedVenueId) || MONITORED_VENUES[0];
  const activeAlerts = telemetry.alerts.filter((a) => a.status === 'active');

  // Get venue coords for weather (hardcoded for now, MetLife default)
  const venueCoords: Record<string, [number, number]> = {
    metlife: [40.8135, -74.0745],
    sofi: [33.9534, -118.3392],
    azteca: [19.3029, -99.1505],
    atandt: [32.7478, -97.0931],
    hardrock: [25.9580, -80.2389],
  };
  const coords = venueCoords[selectedVenueId];
  const { weather } = useWeather(coords?.[0], coords?.[1]);

  if (!snapshot && telemetry.connected) {
    return (
      <div style={{ padding: 24 }}>
        <div className="grid-auto">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <EmptyState
        icon={<SatelliteDish size={48} strokeWidth={1.5} />}
        title="No telemetry yet"
        description={`Waiting for data from ${selectedVenueId}. The digital twin will start broadcasting shortly.`}
      />
    );
  }

  const criticalZones = snapshot.zones.filter((z) => z.occupancyLevel === 'critical').length;
  const highZones = snapshot.zones.filter((z) => z.occupancyLevel === 'high').length;

  return (
    <div style={{ padding: 24, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="flex-1">
        {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-display">
              {selectedVenueId.charAt(0).toUpperCase() + selectedVenueId.slice(1)} — Live Dashboard
            </h1>
            <LiveDot />
          </div>
          <div className="flex items-center gap-4">
            <MatchPhaseLabel phase={snapshot.matchPhase} matchMinute={snapshot.matchMinute} />
            <span className="text-muted text-sm">|</span>
            <span className="text-sm text-secondary">
              Overall: <strong className={
                snapshot.overallOccupancyPct >= 85 ? 'text-danger' :
                snapshot.overallOccupancyPct >= 70 ? 'text-warning' : 'text-success'
              }>{snapshot.overallOccupancyPct}%</strong>
            </span>
            {criticalZones > 0 && (
              <>
                <span className="text-muted text-sm">|</span>
                <span className="badge badge--red">{criticalZones} Critical Zone{criticalZones > 1 ? 's' : ''}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button aria-label="Switch Venue" className="group flex items-center justify-between bg-surface-01/80 backdrop-blur-md hover:bg-surface-02 border border-border-default hover:border-blue-500/40 dark:hover:border-blue-400/40 data-[state=open]:border-blue-500 rounded-xl px-4 py-2 transition-all duration-300 shadow-md hover:shadow-[0_0_12px_rgba(59,130,246,0.12)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-52 cursor-pointer">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex items-center justify-center bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg w-9 h-9 shrink-0 border border-blue-500/20 transition-colors group-hover:bg-blue-500/20 dark:group-hover:bg-blue-500/30">
                    <MapPin size={18} />
                  </div>
                  <div className="flex flex-col items-start truncate leading-tight">
                    <span className="text-[9px] text-muted uppercase tracking-[0.12em] font-bold">Stadium</span>
                    <span className="text-sm text-primary font-bold truncate mt-0.5">{currentVenue.name}</span>
                  </div>
                </div>
                <ChevronDown size={16} className="text-muted ml-2 transition-transform duration-300 group-data-[state=open]:rotate-180" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              sideOffset={8}
              className="w-72 overflow-hidden z-[100] animate-in fade-in-50 slide-in-from-top-2 duration-200"
            >
              <DropdownMenuLabel className="text-[9px] font-bold text-muted uppercase tracking-[0.12em] px-3 py-2 select-none">
                Switch Venue
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border-default/50 mx-1 mb-1.5" />
              
              <div className="overflow-y-auto max-h-[55vh] px-1 pb-1 space-y-1.5 scrollbar-thin">
                {MONITORED_VENUES.map((v) => {
                  const snap = telemetry.telemetryMap.get(v.id);
                  const occ = snap?.overallOccupancyPct ?? 0;
                  const alertsForVenue = activeAlerts.filter((a) => a.venueId === v.id).length;
                  const isActive = selectedVenueId === v.id;

                  return (
                    <DropdownMenuItem
                      key={v.id}
                      onClick={() => setSelectedVenueId(v.id)}
                      className={`group/item flex items-center justify-between rounded-xl px-3 py-3 cursor-pointer outline-none transition-all duration-200 border-l-[3.5px] ${
                        isActive 
                          ? 'bg-gradient-to-r from-blue-500/15 to-indigo-500/10 border-blue-500 shadow-[inset_0_1px_0_rgba(59,130,246,0.15)]' 
                          : 'bg-surface-02/40 border-transparent hover:bg-surface-02 hover:border-blue-500/30 focus:bg-surface-03'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`flex items-center justify-center rounded-lg w-8 h-8 shrink-0 transition-colors ${
                          isActive 
                            ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' 
                            : 'bg-surface-02 text-muted group-hover/item:text-primary group-hover/item:bg-surface-03'
                        }`}>
                          <MapPin size={16} strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                        <div className="flex flex-col truncate">
                          <span className={`text-sm leading-tight transition-colors ${
                            isActive ? 'font-bold text-blue-600 dark:text-blue-400' : 'font-semibold text-primary group-hover/item:text-blue-500'
                          }`}>
                            {v.name}
                          </span>
                          <span className="text-[10px] text-muted uppercase tracking-wider font-semibold mt-1">{v.city}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0 select-none">
                        {alertsForVenue > 0 && (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-white bg-red-500 dark:bg-red-600 px-1.5 py-0.5 rounded shadow-[0_2px_8px_rgba(239,68,68,0.3)]">
                            <AlertCircle size={10} className="stroke-[3]" />
                            {alertsForVenue}
                          </span>
                        )}
                        <div className="flex flex-col items-end gap-1 min-w-[56px]">
                          <span className={`text-[10px] font-bold ${
                            !snap ? 'text-muted' :
                            occ >= 85 ? 'text-danger' : 
                            occ >= 70 ? 'text-warning' : 
                            'text-success'
                          }`}>
                            {snap ? `${occ}% full` : 'Offline'}
                          </span>
                          <div className="w-12 h-1 bg-surface-03 rounded-full overflow-hidden border border-border-subtle/20">
                            <div 
                              className={`h-full rounded-full ${
                                !snap ? 'bg-muted' :
                                occ >= 85 ? 'bg-red-500' : 
                                occ >= 70 ? 'bg-amber-500' : 
                                'bg-green-500'
                              }`} 
                              style={{ width: `${occ}%` }} 
                            />
                          </div>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {weather && <WeatherWidget weather={weather} compact />}
          <div className="text-xs text-muted">
            Updated {new Date(snapshot.timestampUtc).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid-4 mb-6">
        {[
          {
            label: 'Overall Occupancy', value: `${snapshot.overallOccupancyPct}%`,
            color: snapshot.overallOccupancyPct >= 85 ? 'var(--color-danger)' : snapshot.overallOccupancyPct >= 70 ? 'var(--color-warning)' : 'var(--occ-low)',
            sub: snapshot.matchPhase.replace(/_/g, ' ')
          },
          {
            label: 'Critical Zones', value: String(criticalZones),
            color: criticalZones > 0 ? 'var(--color-danger)' : 'var(--occ-low)',
            sub: `${highZones} high`
          },
          {
            label: 'Active Alerts', value: String(telemetry.alerts.filter(a => a.status === 'active' && a.venueId === selectedVenueId).length),
            color: telemetry.alerts.filter(a => a.status === 'active' && a.venueId === selectedVenueId && a.severity === 'critical').length > 0 ? 'var(--color-danger)' : 'var(--color-warning)',
            sub: 'requiring attention'
          },
          {
            label: 'Max Wait Time', value: `${Math.max(...snapshot.zones.map(z => z.waitTimeMin))}m`,
            color: 'var(--text-primary)',
            sub: 'at any gate'
          },
        ].map((stat, i) => (
          <div key={i} className="card fade-in" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{stat.label}</div>
            <div style={{ fontSize: 'var(--text-3xl)', fontFamily: 'var(--font-display)', fontWeight: 600, color: stat.color, lineHeight: 1 }}>
              {stat.value}
            </div>
            <div className="text-xs mt-2" style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Heatmap Grid */}
      <div className="mb-4">
        <h2 className="text-lg font-semi mb-4 flex items-center gap-2">
          <span aria-hidden="true" className="flex items-center"><MapIcon size={20} strokeWidth={2} /></span> Zone Heatmap
        </h2>
        <div
          className="grid-auto"
          role="region"
          aria-label="Live venue zone occupancy heatmap"
          aria-live="polite"
          aria-atomic="false"
        >
          {snapshot.zones.map((zone) => (
            <ZoneCard key={zone.zoneId} zone={zone} />
          ))}
        </div>
      </div>

      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-auto pt-4" style={{ borderTop: '1px solid var(--border-glass)' }}>
        <div className="text-xs font-semi" style={{ color: 'var(--text-muted)' }}>Legend:</div>
        {[
          { label: 'Normal Operation', color: 'var(--text-primary)' },
          { label: 'Critical / Action Required', color: 'var(--color-danger)' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, display: 'inline-block' }} aria-hidden="true" />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
