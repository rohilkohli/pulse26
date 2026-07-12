// ============================================================
// Pulse26 — App Router
// ============================================================

import { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Fan Companion
import { FanLayout } from './presentation/fan/FanLayout';
import { FanHome } from './presentation/fan/FanHome';
import { FanChat } from './presentation/fan/FanChat';
import { FanNavigate } from './presentation/fan/FanNavigate';
import { FanMatch } from './presentation/fan/FanMatch';

// Ops Console
import { OpsLayout } from './presentation/ops/OpsLayout';
import { OpsDashboard } from './presentation/ops/OpsDashboard';
import { OpsAlerts } from './presentation/ops/OpsAlerts';
import { OpsGates } from './presentation/ops/OpsGates';
import { OpsTimeline } from './presentation/ops/OpsTimeline';

function LoadingFallback() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100dvh', flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, animation: 'live-pulse 1.5s ease infinite',
      }} aria-hidden="true">⚡</div>
      <div className="text-muted text-sm">Loading Pulse26...</div>
    </div>
  );
}

// Landing page for root route
function LandingPage() {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(ellipse at 30% 30%, rgba(0,229,160,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(79,138,255,0.08) 0%, transparent 60%), var(--surface-base)',
    }}>
      {/* Logo */}
      <div style={{
        width: 72, height: 72, borderRadius: 20, marginBottom: 24,
        background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 36, boxShadow: '0 8px 32px rgba(0,229,160,0.3)',
      }} aria-hidden="true">⚡</div>

      <h1 className="font-display text-center mb-2" style={{ fontSize: 'var(--text-4xl)' }}>
        <span className="gradient-text">Pulse26</span>
      </h1>
      <p className="text-secondary text-center mb-2" style={{ maxWidth: 400, fontSize: 'var(--text-lg)' }}>
        GenAI Stadium Operations & Fan Experience
      </p>
      <p className="text-muted text-center mb-8 text-sm">
        FIFA World Cup 2026 · July 9–19, 2026
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 340 }}>
        <a
          href="/fan/home"
          className="btn btn--primary btn--lg"
          style={{ justifyContent: 'center', textDecoration: 'none' }}
          aria-label="Open Fan Companion"
        >
          🏟️ Fan Companion
          <span className="text-xs opacity-75" style={{ marginLeft: 8 }}>For supporters</span>
        </a>
        <a
          href="/ops/dashboard"
          className="btn btn--secondary btn--lg"
          style={{ justifyContent: 'center', textDecoration: 'none' }}
          aria-label="Open Venue Operations Console"
        >
          📊 Ops Console
          <span className="text-xs opacity-75" style={{ marginLeft: 8 }}>For venue staff</span>
        </a>
      </div>

      <div className="text-center mt-10" style={{ maxWidth: 320 }}>
        <div className="text-xs text-muted">
          Powered by Google Gemini AI · Digital Twin Telemetry
        </div>
        <div className="text-xs text-muted mt-1">
          Simulated data — labeled "digital twin" per WC26 venue modeling approach
        </div>
      </div>
    </div>
  );
}

import { usePreferences } from './application/usePreferences';

export default function App() {
  usePreferences();

  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Landing */}
          <Route path="/" element={<LandingPage />} />

          {/* Fan Companion */}
          <Route path="/fan" element={<FanLayout />}>
            <Route index element={<Navigate to="/fan/home" replace />} />
            <Route path="home"     element={<FanHome />} />
            <Route path="navigate" element={<FanNavigate />} />
            <Route path="chat"     element={<FanChat />} />
            <Route path="match"    element={<FanMatch />} />
          </Route>

          {/* Venue Ops Console */}
          <Route path="/ops" element={<OpsLayout />}>
            <Route index element={<Navigate to="/ops/dashboard" replace />} />
            <Route path="dashboard" element={<OpsDashboard />} />
            <Route path="alerts"    element={<OpsAlerts />} />
            <Route path="gates"     element={<OpsGates />} />
            <Route path="timeline"  element={<OpsTimeline />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
