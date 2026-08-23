import axios from 'axios';
import { clearToken, getToken } from './auth';

// API origin resolution (Option B — call the backend directly, no Vite proxy):
//   1. If VITE_API_BASE is set (see .env.development), use it. This is the
//      explicit, configurable override for local/staging work.
//   2. Otherwise fall back to a hostname check: localhost → local backend,
//      anything else → production. Keeps prod builds correct even if no env
//      var is provided.
// VITE_API_BASE should be the backend ORIGIN only (no trailing /api, no slash);
// we append `/api` here so every call resolves to `<origin>/api/...`.
const ENV_API_BASE = import.meta.env?.VITE_API_BASE;

export const BASE_URL = ENV_API_BASE
  ? `${String(ENV_API_BASE).replace(/\/+$/, '')}/api`
  : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://127.0.0.1:3004/api'
      : 'https://crisprtech.app/api');

export const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers['X-Access-Token'] = token;
  }

  return config;
});

// Global rule: ANY 401 from ANY API call means the session is dead — clear the
// token and send the user to /login. This is unconditional (no per-request
// opt-out); the only exception is the login endpoint itself, whose form
// renders its own "invalid credentials" error.
export function handleUnauthorized() {
  clearToken();
  if (window.location.pathname !== '/login') {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(`/login?next=${next}`);
  }
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';
    const isAuthCall = url.includes('/admin-auth/authenticate');
    if (status === 401 && !isAuthCall) {
      handleUnauthorized();
    }
    return Promise.reject(error);
  }
);
