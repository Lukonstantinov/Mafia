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
  deaths: number[];      // seats confirmed dead this round
  saved: number[];       // seats the doctor saved from a mafia hit
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

export interface GameState {
  started: boolean;
  round: number;
  stepIdx: number;
  picks: Pick[];                  // current round, in progress
  log: { ts: number; stepId: string; targetSeat: number }[];
  rounds: RoundRecord[];
  roundStartTs: number;
}
