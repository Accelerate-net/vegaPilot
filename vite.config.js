import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Single source of truth: derive the SPA route list from the screens registry
// so we never have to remember to add new routes here.
// eslint-disable-next-line import/extensions
import { allScreens } from './src/lib/legacyScreens.js';

const cleanRoutes = new Set([
  '/',
  '/permission',
  ...allScreens.map((s) => s.path),
]);

// URL prefixes that Vite/dev-tooling owns — never rewrite these or HMR breaks.
const RESERVED_PREFIXES = [
  '/@',           // /@vite, /@react-refresh, /@id, /@fs
  '/src/',
  '/node_modules/',
  '/assets/',
  '/fonts/',
  '/__',          // /__open-in-editor, etc.
  '/favicon',
];

function looksLikeStaticAsset(url) {
  // Anything with a dotted file extension (e.g. .js, .css, .png, .html, .map)
  // — pass through untouched.
  const last = url.split('/').pop() || '';
  return last.includes('.');
}

function cleanRouteFallback() {
  const rewrite = (req, _res, next) => {
    const url = req.url ? req.url.split('?')[0] : '/';

    // ── Player runtime route: /player or /player/<screen_code> ──
    // Routed to the standalone player-app bundle, NOT the admin SPA.
    if (url === '/player' || url.startsWith('/player/')) {
      req.url = '/player.html';
      return next();
    }

    // Known SPA route: rewrite straight to the app entry.
    if (cleanRoutes.has(url)) {
      req.url = '/app.html';
      return next();
    }

    // Anything reserved by Vite/dev-tooling or a static asset: leave alone.
    if (RESERVED_PREFIXES.some((p) => url.startsWith(p)) || looksLikeStaticAsset(url)) {
      return next();
    }

    // Unknown path that looks like an app route (no extension, not reserved):
    // hand it to the SPA so React Router's catch-all can send it to /landing
    // instead of falling through to the legacy index.html.
    req.url = '/app.html';
    next();
  };

  return {
    name: 'clean-route-fallback',
    configureServer(server) {
      server.middlewares.use(rewrite);
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite);
    },
  };
}

export default defineConfig({
  plugins: [react(), cleanRouteFallback()],
  server: {
    port: 5173,
    open: '/candidate-profile',
  },
  build: {
    outDir: 'dist-react',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main:   'app.html',
        player: 'player.html',
      },
    },
  },
});
