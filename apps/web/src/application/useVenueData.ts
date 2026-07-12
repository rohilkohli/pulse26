// ============================================================
// Pulse26 — useVenueData Hook
// Loads venue + match data with caching.
// ============================================================

import { useState, useEffect } from 'react';
import { apiClient } from '../infrastructure/apiClient';
import type { Venue, Match } from '../domain/types';

const cache: { venues: Venue[] | null; matches: Match[] | null; lastFetch: number } = {
  venues: null, matches: null, lastFetch: 0,
};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min (venue data rarely changes)

export function useVenueData() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      // Serve from cache if fresh
      if (cache.venues && Date.now() - cache.lastFetch < CACHE_TTL_MS) {
        setVenues(cache.venues);
        setMatches(cache.matches ?? []);
        setLoading(false);
        return;
      }

      try {
        const [v, m] = await Promise.all([apiClient.getVenues(), apiClient.getMatches()]);
        cache.venues = v;
        cache.matches = m;
        cache.lastFetch = Date.now();
        setVenues(v);
        setMatches(m);
      } catch {
        setError('Failed to load venue data');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return { venues, matches, loading, error };
}

export function useVenue(venueId: string | undefined) {
  const { venues, matches, loading } = useVenueData();
  const venue = venueId ? venues.find((v) => v.id === venueId) ?? null : null;
  const venueMatches = venueId ? matches.filter((m) => m.venueId === venueId) : [];
  return { venue, matches: venueMatches, loading };
}

export function useWeather(lat: number | undefined, lng: number | undefined) {
  const [weather, setWeather] = useState<import('../domain/types').WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lat === undefined || lng === undefined) return;
    setLoading(true);
    apiClient.getWeather(lat, lng)
      .then(setWeather)
      .catch(() => setWeather(null))
      .finally(() => setLoading(false));
  }, [lat, lng]);

  return { weather, loading };
}
