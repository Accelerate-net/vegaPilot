import axios from 'axios';
import { getToken } from './auth';

export function getBaseUrl() {
  const { protocol, hostname } = window.location;
  const isLocalPreview = protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1';

  return isLocalPreview ? 'http://192.168.1.100:3000' : 'https://crisprtech.app/crispr-apis';
}

export const api = axios.create({
  baseURL: getBaseUrl(),
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers['X-Access-Token'] = token;
  }

  return config;
});
