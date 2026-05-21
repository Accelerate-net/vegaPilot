import axios from 'axios';
import { clearToken, getToken } from './auth';

export const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:3004/api'
  : 'https://crisprtech.app/api';

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
