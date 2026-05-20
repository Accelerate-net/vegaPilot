import React, { useState, useEffect, useCallback } from 'react';
import {
  UserContext,
  getCachedUser, setCachedUser,
  getLocalPrefs, setLocalPrefs, syncPrefsToServer,
  decodeToken, getInitials,
} from '../lib/userStore';
import { ROLES } from '../lib/roles';
import { getToken } from '../lib/auth';
import { api } from '../lib/api';

export default function UserProvider({ children }) {
  const [user, setUser]   = useState(getCachedUser);
  const [prefs, setPrefs] = useState(getLocalPrefs);

  // ── Fetch user profile on mount ────────────────────────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    api.get('/user-profile/user-profile')
      .then((res) => {
        if (res.data?.status && res.data?.response) {
          const raw = res.data.response;
          const resolved = normalizeUser(raw);
          setCachedUser(resolved);
          setUser(resolved);
          // Merge server preferences (server wins for shape; local wins for values)
          if (raw.preferences) {
            const merged = { ...getLocalPrefs(), ...raw.preferences };
            setLocalPrefs(merged);
            setPrefs(merged);
          }
        }
      })
      .catch(() => {
        // Fallback: decode JWT payload
        if (!user) {
          const payload = decodeToken(token);
          if (payload) {
            const resolved = normalizeUser(payload);
            setCachedUser(resolved);
            setUser(resolved);
          }
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Preferences helpers ────────────────────────────────────────────
  const updatePrefs = useCallback((next) => {
    setLocalPrefs(next);
    setPrefs(next);
    syncPrefsToServer(next);
  }, []);

  const togglePin = useCallback((path) => {
    setPrefs((prev) => {
      const pins = prev.pinnedPaths || [];
      const next = pins.includes(path)
        ? pins.filter((p) => p !== path)
        : [...pins, path];
      const updated = { ...prev, pinnedPaths: next };
      setLocalPrefs(updated);
      syncPrefsToServer(updated);
      return updated;
    });
  }, []);

  const reorderPins = useCallback((newOrder) => {
    setPrefs((prev) => {
      const updated = { ...prev, pinnedPaths: newOrder };
      setLocalPrefs(updated);
      syncPrefsToServer(updated);
      return updated;
    });
  }, []);

  // ── Profile update ─────────────────────────────────────────────────
  const updateUser = useCallback(async (patch) => {
    const next = { ...(user || {}), ...patch };
    if (patch.name) next.initials = getInitials(patch.name);
    setUser(next);
    setCachedUser(next);
    try {
      await api.patch('/user-profile/update-profile', patch);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err };
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, prefs, togglePin, updatePrefs, reorderPins, updateUser }}>
      {children}
    </UserContext.Provider>
  );
}

// ─── Normalise whatever shape the API/JWT gives into our user shape ───────────
function normalizeUser(raw) {
  const role      = raw.role || raw.userRole || 'super_admin';
  const roleMeta  = ROLES[role] || ROLES.super_admin;
  const name      = raw.name || raw.fullName || raw.username || 'Admin';
  return {
    name,
    initials:  getInitials(name),
    role,
    roleLabel: raw.roleLabel || roleMeta.label,
    badgeColor: roleMeta.badgeColor,
    email:     raw.email || '',
    phone:     raw.phone || raw.mobile || raw.phoneNumber || raw.contactNumber || '',
  };
}
