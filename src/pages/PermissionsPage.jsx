import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ToastRegion from '../components/ToastRegion';
import {
  SUPER_ADMIN,
  createRole,
  extractApiError,
  getRole,
  listPermissions,
  listRoles,
  syncRolePermissions,
  validateRoleName,
} from '../lib/rbacApi';

const STANDARD_ACTIONS = ['view', 'edit', 'delete'];

const thStyle = {
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0.3,
  padding: '10px 12px',
  borderBottom: '1px solid #e5e7eb',
  // Pin the header row when the table body scrolls.
  position: 'sticky',
  top: 0,
  background: '#f9fafb',
  color: '#374151',
  zIndex: 1,
};

const tdStyle = {
  padding: '12px',
  verticalAlign: 'middle',
  borderBottom: '1px solid #e5e7eb',
};

// Format a backend page key (e.g. "courseAuthoring.instructor") into a human
// label ("Course Authoring → Instructor"). Falls back to the raw string.
function formatPageLabel(page) {
  if (!page) return '';
  return page
    .split('.')
    .map((seg) =>
      seg
        // camelCase → "camel Case"
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        // capitalize first letter
        .replace(/^./, (c) => c.toUpperCase())
    )
    .join(' → ');
}

// Capitalize a single action label.
function formatActionLabel(action) {
  if (!action) return '';
  return action.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
}

// Group full permission objects by `page`. Within each page, split actions
// into the standard buckets (view/edit/delete) plus a "custom" bucket for
// everything else (export, freeze, refund, …).
function groupByPage(permissions) {
  const byPage = new Map();
  for (const p of permissions) {
    if (!p?.page || !p?.key) continue;
    if (!byPage.has(p.page)) byPage.set(p.page, []);
    byPage.get(p.page).push(p);
  }
  return Array.from(byPage.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([page, items]) => {
      const standard = {};
      const custom = [];
      for (const it of items) {
        if (STANDARD_ACTIONS.includes(it.action)) standard[it.action] = it;
        else custom.push(it);
      }
      custom.sort((a, b) => (a.action || '').localeCompare(b.action || ''));
      return { page, items, standard, custom };
    });
}

