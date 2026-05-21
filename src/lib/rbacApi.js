import { api } from './api';

const BASE = '/restricted/rbac';

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

export async function fetchMe() {
  const { data } = await api.get('/restricted/admin-auth/me');
  return ensureOk(data);
}

export async function listPermissions() {
  const { data } = await api.get(`${BASE}/permissions`);
  return ensureOk(data);
}

export async function listRoles() {
  const { data } = await api.get(`${BASE}/roles`);
  return ensureOk(data);
}

export async function getRole(id) {
  const { data } = await api.get(`${BASE}/roles/${id}`);
  return ensureOk(data);
}

export async function createRole({ name, permissions }) {
  const { data } = await api.post(`${BASE}/roles`, { name, permissions: permissions || [] });
  return ensureOk(data);
}

export async function renameRole(id, name) {
  const { data } = await api.put(`${BASE}/roles/${id}`, { name });
  return ensureOk(data);
}

export async function syncRolePermissions(id, permissions) {
  const { data } = await api.put(`${BASE}/roles/${id}/permissions`, { permissions });
  return ensureOk(data);
}

// ── Helpers ────────────────────────────────────────────────────────────────
export const SUPER_ADMIN = 'SUPER_ADMIN';

export const ROLE_NAME_REGEX = /^[A-Z0-9_]+$/;
export const ROLE_NAME_MAX = 125;

export function validateRoleName(name) {
  if (!name) return 'Name is required.';
  if (name.length > ROLE_NAME_MAX) return `Name must be at most ${ROLE_NAME_MAX} characters.`;
  if (!ROLE_NAME_REGEX.test(name)) return 'Use uppercase letters, digits, and underscores only.';
  return null;
}

const ACTION_ORDER = ['view', 'create', 'edit', 'manage', 'delete', 'export'];

export function groupPermissions(permissionNames) {
  const groups = new Map();
  for (const name of permissionNames) {
    if (typeof name !== 'string' || !name) continue;
    const dot = name.indexOf('.');
    const module = dot === -1 ? name : name.slice(0, dot);
    const action = dot === -1 ? '' : name.slice(dot + 1);
    if (!groups.has(module)) groups.set(module, []);
    groups.get(module).push({ name, action });
  }
  const sorted = Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([module, items]) => ({
      module,
      items: items.sort((a, b) => {
        const ai = ACTION_ORDER.indexOf(a.action);
        const bi = ACTION_ORDER.indexOf(b.action);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return a.action.localeCompare(b.action);
      }),
    }));
  return sorted;
}

export function extractApiError(err) {
  const body = err?.response?.data || err?.envelope;
  if (!body) return { message: err?.message || 'Request failed', fields: null, status: err?.response?.status };
  const message = body.error?.message || body.message || err.message || 'Request failed';
  const fields = body.error?.fields || null;
  return { message, fields, status: err?.response?.status };
}
