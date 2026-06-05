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

// On 401, the session is no longer valid — clear it and bounce to /login.
// Skip this for:
//  - the login endpoint itself (the form renders its own error)
//  - requests that opt out via `config.skipAuthRedirect` (passive identity probes
//    like /me that shouldn't tear down the session if they fail in isolation)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const cfg = error?.config || {};
    const url = cfg.url || '';
    const isAuthCall = url.includes('/admin-auth/authenticate');
    const skip = cfg.skipAuthRedirect === true;
    if (status === 401 && !isAuthCall && !skip) {
      clearToken();
      if (window.location.pathname !== '/login') {
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.replace(`/login?next=${next}`);
      }
    }
    return Promise.reject(error);
  }
);
