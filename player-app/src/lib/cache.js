// Offline cache. Persists the last successful screen payload so playback
// can survive a network drop. Pure localStorage — swap for IndexedDB if
// media blobs need to be cached too.

const KEY = (code) => `kiosk:cache:${code}`;

export function readCache(screenCode) {
  try {
    const raw = localStorage.getItem(KEY(screenCode));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeCache(screenCode, payload) {
  try {
    localStorage.setItem(KEY(screenCode), JSON.stringify({ ...payload, cached_at: Date.now() }));
  } catch {
    // Quota exceeded → drop silently. Network is the source of truth.
  }
}

export function clearCache(screenCode) {
  try { localStorage.removeItem(KEY(screenCode)); } catch { /* ignore */ }
}