export default function PermissionsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [draft, setDraft] = useState(null); // Set<string> of permission names — null when no role selected
  const [savedDraft, setSavedDraft] = useState(null); // baseline to compare dirtiness
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bootError, setBootError] = useState('');

  // ── Toast helper ────────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  const showToast = useCallback((type, title, message) => {
    const id = ++toastIdRef.current;
    setToasts((cur) => [...cur, { id, type, title, message }]);
    window.setTimeout(() => {
      setToasts((cur) => cur.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  // ── Initial load ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [permsResp, rolesResp] = await Promise.all([listPermissions(), listRoles()]);
        if (cancelled) return;
        const perms = (permsResp?.data || []).filter(
          (p) => p && typeof p.key === 'string' && p.key.length > 0
        );
        const rs = (rolesResp?.data || [])
          .map((r) => ({
            id: r?.id,
            name: r?.key,           // backend's `key` is the role identifier (SUPER_ADMIN, ADMIN, ...)
            label: r?.label,        // human-readable label for the sidebar
            badgeColor: r?.badge_color,
            isSystem: !!r?.is_system,
            permissionCount: typeof r?.permissionCount === 'number' ? r.permissionCount : null,
            permissions: [],        // list endpoint doesn't include these — fetched lazily on select
          }))
          .filter((r) => r.id != null && typeof r.name === 'string' && r.name.length > 0);
        setPermissions(perms);
        setRoles(rs);
        // Auto-select first non-SUPER_ADMIN role if any, else SUPER_ADMIN.
        const firstEditable = rs.find((r) => r.name !== SUPER_ADMIN) || rs[0];
        if (firstEditable) selectRole(firstEditable.id, rs);
      } catch (err) {
        if (cancelled) return;
        const info = extractApiError(err);
        if (info.status === 401) {
          navigate('/login', { replace: true });
          return;
        }
        setBootError(info.message);
        showToast('error', 'Could not load permissions', info.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) || null,
    [roles, selectedRoleId]
  );

  const isReadOnly = selectedRole?.name === SUPER_ADMIN;

  const dirty = useMemo(() => {
    if (!draft || !savedDraft) return false;
    if (draft.size !== savedDraft.size) return true;
    for (const p of draft) if (!savedDraft.has(p)) return true;
    return false;
  }, [draft, savedDraft]);

  // ── Unsaved-changes guard on tab close / navigation ────────────────
  useEffect(() => {
    if (!dirty) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // Track location changes to warn before route change (best-effort)
  const lastPathRef = useRef(location.pathname);
  useEffect(() => {
    lastPathRef.current = location.pathname;
  }, [location.pathname]);

  // ── Role selection ──────────────────────────────────────────────────
  // Extract a role's assigned permission keys from whatever shape the API uses
  // for the per-role response. Tolerates strings or objects.
  function extractRolePermissionKeys(roleObj) {
    const list = roleObj?.permissions || roleObj?.permissionKeys || [];
    if (!Array.isArray(list)) return [];
    return list
      .map((p) => (typeof p === 'string' ? p : (p?.key ?? p?.name)))
      .filter((k) => typeof k === 'string' && k.length > 0);
  }

  async function selectRole(id, rolesOverride) {
    const list = rolesOverride || roles;
    const role = list.find((r) => r.id === id);
    if (!role) return;

    // Show the row as selected immediately; fetch its permissions lazily
    // since the list endpoint only returns a count.
    setSelectedRoleId(id);
    const known = Array.isArray(role.permissions) ? role.permissions : [];
    setDraft(new Set(known));
    setSavedDraft(new Set(known));

    try {
      const resp = await getRole(id);
      const keys = extractRolePermissionKeys(resp?.data);
      setRoles((cur) => cur.map((r) => (r.id === id ? { ...r, permissions: keys } : r)));
      setDraft(new Set(keys));
      setSavedDraft(new Set(keys));
    } catch (err) {
      const info = extractApiError(err);
      if (info.status === 401) {
        navigate('/login', { replace: true });
        return;
      }
      showToast('error', 'Could not load role', info.message);
    }
  }

  function handleSelectRole(id) {
    if (id === selectedRoleId) return;
    if (dirty) {
      const ok = window.confirm('You have unsaved changes. Discard them?');
      if (!ok) return;
    }
    selectRole(id);
  }

  // ── Toggle helpers ──────────────────────────────────────────────────
  function togglePermission(name) {
    if (isReadOnly) return;
    setDraft((cur) => {
      const next = new Set(cur);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function discardChanges() {
    if (!savedDraft) return;
    setDraft(new Set(savedDraft));
  }

  async function saveChanges() {
    if (!selectedRole || isReadOnly || saving) return;
    setSaving(true);
    try {
      const list = Array.from(draft);
      await syncRolePermissions(selectedRole.id, list);
      // Refresh role from server so we display the canonical set.
      const fresh = await getRole(selectedRole.id);
      const d = fresh?.data || {};
      const keys = extractRolePermissionKeys(d);
      const patch = {
        name: d.key || selectedRole.name,
        label: d.label || selectedRole.label,
        badgeColor: d.badge_color ?? selectedRole.badgeColor,
        isSystem: typeof d.is_system === 'boolean' ? d.is_system : selectedRole.isSystem,
        permissionCount: keys.length,
        permissions: keys,
      };
      setRoles((cur) => cur.map((r) => (r.id === selectedRole.id ? { ...r, ...patch } : r)));
      const nextSet = new Set(keys);
      setDraft(nextSet);
      setSavedDraft(new Set(nextSet));
      showToast('success', 'Saved', `${patch.label || patch.name} permissions updated.`);
    } catch (err) {
      const info = extractApiError(err);
      if (info.status === 401) {
        navigate('/login', { replace: true });
        return;
      }
      showToast('error', 'Could not save', info.message);
    } finally {
      setSaving(false);
    }
  }

  // ── New role modal ──────────────────────────────────────────────────
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCopyFromId, setNewCopyFromId] = useState('');
  const [newNameError, setNewNameError] = useState('');
  const [newSubmitting, setNewSubmitting] = useState(false);

  function openNewModal() {
    setNewName('');
    setNewCopyFromId('');
    setNewNameError('');
    setShowNewModal(true);
  }

  function closeNewModal() {
    if (newSubmitting) return;
    setShowNewModal(false);
  }

  // Esc to close modal + focus trap-ish (autofocus on input)
  const newNameInputRef = useRef(null);
  useEffect(() => {
    if (!showNewModal) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') closeNewModal();
    }
    document.addEventListener('keydown', onKey);
    window.setTimeout(() => newNameInputRef.current?.focus(), 0);
    return () => document.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNewModal]);

  async function submitNewRole(e) {
    if (e) e.preventDefault();
    const name = newName.trim().toUpperCase();
    const err = validateRoleName(name);
    if (err) {
      setNewNameError(err);
      return;
    }
    setNewSubmitting(true);
    setNewNameError('');
    try {
      let seedPermissions = [];
      if (newCopyFromId) {
        const source = roles.find((r) => String(r.id) === String(newCopyFromId));
        if (source) seedPermissions = source.permissions || [];
      }
      const created = await createRole({ name, permissions: seedPermissions });
      const c = created?.data || {};
      const newRole = {
        id: c.id,
        name: c.key || name,
        label: c.label || name,
        badgeColor: c.badge_color,
        isSystem: !!c.is_system,
        permissionCount: seedPermissions.length,
        permissions: seedPermissions,
      };
      const nextRoles = [...roles, newRole];
      setRoles(nextRoles);
      setShowNewModal(false);
      selectRole(newRole.id, nextRoles);
      showToast('success', 'Role created', `${newRole.label} is ready.`);
    } catch (err2) {
      const info = extractApiError(err2);
      if (info.fields?.name?.length) {
        setNewNameError(info.fields.name[0]);
      } else {
        setNewNameError(info.message);
      }
    } finally {
      setNewSubmitting(false);
    }
  }

  // ── Render data prep ────────────────────────────────────────────────
  const groups = useMemo(() => groupByPage(permissions), [permissions]);

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="permissions-page" style={{ padding: 24 }}>
      <div
        className="page-header-section"
        style={{
          background: 'white',
          padding: '20px 24px',
          borderRadius: 18,
          border: '1px solid var(--line)',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="fa fa-shield" /> Roles &amp; permissions
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted, #6b7280)', fontSize: 13 }}>
            Manage what each role can do. Changes apply immediately on save.
          </p>
        </div>
        <button type="button" className="legacy-btn legacy-btn-success" onClick={openNewModal}>
          <i className="fa fa-plus" /> New role
        </button>
      </div>

      {bootError && !loading ? (
        <div
          style={{
            padding: 16,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            borderRadius: 12,
          }}
        >
          {bootError}
        </div>
      ) : null}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted, #6b7280)' }}>
          <i className="fa fa-spinner fa-spin" /> Loading roles and permissions…
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '280px 1fr',
            gap: 20,
            alignItems: 'start',
          }}
        >
          {/* Roles sidebar */}
          <nav
            aria-label="Roles"
            style={{
              background: 'white',
              border: '1px solid var(--line)',
              borderRadius: 16,
              padding: 8,
              position: 'sticky',
              top: 16,
            }}
          >
            {roles.length === 0 && (
              <div style={{ padding: 16, color: 'var(--muted, #6b7280)', fontSize: 13 }}>
                No roles found.
              </div>
            )}
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {roles.map((r) => {
                const active = r.id === selectedRoleId;
                const isSuper = r.name === SUPER_ADMIN;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectRole(r.id)}
                      aria-current={active ? 'true' : undefined}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid transparent',
                        background: active ? '#eef2ff' : 'transparent',
                        color: active ? '#3730a3' : 'inherit',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        marginBottom: 2,
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span
                          style={{
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {r.label || r.name}
                        </span>
                        {isSuper && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: '2px 6px',
                              borderRadius: 999,
                              background: '#ede9fe',
                              color: '#5b21b6',
                              fontWeight: 600,
                              letterSpacing: 0.2,
                            }}
                          >
                            system
                          </span>
                        )}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: active ? '#3730a3' : 'var(--muted, #6b7280)',
                          background: active ? '#e0e7ff' : '#f3f4f6',
                          padding: '2px 8px',
                          borderRadius: 999,
                        }}
                      >
                        {Array.isArray(r.permissions) && r.permissions.length > 0
                          ? r.permissions.length
                          : (r.permissionCount ?? 0)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Matrix */}
          <section
            style={{
              background: 'white',
              border: '1px solid var(--line)',
              borderRadius: 16,
              minHeight: 320,
              position: 'relative',
            }}
          >
            {selectedRole ? (
              <>
                <div
                  style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid var(--line)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: 18 }}>
                    {selectedRole.label || selectedRole.name} — {draft?.size || 0} permissions
                  </h3>
                  {isReadOnly && (
                    <span style={{ fontSize: 12, color: '#5b21b6', fontWeight: 600 }}>
                      System role — read only
                    </span>
                  )}
                </div>

                <div style={{ padding: '12px 24px 96px' }}>
                  {groups.length === 0 && (
                    <p style={{ color: 'var(--muted, #6b7280)', padding: '16px 0' }}>
                      No permissions have been seeded yet.
                    </p>
                  )}
                  {groups.length > 0 && (
                    <div
                      style={{
                        maxHeight: 'calc(100vh - 280px)',
                        overflowY: 'auto',
                        border: '1px solid #f3f4f6',
                        borderRadius: 12,
                      }}
                    >
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'separate',
                        borderSpacing: 0,
                        fontSize: 13,
                      }}
                    >
                      <thead>
                        <tr style={{ textAlign: 'left', color: 'var(--muted, #6b7280)' }}>
                          <th style={thStyle}>Name</th>
                          <th style={{ ...thStyle, width: 70, textAlign: 'center' }}>View</th>
                          <th style={{ ...thStyle, width: 70, textAlign: 'center' }}>Edit</th>
                          <th style={{ ...thStyle, width: 70, textAlign: 'center' }}>Delete</th>
                          <th style={{ ...thStyle, minWidth: 240 }}>Custom</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groups.map((g) => {
                          return (
                            <tr key={g.page}>
                              <td style={tdStyle}>
                                <span style={{ fontWeight: 600, color: '#111827' }}>
                                  {formatPageLabel(g.page)}
                                </span>
                              </td>
                              {STANDARD_ACTIONS.map((action) => {
                                const perm = g.standard[action];
                                return (
                                  <td key={action} style={{ ...tdStyle, textAlign: 'center' }}>
                                    {perm ? (
                                      <input
                                        type="checkbox"
                                        aria-label={`${perm.label || perm.key}`}
                                        title={perm.key}
                                        checked={draft?.has(perm.key) || false}
                                        disabled={isReadOnly}
                                        onChange={() => togglePermission(perm.key)}
                                      />
                                    ) : (
                                      <span style={{ color: '#cbd5e1' }}>—</span>
                                    )}
                                  </td>
                                );
                              })}
                              <td style={tdStyle}>
                                {g.custom.length === 0 ? (
                                  <span style={{ color: '#cbd5e1' }}>—</span>
                                ) : (
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexWrap: 'wrap',
                                      gap: 6,
                                    }}
                                  >
                                    {g.custom.map((perm) => {
                                      const id = `perm-${perm.key.replace(/\./g, '-')}`;
                                      const checked = draft?.has(perm.key) || false;
                                      return (
                                        <label
                                          key={perm.key}
                                          htmlFor={id}
                                          title={perm.key}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            lineHeight: 1,
                                            cursor: isReadOnly ? 'default' : 'pointer',
                                          }}
                                        >
                                          <input
                                            id={id}
                                            type="checkbox"
                                            checked={checked}
                                            disabled={isReadOnly}
                                            onChange={() => togglePermission(perm.key)}
                                            style={{ margin: 0, verticalAlign: 'middle' }}
                                          />
                                          <span style={{ lineHeight: 1, display: 'inline-block' }}>
                                            {formatActionLabel(perm.action) || perm.key}
                                          </span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    </div>
                  )}
                </div>

                {!isReadOnly && (
                  <div
                    style={{
                      position: 'sticky',
                      bottom: 0,
                      background: 'white',
                      borderTop: '1px solid var(--line)',
                      padding: '12px 24px',
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 8,
                      borderBottomLeftRadius: 16,
                      borderBottomRightRadius: 16,
                    }}
                  >
                    <button
                      type="button"
                      className="legacy-btn legacy-btn-default"
                      onClick={discardChanges}
                      disabled={!dirty || saving}
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      className="legacy-btn legacy-btn-success"
                      onClick={saveChanges}
                      disabled={!dirty || saving}
                    >
                      {saving ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted, #6b7280)' }}>
                Select a role from the left to manage its permissions.
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── New role modal ───────────────────────────────────────────── */}
      <div
        className={`legacy-modal-backdrop ${showNewModal ? 'active' : ''}`}
        onClick={closeNewModal}
      >
        <div
          className="legacy-modal-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-role-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="legacy-modal-header">
            <h3 id="new-role-title"><i className="fa fa-plus" /> New role</h3>
            <button
              type="button"
              className="legacy-modal-close"
              onClick={closeNewModal}
              aria-label="Close"
              disabled={newSubmitting}
            >
              <i className="fa fa-times" />
            </button>
          </div>
          <form onSubmit={submitNewRole}>
            <div className="legacy-modal-body">
              <div style={{ marginBottom: 14 }}>
                <label htmlFor="new-role-name" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
                  Role name
                </label>
                <input
                  ref={newNameInputRef}
                  id="new-role-name"
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value.toUpperCase());
                    setNewNameError('');
                  }}
                  placeholder="e.g. AUDITOR"
                  maxLength={125}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--line, #d1d5db)',
                    fontFamily: 'inherit',
                  }}
                  disabled={newSubmitting}
                />
                <div style={{ fontSize: 12, color: 'var(--muted, #6b7280)', marginTop: 4 }}>
                  Uppercase letters, digits, and underscores only.
                </div>
                {newNameError && (
                  <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 6 }}>{newNameError}</div>
                )}
              </div>

              <div>
                <label htmlFor="new-role-copy" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
                  Copy permissions from <span style={{ color: 'var(--muted, #6b7280)', fontWeight: 400 }}>(optional)</span>
                </label>
                <select
                  id="new-role-copy"
                  value={newCopyFromId}
                  onChange={(e) => setNewCopyFromId(e.target.value)}
                  disabled={newSubmitting}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--line, #d1d5db)',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="">Start empty</option>
                  {roles
                    .filter((r) => r.name !== SUPER_ADMIN)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label || r.name} ({(r.permissions && r.permissions.length) || r.permissionCount || 0})
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="legacy-modal-footer">
              <button
                type="button"
                className="legacy-btn legacy-btn-default"
                onClick={closeNewModal}
                disabled={newSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="legacy-btn legacy-btn-success"
                disabled={newSubmitting}
              >
                {newSubmitting ? 'Creating…' : 'Create role'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ToastRegion
        toasts={toasts}
        onDismiss={(id) => setToasts((cur) => cur.filter((t) => t.id !== id))}
      />
    </div>
  );
}
