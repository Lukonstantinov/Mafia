export type Team = 'mafia' | 'town' | 'neutral';
export type Lang = 'EN' | 'RU' | 'LT';
export type Screen =
  | 'home' | 'setup' | 'roleCreator' | 'nightOrder' | 'settings'
  | 'assign' | 'tally' | 'deal' | 'gate' | 'table';

export interface RoleDef {
  id: string;            // 'mafia' | 'police' | ... | 'role_<ts>'
  name: string;          // base (EN) name; built-ins translated via i18n by id
  team: Team;
  color: string;         // hex; card + circle colour
  icon: string;          // svg key for built-ins; emoji/char for custom
  actsAtNight: boolean;  // gets its own night step
  desc: string;          // base description; built-ins translated via i18n
  builtin: boolean;
}

export interface Player {
  seat: number;          // 1-based, stable for the whole game
  name: string;          // optional; '' allowed
  roleId: string;
  dead: boolean;
  silencedForRound?: number; // round number they're silenced for (butterfly)
}

export interface GameSettings {
  actionsPerRole: Record<string, number>; // roleId -> picks/night (default 1)
  doctorSelfHeal: boolean;                 // default true
  mafiaWinRatioEqual: boolean;             // mafia wins when mafiaAlive >= townAlive
  townWinLastMafia: boolean;               // town wins when last mafia is out
  storyEnabled: boolean;
  logEnabled: boolean;
}

export interface Pick {
  stepId: string;        // roleId or 'city'
  targetSeat: number;
}

export interface RoundRecord {
  round: number;
  picks: Pick[];
  deaths: number[];      // night deaths confirmed at dawn
  saved: number[];       // seats the doctor saved from a mafia hit
  votes1?: Record<number, number>;  // day vote, round 1 tally (seat -> votes)
  votes2?: Record<number, number>;  // day vote, runoff tally
  votedOut?: number | null;         // seat eliminated by the day vote
  story?: string;
  startTs: number;
  endTs?: number;
}

export interface SetupState {
  count: number;
  names: string[];
  counts: Record<string, number>; // roleId -> how many
  nightOrder: string[];           // ordered roleIds that act at night
}

export type Phase = 'night' | 'dawn' | 'vote';

export interface GameState {
  started: boolean;
  round: number;
  phase: Phase;                   // night -> dawn (reveal) -> vote
  stepIdx: number;                // index into the night steps
  picks: Pick[];                  // current round's night picks, in progress
  nightDeaths: number[];          // confirmed at dawn, pending round commit
  log: { ts: number; stepId: string; targetSeat: number }[];
  rounds: RoundRecord[];
  roundStartTs: number;
}

// Per-seat aggregate statistics across a whole game.
export interface SeatStats {
  targeted: number;   // times a mafia targeted this seat
  checked: number;    // times police checked
  healed: number;     // times doctor healed
  silenced: number;   // times butterfly silenced
  votes: number;      // total day-vote votes received (both rounds)
  total: number;      // sum of all of the above
}
