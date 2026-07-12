// ============================================================
// Pulse26 — Shared UI Components
// ============================================================

import React from 'react';
import { AlertCircle, AlertTriangle, Info, TrendingUp, TrendingDown, MoveRight, Sun, CloudSun, Cloud, CloudFog, CloudRain, CloudSnow, CloudLightning, Flame } from 'lucide-react';
import type { OccupancyLevel, AlertSeverity } from '../../domain/types';

// ─── OccupancyBar ─────────────────────────────────────────────

interface OccupancyBarProps {
  pct: number;
  level: OccupancyLevel;
  showLabel?: boolean;
  className?: string;
}

export function OccupancyBar({ pct, level, showLabel, className = '' }: OccupancyBarProps) {
  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-xs mb-2">
          <span className="text-secondary">Occupancy</span>
          <span className={`font-semi ${
            level === 'critical' ? 'text-danger' :
            level === 'high' ? 'text-warning' :
            level === 'moderate' ? 'text-accent' : 'text-success'
          }`}>
            {pct}%
          </span>
        </div>
      )}
      <div className="occ-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Occupancy ${pct}%`}>
        <div
          className={`occ-bar__fill occ-bar__fill--${level}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

// ─── SeverityBadge ────────────────────────────────────────────

interface SeverityBadgeProps {
  severity: AlertSeverity;
  className?: string;
}

const severityConfig: Record<AlertSeverity, { label: string; cls: string; Icon: React.ElementType }> = {
  critical: { label: 'Critical', cls: 'badge badge--red', Icon: AlertCircle },
  warning:  { label: 'Warning',  cls: 'badge badge--amber', Icon: AlertTriangle },
  info:     { label: 'Info',     cls: 'badge badge--blue', Icon: Info },
};

export function SeverityBadge({ severity, className = '' }: SeverityBadgeProps) {
  const cfg = severityConfig[severity];
  return (
    <span className={`${cfg.cls} ${className}`} role="status" aria-label={`${cfg.label} severity alert`}>
      <cfg.Icon size={14} strokeWidth={2.5} aria-hidden="true" />
      {cfg.label}
    </span>
  );
}

// ─── LiveDot ──────────────────────────────────────────────────

interface LiveDotProps { label?: string; }

export function LiveDot({ label = 'Live' }: LiveDotProps) {
  return (
    <div className="flex items-center gap-2" role="status" aria-label={label}>
      <span className="live-dot" aria-hidden="true" />
      <span className="text-xs font-semi text-pulse uppercase tracking-wide">{label}</span>
    </div>
  );
}

// ─── SkeletonCard ────────────────────────────────────────────

interface SkeletonCardProps { lines?: number; }

export function SkeletonCard({ lines = 3 }: SkeletonCardProps) {
  return (
    <div className="card" aria-busy="true" aria-label="Loading...">
      <div className="skeleton" style={{ height: 20, width: '60%', marginBottom: 12 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 14, width: `${85 - i * 10}%`, marginBottom: 8 }} />
      ))}
    </div>
  );
}

// ─── ConnectionStatus ────────────────────────────────────────

interface ConnectionStatusProps { connected: boolean; }

export function ConnectionStatus({ connected }: ConnectionStatusProps) {
  return (
    <div
      className={`flex items-center gap-2 text-xs font-semi ${connected ? 'text-success' : 'text-danger'}`}
      role="status"
      aria-live="polite"
    >
      <span
        className="w-full rounded-full"
        style={{ width: 6, height: 6, background: connected ? 'var(--occ-low)' : 'var(--color-danger)', borderRadius: '50%', display: 'inline-block' }}
        aria-hidden="true"
      />
      {connected ? 'Live' : 'Reconnecting...'}
    </div>
  );
}

// ─── Trend Arrow ─────────────────────────────────────────────

interface TrendIconProps { trend: 'rising' | 'stable' | 'falling'; }

export function TrendIcon({ trend }: TrendIconProps) {
  if (trend === 'rising')  return <TrendingUp size={16} strokeWidth={2} aria-label="Rising trend" />;
  if (trend === 'falling') return <TrendingDown size={16} strokeWidth={2} aria-label="Falling trend" />;
  return <MoveRight size={16} strokeWidth={2} aria-label="Stable trend" />;
}

// ─── Match Phase Label ────────────────────────────────────────

const phaseLabels: Record<string, { label: string; color: string }> = {
  pre_match:     { label: 'Pre-Match',   color: 'var(--text-muted)' },
  arrival:       { label: 'Arrival',     color: 'var(--color-accent)' },
  kickoff_surge: { label: 'Kickoff',     color: 'var(--color-primary)' },
  first_half:    { label: '1st Half',    color: 'var(--occ-low)' },
  halftime:      { label: 'Half Time',   color: 'var(--color-warning)' },
  second_half:   { label: '2nd Half',    color: 'var(--occ-low)' },
  final_whistle: { label: 'Final Whistle', color: 'var(--color-primary)' },
  exit_surge:    { label: 'Exit Surge',  color: 'var(--color-warning)' },
  post_match:    { label: 'Post-Match',  color: 'var(--text-muted)' },
};

interface MatchPhaseLabelProps { phase: string; matchMinute?: number | null; }

export function MatchPhaseLabel({ phase, matchMinute }: MatchPhaseLabelProps) {
  const cfg = phaseLabels[phase] ?? { label: phase, color: 'var(--text-muted)' };
  return (
    <span style={{ color: cfg.color, fontWeight: 600, fontSize: 'var(--text-sm)' }}>
      {cfg.label}{matchMinute !== null && matchMinute !== undefined ? ` · ${matchMinute}'` : ''}
    </span>
  );
}

