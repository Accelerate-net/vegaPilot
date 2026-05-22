import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ToastRegion from '../components/ToastRegion';
import { listRoles, SUPER_ADMIN } from '../lib/rbacApi';
import { useUser, getCachedUser } from '../lib/userStore';
import {
  listUsers,
  createUser,
  updateUser,
  setUserActive,
  assignUserRole,
  resetUserPassword,
  extractApiError,
  validateUser,
} from '../lib/userAccountsApi';

function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getPageNumbers(currentPage, totalPages) {
  const pages = [];
  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  if (endPage - startPage < maxPagesToShow - 1) startPage = Math.max(1, endPage - maxPagesToShow + 1);
  for (let page = startPage; page <= endPage; page += 1) pages.push(page);
  return pages;
}

function formatLastLogin(value) {
  if (!value) return 'Never';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Never';
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return d.toLocaleDateString();
}

const DEMO_USERS = [
  { id: 'u-1', name: 'Aarav Nair', email: 'aarav.nair@example.com', mobile: '+91 9000000001', roleId: 2, roleName: 'ADMIN', roleLabel: 'Admin', active: true, lastLogin: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: 'u-2', name: 'Diya Joseph', email: 'diya.joseph@example.com', mobile: '+91 9000000002', roleId: 3, roleName: 'MENTOR', roleLabel: 'Mentor', active: true, lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
  { id: 'u-3', name: 'Sneha Menon', email: 'sneha.menon@example.com', mobile: '+91 9000000003', roleId: 2, roleName: 'ADMIN', roleLabel: 'Admin', active: false, lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString() },
  { id: 'u-4', name: 'Rahul Patel', email: 'rahul.patel@example.com', mobile: '+91 9000000004', roleId: 4, roleName: 'INSTRUCTOR', roleLabel: 'Instructor', active: true, lastLogin: null },
  { id: 'u-5', name: 'Ananya Iyer', email: 'ananya.iyer@example.com', mobile: '+91 9000000005', roleId: 1, roleName: SUPER_ADMIN, roleLabel: 'Super Admin', active: true, lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() },
];

function normalizeUser(u, roleLookup) {
  const roleId = u.roleId ?? u.role_id ?? u.role?.id ?? null;
  const fromLookup = roleId != null ? roleLookup.get(roleId) : null;
  const roleName = u.roleName ?? u.role?.key ?? fromLookup?.name ?? '';
  const roleLabel = u.roleLabel ?? u.role?.label ?? fromLookup?.label ?? roleName;
  return {
    id: u.id,
    name: u.name || '',
    email: u.email || '',
    mobile: u.mobile || u.phone || '',
    roleId,
    roleName,
    roleLabel,
    active: u.active ?? (u.status === 1 || u.status === 'active'),
    lastLogin: u.lastLogin || u.last_login || null,
  };
}

export default function UserAccountsPage() {
  const navigate = useNavigate();
  const ctx = useUser();
  const selfEmail = ((ctx?.user || getCachedUser())?.email || '').trim().toLowerCase();
  const isSelf = (user) => !!selfEmail && (user.email || '').trim().toLowerCase() === selfEmail;

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRoleId, setFilterRoleId] = useState('');
  const [sortColumn, setSortColumn] = useState('name');
  const [sortReverse, setSortReverse] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [savingUser, setSavingUser] = useState(false);

  const [activeKebabId, setActiveKebabId] = useState(null);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const kebabRef = useRef(null);
  const filterRef = useRef(null);

  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  const showToast = useCallback((type, title, message) => {
    const id = ++toastIdRef.current;
    setToasts((cur) => [...cur, { id, type, title, message }]);
    window.setTimeout(() => {
      setToasts((cur) => cur.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const roleLookup = useMemo(() => {
    const map = new Map();
    roles.forEach((r) => map.set(r.id, { name: r.name, label: r.label || r.name }));
    return map;
  }, [roles]);

  // Load roles once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await listRoles();
        if (cancelled) return;
        const rs = (resp?.data || [])
          .map((r) => ({ id: r?.id, name: r?.key, label: r?.label || r?.key }))
          .filter((r) => r.id != null && r.name);
        setRoles(rs);
      } catch (err) {
        if (cancelled) return;
        // Demo roles fallback
        setRoles([
          { id: 1, name: SUPER_ADMIN, label: 'Super Admin' },
          { id: 2, name: 'ADMIN', label: 'Admin' },
          { id: 3, name: 'MENTOR', label: 'Mentor' },
          { id: 4, name: 'INSTRUCTOR', label: 'Instructor' },
        ]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const loadUsers = useCallback(async (isCancelled = { current: false }) => {
    setIsLoading(true);
    try {
      const resp = await listUsers({
        page: currentPage,
        size: pageSize,
        sortBy: sortColumn,
        sortOrder: sortReverse ? 'DESC' : 'ASC',
        searchKey: searchQuery.trim() || undefined,
        roleId: filterRoleId || undefined,
      });
      if (resp?.success !== false) {
        const rows = (resp.data || []).map((u) => normalizeUser(u, roleLookup));
        if (!isCancelled.current) {
          setUsers(rows);
          setTotalUsers(resp.meta?.total ?? rows.length);
          setTotalPages(resp.meta?.totalPages ?? 1);
          setIsDemoMode(false);
        }
        return;
      }
      throw new Error(resp?.message || 'Failed to load users');
    } catch (error) {
      if (isCancelled.current) return;
      const info = extractApiError(error);
      if (info.status === 401) {
        navigate('/login', { replace: true });
        return;
      }
      // Only fall back to demo data when the API is genuinely unreachable
      // (no HTTP response). Real API errors are surfaced to the user.
      const networkOnly = !error?.response;
      if (!networkOnly) {
        setUsers([]);
        setTotalUsers(0);
        setTotalPages(1);
        setIsDemoMode(false);
        showToast('error', 'Could not load users', info.message);
        return;
      }
      let rows = DEMO_USERS.map((u) => normalizeUser(u, roleLookup));
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        rows = rows.filter((u) =>
          [u.name, u.email, u.mobile, u.roleLabel].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
        );
      }
      if (filterRoleId) {
        rows = rows.filter((u) => String(u.roleId) === String(filterRoleId));
      }
      rows.sort((a, b) => {
        let av = a[sortColumn];
        let bv = b[sortColumn];
        if (sortColumn === 'lastLogin') {
          av = av ? new Date(av).getTime() : 0;
          bv = bv ? new Date(bv).getTime() : 0;
        } else {
          av = (av || '').toString().toLowerCase();
          bv = (bv || '').toString().toLowerCase();
        }
        if (av < bv) return sortReverse ? 1 : -1;
        if (av > bv) return sortReverse ? -1 : 1;
        return 0;
      });
      const total = rows.length;
      const pages = Math.max(1, Math.ceil(total / pageSize));
      const page = Math.min(currentPage, pages);
      const start = (page - 1) * pageSize;
      if (!isCancelled.current) {
        setUsers(rows.slice(start, start + pageSize));
        setTotalUsers(total);
        setTotalPages(pages);
        setCurrentPage(page);
        setIsDemoMode(true);
      }
    } finally {
      if (!isCancelled.current) setIsLoading(false);
    }
  }, [currentPage, pageSize, sortColumn, sortReverse, searchQuery, filterRoleId, roleLookup, navigate]);

  useEffect(() => {
    const isCancelled = { current: false };
    loadUsers(isCancelled);
    return () => { isCancelled.current = true; };
  }, [loadUsers]);

  useEffect(() => {
    const handleClick = (event) => {
      if (kebabRef.current && !kebabRef.current.contains(event.target)) setActiveKebabId(null);
      if (filterRef.current && !filterRef.current.contains(event.target)) setRoleMenuOpen(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageNumbers = useMemo(() => getPageNumbers(safeCurrentPage, totalPages), [safeCurrentPage, totalPages]);

  function sortIcon(column) {
    if (sortColumn !== column) return 'ti-arrows-vertical';
    return sortReverse ? 'ti-arrow-down' : 'ti-arrow-up';
  }

  function handleSort(column) {
    if (sortColumn === column) {
      setSortReverse((value) => !value);
    } else {
      setSortColumn(column);
      setSortReverse(false);
    }
  }

  function toggleKebab(userId, event) {
    event.stopPropagation();
    setActiveKebabId((current) => (current === userId ? null : userId));
  }

  function openCreateModal() {
    setEditMode(false);
    setCurrentUser({ name: '', email: '', mobile: '', roleId: '', active: true });
    setFormErrors({});
    setEditModalOpen(true);
  }

  function openEditModal(user) {
    setEditMode(true);
    setCurrentUser({
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      roleId: user.roleId || '',
      _originalRoleId: user.roleId || '',
      active: user.active,
    });
    setFormErrors({});
    setEditModalOpen(true);
    setActiveKebabId(null);
  }

  async function saveUser() {
    if (!currentUser) return;
    const errs = validateUser(currentUser) || {};
    if (!currentUser.roleId) errs.roleId = 'Role is required.';
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    // Defensive: never let a user change their own role.
    if (editMode && isSelf(currentUser) && currentUser._originalRoleId != null
        && String(currentUser.roleId) !== String(currentUser._originalRoleId)) {
      setFormErrors({ roleId: 'You cannot change your own role.' });
      return;
    }
    setSavingUser(true);
    const payload = {
      name: currentUser.name.trim(),
      email: currentUser.email.trim(),
      mobile: currentUser.mobile?.trim() || null,
      roleId: currentUser.roleId,
      active: !!currentUser.active,
    };
    try {
      if (editMode && currentUser.id) {
        await updateUser(currentUser.id, payload);
        showToast('success', 'User updated', `${payload.name} updated successfully.`);
      } else {
        await createUser(payload);
        showToast('success', 'User created', `${payload.name} created successfully.`);
      }
      setEditModalOpen(false);
      setCurrentUser(null);
      loadUsers();
    } catch (err) {
      const info = extractApiError(err);
      if (info.status === 401) { navigate('/login', { replace: true }); return; }
      if (info.fields) setFormErrors(info.fields);
      showToast('error', editMode ? 'Update failed' : 'Create failed', info.message);
    } finally {
      setSavingUser(false);
    }
  }

  async function resetPassword(user) {
    setActiveKebabId(null);
    if (isSelf(user)) {
      showToast('error', 'Not allowed', 'You cannot reset your own password from here. Use Change Password instead.');
      return;
    }
    if (!user.mobile) {
      showToast('error', 'Cannot reset password', 'This user has no mobile number on file.');
      return;
    }
    try {
      await resetUserPassword(user.mobile);
      showToast('success', 'Password reset', `Password reset link sent to ${user.name}.`);
    } catch (err) {
      const info = extractApiError(err);
      if (info.status === 401) { navigate('/login', { replace: true }); return; }
      showToast('error', 'Reset failed', info.message);
    }
  }

  async function toggleUserActive(user) {
    if (isSelf(user)) {
      setActiveKebabId(null);
      showToast('error', 'Not allowed', 'You cannot disable your own account.');
      return;
    }
    const nextActive = !user.active;
    // Optimistic update
    setUsers((cur) => cur.map((u) => (u.id === user.id ? { ...u, active: nextActive } : u)));
    setActiveKebabId(null);
    try {
      await setUserActive(user.id, nextActive);
      showToast('success', nextActive ? 'User enabled' : 'User disabled', `${user.name} ${nextActive ? 'enabled' : 'disabled'}.`);
    } catch (err) {
      // Revert
      setUsers((cur) => cur.map((u) => (u.id === user.id ? { ...u, active: user.active } : u)));
      const info = extractApiError(err);
      if (info.status === 401) { navigate('/login', { replace: true }); return; }
      showToast('error', 'Toggle failed', info.message);
    }
  }

  const startIndex = totalUsers === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(safeCurrentPage * pageSize, totalUsers);
  const selectedRoleLabel = filterRoleId
    ? (roles.find((r) => String(r.id) === String(filterRoleId))?.label || 'All Roles')
    : 'All Roles';

  return (
    <section className="user-accounts-page mentor-profiles-page">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((cur) => cur.filter((t) => t.id !== id))} />

      <div className="page-header-section">
        <div>
          <h2>User Accounts</h2>
          <p>Create user profiles, assign roles, and enable or disable access.</p>
        </div>
        <button type="button" className="create-mentor-button" onClick={openCreateModal}>
          <i className="ti ti-plus" /> New User
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-wrapper">
          <i className={`ti ${searchQuery ? 'ti-close' : 'ti-search'}`} onClick={() => setSearchQuery('')} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, email, mobile, or role..."
            value={searchQuery}
            onChange={(event) => { setSearchQuery(event.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="filter-dropdown" ref={filterRef}>
          <button type="button" className="filter-dropdown-btn" onClick={() => setRoleMenuOpen((v) => !v)}>
            {selectedRoleLabel}
            <i className="ti ti-angle-down" />
          </button>
          <div className={`mentor-filter-menu ${roleMenuOpen ? 'active' : ''}`}>
            <button type="button" onClick={() => { setFilterRoleId(''); setCurrentPage(1); setRoleMenuOpen(false); }}>
              All Roles
            </button>
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => { setFilterRoleId(r.id); setCurrentPage(1); setRoleMenuOpen(false); }}
              >
                {r.label || r.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {(users.length > 0 || isLoading) && (
        <div className="students-table-container">
          <table className="students-table">
            <thead>
              <tr>
                <th className={`sortable ${sortColumn === 'name' ? 'active' : ''}`} onClick={() => handleSort('name')}>
                  Name <i className={`sort-icon ti ${sortIcon('name')}`} />
                </th>
                <th>Mobile</th>
                <th className={`sortable ${sortColumn === 'email' ? 'active' : ''}`} onClick={() => handleSort('email')}>
                  Email <i className={`sort-icon ti ${sortIcon('email')}`} />
                </th>
                <th className={`sortable ${sortColumn === 'roleLabel' ? 'active' : ''}`} onClick={() => handleSort('roleLabel')}>
                  Role <i className={`sort-icon ti ${sortIcon('roleLabel')}`} />
                </th>
                <th className={`sortable ${sortColumn === 'lastLogin' ? 'active' : ''}`} onClick={() => handleSort('lastLogin')}>
                  Last Login <i className={`sort-icon ti ${sortIcon('lastLogin')}`} />
                </th>
                <th className="centered-cell">Status</th>
                <th className="actions-column" />
              </tr>
            </thead>
            {isLoading ? (
              <tbody>
                {Array.from({ length: pageSize }, (_, index) => (
                  <tr key={`user-skel-${index}`}>
                    <td>
                      <div className="mentor-skeleton-profile">
                        <div className="mentor-skeleton avatar" />
                        <div className="mentor-skeleton medium" />
                      </div>
                    </td>
                    <td><div className="mentor-skeleton medium" /></td>
                    <td><div className="mentor-skeleton long" /></td>
                    <td><div className="mentor-skeleton short" /></td>
                    <td><div className="mentor-skeleton short" /></td>
                    <td><div className="mentor-skeleton short" /></td>
                    <td />
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody ref={kebabRef}>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="profile-cell">
                        <div className="avatar-placeholder">{getInitials(user.name)}</div>
                        <div>
                          <div className="profile-name">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td>{user.mobile || <span style={{ color: '#9ca3af' }}>—</span>}</td>
                    <td className="mentor-small-copy">{user.email}</td>
                    <td>
                      <span className="subject-badge">{user.roleLabel || user.roleName || '—'}</span>
                    </td>
                    <td className="mentor-small-copy">{formatLastLogin(user.lastLogin)}</td>
                    <td className="centered-cell">
                      <label
                        className="ua-toggle"
                        title={isSelf(user) ? 'You cannot disable your own account' : (user.active ? 'Disable user' : 'Enable user')}
                        onClick={(e) => e.stopPropagation()}
                        style={isSelf(user) ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                      >
                        <input
                          type="checkbox"
                          checked={!!user.active}
                          disabled={isSelf(user)}
                          onChange={() => toggleUserActive(user)}
                        />
                        <span className="ua-toggle-slider" />
                      </label>
                    </td>
                    <td className="mentor-actions-cell">
                      <div className="kebab-menu-container">
                        <button type="button" className="kebab-button" onClick={(event) => toggleKebab(user.id, event)}>
                          <i className="ti ti-more-alt" />
                        </button>
                        <div className={`kebab-dropdown ${activeKebabId === user.id ? 'active' : ''}`}>
                          <button type="button" className="kebab-dropdown-item edit-action" onClick={() => openEditModal(user)}>
                            <i className="ti ti-pencil" />
                            <span>Edit User</span>
                          </button>
                          {user.active && !isSelf(user) && (
                            <button type="button" className="kebab-dropdown-item" onClick={() => resetPassword(user)}>
                              <i className="ti ti-key" />
                              <span>Reset Password</span>
                            </button>
                          )}
                          {!isSelf(user) && (
                            <button type="button" className="kebab-dropdown-item" onClick={() => toggleUserActive(user)}>
                              <i className={`ti ${user.active ? 'ti-na' : 'ti-check'}`} />
                              <span>{user.active ? 'Disable' : 'Enable'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>

          <div className="pagination-container">
            <div className="pagination-info">
              <span>Showing {startIndex} to {endIndex} of {totalUsers} users</span>
              <select
                className="page-size-select"
                value={pageSize}
                onChange={(event) => { setPageSize(Number(event.target.value)); setCurrentPage(1); }}
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>Show {size}</option>
                ))}
              </select>
            </div>
            <div className="pagination-controls">
              <button type="button" className="pagination-btn" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safeCurrentPage === 1}>
                <i className="ti ti-angle-left" /> Previous
              </button>
              {pageNumbers.map((page) => (
                <button key={page} type="button" className={`pagination-btn ${page === safeCurrentPage ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>
                  {page}
                </button>
              ))}
              <button type="button" className="pagination-btn" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safeCurrentPage === totalPages}>
                Next <i className="ti ti-angle-right" />
              </button>
            </div>
          </div>
        </div>
      )}

      {!isLoading && totalUsers === 0 ? (
        <div className="mentors-table-container">
          <div className="empty-state">
            <i className="ti ti-user" />
            <h3>No Users Found</h3>
            <p>{searchQuery || filterRoleId ? 'No users match your search criteria.' : 'Get started by adding your first user.'}</p>
          </div>
        </div>
      ) : null}

      {/* Create/Edit Modal */}
      <div className={`mentor-edit-modal ${editModalOpen ? 'active' : ''}`} onClick={() => setEditModalOpen(false)}>
        <div className="mentor-edit-dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <div className="mentor-edit-header">
            <h3><i className="ti ti-user" /> {editMode ? 'Edit User' : 'Add New User'}</h3>
            <button type="button" className="mentor-edit-close" onClick={() => setEditModalOpen(false)}>
              <i className="ti ti-close" />
            </button>
          </div>
          <div className="mentor-edit-body">
            <div className="mentor-form-section">
              <div className="mentor-form-title">Profile</div>
              <div className="mentor-form-group">
                <label>Name <span className="required">*</span></label>
                <input
                  type="text"
                  className="mentor-form-input"
                  value={currentUser?.name || ''}
                  onChange={(e) => setCurrentUser((cur) => ({ ...cur, name: e.target.value }))}
                />
                {formErrors.name && <div className="ua-form-error">{formErrors.name}</div>}
              </div>
              <div className="mentor-form-row">
                <div className="mentor-form-group">
                  <label>Email <span className="required">*</span></label>
                  <input
                    type="email"
                    className="mentor-form-input"
                    value={currentUser?.email || ''}
                    onChange={(e) => setCurrentUser((cur) => ({ ...cur, email: e.target.value }))}
                  />
                  {formErrors.email && <div className="ua-form-error">{formErrors.email}</div>}
                </div>
                <div className="mentor-form-group">
                  <label>Mobile</label>
                  <input
                    type="tel"
                    className="mentor-form-input"
                    value={currentUser?.mobile || ''}
                    onChange={(e) => setCurrentUser((cur) => ({ ...cur, mobile: e.target.value }))}
                  />
                  {formErrors.mobile && <div className="ua-form-error">{formErrors.mobile}</div>}
                </div>
              </div>
            </div>
            <div className="mentor-form-section">
              <div className="mentor-form-title">Access</div>
              <div className="mentor-form-group">
                <label>Role <span className="required">*</span></label>
                <select
                  className="mentor-form-input"
                  value={currentUser?.roleId || ''}
                  disabled={editMode && currentUser ? isSelf(currentUser) : false}
                  onChange={(e) => setCurrentUser((cur) => ({ ...cur, roleId: e.target.value }))}
                >
                  <option value="">Select a role…</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.label || r.name}</option>
                  ))}
                </select>
                {editMode && currentUser && isSelf(currentUser) && (
                  <div className="ua-form-hint">You cannot change your own role.</div>
                )}
                {formErrors.roleId && <div className="ua-form-error">{formErrors.roleId}</div>}
              </div>
              <div className="mentor-form-group">
                <label className="ua-inline-toggle">
                  <span>Account enabled</span>
                  <span
                    className="ua-toggle"
                    style={editMode && currentUser && isSelf(currentUser) ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                  >
                    <input
                      type="checkbox"
                      checked={!!currentUser?.active}
                      disabled={editMode && currentUser ? isSelf(currentUser) : false}
                      onChange={(e) => setCurrentUser((cur) => ({ ...cur, active: e.target.checked }))}
                    />
                    <span className="ua-toggle-slider" />
                  </span>
                </label>
                {editMode && currentUser && isSelf(currentUser) && (
                  <div className="ua-form-hint">You cannot disable your own account.</div>
                )}
              </div>
            </div>
          </div>
          <div className="mentor-edit-footer">
            <button type="button" className="legacy-btn legacy-btn-default" onClick={() => setEditModalOpen(false)} disabled={savingUser}>
              Cancel
            </button>
            <button type="button" className="legacy-btn legacy-btn-success" onClick={saveUser} disabled={savingUser}>
              <i className="ti ti-check" /> {savingUser ? 'Saving…' : (editMode ? 'Update' : 'Create')} User
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .ua-toggle {
          position: relative;
          display: inline-block;
          width: 38px;
          height: 22px;
          cursor: pointer;
          vertical-align: middle;
        }
        .ua-toggle input { opacity: 0; width: 0; height: 0; }
        .ua-toggle-slider {
          position: absolute; inset: 0;
          background: #cbd5e1;
          border-radius: 999px;
          transition: background .15s ease;
        }
        .ua-toggle-slider::before {
          content: '';
          position: absolute;
          height: 16px; width: 16px;
          left: 3px; top: 3px;
          background: white;
          border-radius: 50%;
          transition: transform .15s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,.15);
        }
        .ua-toggle input:checked + .ua-toggle-slider { background: #16a34a; }
        .ua-toggle input:checked + .ua-toggle-slider::before { transform: translateX(16px); }
        .ua-inline-toggle {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px;
        }
        .ua-form-error {
          color: #b91c1c; font-size: 12px; margin-top: 4px;
        }
        .ua-form-hint {
          color: #6b7280; font-size: 12px; margin-top: 4px;
        }
      `}</style>
    </section>
  );
}
