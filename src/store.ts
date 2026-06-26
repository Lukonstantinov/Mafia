import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Lang, Screen, RoleDef, SetupState, GameSettings, Player, GameState, Pick, RoundRecord,
} from './types';
import { BUILTIN_ROLES, DEFAULT_SETTINGS, DEFAULT_NIGHT_ORDER, PRESETS } from './game/defaults';
import { assignSeats, reshuffleSeats, resolveRound } from './game/engine';

function emptyGame(): GameState {
  return { started: false, round: 1, phase: 'night', stepIdx: 0, picks: [], nightDeaths: [], seatOrder: [], log: [], rounds: [], roundStartTs: 0 };
}

function emptySetup(): SetupState {
  return { count: 6, names: [], counts: { ...PRESETS.scratch.counts }, nightOrder: [...DEFAULT_NIGHT_ORDER] };
}

interface AppState {
  lang: Lang;
  screen: Screen;
  roleDefs: RoleDef[];           // built-ins + custom
  setup: SetupState;
  settings: GameSettings;
  players: Player[];
  dealIdx: number;
  game: GameState;
  roleIcons: Record<string, string>;   // roleId -> user-cropped image data URL

  setLang: (l: Lang) => void;
  go: (s: Screen) => void;

  // setup
  applyPreset: (id: keyof typeof PRESETS) => void;
  setCount: (n: number) => void;
  setNames: (raw: string) => void;
  setSeatName: (i: number, name: string) => void;
  setRoleCount: (roleId: string, n: number) => void;
  setNightOrder: (order: string[]) => void;
  addRole: (r: RoleDef) => void;
  setSettings: (patch: Partial<GameSettings>) => void;
  setRoleIcon: (roleId: string, dataUrl: string) => void;
  clearRoleIcon: (roleId: string) => void;

  // deal
  doAssign: () => void;
  doReshuffle: () => void;
  startDealing: () => void;
  nextDeal: () => void;

  // game
  startGame: () => void;
  addPick: (p: Pick) => void;
  proceedStep: () => void;
  reorderSeats: (order: number[]) => void;
  revealNight: () => void;
  confirmNightDeaths: (deaths: number[], saved: number[]) => void;
  commitVote: (votes1: Record<number, number>, votes2: Record<number, number>, votedOut: number | null, story: string | undefined) => void;
  finishGame: () => void;

  roleById: () => Record<string, RoleDef>;
  nightSteps: () => string[]; // ordered roleIds that act, filtered to those in play
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      lang: 'EN',
      screen: 'home',
      roleDefs: [...BUILTIN_ROLES],
      setup: emptySetup(),
      settings: { ...DEFAULT_SETTINGS },
      players: [],
      dealIdx: 0,
      game: emptyGame(),
      roleIcons: {},

      setLang: (l) => set({ lang: l }),
      go: (s) => set({ screen: s }),

      applyPreset: (id) => {
        const preset = PRESETS[id];
        set({
          setup: {
            count: preset.count,
            names: [],
            counts: { ...preset.counts },
            nightOrder: [...DEFAULT_NIGHT_ORDER],
          },
          screen: 'setup',
        });
      },

      setCount: (n) => {
        const count = Math.max(3, Math.min(30, n));
        set((st) => ({ setup: { ...st.setup, count } }));
      },

      setNames: (raw) => {
        const names = raw.split(',').map((s) => s.trim());
        set((st) => ({ setup: { ...st.setup, names } }));
      },

      setSeatName: (i, name) => {
        set((st) => {
          const names = [...st.setup.names];
          while (names.length <= i) names.push('');
          names[i] = name;
          return { setup: { ...st.setup, names } };
        });
      },

      setRoleCount: (roleId, n) => {
        set((st) => ({
          setup: { ...st.setup, counts: { ...st.setup.counts, [roleId]: Math.max(0, n) } },
        }));
      },

      setNightOrder: (order) => set((st) => ({ setup: { ...st.setup, nightOrder: order } })),

      addRole: (r) => {
        set((st) => {
          const roleDefs = [...st.roleDefs, r];
          let nightOrder = st.setup.nightOrder;
          if (r.actsAtNight && !nightOrder.includes(r.id)) {
            nightOrder = [...nightOrder, r.id]; // insert before the pinned vote (vote isn't in this list)
          }
          return {
            roleDefs,
            setup: { ...st.setup, counts: { ...st.setup.counts, [r.id]: 0 }, nightOrder },
          };
        });
      },

      setSettings: (patch) => set((st) => ({ settings: { ...st.settings, ...patch } })),

      setRoleIcon: (roleId, dataUrl) => set((st) => ({ roleIcons: { ...st.roleIcons, [roleId]: dataUrl } })),
      clearRoleIcon: (roleId) => set((st) => {
        const next = { ...st.roleIcons }; delete next[roleId]; return { roleIcons: next };
      }),

