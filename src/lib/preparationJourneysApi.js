// Thin HTTP layer for the Mobile App Settings → Preparation Journeys module.
// Reuses the project-wide axios instance (X-Access-Token + 401 handling),
// unwraps the `{ data }` / `{ data, meta }` envelope, and normalises errors so
// callers can switch on `err.code` (e.g. 'VALIDATION_ERROR', 'NOT_FOUND').
//
// Object shape (see API contract):
//   {
//     id, journey ('IAT'|'NEST'), year, nickName ('IISER'|'NISER'),
//     examDate (YYYY-MM-DD), datesUnsure (bool), status ('Active'|'Completed')
//   }
//
// `nickName` is derived server-side from `journey`; the client never sends it.
// `datesUnsure` is presentation-only (UI shows month+year instead of a full date).

import { api } from './api';

const BASE = '/restricted/mobile-app/preparation-journeys';

// ── Error normalisation ──────────────────────────────────────────────
class PreparationJourneyError extends Error {
  constructor(code, message, fields, status) {
    super(message || code);
    this.code = code || 'SERVER_ERROR';
    this.fields = fields || null;
    this.status = status || 0;
  }
}

function normaliseError(err) {
  if (err instanceof PreparationJourneyError) return err;
  const status = err?.response?.status || 0;
  const env = err?.response?.data?.error || {};
  return new PreparationJourneyError(
    env.code || (status === 404 ? 'NOT_FOUND' : status === 401 ? 'UNAUTHENTICATED' : status === 403 ? 'FORBIDDEN' : status === 400 ? 'VALIDATION_ERROR' : 'SERVER_ERROR'),
    env.message || err?.message || 'Request failed',
    env.fields || null,
    status,
  );
}

function unwrap(res) { return res?.data?.data ?? res?.data; }
function unwrapList(res) {
  const body = res?.data || {};
  return { data: body.data ?? (Array.isArray(body) ? body : []), meta: body.meta ?? null };
}

// Whitelist the writable fields the backend accepts (server owns id + nickName).
function toPayload(body = {}) {
  return {
    journey: body.journey,
    year: body.year,
    examDate: body.examDate,
    datesUnsure: !!body.datesUnsure,
    status: body.status,
  };
}

export const PreparationJourneys = {
  // status: 'active' | 'completed' | 'all'  (maps to the table filter)
  list: async (status = 'all') => {
    try {
      const params = status && status !== 'all' ? { status } : undefined;
      return unwrapList(await api.get(BASE, { params }));
    } catch (e) { throw normaliseError(e); }
  },
  get: async (id) => {
    try { return unwrap(await api.get(`${BASE}/${id}`)); }
    catch (e) { throw normaliseError(e); }
  },
  create: async (body) => {
    try { return unwrap(await api.post(BASE, toPayload(body))); }
    catch (e) { throw normaliseError(e); }
  },
  update: async (id, body) => {
    try { return unwrap(await api.put(`${BASE}/${id}`, toPayload(body))); }
    catch (e) { throw normaliseError(e); }
  },
  remove: async (id) => {
    try { return unwrap(await api.delete(`${BASE}/${id}`)); }
    catch (e) { throw normaliseError(e); }
  },
};

export { PreparationJourneyError };
