import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import ToastRegion from '../components/ToastRegion';
import { Can } from '../lib/userStore';
import { PERMS } from '../lib/permissions';
import { listMappings, createMapping, revokeMapping } from '../lib/attendanceMappingApi';
import { listCandidates } from '../lib/icardApi';
import LocationPicker from '../components/LocationPicker';

const PAGE_SIZE_OPTIONS = [20, 50, 100, 200];

const USER_TYPES = {
  1: 'Student',
  2: 'Instructor',
  3: 'Mentor',
  4: 'Staff',
};

const STATUSES = {
  0: 'Expired',
  1: 'Active',
  2: 'Revoked',
};

const STATUS_CLASS = {
  0: 'status-warning',
  1: 'status-active',
  2: 'status-danger',
};

// Unwrap the API error envelope: { success:false, error:{ code, message } }
function apiErrorMessage(error, fallback) {
  const body = error?.response?.data;
  return body?.error?.message || body?.message || error?.message || fallback;
}

function formatTimestamp(value) {
  if (!value) return '—';
  const num = Number(value);
  const d = Number.isFinite(num) && num > 0
    ? new Date(num < 1e11 ? num * 1000 : num)
    : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return `${date} ${time}`;
}

function getPageNumbers(currentPage, totalPages) {
  const out = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i += 1) out.push(i);
    return out;
  }
  if (currentPage <= 4) {
    out.push(1, 2, 3, 4, 5, '...', totalPages);
  } else if (currentPage >= totalPages - 3) {
    out.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
  } else {
    out.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
  }
  return out;
}

