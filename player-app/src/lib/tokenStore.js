// Per-screen bearer-token storage. Keyed by screen_code so a single
// browser can host multiple paired screens (useful for the wall-of-tvs
// demo). Persisted in localStorage and survives reloads.

const PREFIX = 'kiosk:screen_token:';

export function read(screen_code)        { try { return localStorage.getItem(PREFIX + screen_code); } catch { return null; } }
export function write(screen_code, tok)  { try { localStorage.setItem(PREFIX + screen_code, tok); } catch { /* quota */ } }
export function clear(screen_code)       { try { localStorage.removeItem(PREFIX + screen_code); } catch { /* ignore */ } }
