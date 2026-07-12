// ============================================================
// Pulse26 — Ops Alerts Panel
// AI-generated alerts with explainer data and action controls
// ============================================================

import { useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Minus, ChevronUp, ChevronDown, Check, X } from 'lucide-react';
import { useOpsContext } from './OpsLayout';
import { SeverityBadge, EmptyState } from '../shared/components';
import type { Alert } from '../../domain/types';

function AlertCard({ alert, onAcknowledge, onResolve }: {
  alert: Alert;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
}) {
  const [showExplainer, setShowExplainer] = useState(false);

  const timeAgo = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div
      className={`alert-card alert-card--${alert.severity} fade-in glass`}
      style={{
        padding: '24px'
      }}
      role="article"
      aria-label={`${alert.severity} alert: ${alert.title}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <SeverityBadge severity={alert.severity} />
          <span className="text-xs text-muted">{timeAgo(alert.createdUtc)}</span>
          {alert.status !== 'active' && (
            <span className={`badge ${alert.status === 'acknowledged' ? 'badge--blue' : 'badge--green'}`}>
              {alert.status}
            </span>
          )}
        </div>
        <span className="text-xs text-muted">
          Zone: <strong className="text-secondary">{alert.triggerData.zoneName}</strong>
        </span>
      </div>

      {/* Title */}
      <h3 className="text-base font-semi mb-2">{alert.title}</h3>

      {/* Recommended Action */}
      <div style={{
        background: 'rgba(0, 229, 160, 0.08)',
        border: '1px solid rgba(0, 229, 160, 0.2)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        marginBottom: 12,
      }}>
        <div className="text-xs text-pulse font-semi mb-1 uppercase tracking-wide">Recommended Action</div>
        <p className="text-sm text-primary" style={{ color: 'var(--text-primary)', margin: 0 }}>
          {alert.recommendedAction}
        </p>
      </div>

      {/* Trigger Data */}
      <div className="flex gap-4 mb-3">
        <div>
          <div className="text-xs text-muted">Occupancy</div>
          <div className={`text-sm font-bold ${
            alert.triggerData.occupancyPct >= 85 ? 'text-danger' : 'text-warning'
          }`}>{alert.triggerData.occupancyPct}%</div>
        </div>
        <div>
          <div className="text-xs text-muted">Wait Time</div>
          <div className="text-sm font-bold">{alert.triggerData.waitTimeMin}m</div>
        </div>
        <div>
          <div className="text-xs text-muted">Trend</div>
          <div className="text-sm font-bold flex items-center gap-1" style={{
            color: alert.triggerData.trend === 'rising' ? 'var(--color-danger)' : 'var(--text-primary)'
          }}>
            {alert.triggerData.trend === 'rising' ? <><TrendingUp size={14} /> Rising</> : 
             alert.triggerData.trend === 'falling' ? <><TrendingDown size={14} /> Falling</> : 
             <><Minus size={14} /> Stable</>}
          </div>
        </div>
        {alert.suggestedAlternateZones.length > 0 && (
          <div>
            <div className="text-xs text-muted">Redirects to</div>
            <div className="text-sm font-bold text-accent">{alert.suggestedAlternateZones.join(', ')}</div>
          </div>
        )}
      </div>

      {/* Explainer Toggle */}
      <button
        className="btn btn--ghost btn--sm flex items-center gap-1"
        onClick={() => setShowExplainer(!showExplainer)}
        aria-expanded={showExplainer}
        aria-controls={`explainer-${alert.id}`}
        style={{ marginBottom: showExplainer ? 8 : 0, paddingLeft: 0 }}
      >
        {showExplainer ? <ChevronUp size={16} /> : <ChevronDown size={16} />} Why did this fire?
      </button>

      {showExplainer && (
        <div
          id={`explainer-${alert.id}`}
          style={{
            background: 'var(--surface-base)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            marginBottom: 12,
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            borderLeft: '2px solid var(--text-muted)',
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>AI Reasoning:</strong> {alert.explainer}
        </div>
      )}

      {/* Actions */}
      {alert.status === 'active' && (
        <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--border-glass)' }}>
          <button
            className="btn btn--secondary btn--sm flex items-center gap-2"
            onClick={() => onAcknowledge(alert.id)}
            aria-label={`Acknowledge alert: ${alert.title}`}
          >
            <Check size={16} /> Acknowledge
          </button>
          <button
            className="btn btn--ghost btn--sm flex items-center gap-2"
            onClick={() => onResolve(alert.id)}
            aria-label={`Resolve alert: ${alert.title}`}
          >
            <X size={16} /> Resolve
          </button>
        </div>
      )}
    </div>
  );
}

export function OpsAlerts() {
  const { telemetry, selectedVenueId } = useOpsContext();
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged' | 'resolved'>('active');

  const filtered = telemetry.alerts
    .filter((a) => a.venueId === selectedVenueId || true) // Show all venues in Alerts
    .filter((a) => filter === 'all' || a.status === filter)
    .sort((a, b) => {
      // Critical first, then by time
      const sevOrder = { critical: 0, warning: 1, info: 2 };
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return (sevOrder[a.severity] - sevOrder[b.severity]) ||
        new Date(b.createdUtc).getTime() - new Date(a.createdUtc).getTime();
    });

  const activeCritical = telemetry.alerts.filter((a) => a.status === 'active' && a.severity === 'critical').length;
  const activeWarning = telemetry.alerts.filter((a) => a.status === 'active' && a.severity === 'warning').length;

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-display mb-2">Alerts & Recommendations</h1>
          <p className="text-sm text-secondary">
            AI-generated operational intelligence. Every alert shows the data that triggered it.
          </p>
        </div>
        <div className="flex gap-3">
          {activeCritical > 0 && (
            <div className="badge badge--red" style={{ padding: '6px 12px', fontSize: 'var(--text-sm)' }}>
              <AlertCircle size={16} strokeWidth={2.5}/> {activeCritical} Critical
            </div>
          )}
          {activeWarning > 0 && (
            <div className="badge badge--amber" style={{ padding: '6px 12px', fontSize: 'var(--text-sm)' }}>
              <AlertTriangle size={16} strokeWidth={2.5}/> {activeWarning} Warning
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6" role="tablist" aria-label="Alert filter">
        {(['active', 'acknowledged', 'resolved', 'all'] as const).map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            className={`btn btn--sm ${filter === f ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => setFilter(f)}
            style={{ textTransform: 'capitalize' }}
          >
            {f}
            <span style={{ marginLeft: 4 }}>
              ({telemetry.alerts.filter((a) => f === 'all' || a.status === f).length})
            </span>
          </button>
        ))}
      </div>

      {/* Alert List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 size={48} strokeWidth={1.5} />}
          title={filter === 'active' ? 'No active alerts' : `No ${filter} alerts`}
          description={
            filter === 'active'
              ? 'All zones are operating within normal parameters. The AI alert engine is monitoring continuously.'
              : 'Nothing to show here.'
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((alert, i) => (
            <div key={alert.id} style={{ animationDelay: `${i * 60}ms` }}>
              <AlertCard
                alert={alert}
                onAcknowledge={telemetry.acknowledgeAlert}
                onResolve={telemetry.resolveAlert}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
