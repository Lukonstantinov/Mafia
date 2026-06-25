# Night Table — Mafia

A single-device, pass-and-play **Mafia** party-game app. The phone is the
**mayor's console**: it deals every player a secret role, then runs the
night/day cycle as an omniscient host view. It is a **smart notepad, not a
referee** — it records picks and suggests outcomes; the **mayor confirms every
death manually**.

Live: https://lukonstantinov.github.io/Mafia/

---

## ⚠️ Players: do NOT open the app yourself

**Only the mayor (host) ever touches the phone.** If a player opens the app on
their own, they can see every secret role and the whole team — which ruins the
game. The rules of safe use:

1. **One device, one operator.** The mayor holds the phone the entire game.
2. **Never open the app as a player.** When it is your turn during dealing, the
   mayor hands you the phone showing **only your own card**. Look at it, tap
   **Hide & pass**, and give the phone straight back.
3. **The blank face is a question mark (`?`).** Before you tap, and again after
   you hide, the card shows only a `?` — no role leaks between hand-offs.
4. **The full team is revealed to the mayor only, and last.** After the last
   card is dealt, the app locks behind a two-step "Are you the mayor?" gate.
   Only the host continues into the god-view that shows everyone's role.
5. **Don't peek over the mayor's shoulder** once the console is running.

If you are not the mayor, the app should never be in your hands except for the
one moment you are shown your own card.

---

## How a game runs

1. **Home** — pick a language (EN / RU / LT) and a preset (Classic 11,
   Starter 8) or build from scratch.
2. **Setup** — choose player count, optional names, role counts, custom roles,
   night order and rules.
3. **Assign** — roles are shuffled randomly across the seats. Seats settle to
   `?` (nothing is revealed to the room). **Reshuffle** re-randomises.
4. **Deal** — pass the phone seat by seat. Each player taps to see only their
   own card, then hides and passes. The next card never flashes into view.
5. **Gate** — two-step "I'm the mayor" confirm before any roles are shown.
6. **Table (mayor's console)** — god-view ring of all seats. Step through the
   night (mafia / police / doctor / butterfly / vote), record picks, then
   **resolve**: a doctor heal on the mafia's target cancels the kill; the mayor
   confirms the final deaths. Read a per-round log/story. Finish needs two
   warnings.

### The doctor rule

A Doctor heal on the **same seat** the Mafia targeted **cancels the kill** —
that player survives the round. Resolution pre-fills suggested deaths =
(mafia targets − doctor saves) ∪ city vote, and the **mayor confirms**.

---

## Develop

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check + production build (must pass before commits)
npm run preview  # serve the production build locally
```

Stack: React 18 + TypeScript + Vite · Zustand (`persist`) · hand-rolled i18n
(EN/RU/LT) · inline-SVG role art · `vite-plugin-pwa`. Base path is `/Mafia/`.

State persists to `localStorage`, so a refresh resumes mid-game, and the app
runs fully offline once installed.

## Install on a phone (PWA)

Open the live URL in Safari (iOS) or Chrome (Android) → **Share → Add to Home
Screen**. It launches fullscreen with its own icon and works offline.

## Deploy

Push to `main` → GitHub Actions builds and deploys to GitHub Pages.
One-time: repo **Settings → Pages → Source = GitHub Actions**.