// ─── EmptyState ──────────────────────────────────────────────

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 gap-4 fade-in">
      <div className="text-muted" aria-hidden="true">{icon}</div>
      <div>
        <h3 className="text-lg font-semi mb-2">{title}</h3>
        <p className="text-secondary text-sm" style={{ maxWidth: 320 }}>{description}</p>
      </div>
    </div>
  );
}

// ─── WeatherWidget ───────────────────────────────────────────

interface WeatherWidgetProps {
  weather: import('../../domain/types').WeatherData | null;
  compact?: boolean;
}

function getWeatherIcon(code: number) {
  if (code >= 95) return <CloudLightning size={24} strokeWidth={1.5} />;
  if (code >= 71) return <CloudSnow size={24} strokeWidth={1.5} />;
  if (code >= 61 || code === 51) return <CloudRain size={24} strokeWidth={1.5} />;
  if (code >= 45) return <CloudFog size={24} strokeWidth={1.5} />;
  if (code === 3) return <Cloud size={24} strokeWidth={1.5} />;
  if (code === 2 || code === 1) return <CloudSun size={24} strokeWidth={1.5} />;
  return <Sun size={24} strokeWidth={1.5} />;
}

export function WeatherWidget({ weather, compact = false }: WeatherWidgetProps) {
  if (!weather) return null;

  const riskColors: Record<string, string> = {
    none: 'var(--occ-low)',
    heat_advisory: 'var(--color-warning)',
    rain_advisory: 'var(--color-accent)',
    storm_warning: 'var(--color-danger)',
  };

  const riskLabels: Record<string, React.ReactNode> = {
    none: null,
    heat_advisory: <span className="flex items-center gap-1"><Flame size={12} strokeWidth={2.5}/> Heat Advisory</span>,
    rain_advisory: <span className="flex items-center gap-1"><CloudRain size={12} strokeWidth={2.5}/> Rain Advisory</span>,
    storm_warning: <span className="flex items-center gap-1"><CloudLightning size={12} strokeWidth={2.5}/> Storm Warning</span>,
  };

  return (
    <div className={`flex items-center gap-3 ${compact ? '' : 'card'}`} aria-label={`Weather: ${weather.weatherDescription}, ${weather.temperature}°C`}>
      <div className="text-primary" aria-hidden="true" style={{ transform: compact ? 'scale(0.8)' : 'scale(1.2)' }}>
        {getWeatherIcon(weather.weatherCode)}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="font-bold" style={{ fontSize: compact ? 'var(--text-base)' : 'var(--text-xl)' }}>
            {Math.round(weather.temperature)}°C
          </span>
          {weather.crowdRiskModifier !== 'none' && (
            <span style={{ color: riskColors[weather.crowdRiskModifier], fontSize: 'var(--text-xs)', fontWeight: 600 }}>
              {riskLabels[weather.crowdRiskModifier]}
            </span>
          )}
        </div>
        {!compact && (
          <p className="text-xs text-muted">{weather.weatherDescription} · Feels {Math.round(weather.apparentTemperature)}°C</p>
        )}
      </div>
    </div>
  );
}
