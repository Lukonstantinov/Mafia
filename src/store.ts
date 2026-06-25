import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Lang, Screen, RoleDef, SetupState, GameSettings, Player, GameState, Pick, RoundRecord,
} from './types';
import { BUILTIN_ROLES, DEFAULT_SETTINGS, DEFAULT_NIGHT_ORDER, PRESETS } from './game/defaults';
import { assignSeats, reshuffleSeats } from './game/engine';

function emptyGame(): GameState {
  return { started: false, round: 1, stepIdx: 0, picks: [], log: [], rounds: [], roundStartTs: 0 };
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

  setLang: (l: Lang) => void;
  go: (s: Screen) => void;

  // setup
  applyPreset: (id: keyof typeof PRESETS) => void;
  setCount: (n: number) => void;
  setNames: (raw: string) => void;
  setRoleCount: (roleId: string, n: number) => void;
  setNightOrder: (order: string[]) => void;
  addRole: (r: RoleDef) => void;
  setSettings: (patch: Partial<GameSettings>) => void;

  // deal
  doAssign: () => void;
  doReshuffle: () => void;
  startDealing: () => void;
  nextDeal: () => void;

  // game
  startGame: () => void;
  addPick: (p: Pick) => void;
  proceedStep: () => void;
  commitResolution: (deaths: number[], saved: number[], story: string | undefined) => void;
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
          game: { ...emptyGame(), started: true, roundStartTs: Date.now() },
          screen: 'table',
          // re-marking players as alive in case of a fresh game on same roster
          players: st.players.map((p) => ({ ...p, dead: false, silencedForRound: undefined })),
        }));
      },

      addPick: (p) => {
        set((st) => {
          // replace any existing pick for this step at the current slot — allow multiple per step
          const picks = [...st.game.picks, p];
          return { game: { ...st.game, picks } };
        });
      },

      proceedStep: () => {
        set((st) => ({ game: { ...st.game, stepIdx: st.game.stepIdx + 1 } }));
      },

      commitResolution: (deaths, saved, story) => {
        set((st) => {
          const deadSet = new Set(deaths);
          const players = st.players.map((p) => (deadSet.has(p.seat) ? { ...p, dead: true } : p));
          const record: RoundRecord = {
            round: st.game.round,
            picks: st.game.picks,
            deaths,
            saved,
            story,
            startTs: st.game.roundStartTs,
            endTs: Date.now(),
          };
          return {
            players,
            game: {
              ...st.game,
              round: st.game.round + 1,
              stepIdx: 0,
              picks: [],
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
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        return {
          ...current,
          ...p,
          // always rebuild full role list = built-ins + persisted custom
          roleDefs: [...BUILTIN_ROLES, ...((p.roleDefs as RoleDef[]) ?? [])],
        };
      },
    },
  ),
);
