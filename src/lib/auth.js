const TOKEN_KEY = 'crisprPilotAdminToken';

// Best storage available to a pure SPA is localStorage. A non-HttpOnly cookie
// is no more secure (still readable from JS) and adds CSRF surface, so we
// stick to localStorage only and clear any legacy cookie that may exist.

function clearLegacyCookie() {
  document.cookie = `${TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export function getToken() {
  const stored = window.localStorage.getItem(TOKEN_KEY);
  if (stored) return stored;

  // One-time migration: if a legacy cookie is present, lift it into
  // localStorage and remove the cookie.
  const cookieMatch = document.cookie.match(`(^|;)\\s*${TOKEN_KEY}=([^;]+)`);
  if (cookieMatch?.[2]) {
    const value = decodeURIComponent(cookieMatch[2]);
    window.localStorage.setItem(TOKEN_KEY, value);
    clearLegacyCookie();
    return value;
  }
  return '';
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function setToken(token) {
  if (!token) return;
  window.localStorage.setItem(TOKEN_KEY, token);
  clearLegacyCookie();
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  clearLegacyCookie();
  // Drop cached user/prefs tied to the session so the next login starts clean.
  window.localStorage.removeItem('vp_user');
  window.localStorage.removeItem('vp_prefs');
}
