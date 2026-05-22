import { api } from './api';

const BASE = '/restricted/icard';

function clean(params) {
  const out = {};
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    out[key] = value;
  });
  return out;
}

export async function listIcardAudit({ page = 1, size = 20, searchKey } = {}) {
  const { data } = await api.get(`${BASE}/audit/list`, {
    params: clean({ page, size, searchKey }),
  });
  return data;
}

// Record one audit row per student card.  `entries` is
// `[{ candidateId, candidateName, type, templatePath }, ...]`.
// The backend stamps `printedAt` and `admin` from the request context.
export async function recordIcardAudit(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return null;
  const { data } = await api.post(`${BASE}/audit/record`, { entries });
  return data;
}

export async function getCandidateProfile(id) {
  const { data } = await api.get('/restricted/people/candidate/profile', { params: { id } });
  return data;
}

export async function generateIcards({ batchIds, candidateIds }) {
  const { data } = await api.post(`${BASE}/generate`, clean({ batchIds, candidateIds }));
  return data;
}

export async function listBatches({ page = 1, size = 200, searchKey } = {}) {
  const { data } = await api.get('/restricted/enrollment/list-batches', {
    params: clean({ page, size, sortBy: 'name', sortOrder: 'ASC', searchKey }),
  });
  return data;
}

export async function listCandidates({ page = 1, size = 50, searchKey } = {}) {
  const { data } = await api.get('/restricted/people/candidate/list', {
    params: clean({ page, size, sortBy: 'name', searchKey }),
  });
  return data;
}

export async function listCandidatesInBatches(batchIds) {
  const ids = Array.isArray(batchIds) ? batchIds.filter(Boolean) : [];
  if (ids.length === 0) return { data: [] };
  const { data } = await api.get('/restricted/enrollment/list-candidates-in-batches', {
    params: { batchIds: ids.join(',') },
  });
  return data;
}
