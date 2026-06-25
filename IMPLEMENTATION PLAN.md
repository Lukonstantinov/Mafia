# Night Table — Implementation Plan (for Claude Code)

A Mafia (social-deduction) party-game app. Single device, pass-and-play. It does two jobs:
1. **Role dealer** — shuffles roles to seats and shows each player their secret card (like a physical card deck).
2. **Mayor's console** — an omniscient narrator view for the host to run the night/day cycle, record actions, and resolve outcomes.

The app is a **smart notepad, not a referee**: it records picks and shows marks; the **mayor confirms deaths and outcomes manually**.

Repo: https://github.com/Lukonstantinov/Mafia → GitHub Pages base path is **`/Mafia/`**.

Visual + interaction source of truth: **`reference/prototype.html`** (open it in a browser). Port its look, layout, animations, and the `roleSVG()` emblems directly. This plan is the spec; the prototype is the design.

---

## How to use this plan with Claude Code

Work **phase by phase**. After each phase: `npm run build` must pass, commit with the suggested message, and tick the acceptance checks before moving on. Each phase is self-contained so context stays small. Re-read `CLAUDE.md` at the start of a session.

---

## Tech stack

| Concern | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| State | Zustand + `persist` middleware (localStorage) |
| Navigation | Phase state in the store (no router needed) |
| i18n | Hand-rolled `t()` + nested dictionary (EN / RU / LT) |
| Styling | Plain CSS (port `index.css` from the prototype `<style>`) |
| Icons/art | Inline SVG components (port `roleSVG()`); real PNGs slot in later |
| PWA | `vite-plugin-pwa` (autoUpdate) + manifest + apple-touch icons |
| Deploy | GitHub Actions → GitHub Pages |

Rationale for phase-nav over a router: the flow is a linear pass-and-play state machine, not deep-linkable screens. A `screen` field in the store is simpler and avoids SPA-404 issues on Pages.

---

## Repo / file structure

```
Mafia/
├─ index.html
├─ package.json
├─ tsconfig.json
├─ tsconfig.node.json
├─ vite.config.ts
├─ .gitignore
├─ CLAUDE.md
├─ reference/prototype.html          # design source of truth (do not ship in build)
├─ .github/workflows/deploy.yml
├─ public/
│  ├─ manifest.webmanifest
│  ├─ icon-192.png  icon-512.png  apple-touch-icon.png   # 1024 maskable source too
└─ src/
   ├─ main.tsx
   ├─ App.tsx                         # renders current screen from store
   ├─ index.css                       # ported from prototype
   ├─ types.ts
   ├─ store.ts                        # zustand + persist
   ├─ i18n/
   │  ├─ index.ts                     # useT() / t()
   │  ├─ en.ts  ru.ts  lt.ts
   ├─ game/
   │  ├─ defaults.ts                  # built-in roles + presets
   │  ├─ engine.ts                    # assignment, night steps, resolution, win-check
   ├─ components/
   │  ├─ RoleArt.tsx                  # SVG emblems (+ defs)
   │  ├─ Stepper.tsx  Toggle.tsx  Sheet.tsx  Modal.tsx
   └─ screens/
      ├─ Home.tsx
      ├─ Setup.tsx
      ├─ RoleCreator.tsx
      ├─ NightOrder.tsx
      ├─ Settings.tsx
      ├─ Assign.tsx
      ├─ Tally.tsx
      ├─ Deal.tsx
      ├─ Gate.tsx
      └─ Table.tsx                    # god-view + step engine + sheets + resolution
```

---

## Design tokens (from prototype)

```css
--bg:#0A0E18; --bg2:#0E1421; --panel:#161E2E; --panel2:#1C2638; --line:#28344B;
--lamp:#E7B45A; --lamp-soft:#F0C674; --ink:#ECEFF6; --mute:#8A93A8; --mute2:#5C6680;
--mafia:#D8453E; --police:#3E84CC; --doctor:#41A877; --butterfly:#C94F93; --citizen:#8F99AD; --danger:#E2574C;
```
Fonts: display = Playfair Display (serif), body = Inter. Theme = "lamp over a midnight card table." Keep the warm-gold accent sparing.

