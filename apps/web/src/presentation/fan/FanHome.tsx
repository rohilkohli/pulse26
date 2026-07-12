// ============================================================
// Pulse26 — Fan Home Screen
// Match countdown, weather, venue context, active alerts
// ============================================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFanContext } from './FanLayout';
import { useVenue, useWeather } from '../../application/useVenueData';
import { usePreferences } from '../../application/usePreferences';
import { apiClient } from '../../infrastructure/apiClient';
import { WeatherWidget, SkeletonCard } from '../shared/components';
import { Shield, MapIcon, MessageCircle, Accessibility, AlertCircle, AlertTriangle, Moon, Sun, ALargeSmall } from 'lucide-react';
import type { Alert } from '../../domain/types';

const VENUE_OPTIONS = [
  { id: 'metlife',   label: 'MetLife Stadium — NY/NJ' },
  { id: 'sofi',      label: 'SoFi Stadium — Los Angeles' },
  { id: 'azteca',    label: 'Estadio Azteca — Mexico City' },
  { id: 'atandt',    label: 'AT&T Stadium — Dallas' },
  { id: 'gillette',  label: 'Gillette Stadium — Boston' },
  { id: 'nrg',       label: 'NRG Stadium — Houston' },
  { id: 'arrowhead', label: 'Arrowhead Stadium — Kansas City' },
  { id: 'hardrock',  label: 'Hard Rock Stadium — Miami' },
  { id: 'levis',     label: "Levi's Stadium — San Francisco" },
  { id: 'centurylink', label: 'Lumen Field — Seattle' },
  { id: 'lincoln',   label: 'Lincoln Financial — Philadelphia' },
  { id: 'atlanta',   label: 'Mercedes-Benz Stadium — Atlanta' },
  { id: 'bmo_toronto', label: 'BMO Field — Toronto' },
  { id: 'bcplace',   label: 'BC Place — Vancouver' },
];

function useCountdown(kickoffUtc: string) {
  const [remaining, setRemaining] = useState('');
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(kickoffUtc).getTime() - Date.now();
      if (diff <= 0) {
        setIsLive(true);
        setRemaining('LIVE');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [kickoffUtc]);

  return { remaining, isLive };
}

const ROUND_LABELS: Record<string, string> = {
  r16: 'Round of 16', qf: 'Quarter-Final', sf: 'Semi-Final', final: 'Final', group: 'Group Stage',
};

