// Standalone Vite config — used AFTER extracting `player-app/` to its own repo.
// Inside the parent monorepo this file is unused (the parent's vite.config.js
// owns the dev server and rewrites /player/* → /player.html).
//
// On extraction:
//   1. Rename this file to `vite.config.js` at the new repo root.
//   2. Rename `index.html` to stay at the new repo root.
//   3. `npm install && npm run dev`.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Rewrite any "/player/<screen_code>" URL to index.html so the SPA can
// parse the code from window.location and load it.
function playerRouteFallback() {
  const rewrite = (req, _res, next) => {
    const url = (req.url || '/').split('?')[0];
    const last = url.split('/').pop() || '';
    const isAsset = last.includes('.') || url.startsWith('/@') || url.startsWith('/src/') || url.startsWith('/node_modules/');
    if (!isAsset) req.url = '/index.html';
    next();
  };
  return {
    name: 'player-route-fallback',
    configureServer(server) { server.middlewares.use(rewrite); },
    configurePreviewServer(server) { server.middlewares.use(rewrite); },
  };
}

export default defineConfig({
  plugins: [react(), playerRouteFallback()],
  server: { port: 5174, host: true, open: '/player/KCH-R01' },
  build: { outDir: 'dist', emptyOutDir: true },
});
