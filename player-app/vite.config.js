// Vite config for the standalone CrisprSignagePlayer repo, deployed to GitHub
// Pages at the custom domain player.crisprlearning.in (served from the `docs/`
// folder on `main`). The custom domain serves from root, so `base` stays '/'.

import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const OUT_DIR = 'docs';

// Rewrite any "/player/<screen_code>" URL to index.html so the dev/preview
// server can parse the code from window.location and load it.
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

// The app routes on pathname (/player/<screen_code>) but GitHub Pages is static
// and only resolves /index.html. Emitting 404.html as a copy of index.html
// makes Pages serve the SPA for any deep link, where App.jsx then reads the
// path client-side.
function spaFallback() {
  return {
    name: 'spa-404-fallback',
    closeBundle() {
      const dir = resolve(process.cwd(), OUT_DIR);
      copyFileSync(resolve(dir, 'index.html'), resolve(dir, '404.html'));
    },
  };
}

export default defineConfig({
  plugins: [react(), playerRouteFallback(), spaFallback()],
  server: { port: 5174, host: true, open: '/player/KCH-R01' },
  build: { outDir: OUT_DIR, emptyOutDir: true },
});
