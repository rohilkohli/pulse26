// ============================================================
// Pulse26 — Accessibility & Preferences Hook
// Manages user preferences: high contrast, light mode,
// font size, accessibility needs. Persisted to localStorage.
// ============================================================

import { useState, useEffect, useCallback } from 'react';

interface UserPreferences {
  lightMode: boolean;          // light vs dark theme
  highContrast: boolean;
  fontScale: number;           // 0.85 | 1.0 | 1.15 | 1.3
  accessibilityNeeds: boolean; // wheelchair/accessible routing
  preferredLanguage: string;
  reducedMotion: boolean;      // synced with prefers-reduced-motion
}

const STORAGE_KEY = 'pulse26_prefs';
const FONT_SCALES = [0.85, 1.0, 1.15, 1.3] as const;

function loadPrefs(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { lightMode: false, ...JSON.parse(raw) } as UserPreferences;
  } catch { /* ignore */ }
  return {
    lightMode: false,
    highContrast: false,
    fontScale: 1.0,
    accessibilityNeeds: false,
    preferredLanguage: navigator.language.split('-')[0] ?? 'en',
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };
}

function applyPrefs(prefs: UserPreferences) {
  const root = document.documentElement;

  // Theme priority: high-contrast > light > dark (default)
  if (prefs.highContrast) {
    root.dataset.theme = 'high-contrast';
  } else if (prefs.lightMode) {
    root.dataset.theme = 'light';
  } else {
    root.dataset.theme = '';
  }

  root.style.setProperty('--user-font-scale', String(prefs.fontScale));
}

export function usePreferences() {
  const [prefs, setPrefsState] = useState<UserPreferences>(loadPrefs);

  useEffect(() => {
    applyPrefs(prefs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  // Listen for OS-level reduced motion changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => {
      setPrefsState((p) => ({ ...p, reducedMotion: e.matches }));
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const setLightMode = useCallback((val: boolean) => {
    setPrefsState((p) => ({ ...p, lightMode: val }));
  }, []);

  const setHighContrast = useCallback((val: boolean) => {
    setPrefsState((p) => ({ ...p, highContrast: val }));
  }, []);

  const cycleFontScale = useCallback(() => {
    setPrefsState((p) => {
      const idx = FONT_SCALES.indexOf(p.fontScale as typeof FONT_SCALES[number]);
      const next = FONT_SCALES[(idx + 1) % FONT_SCALES.length];
      return { ...p, fontScale: next ?? 1.0 };
    });
  }, []);

  const setAccessibilityNeeds = useCallback((val: boolean) => {
    setPrefsState((p) => ({ ...p, accessibilityNeeds: val }));
  }, []);

  const setLanguage = useCallback((lang: string) => {
    setPrefsState((p) => ({ ...p, preferredLanguage: lang }));
  }, []);

  return {
    prefs,
    setLightMode,
    setHighContrast,
    cycleFontScale,
    setAccessibilityNeeds,
    setLanguage,
    fontScaleLabel: `${Math.round(prefs.fontScale * 100)}%`,
  };
}
