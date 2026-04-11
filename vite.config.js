import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const cleanRoutes = new Set([
  '/',
  '/login',
  '/verify-token',
  '/candidate-profile',
  '/candidate-detail',
  '/orders',
  '/courses-list',
  '/course-view',
  '/course-management',
  '/catalog',
  '/video-content',
  '/bunny-admin',
  '/quiz-listing',
  '/quiz-creation',
  '/quiz-attempt-report',
  '/question-bank',
  '/practice-questions',
  '/exam-listing',
  '/exam-creation-wizard',
  '/exam-attempt-report',
  '/test-series-list',
  '/mentor-profiles',
  '/instructor-portfolio',
  '/instructor-payouts',
  '/leads-management',
  '/batch',
  '/web-content-manager',
]);

function cleanRouteFallback() {
  const rewrite = (req, _res, next) => {
    const url = req.url ? req.url.split('?')[0] : '/';
    if (cleanRoutes.has(url)) {
      req.url = '/app.html';
    }
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
  },
});
