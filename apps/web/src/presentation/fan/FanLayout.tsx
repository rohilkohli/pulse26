/* eslint-disable react-refresh/only-export-components */
// ============================================================
// Pulse26 — Fan Companion Layout
// Mobile-first with bottom navigation
// ============================================================

import { createContext, useContext, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, MapIcon, MessageCircle, Goal } from 'lucide-react';
import { usePreferences } from '../../application/usePreferences';

interface FanContextType {
  venueId: string;
  setVenueId: (id: string) => void;
  matchId: string;
  setMatchId: (id: string) => void;
}

export const FanContext = createContext<FanContextType>({
  venueId: 'metlife',
  setVenueId: () => {},
  matchId: 'r16_01',
  setMatchId: () => {},
});

export function useFanContext() {
  return useContext(FanContext);
}

const NAV_ITEMS = [
  { to: '/fan/home',     icon: <Home size={24} strokeWidth={1.5} />, label: 'Home',     labelEs: 'Inicio',    labelFr: 'Accueil', labelPt: 'Início' },
  { to: '/fan/navigate', icon: <MapIcon size={24} strokeWidth={1.5} />, label: 'Navigate', labelEs: 'Navegar',   labelFr: 'Naviguer', labelPt: 'Navegar' },
  { to: '/fan/chat',     icon: <MessageCircle size={24} strokeWidth={1.5} />, label: 'Concierge',labelEs: 'Asistente', labelFr: 'Aide', labelPt: 'Assistente' },
  { to: '/fan/match',    icon: <Goal size={24} strokeWidth={1.5} />, label: 'My Match', labelEs: 'Mi Partido',labelFr: 'Mon Match', labelPt: 'Meu Jogo' },
];

export function FanLayout() {
  const [venueId, setVenueId] = useState('metlife');
  const [matchId, setMatchId] = useState('r16_01');
  const { prefs } = usePreferences();

  const getLangLabel = (item: typeof NAV_ITEMS[0]) => {
    switch (prefs.preferredLanguage) {
      case 'es': return item.labelEs;
      case 'fr': return item.labelFr;
      case 'pt': return item.labelPt;
      default:   return item.label;
    }
  };

  return (
    <FanContext.Provider value={{ venueId, setVenueId, matchId, setMatchId }}>
      <div className="bg-mesh fan-mobile-container" style={{ minHeight: '100dvh' }}>
        <div className="fan-mobile-frame">
          {/* Skip to main (WCAG) */}
        <a
          href="#fan-main"
          className="btn btn--primary"
          style={{
            position: 'absolute', left: '-100vw'
          }}
        >
          Skip to main content
        </a>

        {/* Content area */}
        <main id="fan-main" role="main" className="page-fan">
          <Outlet />
        </main>

        {/* Bottom Navigation */}
        <nav
          className="bottom-nav"
          role="navigation"
          aria-label="Fan companion navigation"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
              }
              aria-label={item.label}
            >
              {({ isActive }) => (
                <>
                  <span className={`bottom-nav__icon${isActive ? ' bottom-nav__icon--active' : ''}`} aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{getLangLabel(item)}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        </div>
      </div>
    </FanContext.Provider>
  );
}