---

## Data models (`src/types.ts`)

```ts
export type Team = 'mafia' | 'town' | 'neutral';
export type Lang = 'EN' | 'RU' | 'LT';
export type Screen =
  | 'home' | 'setup' | 'roleCreator' | 'nightOrder' | 'settings'
  | 'assign' | 'tally' | 'deal' | 'gate' | 'table';

export interface RoleDef {
  id: string;            // 'mafia' | 'police' | ... | 'role_<ts>'
  name: string;          // base (EN) name; built-ins are translated via i18n by id
  team: Team;
  color: string;         // hex; card + circle colour
  icon: string;          // svg key for built-ins; emoji/char for custom
  actsAtNight: boolean;  // gets its own night step
  desc: string;          // base description; built-ins translated via i18n
  builtin: boolean;
}

export interface Player {
  seat: number;          // 1-based, stable for the whole game (numbering never shifts)
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
  nightOrder: string[];           // ordered roleIds that act at night (between pinned ends)
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
```

Store (`src/store.ts`) holds: `lang`, `screen`, `roleDefs` (built-ins + custom), `setup`, `settings`, `players`, `dealIdx`, `game`. **Persist** `lang`, custom `roleDefs`, `settings`, and the active `players`/`game`/`setup` so a refresh resumes mid-game. Serialize any Sets as arrays.

---

## Built-in roles & presets (`src/game/defaults.ts`)

Built-ins (id, team, color, svg key):
- `mafia` — mafia, `#D8453E`, kills one/night.
- `police` — town, `#3E84CC`, checks one/night (learns if Mafia).
- `doctor` — town, `#41A877`, heals one/night (see rule below).
- `butterfly` — town, `#C94F93`, silences one player for the coming day.
- `citizen` — town, `#8F99AD`, no night action.

Presets:
- **Classic 11**: mafia×3, police×2, doctor×1, butterfly×1, citizen×4.
- **Starter 8**: mafia×2, police×1, doctor×1, citizen×4.
- **From scratch**: empty counts, user builds it.

---

## ⭐ Core rule: Doctor heal cancels the Mafia kill

The Doctor heals one player per night. **If the Mafia targeted that same player, the player survives** (heal = immunity for that round). Resolution each round:

```
mafiaTargets  = picks where stepId == 'mafia'         (length = actionsPerRole.mafia)
doctorHeals   = picks where stepId == 'doctor'
cityVotes     = picks where stepId == 'city'
saved         = mafiaTargets ∩ doctorHeals            // doctor saved them
downByMafia   = mafiaTargets \ saved
suggestedDeaths = unique(downByMafia ∪ cityVotes)
```
- `doctorSelfHeal` off → Doctor may not pick their own seat (disable that circle for the doctor step).
- The resolution screen pre-fills `suggestedDeaths` as checked, shows "🩺 saved <name>" for each save, and the **mayor toggles the final dead set and confirms**. Only confirmed seats get `dead = true`. Numbering never shifts; dead circles stay in place, greyed + struck through.
- Police check: the mayor already sees roles, so the app just logs the check and shows the result inline (mafia / not mafia) for the mayor to tell the player verbally.
- Butterfly: set `silencedForRound = round + ?` (the coming day); purely informational — mayor enforces verbally.
- **Dead roles' steps are still shown** (not auto-skipped); the mayor just proceeds.

Win check (suggestion only — mayor decides):
```
mafiaAlive, townAlive = counts of alive players by team
if townWinLastMafia && mafiaAlive == 0  -> suggest "Town wins"
if mafiaWinRatioEqual && mafiaAlive >= townAlive && mafiaAlive>0 -> suggest "Mafia wins"
```
Show a non-blocking banner; the mayor can keep playing or Finish.

---

## Screen-by-screen behaviour

All ported from `reference/prototype.html`. Key points only:

