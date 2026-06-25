# CLAUDE.md — Night Table (Mafia party-game app)

Project guide for Claude Code. Read this at the start of every session. The full build spec is in **`IMPLEMENTATION_PLAN.md`**; the visual + interaction source of truth is **`reference/prototype.html`** (open in a browser).

## What this is
Single-device, pass-and-play Mafia app. Two modes: (1) **role dealer** — shuffles roles to seats, shows each player their secret card; (2) **mayor's console** — omniscient host view to run the night/day cycle, record actions, resolve outcomes. The app is a **smart notepad, not a referee** — it records and suggests; the **mayor confirms deaths and outcomes manually**.

## Stack
React 18 + TypeScript + Vite · Zustand (`persist`) · hand-rolled i18n (EN/RU/LT) · plain CSS (ported from prototype) · inline-SVG role art · `vite-plugin-pwa` · GitHub Pages via Actions.

## Non-negotiables
- **Base path is `/Mafia/`** (repo name). Every absolute asset path and the PWA `start_url`/`scope` use it.
- **No-peek card flip**: when advancing to the next player, reset the card to its blank face with the CSS transition disabled (instant), repopulate the front while hidden, then restore the transition via double `requestAnimationFrame`. Never let the next role animate into view.
- **Stable seat numbering**: seats are fixed 1..N for the whole game. Dead players stay in place, greyed + struck through. Numbering never shifts.
- **Doctor rule**: a Doctor heal on the same seat the Mafia targeted **cancels the kill** (that player survives the round). Resolution pre-fills suggested deaths = (mafia targets − doctor saves) ∪ city vote; the **mayor confirms**.
- **Table never resets** during play — step marks and dead state layer on top and persist across steps and rounds.
- **Mayor is outside the player count** — host only, never dealt a card.
- **Finish** requires **two sequential warning modals** before a new game can start.
- **Offline only** — story generation is static/procedural templates, no API calls.

## Design tokens
`--bg:#0A0E18 --bg2:#0E1421 --panel:#161E2E --line:#28344B --lamp:#E7B45A --ink:#ECEFF6 --mute:#8A93A8`
roles: `--mafia:#D8453E --police:#3E84CC --doctor:#41A877 --butterfly:#C94F93 --citizen:#8F99AD`
Fonts: Playfair Display (display) + Inter (body). Theme: "lamp over a midnight card table"; gold accent used sparingly.

## Conventions
- Navigation is a `screen` field in the Zustand store, not a router.
- Persist: `lang`, custom `roleDefs`, `settings`, and active `players`/`game`/`setup` (so refresh resumes mid-game). Serialize Sets as arrays.
- Keep `RoleArt` API stable (`<RoleArt roleId=... />`) so PNG art can replace SVG later in one file.
- i18n: every user-facing string goes through `t()`. Built-in role names/descriptions are translated by `roleId`; custom roles use the user's typed text as-is.
- Work in the phases from the plan. After each phase: `npm run build` must pass, then commit with the message suggested in the plan. Keep changes scoped to the current phase.

## Commands
```
npm run dev      # local dev
npm run build    # must pass before every commit
npm run preview  # check the production build locally
```

## Deploy
Push to `main` → GitHub Actions builds and deploys to Pages. One-time: repo **Settings → Pages → Source = GitHub Actions**. Live at `https://lukonstantinov.github.io/Mafia/`.

## Definition of done (v1)
Host can build/pick a roster → deal all cards on one phone → enter mayor view → run multiple rounds (mafia/police/doctor/butterfly/vote) → resolve deaths with the doctor-save rule, confirmed manually → read a round log/story → finish safely. Installs to iPhone home screen, persists across refreshes, runs offline in EN/RU/LT.