export default function AttendanceMappingPage() {
  const navigate = useNavigate();

  // Filters (search matches device key; filterBy maps to mapping status)
  const [searchQuery, setSearchQuery] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [filterBy, setFilterBy] = useState('');

  // Add mapping
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Data
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Lookups
  const [locations, setLocations] = useState([]);

  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  // Row kebab menu
  const [activeKebabId, setActiveKebabId] = useState(null);
  const kebabRef = useRef(null);

  function toggleKebab(id, event) {
    event.stopPropagation();
    setActiveKebabId((cur) => (cur === id ? null : id));
  }

  useEffect(() => {
    const handleClick = (event) => {
      if (kebabRef.current && !kebabRef.current.contains(event.target)) {
        setActiveKebabId(null);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const showToast = useCallback((type, title, message) => {
    const id = toastIdRef.current + 1;
    toastIdRef.current = id;
    setToasts((cur) => [...cur, { id, type, title, message }]);
    window.setTimeout(() => setToasts((cur) => cur.filter((t) => t.id !== id)), 4500);
  }, []);

  // ── Load locations ───────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await api.get('/restricted/locations');
        if (!cancelled) {
          const rows = resp.data?.data || resp.data?.locations || resp.data || [];
          setLocations(Array.isArray(rows) ? rows : []);
        }
      } catch (_e) { /* silent — locations endpoint optional */ }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Load mappings ────────────────────────────────────────────────────────
  const loadMappings = useCallback(async (signal = { cancelled: false }) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const resp = await listMappings({
        search: searchQuery.trim() || undefined,
        userType: userTypeFilter || undefined,
        filterBy: filterBy || undefined,
        page,
        size: pageSize,
      });
      if (signal.cancelled) return;

      const rows = resp?.data || [];
      const meta = resp?.pagination || {};
      setRecords(Array.isArray(rows) ? rows : []);
      const tot = Number(meta.total ?? (Array.isArray(rows) ? rows.length : 0));
      setTotal(tot);
      setTotalPages(Number(meta.lastPage ?? Math.max(1, Math.ceil(tot / pageSize))));
    } catch (error) {
      if (signal.cancelled) return;
      setRecords([]);
      setTotal(0);
      setTotalPages(1);
      const msg = apiErrorMessage(error, 'Failed to load attendance mappings.');
      setLoadError(msg);
      showToast('error', 'Network Error', msg);
    } finally {
      if (!signal.cancelled) setIsLoading(false);
    }
  }, [searchQuery, userTypeFilter, filterBy, page, pageSize, showToast]);

  useEffect(() => {
    const signal = { cancelled: false };
    const timer = setTimeout(() => loadMappings(signal), 250);
    return () => { signal.cancelled = true; clearTimeout(timer); };
  }, [loadMappings]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [searchQuery, userTypeFilter, filterBy, pageSize]);

  const safePage = Math.min(page, totalPages);
  const showingStart = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const showingEnd = Math.min(safePage * pageSize, total);

  const hasActiveFilters = !!searchQuery || !!userTypeFilter || !!filterBy;

  function clearFilters() {
    setSearchQuery('');
    setUserTypeFilter('');
    setFilterBy('');
  }

  function locationName(id) {
    const l = locations.find((x) => String(x.id ?? x.code) === String(id));
    return l?.name || l?.title || l?.code || id || '—';
  }

  async function handleAddSubmit(payload) {
    setSubmitting(true);
    try {
      await createMapping(payload);
      showToast('success', 'Mapping Added', `Key ${payload.key} mapped successfully.`);
      setShowAddModal(false);
      loadMappings();
    } catch (error) {
      const msg = apiErrorMessage(error, 'Failed to add mapping.');
      showToast('error', 'Failed to Add', msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(row) {
    setActiveKebabId(null);
    if (!window.confirm(`Revoke access for key ${row.key}?`)) return;
    try {
      await revokeMapping(row.id);
      showToast('success', 'Access Revoked', `Key ${row.key} revoked.`);
      loadMappings();
    } catch (error) {
      const msg = apiErrorMessage(error, 'Failed to revoke mapping.');
      showToast('error', 'Failed to Revoke', msg);
    }
  }

  return (
    <div className="quiz-attempt-report-page data-table-page attendance-mapping-page">
      <style>{`
        .attendance-mapping-page .am-table-scroll { overflow-x: auto; }
        .attendance-mapping-page .am-table-scroll .students-table { min-width: 1080px; }
      `}</style>
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((cur) => cur.filter((t) => t.id !== id))} />

      {/* ── Standard Page Header ── */}
      <div className="page-header-section">
        <div className="page-header-title-group">
          <span className="page-header-icon-box"><i className="fa fa-id-badge" /></span>
          <div>
            <h2>Attendance Mapping</h2>
            <p>Map attendance device keys to users at each location, with access validity windows.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="page-back-button" onClick={() => navigate('/offline-attendance')}>
            <i className="ti ti-angle-left" /> Back to Attendance
          </button>
          <Can permission={PERMS.ATTENDANCE_MAPPING_EDIT}>
            <button type="button" className="page-action-button" onClick={() => setShowAddModal(true)}>
              <i className="ti ti-plus" /> Add Mapping
            </button>
          </Can>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="filter-bar">
        <style>{`
          .am-combo { display:flex; align-items:stretch; flex:0 1 auto; width:380px; max-width:100%; min-height:40px; border:1px solid var(--line,#d7e5e8); border-radius:8px; background:#fff; overflow:hidden; transition:width .28s ease; }
          .am-combo.collapsed { width:auto; }
          .am-combo.collapsed .am-combo-select { border-right:none; border-radius:8px; padding-right:28px; }
          .am-combo-select { border:none; background:#f3f8f9; border-right:1px solid var(--line,#d7e5e8); padding:0 14px 0 12px; font-size:13px; font-weight:600; color:var(--ink,#16353c); cursor:pointer; outline:none; max-width:170px; }
          .am-combo-field { display:flex; flex:1; align-items:stretch; overflow:hidden; animation:amComboReveal .3s ease; }
          @keyframes amComboReveal { from { opacity:0; max-width:0; transform:translateX(-8px); } to { opacity:1; max-width:300px; transform:none; } }
          .am-combo-icon { display:flex; align-items:center; padding:0 12px; border:none; background:transparent; color:#94a3b8; }
          .am-combo-icon.clearable { cursor:pointer; color:#64748b; }
          .am-combo-input { flex:1; border:none; outline:none; padding:10px 12px; font-size:13px; color:var(--ink,#16353c); background:transparent; min-width:0; }
        `}</style>
        <div className={`am-combo${userTypeFilter ? '' : ' collapsed'}`}>
          <select className="am-combo-select" value={userTypeFilter} onChange={(e) => { const v = e.target.value; setUserTypeFilter(v); if (!v) setSearchQuery(''); }}>
            <option value="">All User Types</option>
            {Object.entries(USER_TYPES).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          {userTypeFilter && (
            <div className="am-combo-field">
              <input
                type="text"
                className="am-combo-input"
                placeholder="Search by device key..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="button"
                className={`am-combo-icon${searchQuery ? ' clearable' : ''}`}
                onClick={() => { if (searchQuery) setSearchQuery(''); }}
                tabIndex={searchQuery ? 0 : -1}
                aria-label={searchQuery ? 'Clear search' : 'Search'}
              >
                <i className={`ti ${searchQuery ? 'ti-close' : 'ti-search'}`} />
              </button>
            </div>
          )}
        </div>
        <select className="qar-select" style={{ maxWidth: 150 }} value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="revoked">Revoked</option>
        </select>
      </div>

      {/* ── Add Mapping Modal ── */}
      {showAddModal && (
        <AddMappingModal
          submitting={submitting}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddSubmit}
        />
      )}

      {/* ── Table ── */}
      {isLoading ? (
        <div className="students-table-container">
          <div className="am-table-scroll">
          <table className="students-table thead-loading">
            <thead>
              <tr>
                <th>Key</th>
                <th>User</th>
                <th>User Type</th>
                <th>Location</th>
                <th>Access Provided</th>
                <th>Access Expiry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }, (_, i) => (
                <tr key={`sk-${i}`}>
                  {Array.from({ length: 8 }, (_, j) => (
                    <td key={j}><div className="table-skeleton medium" /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      ) : records.length > 0 ? (
        <div className="students-table-container">
          <div className="am-table-scroll">
          <table className="students-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>User</th>
                <th>User Type</th>
                <th>Location</th>
                <th>Access Provided</th>
                <th>Access Expiry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody ref={kebabRef}>
              {records.map((r, idx) => {
                const statusKey = Number(r.status);
                return (
                  <tr key={r.id ?? `${r.key ?? 'row'}-${idx}`} className={activeKebabId === r.id ? 'row-active-menu' : ''}>
                    <td><strong>{r.key ?? '—'}</strong></td>
                    <td>
                      <div className="qar-user-cell">
                        <strong>{r.userName || '—'}</strong>
                        {r.userId != null && <span className="qar-user-id">ID: {r.userId}</span>}
                      </div>
                    </td>
                    <td>{r.userTypeLabel || USER_TYPES[Number(r.userType)] || '—'}</td>
                    <td>{r.locationName || r.location || locationName(r.locationId)}</td>
                    <td className="qar-datetime">{formatTimestamp(r.accessProvidedAt)}</td>
                    <td className="qar-datetime">{formatTimestamp(r.accessExpiryAt)}</td>
                    <td>
                      <span className={`status-pill ${STATUS_CLASS[statusKey] || ''}`}>
                        {r.statusLabel || STATUSES[statusKey] || '—'}
                      </span>
                    </td>
                    <td className={`center-align ${activeKebabId === r.id ? 'cell-active-menu' : ''}`}>
                      <Can permission={PERMS.ATTENDANCE_MAPPING_EDIT}>
                        {statusKey === 1 ? (
                          <div className="kebab-menu-container">
                            <button type="button" className="kebab-button" onClick={(event) => toggleKebab(r.id, event)}>
                              <i className="ti ti-more-alt" />
                            </button>
                            <div className={`kebab-dropdown ${activeKebabId === r.id ? 'active' : ''}`}>
                              <button type="button" className="kebab-dropdown-item delete-action" onClick={() => handleRevoke(r)}>
                                <i className="ti ti-ban" />
                                <span className="item-label">Revoke</span>
                              </button>
                            </div>
                          </div>
                        ) : '—'}
                      </Can>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>

          <div className="pagination-container">
            <div className="pagination-info">
              <span>Showing {showingStart} to {showingEnd} of {total} entries</span>
              <select className="page-size-select" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>Show {s}</option>)}
              </select>
            </div>
            <div className="pagination-controls">
              <button type="button" className="pagination-btn" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <i className="ti ti-angle-left" /> Previous
              </button>
              {getPageNumbers(safePage, totalPages).map((p, idx) => (
                p === '...' ? (
                  <span key={`el-${idx}`} className="pagination-ellipsis">...</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    className={`pagination-btn${safePage === p ? ' active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                )
              ))}
              <button type="button" className="pagination-btn" disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                Next <i className="ti ti-angle-right" />
              </button>
            </div>
          </div>
        </div>
      ) : loadError ? (
        <div className="qar-empty-state">
          <i className="ti ti-alert" />
          <h4>Unable to load mappings</h4>
          <p>{loadError}</p>
          <button type="button" className="qar-btn-export" style={{ marginTop: 12 }} onClick={() => loadMappings()}>
            <i className="ti ti-reload" /> Retry
          </button>
        </div>
      ) : (
        <div className="qar-empty-state">
          <i className="ti ti-id-badge" />
          <h4>No Mappings Found</h4>
          {hasActiveFilters
            ? <p>Try adjusting your filters.</p>
            : <p>No attendance device keys have been mapped yet.</p>}
        </div>
      )}
    </div>
  );
}

// ── Add mapping: key + user picker + type + location + validity window ────────
function AddMappingModal({ submitting, onClose, onSubmit }) {
  const [key, setKey] = useState('');
  const [userType, setUserType] = useState('1');
  const [locationId, setLocationId] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [accessExpiryAt, setAccessExpiryAt] = useState('');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Debounced user search (only meaningful for student lookups)
  useEffect(() => {
    if (selected) return undefined;
    const q = query.trim();
    if (q.length < 2) { setResults([]); setOpen(false); return undefined; }
    let cancelled = false;
    setSearching(true);
    setOpen(true);
    const t = setTimeout(async () => {
      try {
        const resp = await listCandidates({ page: 1, size: 20, searchKey: q });
        if (cancelled) return;
        const rows = resp?.data || [];
        setResults(Array.isArray(rows) ? rows : []);
      } catch (_e) {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query, selected]);

  function pick(c) {
    // The mapping API expects an integer userId — that's the numeric `id`,
    // not the UUID `candidateKey` used for display elsewhere.
    setSelected({
      userId: c.id,
      displayId: c.candidateKey || c.id,
      name: c.name || 'Unknown',
    });
    setOpen(false);
    setResults([]);
  }

  const toEpoch = (val) => (val ? new Date(val).getTime() : undefined);
  const numericUserId = Number(selected?.userId);
  const hasNumericUser = Number.isInteger(numericUserId);
  const canSubmit = !!key.trim() && hasNumericUser && !!locationId && !!accessExpiryAt && !submitting;

  function submit() {
    onSubmit({
      key: key.trim(),
      userId: numericUserId,
      userType: Number(userType),
      locationId: Number(locationId),
      accessExpiryAt: toEpoch(accessExpiryAt),
    });
  }

  return (
    <div
      className="crispr-modal-backdrop active"
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="crispr-modal-dialog" style={{ maxWidth: 560 }} role="dialog" aria-modal="true">
        <div className="crispr-modal-header">
          <h3><i className="ti ti-plus" /> Add Attendance Mapping</h3>
          <button type="button" className="crispr-modal-close" onClick={onClose}>
            <i className="ti ti-close" />
          </button>
        </div>
        <div className="crispr-modal-body">
          <div className="qar-modal-grid">
            {/* Device key */}
            <div className="qar-filter-field">
              <label className="qar-filter-label"><i className="ti ti-key" /> Device Key</label>
              <input
                type="text"
                className="qar-input"
                placeholder="e.g. 10001"
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
            </div>

            {/* User type */}
            <div className="qar-filter-field">
              <label className="qar-filter-label"><i className="ti ti-users" /> User Type</label>
              <select className="qar-select" value={userType} onChange={(e) => setUserType(e.target.value)}>
                {Object.entries(USER_TYPES).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* User picker */}
          <div className="qar-filter-field" style={{ position: 'relative', margin: '18px 0' }}>
            <label className="qar-filter-label"><i className="ti ti-user" /> User</label>
            {selected ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 12px', border: '1px solid #d7e1e7', borderRadius: 6, background: '#f8f9fa' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#2c3e50' }}>{selected.name}</div>
                  <div style={{ fontSize: 12, color: '#6c757d' }}>User ID: {selected.userId}</div>
                </div>
                <button type="button" className="qar-clear-btn" onClick={() => { setSelected(null); setQuery(''); }}>Change</button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  className="qar-input"
                  placeholder="Search by name, mobile or ID…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => { if (results.length) setOpen(true); }}
                />
                {open && query.trim().length >= 2 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 5, background: '#fff', border: '1px solid #d7e1e7', borderRadius: 6, marginTop: 4, maxHeight: 240, overflowY: 'auto', boxShadow: '0 8px 20px rgba(0,0,0,0.12)' }}>
                    {searching ? (
                      <div style={{ padding: '12px 14px', color: '#6c757d', fontSize: 13 }}>Searching…</div>
                    ) : results.length === 0 ? (
                      <div style={{ padding: '12px 14px', color: '#6c757d', fontSize: 13 }}>No users found.</div>
                    ) : results.map((c) => {
                      const id = c.candidateKey || c.id;
                      const mobile = c.mobile || c.registeredMobile || c.communicationMobile || '';
                      return (
                        <button
                          type="button"
                          key={id}
                          onClick={() => pick(c)}
                          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', borderBottom: '1px solid #f1f3f5', background: '#fff', cursor: 'pointer' }}
                        >
                          <div style={{ fontWeight: 600, color: '#2c3e50', fontSize: 14 }}>{c.name || 'Unknown'}</div>
                          <div style={{ fontSize: 12, color: '#6c757d' }}>ID: {id}{mobile ? ` · ${mobile}` : ''}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="qar-modal-grid">
            {/* Location */}
            <div className="qar-filter-field">
              <label className="qar-filter-label"><i className="ti ti-location-pin" /> Location *</label>
              <LocationPicker
                value={locationId || null}
                initialLabel={locationLabel}
                placeholder="Search & select a location…"
                onChange={(sel) => {
                  setLocationId(sel ? sel.id : '');
                  setLocationLabel(sel ? sel.name : '');
                }}
              />
            </div>

            {/* Access expiry */}
            <div className="qar-filter-field">
              <label className="qar-filter-label"><i className="ti ti-calendar-off" /> Access Expiry *</label>
              <input
                type="datetime-local"
                className="qar-input"
                value={accessExpiryAt}
                onChange={(e) => setAccessExpiryAt(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="crispr-modal-footer">
          <button type="button" className="btn btn-default" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn btn-success"
            disabled={!canSubmit}
            style={!canSubmit ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
            onClick={submit}
          >
            <i className="ti ti-check" /> {submitting ? 'Saving…' : 'Add Mapping'}
          </button>
        </div>
      </div>
    </div>
  );
}
