import { api } from './api';

const BASE = '/restricted/asset';

export const ASSET_TYPES = {
  1: 'Devices',
  2: 'Furnitures',
  3: 'Academic Materials',
  4: 'Electricals',
  5: 'Miscellaneous',
};

export const ASSET_TYPE_OPTIONS = Object.entries(ASSET_TYPES).map(([value, label]) => ({
  value: Number(value),
  label,
}));

export const ASSET_STATUS = {
  1: 'Active',
  0: 'Inactive',
};

function clean(params) {
  const out = {};
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    out[k] = v;
  });
  return out;
}

export async function addAsset(payload) {
  const { data } = await api.post(`${BASE}/add`, payload);
  return data;
}

export async function updateAsset(payload) {
  const { data } = await api.post(`${BASE}/update`, payload);
  return data;
}

export async function listAssets({
  id,
  page = 1,
  size = 20,
  timestampFrom,
  timestampTo,
  filterBy = 'all',
  locationId,
  type,
  sortBy = 'createdAt',
  sortOrder = 'DESC',
} = {}) {
  const { data } = await api.get(`${BASE}/list`, {
    params: clean({ id, page, size, timestampFrom, timestampTo, filterBy, locationId, type, sortBy, sortOrder }),
  });
  return data;
}

export async function uploadInvoice(id, file) {
  const form = new FormData();
  form.append('id', String(id));
  form.append('invoice', file);
  const { data } = await api.post(`${BASE}/upload-invoice`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function removeInvoice(id) {
  const { data } = await api.post(`${BASE}/remove-invoice`, { id });
  return data;
}

export async function getAsset(id) {
  const { data } = await api.get(`${BASE}/list`, { params: { id } });
  return data;
}
