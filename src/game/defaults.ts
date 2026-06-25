import type { RoleDef, GameSettings } from '../types';

export const BUILTIN_ROLES: RoleDef[] = [
  { id: 'mafia', name: 'Mafia', team: 'mafia', color: '#D8453E', icon: 'mafia', actsAtNight: true, desc: 'Kills one per night.', builtin: true },
  { id: 'police', name: 'Police', team: 'town', color: '#3E84CC', icon: 'police', actsAtNight: true, desc: 'Checks one per night.', builtin: true },
  { id: 'doctor', name: 'Doctor', team: 'town', color: '#41A877', icon: 'doctor', actsAtNight: true, desc: 'Heals one per night.', builtin: true },
  { id: 'butterfly', name: 'Butterfly', team: 'town', color: '#C94F93', icon: 'butterfly', actsAtNight: true, desc: 'Silences one for the day.', builtin: true },
  { id: 'citizen', name: 'Citizen', team: 'town', color: '#8F99AD', icon: 'citizen', actsAtNight: false, desc: 'No night action.', builtin: true },
];

export const ROLE_ORDER = ['mafia', 'police', 'doctor', 'butterfly', 'citizen'];

export interface Preset {
  id: string;
  count: number;
  counts: Record<string, number>;
}

export const PRESETS: Record<string, Preset> = {
  classic: {
    id: 'classic',
    count: 11,
    counts: { mafia: 3, police: 2, doctor: 1, butterfly: 1, citizen: 4 },
  },
  starter: {
    id: 'starter',
    count: 8,
    counts: { mafia: 2, police: 1, doctor: 1, butterfly: 0, citizen: 4 },
  },
  scratch: {
    id: 'scratch',
    count: 6,
    counts: { mafia: 1, police: 1, doctor: 0, butterfly: 0, citizen: 4 },
  },
};

export const DEFAULT_SETTINGS: GameSettings = {
  actionsPerRole: { mafia: 1, police: 1, doctor: 1, butterfly: 1 },
  doctorSelfHeal: true,
  mafiaWinRatioEqual: true,
  townWinLastMafia: true,
  storyEnabled: true,
  logEnabled: true,
};

// Default night order among acting roles (between pinned ends).
export const DEFAULT_NIGHT_ORDER = ['mafia', 'police', 'doctor', 'butterfly'];
