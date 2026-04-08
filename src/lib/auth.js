const TOKEN_KEY = 'vegaPilotAdminToken';

export function getToken() {
  const cookieMatch = document.cookie.match(`(^|;)\\s*${TOKEN_KEY}=([^;]+)`);

  if (cookieMatch?.[2]) {
    return decodeURIComponent(cookieMatch[2]);
  }

  return window.localStorage.getItem(TOKEN_KEY) || '';
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function setToken(token) {
  if (!token) {
    return;
  }

  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; expires=${expiry.toUTCString()}; path=/`;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  document.cookie = `${TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  window.localStorage.removeItem(TOKEN_KEY);
}
