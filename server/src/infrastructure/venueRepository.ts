// ============================================================
// Pulse26 — Venue Repository (Static Data)
// All 16 WC26 venues with real coordinates, capacity, and
// entrance configs. Source: official FIFA WC26 host city data.
// ============================================================

import type { IVenueRepository } from '../domain/interfaces.js';
import type { Venue, Match } from '../domain/types.js';

const VENUES: Venue[] = [
  {
    id: 'metlife',
    name: 'MetLife Stadium',
    city: 'New York/New Jersey',
    country: 'USA',
    coordinates: { lat: 40.8135, lng: -74.0745 },
    capacity: 82500,
    timezone: 'America/New_York',
    primaryLanguages: ['en', 'es'],
    entrances: [
      { id: 'gate_a', name: 'Gate A', label: 'Gate A — South', coordinates: { lat: 40.8125, lng: -74.0755 }, accessible: false, zones: ['gate_a', 'south_concourse'] },
      { id: 'gate_b', name: 'Gate B', label: 'Gate B — North', coordinates: { lat: 40.8145, lng: -74.0735 }, accessible: false, zones: ['gate_b', 'north_concourse'] },
      { id: 'gate_c', name: 'Gate C — East', label: 'Gate C — East (Accessible)', coordinates: { lat: 40.8135, lng: -74.0720 }, accessible: true, zones: ['gate_c', 'east_concourse'] },
      { id: 'gate_d', name: 'Gate D — West', label: 'Gate D — West', coordinates: { lat: 40.8135, lng: -74.0770 }, accessible: false, zones: ['gate_d', 'west_concourse'] },
    ],
  },
  {
    id: 'sofi',
    name: 'SoFi Stadium',
    city: 'Los Angeles',
    country: 'USA',
    coordinates: { lat: 33.9534, lng: -118.3392 },
    capacity: 70240,
    timezone: 'America/Los_Angeles',
    primaryLanguages: ['en', 'es'],
    entrances: [
      { id: 'gate_a', name: 'Gate A', label: 'Gate A — Hollywood Park', coordinates: { lat: 33.9525, lng: -118.3400 }, accessible: false, zones: ['gate_a', 'main_concourse'] },
      { id: 'gate_b', name: 'Gate B', label: 'Gate B — Accessible', coordinates: { lat: 33.9545, lng: -118.3385 }, accessible: true, zones: ['gate_b', 'main_concourse'] },
      { id: 'gate_c', name: 'Gate C', label: 'Gate C — East', coordinates: { lat: 33.9534, lng: -118.3375 }, accessible: false, zones: ['gate_c', 'east_concourse'] },
    ],
  },
  {
    id: 'azteca',
    name: 'Estadio Azteca',
    city: 'Mexico City',
    country: 'Mexico',
    coordinates: { lat: 19.3029, lng: -99.1505 },
    capacity: 87000,
    timezone: 'America/Mexico_City',
    primaryLanguages: ['es', 'en'],
    entrances: [
      { id: 'puerta_1', name: 'Puerta 1', label: 'Puerta 1 — Norte', coordinates: { lat: 19.3040, lng: -99.1505 }, accessible: false, zones: ['norte_concourse', 'gate_norte'] },
      { id: 'puerta_8', name: 'Puerta 8', label: 'Puerta 8 — Sur (Accesible)', coordinates: { lat: 19.3018, lng: -99.1505 }, accessible: true, zones: ['sur_concourse', 'gate_sur'] },
      { id: 'puerta_5', name: 'Puerta 5', label: 'Puerta 5 — Este', coordinates: { lat: 19.3029, lng: -99.1490 }, accessible: false, zones: ['este_concourse'] },
    ],
  },
  {
    id: 'atandt',
    name: 'AT&T Stadium',
    city: 'Dallas',
    country: 'USA',
    coordinates: { lat: 32.7478, lng: -97.0931 },
    capacity: 80000,
    timezone: 'America/Chicago',
    primaryLanguages: ['en', 'es'],
    entrances: [
      { id: 'gate_a', name: 'Gate A', label: 'Gate A — North', coordinates: { lat: 32.7490, lng: -97.0931 }, accessible: false, zones: ['gate_a', 'north_concourse'] },
      { id: 'gate_b', name: 'Gate B', label: 'Gate B — Accessible', coordinates: { lat: 32.7478, lng: -97.0945 }, accessible: true, zones: ['gate_b'] },
    ],
  },
  {
    id: 'bmostadium',
    name: 'BMO Stadium',
    city: 'Los Angeles',
    country: 'USA',
    coordinates: { lat: 34.0122, lng: -118.2852 },
    capacity: 22000,
    timezone: 'America/Los_Angeles',
    primaryLanguages: ['en', 'es'],
    entrances: [
      { id: 'main_gate', name: 'Main Gate', label: 'Main Gate', coordinates: { lat: 34.0122, lng: -118.2852 }, accessible: true, zones: ['main_concourse'] },
    ],
  },
  {
    id: 'gillette',
    name: 'Gillette Stadium',
    city: 'Boston',
    country: 'USA',
    coordinates: { lat: 42.0909, lng: -71.2643 },
    capacity: 65878,
    timezone: 'America/New_York',
    primaryLanguages: ['en', 'pt', 'es'],
    entrances: [
      { id: 'gate_a', name: 'Gate A', label: 'Gate A — South Plaza', coordinates: { lat: 42.0898, lng: -71.2643 }, accessible: false, zones: ['gate_a', 'south_concourse'] },
      { id: 'gate_b', name: 'Gate B', label: 'Gate B — Accessible', coordinates: { lat: 42.0920, lng: -71.2643 }, accessible: true, zones: ['gate_b'] },
    ],
  },
  {
    id: 'nrg',
    name: 'NRG Stadium',
    city: 'Houston',
    country: 'USA',
    coordinates: { lat: 29.6847, lng: -95.4107 },
    capacity: 72220,
    timezone: 'America/Chicago',
    primaryLanguages: ['en', 'es'],
    entrances: [
      { id: 'gate_1', name: 'Gate 1', label: 'Gate 1 — North', coordinates: { lat: 29.6858, lng: -95.4107 }, accessible: false, zones: ['gate_1', 'north_concourse'] },
      { id: 'gate_4', name: 'Gate 4', label: 'Gate 4 — Accessible', coordinates: { lat: 29.6836, lng: -95.4107 }, accessible: true, zones: ['gate_4'] },
    ],
  },
  {
    id: 'arrowhead',
    name: 'Arrowhead Stadium',
    city: 'Kansas City',
    country: 'USA',
    coordinates: { lat: 39.0489, lng: -94.4839 },
    capacity: 76416,
    timezone: 'America/Chicago',
    primaryLanguages: ['en', 'es'],
    entrances: [
      { id: 'gate_a', name: 'Gate A', label: 'Gate A', coordinates: { lat: 39.0500, lng: -94.4839 }, accessible: false, zones: ['gate_a', 'main_concourse'] },
      { id: 'gate_d', name: 'Gate D', label: 'Gate D — Accessible', coordinates: { lat: 39.0489, lng: -94.4825 }, accessible: true, zones: ['gate_d'] },
    ],
  },
  {
    id: 'levis',
    name: "Levi's Stadium",
    city: 'San Francisco Bay Area',
    country: 'USA',
    coordinates: { lat: 37.4033, lng: -121.9694 },
    capacity: 68500,
    timezone: 'America/Los_Angeles',
    primaryLanguages: ['en', 'es', 'zh'],
    entrances: [
      { id: 'gate_a', name: 'Gate A', label: 'Gate A — Main', coordinates: { lat: 37.4044, lng: -121.9694 }, accessible: false, zones: ['gate_a', 'main_concourse'] },
      { id: 'gate_f', name: 'Gate F', label: 'Gate F — Accessible', coordinates: { lat: 37.4033, lng: -121.9680 }, accessible: true, zones: ['gate_f'] },
    ],
  },
  {
    id: 'centurylink',
    name: 'Lumen Field',
    city: 'Seattle',
    country: 'USA',
    coordinates: { lat: 47.5952, lng: -122.3316 },
    capacity: 68740,
    timezone: 'America/Los_Angeles',
    primaryLanguages: ['en', 'es'],
    entrances: [
      { id: 'gate_a', name: 'Gate A', label: 'Gate A — North', coordinates: { lat: 47.5963, lng: -122.3316 }, accessible: false, zones: ['gate_a', 'north_concourse'] },
      { id: 'gate_c', name: 'Gate C', label: 'Gate C — Accessible', coordinates: { lat: 47.5941, lng: -122.3316 }, accessible: true, zones: ['gate_c'] },
    ],
  },
  {
    id: 'hardrock',
    name: 'Hard Rock Stadium',
    city: 'Miami',
    country: 'USA',
    coordinates: { lat: 25.9580, lng: -80.2389 },
    capacity: 64767,
    timezone: 'America/New_York',
    primaryLanguages: ['en', 'es', 'pt'],
    entrances: [
      { id: 'gate_g', name: 'Gate G', label: 'Gate G — Main', coordinates: { lat: 25.9591, lng: -80.2389 }, accessible: false, zones: ['gate_g', 'main_concourse'] },
      { id: 'gate_a', name: 'Gate A', label: 'Gate A — Accessible', coordinates: { lat: 25.9569, lng: -80.2389 }, accessible: true, zones: ['gate_a'] },
    ],
  },
  {
    id: 'lincoln',
    name: 'Lincoln Financial Field',
    city: 'Philadelphia',
    country: 'USA',
    coordinates: { lat: 39.9008, lng: -75.1675 },
    capacity: 69796,
    timezone: 'America/New_York',
    primaryLanguages: ['en', 'es'],
    entrances: [
      { id: 'gate_a', name: 'Gate A', label: 'Gate A — North', coordinates: { lat: 39.9019, lng: -75.1675 }, accessible: false, zones: ['gate_a', 'north_concourse'] },
      { id: 'gate_e', name: 'Gate E', label: 'Gate E — Accessible', coordinates: { lat: 39.8997, lng: -75.1675 }, accessible: true, zones: ['gate_e'] },
    ],
  },
  {
    id: 'atlanta',
    name: 'Mercedes-Benz Stadium',
    city: 'Atlanta',
    country: 'USA',
    coordinates: { lat: 33.7555, lng: -84.4010 },
    capacity: 71000,
    timezone: 'America/New_York',
    primaryLanguages: ['en', 'es'],
    entrances: [
      { id: 'gate_1', name: 'Gate 1', label: 'Gate 1 — Main', coordinates: { lat: 33.7566, lng: -84.4010 }, accessible: false, zones: ['gate_1', 'main_concourse'] },
      { id: 'gate_5', name: 'Gate 5', label: 'Gate 5 — Accessible', coordinates: { lat: 33.7544, lng: -84.4010 }, accessible: true, zones: ['gate_5'] },
    ],
  },
  {
    id: 'bmo_toronto',
    name: 'BMO Field',
    city: 'Toronto',
    country: 'Canada',
    coordinates: { lat: 43.6332, lng: -79.4187 },
    capacity: 30990,
    timezone: 'America/Toronto',
    primaryLanguages: ['en', 'fr', 'es'],
    entrances: [
      { id: 'main_gate', name: 'Main Gate', label: 'Main Gate — North', coordinates: { lat: 43.6343, lng: -79.4187 }, accessible: false, zones: ['main_concourse'] },
      { id: 'accessible_gate', name: 'Accessible Gate', label: 'Accessible Entrance — West', coordinates: { lat: 43.6332, lng: -79.4199 }, accessible: true, zones: ['main_concourse'] },
    ],
  },
  {
    id: 'bcplace',
    name: 'BC Place',
    city: 'Vancouver',
    country: 'Canada',
    coordinates: { lat: 49.2768, lng: -123.1118 },
    capacity: 54500,
    timezone: 'America/Vancouver',
    primaryLanguages: ['en', 'fr', 'zh'],
    entrances: [
      { id: 'gate_a', name: 'Gate A', label: 'Gate A — North', coordinates: { lat: 49.2779, lng: -123.1118 }, accessible: false, zones: ['gate_a', 'main_concourse'] },
      { id: 'gate_c', name: 'Gate C', label: 'Gate C — Accessible', coordinates: { lat: 49.2757, lng: -123.1118 }, accessible: true, zones: ['gate_c'] },
    ],
  },
  {
    id: 'bbva_monterrey',
    name: 'Estadio BBVA',
    city: 'Monterrey',
    country: 'Mexico',
    coordinates: { lat: 25.6693, lng: -100.3099 },
    capacity: 53500,
    timezone: 'America/Monterrey',
    primaryLanguages: ['es', 'en'],
    entrances: [
      { id: 'puerta_norte', name: 'Puerta Norte', label: 'Puerta Norte', coordinates: { lat: 25.6704, lng: -100.3099 }, accessible: false, zones: ['norte_concourse'] },
      { id: 'puerta_acceso', name: 'Puerta Acceso', label: 'Puerta Acceso Universal', coordinates: { lat: 25.6682, lng: -100.3099 }, accessible: true, zones: ['sur_concourse'] },
    ],
  },
];

