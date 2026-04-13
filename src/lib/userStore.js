import { createContext, useContext } from 'react';
import { api } from './api';

const USER_KEY  = 'vp_user';
const PREFS_KEY = 'vp_prefs';

// ─── Context ──────────────────────────────────────────────────────────────────
export const UserContext = createContext(null);

export function useUser() {
  return useContext(UserContext);
}

// ─── JWT decode (no verification — for display only) ─────────────────────────
export function decodeToken(token) {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

// ─── Initials helper ─────────────────────────────────────────────────────────
export function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (name.slice(0, 2) || 'U').toUpperCase();
}

// ─── Cached user (synchronous — used for route guards) ───────────────────────
export function getCachedUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function setCachedUser(user) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

// ─── Preferences ─────────────────────────────────────────────────────────────
export function getLocalPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function setLocalPrefs(prefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

// Non-blocking API sync — fire and forget, never throws
export async function syncPrefsToServer(prefs) {
  try {
    await api.patch('/restricted/user/preferences.php', { preferences: prefs });
  } catch {
    // Silently ignore — local state is the source of truth
  }
}
