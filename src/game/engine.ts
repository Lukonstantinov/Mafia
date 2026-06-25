import type { Player, Pick, RoleDef, SetupState, GameSettings } from '../types';

/** Fisher-Yates in-place shuffle using Math.random (true random reshuffle). */
export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build the flat role pool from the setup counts (e.g. mafia,mafia,police,...).
 * Citizens are excluded here and auto-filled to the player count in assignSeats,
 * so the stored citizen count can never drift out of sync with the roster.
 */
export function buildPool(setup: SetupState): string[] {
  const pool: string[] = [];
  for (const [roleId, n] of Object.entries(setup.counts)) {
    if (roleId === 'citizen') continue;
    for (let i = 0; i < n; i++) pool.push(roleId);
  }
  return pool;
}

/**
 * Randomly assign roles to seats. Citizens auto-fill any remaining seats so the
 * pool always matches the player count. Seats are 1..count and stay stable.
 */
export function assignSeats(setup: SetupState): Player[] {
  let pool = buildPool(setup);
  // Citizens fill the remainder up to the player count.
  while (pool.length < setup.count) pool.push('citizen');
  pool = pool.slice(0, setup.count);
  const shuffled = shuffle(pool);
  return shuffled.map((roleId, i) => ({
    seat: i + 1,
    name: setup.names[i] ?? '',
    roleId,
    dead: false,
  }));
}

/** Reassign roles to the existing seats/names (random reshuffle, seats unchanged). */
export function reshuffleSeats(players: Player[]): Player[] {
  const roles = shuffle(players.map((p) => p.roleId));
  return players.map((p, i) => ({ ...p, roleId: roles[i] }));
}

export interface Resolution {
  mafiaTargets: number[];
  doctorHeals: number[];
  cityVotes: number[];
  saved: number[];        // seats the doctor saved from a mafia hit
  suggestedDeaths: number[];
}

/** ⭐ Core rule: a doctor heal on the mafia's target cancels the kill. */
export function resolveRound(picks: Pick[]): Resolution {
  const mafiaTargets = picks.filter((p) => p.stepId === 'mafia').map((p) => p.targetSeat);
  const doctorHeals = picks.filter((p) => p.stepId === 'doctor').map((p) => p.targetSeat);
  const cityVotes = picks.filter((p) => p.stepId === 'city').map((p) => p.targetSeat);

  const healSet = new Set(doctorHeals);
  const saved = [...new Set(mafiaTargets.filter((s) => healSet.has(s)))];
  const savedSet = new Set(saved);
  const downByMafia = mafiaTargets.filter((s) => !savedSet.has(s));
  const suggestedDeaths = [...new Set([...downByMafia, ...cityVotes])];

  return { mafiaTargets, doctorHeals, cityVotes, saved, suggestedDeaths };
}

export type WinSuggestion = 'town' | 'mafia' | null;

export function checkWin(players: Player[], roleById: Record<string, RoleDef>, settings: GameSettings): WinSuggestion {
  const alive = players.filter((p) => !p.dead);
  const mafiaAlive = alive.filter((p) => roleById[p.roleId]?.team === 'mafia').length;
  const townAlive = alive.length - mafiaAlive;
  if (settings.townWinLastMafia && mafiaAlive === 0) return 'town';
  if (settings.mafiaWinRatioEqual && mafiaAlive > 0 && mafiaAlive >= townAlive) return 'mafia';
  return null;
}

// ---- Story generator (offline, procedural, noir) -------------------------

const OPENINGS = [
  'The lamp guttered low over the table.',
  'Night pressed against the windows of the quiet town.',
  'A clock somewhere struck the hour and went silent.',
  'Smoke curled past the empty chairs.',
];
const ONE_DEATH = [
  'By morning, {names} was gone — a single chair left cold.',
  'They found {names} at first light, and no one met an eye.',
  'Only {names} did not answer the morning roll.',
];
const MULTI_DEATH = [
  'When dawn came, {names} were missing, and the town held its breath.',
  'The morning counted its losses: {names}.',
];
const NO_DEATH = [
  'But when the sun rose, every seat was filled. The doctor had been quick.',
  'Morning brought no funeral — a hand had reached the wounded in time.',
];

/** Stable pseudo-random pick from a seed (round number). */
function seeded(seed: number, len: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return Math.floor((x - Math.floor(x)) * len);
}

export function generateStory(round: number, deadNames: string[], savedNames: string[]): string {
  const open = OPENINGS[seeded(round, OPENINGS.length)];
  let body: string;
  if (deadNames.length === 0) {
    body = NO_DEATH[seeded(round + 1, NO_DEATH.length)];
  } else if (deadNames.length === 1) {
    body = ONE_DEATH[seeded(round + 2, ONE_DEATH.length)].replace('{names}', deadNames[0]);
  } else {
    body = MULTI_DEATH[seeded(round + 3, MULTI_DEATH.length)].replace('{names}', listNames(deadNames));
  }
  let tail = '';
  if (savedNames.length > 0) {
    tail = ` ${listNames(savedNames)} owed the night to a steady hand.`;
  }
  return `${open} ${body}${tail}`;
}

function listNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function seatLabel(p: Player): string {
  return p.name?.trim() ? p.name.trim() : `#${p.seat}`;
}
