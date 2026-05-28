// Thin HTTP layer for the Digital Signage admin module + player surface.
// Reuses the project-wide axios instance (X-Access-Token + 401 handling),
// unwraps the `{ data: ... }` envelope, and normalises errors so callers
// can switch on `err.code` (e.g. 'SCREEN_CODE_TAKEN', 'MEDIA_IN_USE').
//
// Backend contract: DIGITAL_SIGNAGE_API_CONTRACT.md (admin §4, player §7).
// Branches are NOT owned by signage — use `listLocations` from
// ./locationsApi.js for the branch/location dropdown.

import axios from 'axios';
import { api } from './api';

const BASE = '/restricted/signage';
const PLAYER_BASE = '/signage/player';

// Player calls go through a dedicated axios instance so we can attach the
// `Authorization: Bearer <screen_token>` header without colliding with the
// admin app's X-Access-Token interceptor.
const playerHttp = axios.create({ baseURL: api.defaults.baseURL });

// ── Error normalisation ──────────────────────────────────────────────
class SignageError extends Error {
  constructor(code, message, details, status) {
    super(message || code);
    this.code = code || 'SERVER_ERROR';
    this.details = details || null;
    this.status = status || 0;
  }
}

function normaliseError(err) {
  if (err instanceof SignageError) return err;
  const status = err?.response?.status || 0;
  const body = err?.response?.data || {};
  const env = body?.error || {};
  return new SignageError(
    env.code || (status === 404 ? 'NOT_FOUND' : status === 401 ? 'UNAUTHENTICATED' : status === 403 ? 'FORBIDDEN' : 'SERVER_ERROR'),
    env.message || err?.message || 'Request failed',
    env.details || null,
    status,
  );
}

// Unwrap `{ data }` or `{ data, meta }`.
function unwrap(res) { return res?.data?.data ?? res?.data; }
function unwrapList(res) {
  const body = res?.data || {};
  return { data: body.data ?? [], meta: body.meta ?? null };
}

async function get(path, params)      { try { return unwrap(await api.get(`${BASE}${path}`, { params })); }     catch (e) { throw normaliseError(e); } }
async function getList(path, params)  { try { return unwrapList(await api.get(`${BASE}${path}`, { params })); } catch (e) { throw normaliseError(e); } }
async function post(path, body, opts) { try { return unwrap(await api.post(`${BASE}${path}`, body, opts)); }    catch (e) { throw normaliseError(e); } }
async function patch(path, body)      { try { return unwrap(await api.patch(`${BASE}${path}`, body)); }         catch (e) { throw normaliseError(e); } }
async function del(path, params)      { try { return unwrap(await api.delete(`${BASE}${path}`, { params })); }  catch (e) { throw normaliseError(e); } }

// ── Dashboard ────────────────────────────────────────────────────────
export const dashboard = () => get('/dashboard');

// ── Content-type catalog ─────────────────────────────────────────────
export const contentTypes = () => get('/content-types');

// ── Screens ──────────────────────────────────────────────────────────
export const Screens = {
  list:   (params)            => getList('/screens', params),
  get:    (id)                => get(`/screens/${id}`),
  create: (body)              => post('/screens', body),
  update: (id, body)          => patch(`/screens/${id}`, body),
  remove: (id)                => del(`/screens/${id}`),
  regeneratePairing: (id)     => post(`/screens/${id}/regenerate-pairing-code`),
  restart:           (id)     => post(`/screens/${id}/restart`),
  assignLoop:        (id, loopId) => post(`/screens/${id}/assign-loop`, { loop_id: loopId }),
  bulkAssignLoop:    (screen_ids, loopId) => post('/screens/bulk-assign-loop', { screen_ids, loop_id: loopId }),
};

// ── Loops + items ────────────────────────────────────────────────────
export const Loops = {
  list:      (params) => getList('/loops', params),
  get:       (id)     => get(`/loops/${id}`),
  create:    (body)   => post('/loops', body),
  update:    (id, b)  => patch(`/loops/${id}`, b),
  remove:    (id)     => del(`/loops/${id}`),
  duplicate: (id)     => post(`/loops/${id}/duplicate`),

  addItem:        (loopId, body)              => post(`/loops/${loopId}/items`, body),
  updateItem:     (loopId, itemId, body)      => patch(`/loops/${loopId}/items/${itemId}`, body),
  deleteItem:     (loopId, itemId)            => del(`/loops/${loopId}/items/${itemId}`),
  duplicateItem:  (loopId, itemId)            => post(`/loops/${loopId}/items/${itemId}/duplicate`),
  reorderItems:   (loopId, orderedIds)        => post(`/loops/${loopId}/items/reorder`, { ordered_ids: orderedIds }),
  bulkDuration:   (loopId, seconds)           => post(`/loops/${loopId}/items/bulk-duration`, { duration_seconds: seconds }),
};

