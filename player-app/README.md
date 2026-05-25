# Crispr Kiosk Player

A lightweight, dependency-free (apart from React) digital-signage runtime.
Loads a screen's assigned **loop** from the admin API and renders content
fullscreen on a TV / Chromecast / browser.

## URL format

```
https://<host>/player/<SCREEN_CODE>
```

Example: `https://signage.crispr.in/player/KCH-R01`

The player parses the screen code from the URL, fetches the loop, and starts
playing immediately. On disconnect, it falls back to the cached loop in
localStorage so playback continues.

## Architecture

```
player-app/
├─ index.html                    standalone HTML entry (after extraction)
├─ package.json                  standalone manifest
├─ vite.config.standalone.js     rename → vite.config.js after extraction
└─ src/
   ├─ main.jsx                   React mount
   ├─ App.jsx                    URL parsing → <Player>
   ├─ Player.jsx                 orchestrator: fetch, advance items, overlays
   ├─ config.js                  env / endpoint config
   ├─ styles.css                 base reset + transitions
   ├─ lib/
   │  ├─ api.js                  HTTP transport (swap mockApi for real)
   │  ├─ mockApi.js              hard-coded seed used until backend wired
   │  ├─ cache.js                localStorage-backed offline cache
   │  ├─ socket.js               WebSocket placeholder (check-ins, alerts)
   │  └─ log.js                  tiny logger
   ├─ renderer/
   │  ├─ ContentRenderer.jsx     dispatches by item.content_type
   │  ├─ transitions.js          fade / slide / zoom / blur / wipe / cinematic
   │  └─ content/                one component per content type
   └─ overlays/
      ├─ CheckinOverlay.jsx      floating biometric check-in toasts
      └─ EmergencyOverlay.jsx    fullscreen red override
```

Every module talks to the rest through narrow interfaces (`api.fetchScreen`,
`socket.subscribe`, `cache.read/write`). Nothing outside `player-app/`
is imported.

## Running inside the monorepo

The parent Vite config rewrites `/player` and `/player/*` to `/player.html`,
which mounts this app. Just run the parent's `npm run dev:web` and open
`http://localhost:5173/player/KCH-R01`.

## Extracting to its own repo

1. **Copy** the `player-app/` folder to the new repo root (flatten — its
   contents become the repo's contents).
2. **Rename** `vite.config.standalone.js` → `vite.config.js`.
3. **Install + run**:
   ```bash
   npm install
   npm run dev
   ```
   Opens `http://localhost:5174/player/KCH-R01`.
4. **Swap the data source**: open `src/lib/api.js` and flip the
   `USE_MOCK` flag to `false`, then set `VITE_API_BASE` in `.env`.
   That's the only edit needed to point at the real backend.

No other code changes are required — the player has no imports from outside
its own folder.

## Swapping the backend

`src/lib/api.js` exposes a tiny interface:

```js
fetchScreen(screenCode)        // → { screen, loop, alerts }
heartbeat(screenCode)          // periodic ping
```

When `USE_MOCK = true` (default) calls are served from `mockApi.js`.
When `false`, calls go to `${VITE_API_BASE}/api/player/...`.

## Adding a new content type

1. Add a file in `src/renderer/content/` (e.g. `MyType.jsx`).
2. Register it in `src/renderer/ContentRenderer.jsx`'s `RENDERERS` map
   under the same `content_type` string the admin emits.

That's the only wiring required — the player will pick it up automatically.

## Realtime features

`src/lib/socket.js` is a placeholder that simulates check-in events on a
timer when `USE_MOCK = true`. Swap it for a real `WebSocket` connection
when the backend is ready. The `Player` subscribes to two channels:

- `checkin:<branch_id>` → drives `CheckinOverlay`
- `emergency:<branch_id>` → drives `EmergencyOverlay`

## Offline behaviour

On every successful fetch the full `{ screen, loop, alerts }` payload is
written to `localStorage` under `kiosk:cache:<screen_code>`. On fetch
failure the player reads the last cached payload and continues playing.
A small badge in the corner indicates "offline — using cache" so on-site
staff know.