- **Home** — language toggle (EN/RU/LT, persisted); preset cards + "from scratch".
- **Setup** — player count stepper; optional names (comma list fills seats; blanks allowed); role-count rows (Citizens auto-fill remainder); buttons to Role Creator, Night Order, Settings; "Move on" → Assign.
- **Role Creator** — name, description, icon, card colour, team (mafia/town/neutral), "Acts at night" toggle. Save → adds to `roleDefs` (custom, **persisted**) and appears in Setup. A night-acting custom role auto-inserts into `nightOrder` just before the pinned vote, draggable anywhere between the pinned ends.
- **Night Order** — drag-reorder list. "City sleeps" pinned first, "City/Citizens vote" pinned last; only the middle is reorderable. Implement real pointer-based drag (mobile-first). Persist order.
- **Settings** — actions-per-role steppers (default 1; e.g. Mafia 2 kills); win thresholds (mafia ratio, town last-mafia); Doctor self-heal toggle; Story toggle; Round-log+timers toggle.
- **Assign** — rotating-ring animation: numbered seats spin, settle, fill with role emblems; then Reshuffle / See result. Assignment shuffles the role pool across seats.
- **Tally** — "All done", counts per role (`3/3`…), Reshuffle / Start dealing.
- **Deal (pass & play)** — "Seat N · pass to <Name>" → tap card → flips to role emblem + colour + "The <Role>" + description → "Hide & pass" → next. **No-peek flip (critical):** on advancing, snap the card back to its blank face with the transition disabled (instant), repopulate the front while hidden, then restore the transition via double `requestAnimationFrame`. After the last seat → Gate.
- **Gate** — "All roles dealt" → "I'm the Mayor" → confirm modal "Are you the mayor? (you'll see all secret roles)" → Table.
- **Table (god-view + game)**
  - Pre-game: ring of numbered, named, role-colour circles; tap to inspect; "Start game".
  - In-game: step tabs (night order + final City vote), prompt bar, **Proceed** logs the tapped target and advances. **The table never resets** — marks layer on top; all state retained across steps and rounds.
  - Floating subwindows (bottom-sheets; main view stays): **Tonight's picks** (each step's target tagged targeted/checked/healed/silenced), **Who's left** (grouped by role, header `Mafia 1/3`, dead members greyed + struck), **Round log** (timestamps + per-round duration + optional generated story paragraph).
  - End of round → **Resolution** (the ⭐ rule above): confirm deaths, then round++ continues identically.
  - **Finish** — must pass **two sequential warning modals** before a new game starts.
  - Mayor sits outside the player count (host only; never dealt a card).

---

## Story generator (`engine.ts`)

Offline, procedural, template-based (no API). Input: round's confirmed deaths + saves. Tone = short noir. Provide ~4 opening templates, ~3 "one death", ~2 "multiple deaths", ~2 "no deaths / doctor saved everyone" variants; pick by seeded random so a round's story is stable. Make tone easy to swap (one `TONE` constant or template set) — Luka may want darker/lighter/playful later. Translate story fragments per language, or keep EN-only in v1 and flag as TODO.

---

## PWA + GitHub Pages

`vite.config.ts`:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/Mafia/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Night Table — Mafia',
        short_name: 'Night Table',
        start_url: '/Mafia/',
        scope: '/Mafia/',
        display: 'standalone',
        background_color: '#0A0E18',
        theme_color: '#0A0E18',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
});
```
`index.html` `<head>` needs the iOS bits (so "Add to Home Screen" gives a real app icon + fullscreen):
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="apple-touch-icon" href="/Mafia/apple-touch-icon.png">
<meta name="theme-color" content="#0A0E18">
```

`.github/workflows/deploy.yml` (build + deploy on push to `main`):
```yaml
name: Deploy
on: { push: { branches: [main] } }
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: "${{ steps.deployment.outputs.page_url }}" }
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```
Then in the repo: **Settings → Pages → Source = GitHub Actions**. Live URL will be `https://lukonstantinov.github.io/Mafia/`.

---

## Phased task list (execute in order)

