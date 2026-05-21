import React, { createContext, useContext } from 'react';
import { api } from './api';
import { has as permHas, hasAny as permHasAny, hasAll as permHasAll } from './permissions';

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

// ─── Permissions helpers ─────────────────────────────────────────────────────
export function getCachedPermissions() {
  const user = getCachedUser();
  return user?.permissions || [];
}

export function userCan(user, key) {
  return permHas(user?.permissions, key);
}

export function usePermission() {
  const ctx = useUser();
  const perms = ctx?.user?.permissions;
  return {
    can: (key) => permHas(perms, key),
    canAny: (keys) => permHasAny(perms, keys),
    canAll: (keys) => permHasAll(perms, keys),
    permissions: perms,
    roles: ctx?.user?.roles || [],
    isSuperAdmin: Array.isArray(perms) ? perms.includes('*') : perms === '*',
  };
}

// Declarative gate: <Can permission="students.blacklist"> ... </Can>
// Optional `fallback` element shown when permission is missing.
export function Can({ permission, anyOf, allOf, fallback = null, children }) {
  const { can, canAny, canAll } = usePermission();
  let allowed = false;
  if (permission) allowed = can(permission);
  else if (anyOf) allowed = canAny(anyOf);
  else if (allOf) allowed = canAll(allOf);
  if (!allowed) return fallback;
  return typeof children === 'function' ? children() : children;
}

// Non-blocking API sync — fire and forget, never throws
export async function syncPrefsToServer(prefs) {
  try {
    await api.patch('/user-profile/update-profile', { preferences: prefs });
  } catch {
    // Silently ignore — local state is the source of truth
  }
}
