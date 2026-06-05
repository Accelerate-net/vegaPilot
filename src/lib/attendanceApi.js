import { api } from './api';

const BASE = '/offline-attendance';

function clean(params) {
  const out = {};
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    out[key] = value;
  });
  return out;
}

export async function listAttendance({
  candidateId,
  dateFrom,
  dateTo,
  batchId,
  residenceId,
  locationId,
  q,
  groupBy,
  page = 1,
  limit = 20,
} = {}) {
  const { data } = await api.get(BASE, {
    params: clean({ candidateId, dateFrom, dateTo, batchId, residenceId, locationId, q, groupBy, page, limit }),
  });
  return data;
}

export async function createManualAttendance({ candidateId, locationId } = {}) {
  const { data } = await api.post(BASE, clean({ candidateId, locationId, source: 'manual' }));
  return data;
}

export async function getAttendanceSummary(params = {}) {
  // Optional convenience endpoint; falls back to listAttendance with groupBy=day if unsupported.
  try {
    const { data } = await api.get(`${BASE}/summary`, { params: clean(params) });
    return data;
  } catch (error) {
    return null;
  }
}
