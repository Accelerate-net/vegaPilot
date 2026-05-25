// Central config. Vite injects VITE_* env vars at build time; sensible
// defaults make the player run with zero setup inside the monorepo.

// Empty string => use same-origin (recommended in production; the player
// is served from the same host as the API). Override with VITE_API_BASE
// when developing the player standalone against a remote backend.
export const API_BASE = import.meta.env?.VITE_API_BASE || '';
export const POLL_INTERVAL_MS = Number(import.meta.env?.VITE_POLL_INTERVAL_MS || 20_000);
export const HEARTBEAT_MS = Number(import.meta.env?.VITE_HEARTBEAT_MS || 60_000);
export const MOUNT_ID = 'player-root';

// Mock mode is now opt-in. Set VITE_USE_MOCK=true to demo without the
// backend. Default is real API.
export const USE_MOCK = (import.meta.env?.VITE_USE_MOCK ?? 'false') === 'true';
