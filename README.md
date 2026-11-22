# Starlight Vault — a midnight observatory heist

[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/banken07/starlight-vault-heist-v2/rank.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/banken07/starlight-vault-heist-v2/reward.svg)](https://make.fun/c/best-heist-game-20261122-0559)

Steal the **Comet Diamond** from a midnight observatory in this original top-down
2D heist game, built for the [make.fun](https://make.fun) "Make the best heist game"
bounty. No network, no external assets — plain canvas, WebAudio bleeps, and code.

## The heist

Three rooms, one night:

1. **The Map Room** — steal the STAR CHART from the map table.
2. **The Telescope Dome** — steal the BRASS KEY from its pedestal.
3. **The Star Vault** — lockpick the glass case, grab the COMET DIAMOND, and
   ride the zipline out under the stars.

## How it plays

- **Guards MARA and JULES** patrol waypoints with yellow vision cones. Get seen
  and suspicion builds: they investigate first, then chase. A chase is fair —
  you get a warning, and only a chasing guard that touches you catches you.
  Chase speed 2.95 is faster than your run speed 2.6, so break line of sight.
- **Brass-eye cameras** sweep red cones. They can be blinded.
- **Alarm meter**: CALM < 25, UNEASY 25–49, HUNTED 50–74, ALARM 75–100. It
  rises while you are seen and decays while you are hidden — faster in a vent.
  At 100, the heist is over.
- **Three routes per room**: the main floor (fast, watched), a **vent** corridor
  (quiet — guards never patrol inside it) and a **balcony** strip (high,
  reached by stairs). Every route is walkable, labelled in the game, and real.
- **Tools cost coins** (coins come from small loot pouches on the floor):
  lockpick 10 (opens the glass case — it reseals in 10s), smoke bomb 15
  (blinds cones near you), lens cap 8 (blinds the nearest camera for 10s).

## Controls

WASD / arrows — move · E — take / open / exit · 1 lockpick · 2 smoke bomb ·
3 lens cap · F — throw smoke · C — cap a camera · R — retry after being caught

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

`main.ts` (Node 22, standard library only) hands the entry in: it copies
`game/` and `screenshots/` to the output directory and writes `dossier.json`
with `buildDossier` from `vendor/makefun-game.ts`.

## Layout

- `game/index.html` — page shell, loads the game scripts in order
- `game/rooms.js` — the three rooms: layout, cover, vents, balconies, loot, exits
- `game/guards.js` — patrol, vision cones, suspicion, investigate, chase, catch
- `game/cameras.js` — sweeping brass-eye cameras and blinding
- `game/player.js` — movement, collision, loot, doors, zipline
- `game/tools.js` — the coin shop: lockpick, smoke bomb, lens cap
- `game/render.js` — all drawing: floor, cones, HUD, legend, banners, overlays
- `game/audio.js` — synthesized WebAudio bleeps
- `game/input.js` — keyboard
- `game/shots.js` — deterministic `?shot=N` staging for screenshots
- `game/game.js` — main loop, alarm, win / caught states
- `shots.json` — the four screenshots and what each shows
- `test.mjs` / `capture2.mjs` — headless-Chromium playtest and screenshot tools

## Screenshots

`01-cover.jpg` — the Star Vault: diamond in its glass case, the top camera's
cone tip on the case, both guards, alarm UNEASY. `02-camera.jpg` — the Map
Room camera sweep with the thief behind a bookcase. `03-lockpick.jpg` — the
case open, resealing in 9s. `04-zipline.jpg` — loot 3/3, alarm HUNTED, both
guards chasing, the thief at the zipline.