### Phase 0 — Scaffold
Create Vite react-ts project; add deps (`zustand`, `vite-plugin-pwa`); add `vite.config.ts` (base `/Mafia/`, PWA), `index.html` head, `.github/workflows/deploy.yml`, icons in `public/`, port design tokens into `index.css`, drop a placeholder `App.tsx`.
**Accept:** `npm run dev` shows a styled placeholder; `npm run build` passes; pushing to `main` deploys a blank app to Pages.
**Commit:** `chore: scaffold vite+react+ts PWA with pages deploy`

### Phase 1 — Foundations
`types.ts`, `store.ts` (with persist), `i18n/` (EN full; RU/LT stubs for main strings), `game/defaults.ts`, `components/RoleArt.tsx` (port `roleSVG` + gradient defs), shared `Stepper/Toggle/Sheet/Modal`.
**Accept:** language toggle persists across reload; RoleArt renders all five emblems; store survives refresh.
**Commit:** `feat: types, store, i18n, role art, shared components`

### Phase 2 — Setup flow
`Home`, `Setup`, `RoleCreator`, `NightOrder` (real drag), `Settings`. Custom roles persist and appear in Setup; night-acting customs insert before the pinned vote.
**Accept:** can build a roster from a preset or scratch; create a custom role and see it persist after reload; reorder the night list with the pinned ends fixed.
**Commit:** `feat: home, setup, role creator, night order, settings`

### Phase 3 — Deal
`Assign` (ring animation + shuffle), `Tally`, `Deal` (no-peek flip).
**Accept:** assignment distributes exactly the configured counts; dealing walks all seats; **no flash of the next card** on advance; reshuffle works.
**Commit:** `feat: assignment animation, tally, pass-and-play dealing`

### Phase 4 — Mayor table (static)
`Gate` (two-step confirm), `Table` pre-game god-view (ring layout, inspect on tap).
**Accept:** gate warns before reveal; ring shows numbered/named/colour circles; tapping inspects.
**Commit:** `feat: mayor gate and table god-view`

### Phase 5 — Game engine
Step tabs from night order + City vote; Proceed logs picks; clock; three subwindows (picks / who's-left / log+story). Table never resets.
**Accept:** stepping through a night logs each pick; sheets reflect live state; dead/greyed state persists across steps; story renders when enabled.
**Commit:** `feat: night step engine, subwindows, round log + story`

### Phase 6 — Resolution, rounds, finish
End-of-round Resolution implementing the ⭐ doctor-cancels-mafia rule + manual confirm; commit deaths (stable numbering); win-check banner; next round; Finish with two warnings.
**Accept:** Mafia hit + Doctor heal on the same seat → that seat survives and shows "saved"; confirmed deaths grey in place; round 2 behaves like round 1; Finish needs both warnings.
**Commit:** `feat: round resolution (doctor save), win check, finish flow`

### Phase 7 — Polish
Full RU/LT pass; persistence resume mid-game; PWA install test on a real iPhone; art slots so PNG illustrations replace SVG without layout change; edge cases (0 mafia, all-citizen, >1 mafia kills, doctor self-heal off).
**Accept:** installable on iOS with correct icon; switching language mid-game updates everything; refreshing mid-round resumes.
**Commit:** `feat: i18n pass, pwa polish, art slots, persistence resume`

---

## Swapping SVG emblems for the real PNG art

Keep `RoleArt` API as `<RoleArt roleId="mafia" />`. Built-ins render SVG now; later, map each `roleId` to an imported PNG (`/src/assets/roles/mafia.png`) and render `<img>` inside the same circular frame. Because every screen consumes `RoleArt`, dropping in PNGs is a one-file change. Card faces already use a role-coloured frame + banner, matching the uploaded reference cards.

---

## Definition of done (v1)

A host can: pick/build a roster → deal every player their card on one phone → enter the mayor view → run multiple rounds recording mafia/police/doctor/butterfly/vote actions → resolve deaths with the doctor-save rule applied and confirmed manually → read a per-round log/story → finish safely. App installs to an iPhone home screen, persists across refreshes, and runs fully offline in EN/RU/LT.