// ── Schedules ────────────────────────────────────────────────────────
export const Schedules = {
  list:   (params) => getList('/schedules', params),
  get:    (id)     => get(`/schedules/${id}`),
  create: (body)   => post('/schedules', body),
  update: (id, b)  => patch(`/schedules/${id}`, b),
  remove: (id)     => del(`/schedules/${id}`),
};

// ── Alerts ───────────────────────────────────────────────────────────
export const Alerts = {
  list:      (params) => getList('/alerts', params),
  get:       (id)     => get(`/alerts/${id}`),
  create:    (body)   => post('/alerts', body),
  update:    (id, b)  => patch(`/alerts/${id}`, b),
  remove:    (id)     => del(`/alerts/${id}`),
  broadcast: (id)     => post(`/alerts/${id}/broadcast`),
  dismiss:   (id)     => post(`/alerts/${id}/dismiss`),
};

// ── Media ────────────────────────────────────────────────────────────
export const Media = {
  list:   (params) => getList('/media', params),
  get:    (id)     => get(`/media/${id}`),
  update: (id, b)  => patch(`/media/${id}`, b),
  remove: (id, opts = {}) => del(`/media/${id}`, opts.force ? { force: true } : undefined),

  // Uploads use multipart/form-data. Pass a File from <input type="file">.
  upload: (file, { location_id, name, tags } = {}) => {
    const fd = new FormData();
    fd.append('file', file);
    if (location_id != null) fd.append('location_id', String(location_id));
    if (name)                fd.append('name', name);
    if (Array.isArray(tags)) tags.forEach((t) => fd.append('tags[]', t));
    // Do NOT set Content-Type manually — browser sets the boundary.
    return post('/media', fd);
  },
};

// ── Player surface (kiosk) ───────────────────────────────────────────
// Auth is `Authorization: Bearer <screen_id>:<token_secret>` except /pair.
// Bearer is stored locally by the kiosk shell; pass it on every call here.
async function playerCall(method, path, { token, body, headers } = {}) {
  try {
    const h = { Accept: 'application/json', ...(headers || {}) };
    if (token) h.Authorization = `Bearer ${token}`;
    const res = await playerHttp.request({
      method, url: `${PLAYER_BASE}${path}`,
      data: body, headers: h,
      // Allow 304 through so ETag polling works
      validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
    });
    return res;
  } catch (e) { throw normaliseError(e); }
}

export const Player = {
  pair: async ({ screen_code, pairing_code }) => {
    const res = await playerCall('POST', '/pair', { body: { screen_code, pairing_code } });
    return res.data?.data ?? res.data;
  },
  unpair: async (token) => {
    await playerCall('POST', '/unpair', { token });
  },
  // ETag-aware. Pass the previous `config_version` in `ifNoneMatch`.
  // Returns `{ status, etag, data }` where status === 304 means "unchanged".
  fetchPayload: async ({ token, screen_code, ifNoneMatch } = {}) => {
    const headers = ifNoneMatch ? { 'If-None-Match': `"${ifNoneMatch}"` } : undefined;
    const res = await playerCall('GET', `/screens/${encodeURIComponent(screen_code)}`, { token, headers });
    const etag = (res.headers?.etag || res.headers?.ETag || '').replace(/(^"|"$)/g, '') || null;
    return {
      status: res.status,
      etag,
      data: res.status === 304 ? null : (res.data?.data ?? res.data),
    };
  },
  fetchLoop:   async ({ token, screen_code }) => {
    const res = await playerCall('GET', `/screens/${encodeURIComponent(screen_code)}/loop`, { token });
    return res.data?.data ?? res.data;
  },
  fetchAlerts: async ({ token, screen_code }) => {
    const res = await playerCall('GET', `/screens/${encodeURIComponent(screen_code)}/alerts`, { token });
    return res.data?.data ?? res.data;
  },
  heartbeat: async ({ token, screen_code, payload }) => {
    const res = await playerCall('POST', `/screens/${encodeURIComponent(screen_code)}/heartbeat`, { token, body: payload });
    return res.data?.data ?? res.data;
  },
};

export { SignageError };
