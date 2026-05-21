// Tiny one-shot flash message channel.
// Used to surface a toast across a navigation/redirect.

const KEY = 'vp_flash';

export function setFlash(flash) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(flash));
  } catch {
    // ignore
  }
}

export function consumeFlash() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
