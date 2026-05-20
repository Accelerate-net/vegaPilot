import axios from 'axios';
import { getToken } from './auth';

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
