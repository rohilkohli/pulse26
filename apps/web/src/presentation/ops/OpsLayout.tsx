/* eslint-disable react-refresh/only-export-components */
import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useTelemetry } from '../../application/useTelemetry';
import { LayoutDashboard, DoorOpen, AlertTriangle, Clock } from 'lucide-react';

interface OpsLayoutContextType {
  telemetry: ReturnType<typeof useTelemetry>;
  selectedVenueId: string;
  setSelectedVenueId: (id: string) => void;
}

export const OpsLayoutContext = React.createContext<OpsLayoutContextType | null>(null);

export function useOpsContext() {
  const ctx = React.useContext(OpsLayoutContext);
  if (!ctx) throw new Error('Must be used within OpsLayout');
  return ctx;
}

export function OpsLayout() {
  const telemetry = useTelemetry();
  const [selectedVenueId, setSelectedVenueId] = useState('metlife');

  const activeAlertsCount = telemetry.connected 
    ? telemetry.alerts.filter(a => a.status === 'active' && a.venueId === selectedVenueId).length
    : 0;

  const navItems = [
    { path: '/ops/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/ops/gates', label: 'Gates', icon: DoorOpen },
    { path: '/ops/alerts', label: 'Alerts', icon: AlertTriangle, badge: activeAlertsCount },
    { path: '/ops/timeline', label: 'Timeline', icon: Clock },
  ];

  return (
    <OpsLayoutContext.Provider value={{ telemetry, selectedVenueId, setSelectedVenueId }}>
      <div className="min-h-screen bg-surface-base text-primary pt-20">
        {/* Floating Top Nav Bar */}
        <nav 
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-surface-01/80 backdrop-blur-md border border-border-default rounded-xl px-1.5 py-1 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)] transition-all duration-300"
          aria-label="Operations Management Navigation"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all duration-200 select-none cursor-pointer border
                ${isActive 
                  ? 'bg-gradient-to-r from-blue-500/12 to-indigo-500/8 border-blue-500/40 text-blue-600 dark:text-blue-400 shadow-[inset_0_1px_0_rgba(59,130,246,0.1)]' 
                  : 'bg-transparent border-transparent text-muted hover:text-primary hover:bg-surface-02/50 dark:hover:bg-surface-02/30'
                }
              `}
            >
              <item.icon size={13} strokeWidth={2.5} />
              <span>{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="flex items-center justify-center text-[9px] font-bold text-white bg-red-500 rounded-full w-4.5 h-4.5 ml-0.5 animate-pulse shadow-[0_1px_4px_rgba(239,68,68,0.4)]">
                  {item.badge}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <main id="main-content" role="main">
          <Outlet />
        </main>
      </div>
    </OpsLayoutContext.Provider>
  );
}