export function FanHome() {
  const { venueId, setVenueId } = useFanContext();
  const { venue, matches, loading } = useVenue(venueId);
  const match = matches[0];
  const { weather } = useWeather(venue?.coordinates.lat, venue?.coordinates.lng);
  const { prefs, setLightMode, cycleFontScale, setAccessibilityNeeds, setLanguage } = usePreferences();
  const { remaining, isLive } = useCountdown(match?.kickoffUtc ?? '2026-07-09T23:00:00Z');
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showVenuePicker, setShowVenuePicker] = useState(false);

  useEffect(() => {
    apiClient.getActiveAlerts().then((a) => setAlerts(a.filter((al) => al.venueId === venueId)));
  }, [venueId]);

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const kickoffDate = match ? new Date(match.kickoffUtc) : null;
  const fanAlerts = alerts.filter((a) => a.status === 'active').slice(0, 2);

  return (
    <div style={{ padding: '16px 16px 8px' }}>

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            FIFA World Cup 2026
          </div>
          <h1 className="font-display font-bold" style={{ fontSize: 'var(--text-2xl)', lineHeight: 1.1 }}>
            <span className="gradient-text">Pulse26</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn--ghost btn--sm"
            aria-label={prefs.lightMode ? 'Switch to dark mode' : 'Switch to light mode'}
            onClick={() => setLightMode(!prefs.lightMode)}
            aria-pressed={prefs.lightMode}
            style={{ width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {prefs.lightMode
              ? <Moon size={16} strokeWidth={2} className="text-primary" />
              : <Sun size={16} strokeWidth={2} className="text-muted" />}
          </button>
          <button 
            className="btn btn--ghost btn--sm" 
            onClick={cycleFontScale} 
            aria-label="Change text size"
            style={{ width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ALargeSmall size={16} strokeWidth={2} className="text-muted" />
          </button>
        </div>
      </div>

      {/* Venue Picker */}
      <div className="card mb-4" style={{ padding: 12 }}>
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs text-muted uppercase tracking-wide">Your Venue</div>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => setShowVenuePicker(!showVenuePicker)}
            aria-expanded={showVenuePicker}
          >Change</button>
        </div>
        <div className="font-semi text-base">{venue?.name ?? 'Select a venue'}</div>
        <div className="text-xs text-muted">{venue?.city}, {venue?.country}</div>

        {showVenuePicker && (
          <div style={{
            marginTop: 12,
            maxHeight: 200,
            overflowY: 'auto',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
          }}>
            {VENUE_OPTIONS.map((v) => (
              <button
                key={v.id}
                onClick={() => { setVenueId(v.id); setShowVenuePicker(false); }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  textAlign: 'left',
                  background: v.id === venueId ? 'var(--surface-03)' : 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
                aria-pressed={v.id === venueId}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Match Card */}
      {match && (
        <div
          className="glass mb-4 relative overflow-hidden"
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
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 16, textAlign: 'center' }}>
            <span style={{ background: 'var(--surface-02)', padding: '4px 12px', borderRadius: 'var(--radius-full)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-glass)' }}>
              {ROUND_LABELS[match.round] ?? match.round} <span className="mx-1 opacity-50">·</span> {kickoffDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          {/* Teams */}
          <div className="flex items-center justify-between mb-5 relative z-10" style={{ gap: 8 }}>
            <div className="text-center flex-1">
              <div className="flex justify-center text-primary mb-3" aria-hidden="true">
                <div style={{ padding: 10, borderRadius: '50%', background: 'rgba(0, 229, 160, 0.1)', border: '1px solid rgba(0, 229, 160, 0.2)' }}>
                  <Shield size={24} strokeWidth={1.5} />
                </div>
              </div>
              <div className="font-display font-bold text-lg tracking-tight">{match.homeTeam}</div>
            </div>

            {/* Centre — time pill + VS */}
            <div className="flex flex-col items-center gap-2" style={{ padding: '0 8px' }}>
              {/* Kickoff time pill */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'var(--surface-02)',
                border: '1px solid var(--border-glass)',
                borderRadius: 999,
                padding: '4px 12px',
                backdropFilter: 'blur(8px)',
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  {kickoffDate?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {/* VS */}
              <div className="font-display font-black italic" style={{ fontSize: 22, color: 'var(--color-primary)', textShadow: '0 2px 10px rgba(0,229,160,0.3)', lineHeight: 1 }}>VS</div>
            </div>

            <div className="text-center flex-1">
              <div className="flex justify-center text-accent mb-3" aria-hidden="true">
                <div style={{ padding: 10, borderRadius: '50%', background: 'rgba(79, 138, 255, 0.1)', border: '1px solid rgba(79, 138, 255, 0.2)' }}>
                  <Shield size={24} strokeWidth={1.5} />
                </div>
              </div>
              <div className="font-display font-bold text-lg tracking-tight">{match.awayTeam}</div>
            </div>
          </div>

          {/* Countdown */}
          <div className="relative z-10" style={{
            textAlign: 'center',
            background: 'var(--surface-02)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            border: '1px solid var(--border-subtle)'
          }}>
            {isLive ? (
              <div className="flex items-center justify-center gap-2">
                <span className="live-dot" aria-hidden="true" />
                <span className="font-display font-bold text-xl text-pulse tracking-widest uppercase">Live Now</span>
              </div>
            ) : (
              <>
                <div className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Kickoff in</div>
                <div className="font-display font-black text-2xl gradient-text tracking-tight" aria-live="off">{remaining}</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Weather + Active Alerts */}
      <div className="flex gap-3 mb-4">
        {weather && (
          <div className="card flex-1" style={{ padding: 14 }}>
            <WeatherWidget weather={weather} compact />
          </div>
        )}
        <div className="card" style={{ padding: 14, flex: 1 }}>
          <div className="text-xs text-muted mb-2">Capacity</div>
          <div className="font-bold text-lg">{(venue?.capacity ?? 0).toLocaleString()}</div>
          <div className="text-xs text-muted">seats</div>
        </div>
      </div>

      {/* Fan Alerts (crowd advisory) */}
      {fanAlerts.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-bold text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
            <AlertTriangle size={14} className="text-warning" /> Crowd Advisories
          </div>
          {fanAlerts.map((a) => (
            <div
              key={a.id}
              className={`alert-card alert-card--${a.severity} mb-2`}
              role="alert"
            >
              <div className="flex items-start gap-3">
                <span aria-hidden="true" style={{ marginTop: 2 }}>
                  {a.severity === 'critical' ? <AlertCircle size={20} strokeWidth={2.5} className="text-danger" /> : <AlertTriangle size={20} strokeWidth={2.5} className="text-warning" />}
                </span>
                <div>
                  <div className="text-sm font-semi mb-1">{a.title}</div>
                  <div className="text-xs text-secondary">{a.recommendedAction}</div>
                  {a.suggestedAlternateZones.length > 0 && (
                    <div className="text-xs text-accent mt-1">
                      Try: {a.suggestedAlternateZones.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-4">
        <div className="text-xs text-muted uppercase tracking-wide mb-3">Quick Actions</div>
        <div className="grid-2 gap-3">
          <button
            className="card"
            onClick={() => navigate('/fan/navigate')}
            style={{ padding: 16, textAlign: 'left', cursor: 'pointer', border: 'none', width: '100%' }}
            aria-label="Navigate to your gate"
          >
            <div className="text-accent mb-2" aria-hidden="true"><MapIcon size={24} strokeWidth={1.5} /></div>
            <div className="text-sm font-semi">Get to My Gate</div>
            <div className="text-xs text-muted">Step-by-step directions</div>
          </button>
          <button
            className="card"
            onClick={() => navigate('/fan/chat')}
            style={{ padding: 16, textAlign: 'left', cursor: 'pointer', border: 'none', width: '100%' }}
            aria-label="Chat with AI concierge"
          >
            <div className="text-accent mb-2" aria-hidden="true"><MessageCircle size={24} strokeWidth={1.5} /></div>
            <div className="text-sm font-semi">Ask Anything</div>
            <div className="text-xs text-muted">Multilingual AI help</div>
          </button>
        </div>
      </div>

      {/* Accessibility Toggle */}
      <div className="card" style={{ padding: 14 }}>
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm font-semi flex items-center gap-1"><Accessibility size={16} strokeWidth={2} /> Accessibility Mode</div>
            <div className="text-xs text-muted">Wheelchair-accessible routing</div>
          </div>
          <button
            role="switch"
            aria-checked={prefs.accessibilityNeeds}
            onClick={() => setAccessibilityNeeds(!prefs.accessibilityNeeds)}
            style={{
              width: 44, height: 24, borderRadius: 12,
              background: prefs.accessibilityNeeds ? 'var(--color-primary)' : 'var(--surface-03)',
              border: 'none', cursor: 'pointer', position: 'relative',
              transition: 'background var(--transition-base)',
              flexShrink: 0,
            }}
            aria-label="Toggle accessibility mode"
          >
            <span style={{
              position: 'absolute', top: 3, left: prefs.accessibilityNeeds ? 23 : 3,
              width: 18, height: 18, borderRadius: '50%',
              background: '#fff', transition: 'left var(--transition-base)',
            }} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Language Selector */}
      <div className="mt-4 mb-4">
        <div className="text-xs text-muted uppercase tracking-wide mb-2">Language</div>
        <div className="flex gap-2 flex-wrap">
          {[
            { code: 'en', label: 'English' },
            { code: 'es', label: 'Español' },
            { code: 'fr', label: 'Français' },
            { code: 'pt', label: 'Português' },
          ].map((lang) => (
            <button
              key={lang.code}
              className={`btn btn--sm ${prefs.preferredLanguage === lang.code ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setLanguage(lang.code)}
              aria-pressed={prefs.preferredLanguage === lang.code}
              aria-label={`Set language to ${lang.label}`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
