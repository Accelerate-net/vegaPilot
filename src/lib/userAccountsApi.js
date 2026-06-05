import { api } from './api';

const BASE = '/restricted/user-account';

function ensureOk(body) {
  if (body && body.success === false) {
    const err = body.error || {};
    const e = new Error(err.message || body.message || 'Request failed');
    e.code = err.code;
    e.fields = err.fields;
    e.envelope = body;
    throw e;
  }
  return body;
}

export async function listUsers(params = {}) {
  const { data } = await api.get(`${BASE}/list`, { params });
  return ensureOk(data);
}

/**
 * Create an admin user.
 * @param {{ name: string, email: string, mobile?: string|null, roleIds: number[], active?: boolean }} payload
 */
export async function createUser(payload) {
  const { data } = await api.post(BASE, payload);
  return ensureOk(data);
}

/**
 * Update an admin user. `roleIds` (if sent) REPLACES the user's full role set.
 * @param {number|string} id seq id
 * @param {{ name: string, email: string, mobile?: string|null, roleIds: number[], active?: boolean }} payload
 */
export async function updateUser(id, payload) {
  const { data } = await api.put(`${BASE}/${id}`, payload);
  return ensureOk(data);
}

export async function setUserActive(id, active) {
  const { data } = await api.put(`${BASE}/${id}/active`, { active });
  return ensureOk(data);
}

/**
 * Quick multi-role reassign without touching other fields. Replaces the set.
 * @param {number|string} id
 * @param {number[]} roleIds
 */
export async function assignUserRoles(id, roleIds) {
  const { data } = await api.put(`${BASE}/${id}/role`, { roleIds });
  return ensureOk(data);
}

export async function resetUserPassword(mobile) {
  const { data } = await api.put(`${BASE}/reset-password`, null, { params: { mobile } });
  return ensureOk(data);
}

export function extractApiError(err) {
  const body = err?.response?.data || err?.envelope;
  if (!body) return { message: err?.message || 'Request failed', fields: null, status: err?.response?.status };
  const message = body.error?.message || body.message || err.message || 'Request failed';
  const fields = body.error?.fields || null;
  return { message, fields, status: err?.response?.status };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^\+?[0-9\s-]{7,15}$/;

export function validateUser({ name, email, mobile, roleIds }) {
  const fields = {};
  if (!name || !name.trim()) fields.name = 'Name is required.';
  if (!email || !EMAIL_REGEX.test(email.trim())) fields.email = 'Valid email is required.';
  if (mobile && !MOBILE_REGEX.test(mobile.trim())) fields.mobile = 'Invalid mobile number.';
  if (!Array.isArray(roleIds) || roleIds.length === 0) {
    fields.roleIds = 'At least one role is required.';
  }
  return Object.keys(fields).length ? fields : null;
}
