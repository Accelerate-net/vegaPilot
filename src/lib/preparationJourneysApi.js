// Thin HTTP layer for the Mobile App Settings → Preparation Journeys module.
// Reuses the project-wide axios instance (X-Access-Token + 401 handling),
// unwraps the `{ data }` / `{ data, pagination }` envelope, and normalises
// errors so callers can switch on `err.code` (e.g. 'validation_error',
// 'PREPARATION_JOURNEY_NOT_FOUND').
//
// Object shape (see API contract):
//   {
//     id (integer), journey ('IAT'|'NEST'), year, nickName ('IISER'|'NISER'),
//     examDate (YYYY-MM-DD), datesUnsure (bool), status ('Active'|'Completed')
//   }
//
// `nickName` is derived server-side from `journey`; the client never sends it.
// `datesUnsure` is presentation-only (UI shows month+year instead of a full date).
//
// Routes (mounted under the axios baseURL's `/api`):
//   GET    /restricted/preparation-journey/list?status&page&size   (preparationJourney.view)
//   POST   /restricted/preparation-journey/add                     (preparationJourney.edit)
//   PUT    /restricted/preparation-journey/{id}                    (preparationJourney.edit)
//   DELETE /restricted/preparation-journey/{id}                    (preparationJourney.edit)

import { api } from './api';

const BASE = '/restricted/preparation-journey';

// ── Error normalisation ──────────────────────────────────────────────
class PreparationJourneyError extends Error {
  constructor(code, message, fields, status) {
    super(message || code);
    this.code = code || 'SERVER_ERROR';
    this.fields = fields || null;
    this.status = status || 0;
  }
}

function statusToCode(status) {
  if (status === 404) return 'PREPARATION_JOURNEY_NOT_FOUND';
  if (status === 401) return 'UNAUTHENTICATED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 422) return 'validation_error';
  return 'SERVER_ERROR';
}

function normaliseError(err) {
  if (err instanceof PreparationJourneyError) return err;
  const status = err?.response?.status || 0;
  const env = err?.response?.data?.error || {};
  return new PreparationJourneyError(
    env.code || statusToCode(status),
    env.message || err?.message || 'Request failed',
    env.fields || null,
    status,
  );
}

// Guard against 2xx responses that still carry `{ success: false }`.
function ensureOk(res) {
  const body = res?.data;
  if (body && body.success === false) {
    const env = body.error || {};
    throw new PreparationJourneyError(
      env.code || statusToCode(res?.status || 0),
      env.message || 'Request failed',
      env.fields || null,
      res?.status || 0,
    );
  }
  return body;
}

function unwrap(res) {
  const body = ensureOk(res);
  return body?.data ?? body;
}

function unwrapList(res) {
  const body = ensureOk(res) || {};
  return {
    data: body.data ?? (Array.isArray(body) ? body : []),
    pagination: body.pagination ?? null,
  };
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
  // Sorted by examDate ascending; pagination via { page, size } (size 1–100).
  list: async (status = 'all', { page, size } = {}) => {
    try {
      const params = {};
      if (status && status !== 'all') params.status = status;
      if (page != null) params.page = page;
      if (size != null) params.size = size;
      return unwrapList(await api.get(`${BASE}/list`, {
        params: Object.keys(params).length ? params : undefined,
      }));
    } catch (e) { throw normaliseError(e); }
  },
  create: async (body) => {
    try { return unwrap(await api.post(`${BASE}/add`, toPayload(body))); }
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