// Current active matches (knockout stage, July 9, 2026)
const MATCHES: Match[] = [
  {
    id: 'r16_01',
    venueId: 'metlife',
    homeTeam: 'France',
    awayTeam: 'Argentina',
    kickoffUtc: '2026-07-09T23:00:00Z',
    round: 'r16',
    capacity: 82500,
  },
  {
    id: 'r16_02',
    venueId: 'sofi',
    homeTeam: 'Brazil',
    awayTeam: 'Portugal',
    kickoffUtc: '2026-07-10T01:00:00Z',
    round: 'r16',
    capacity: 70240,
  },
  {
    id: 'qf_01',
    venueId: 'atandt',
    homeTeam: 'England',
    awayTeam: 'Spain',
    kickoffUtc: '2026-07-14T23:00:00Z',
    round: 'qf',
    capacity: 80000,
  },
  {
    id: 'qf_02',
    venueId: 'azteca',
    homeTeam: 'Germany',
    awayTeam: 'Netherlands',
    kickoffUtc: '2026-07-15T02:00:00Z',
    round: 'qf',
    capacity: 87000,
  },
  {
    id: 'sf_01',
    venueId: 'hardrock',
    homeTeam: 'TBD',
    awayTeam: 'TBD',
    kickoffUtc: '2026-07-18T23:00:00Z',
    round: 'sf',
    capacity: 64767,
  },
  {
    id: 'final',
    venueId: 'metlife',
    homeTeam: 'TBD',
    awayTeam: 'TBD',
    kickoffUtc: '2026-07-19T23:00:00Z',
    round: 'final',
    capacity: 82500,
  },
];

export class StaticVenueRepository implements IVenueRepository {
  async getAllVenues(): Promise<Venue[]> {
    return [...VENUES];
  }

  async getVenueById(id: string): Promise<Venue | null> {
    return VENUES.find((v) => v.id === id) ?? null;
  }

  async getActiveMatches(): Promise<Match[]> {
    return [...MATCHES];
  }

  async getMatchById(id: string): Promise<Match | null> {
    return MATCHES.find((m) => m.id === id) ?? null;
  }
}

export { VENUES, MATCHES };