      doAssign: () => {
        const players = assignSeats(get().setup);
        set({ players, screen: 'assign' });
      },

      doReshuffle: () => set((st) => ({ players: reshuffleSeats(st.players) })),

      startDealing: () => set({ dealIdx: 0, screen: 'deal' }),

      nextDeal: () => {
        const { dealIdx, players } = get();
        if (dealIdx + 1 >= players.length) {
          set({ screen: 'gate' });
        } else {
          set({ dealIdx: dealIdx + 1 });
        }
      },

      startGame: () => {
        set((st) => ({
          game: { ...emptyGame(), started: true, roundStartTs: Date.now(), seatOrder: st.players.map((p) => p.seat) },
          screen: 'table',
          // re-marking players as alive in case of a fresh game on same roster
          players: st.players.map((p) => ({ ...p, dead: false, silencedForRound: undefined })),
        }));
      },

      reorderSeats: (order) => set((st) => ({ game: { ...st.game, seatOrder: order } })),

      addPick: (p) => {
        set((st) => {
          // append a pick for the current step — allow multiple per step
          const picks = [...st.game.picks, p];
          return { game: { ...st.game, picks } };
        });
      },

      proceedStep: () => {
        set((st) => ({ game: { ...st.game, stepIdx: st.game.stepIdx + 1 } }));
      },

      // Night steps are done — reveal what happened (dawn report).
      revealNight: () => set((st) => ({ game: { ...st.game, phase: 'dawn' } })),

      // Mayor confirms the night's deaths → grey them, then move to the day vote.
      confirmNightDeaths: (deaths) => {
        set((st) => {
          const deadSet = new Set(deaths);
          const players = st.players.map((p) => (deadSet.has(p.seat) ? { ...p, dead: true } : p));
          return { players, game: { ...st.game, phase: 'vote', nightDeaths: deaths } };
        });
      },

      // Day vote resolved — record the round, eliminate the voted-out seat, next round.
      commitVote: (votes1, votes2, votedOut, story) => {
        set((st) => {
          const players = votedOut != null
            ? st.players.map((p) => (p.seat === votedOut ? { ...p, dead: true } : p))
            : st.players;
          const record: RoundRecord = {
            round: st.game.round,
            picks: st.game.picks,
            deaths: st.game.nightDeaths,
            saved: resolveRound(st.game.picks).saved,
            votes1,
            votes2,
            votedOut,
            story,
            startTs: st.game.roundStartTs,
            endTs: Date.now(),
          };
          return {
            players,
            game: {
              ...st.game,
              round: st.game.round + 1,
              phase: 'night',
              stepIdx: 0,
              picks: [],
              nightDeaths: [],
              rounds: [...st.game.rounds, record],
              roundStartTs: Date.now(),
            },
          };
        });
      },

      finishGame: () => {
        set({
          game: emptyGame(),
          players: [],
          dealIdx: 0,
          setup: emptySetup(),
          screen: 'home',
        });
      },

      roleById: () => {
        const map: Record<string, RoleDef> = {};
        for (const r of get().roleDefs) map[r.id] = r;
        return map;
      },

      nightSteps: () => {
        const { setup } = get();
        const inPlay = (id: string) => (setup.counts[id] ?? 0) > 0;
        return setup.nightOrder.filter(inPlay);
      },
    }),
    {
      name: 'night-table-v1',
      partialize: (st) => ({
        lang: st.lang,
        roleDefs: st.roleDefs.filter((r) => !r.builtin),
        settings: st.settings,
        setup: st.setup,
        players: st.players,
        dealIdx: st.dealIdx,
        game: st.game,
        screen: st.screen,
        roleIcons: st.roleIcons,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        // Normalize state saved by older versions so missing fields can never
        // crash the app (e.g. a pre-seatOrder game showing a blank screen).
        const game = { ...emptyGame(), ...(p.game ?? {}) };
        const setup = { ...emptySetup(), ...(p.setup ?? {}) };
        const settings = { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) };
        const players = Array.isArray(p.players) ? p.players : [];
        const roleIcons = (p.roleIcons && typeof p.roleIcons === 'object') ? p.roleIcons : {};
        // If a game is mid-table but has no roster, fall back to home (safe).
        const screen = p.screen === 'table' && players.length === 0 ? 'home' : (p.screen ?? 'home');
        return {
          ...current,
          ...p,
          game,
          setup,
          settings,
          players,
          screen,
          roleIcons,
          // always rebuild full role list = built-ins + persisted custom
          roleDefs: [...BUILTIN_ROLES, ...((p.roleDefs as RoleDef[]) ?? [])],
        };
      },
    },
  ),
);
