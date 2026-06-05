import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';
import ToastRegion from '../components/ToastRegion';
import { Can } from '../lib/userStore';
import { PERMS } from '../lib/permissions';
import { listAttendance, createManualAttendance } from '../lib/attendanceApi';
import { listResidences } from '../lib/residencesApi';
import { listCandidates } from '../lib/icardApi';

const PAGE_SIZE_OPTIONS = [20, 50, 100, 200];

function todayISODate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTimestamp(value) {
  if (!value) return '—';
  const num = Number(value);
  const d = Number.isFinite(num) && num > 0
    ? new Date(num < 1e11 ? num * 1000 : num)
    : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `${date} ${time}`;
}

function formatDateOnly(value) {
  if (!value) return '—';
  const num = Number(value);
  const d = Number.isFinite(num) && num > 0
    ? new Date(num < 1e11 ? num * 1000 : num)
    : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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

function toCSV(rows, columns) {
  const escape = (val) => {
    if (val == null) return '';
    const s = String(val);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = columns.map((c) => escape(c.label)).join(',');
  const body = rows.map((r) => columns.map((c) => escape(c.value(r))).join(',')).join('\n');
  return `${header}\n${body}`;
}

function downloadCSV(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function OfflineAttendancePage() {
  const today = todayISODate();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [batchId, setBatchId] = useState('');
  const [residenceId, setResidenceId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Manual attendance entry
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // Pagination / sort
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortColumn, setSortColumn] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');

  // Data
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Lookups
  const [batches, setBatches] = useState([]);
  const [residences, setResidences] = useState([]);
  const [locations, setLocations] = useState([]);

  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const showToast = useCallback((type, title, message) => {
    const id = toastIdRef.current + 1;
    toastIdRef.current = id;
    setToasts((cur) => [...cur, { id, type, title, message }]);
    window.setTimeout(() => setToasts((cur) => cur.filter((t) => t.id !== id)), 4500);
  }, []);

  // ── Load lookups (batches, residences, locations) ───────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await api.get('/restricted/enrollment/list-batches', {
          params: { page: 1, size: 200, sortBy: 'name', sortOrder: 'ASC' },
        });
        if (!cancelled && resp.data?.status === 'success') {
          setBatches(resp.data.data || []);
        }
      } catch (_e) { /* silent */ }

      try {
        const r = await listResidences({ activeOnly: 1, perPage: 200, page: 1 });
        if (!cancelled) {
          const rows = r?.data || r?.residences || r || [];
          setResidences(Array.isArray(rows) ? rows : []);
        }
      } catch (_e) { /* silent */ }

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

  // ── Load attendance ─────────────────────────────────────────────────────
  const loadAttendance = useCallback(async (signal = { cancelled: false }) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const resp = await listAttendance({
        candidateId: /^\d+$/.test(searchQuery.trim()) ? searchQuery.trim() : undefined,
        q: !/^\d+$/.test(searchQuery.trim()) ? (searchQuery.trim() || undefined) : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        batchId: batchId || undefined,
        residenceId: residenceId || undefined,
        locationId: locationId || undefined,
        source: sourceFilter || undefined,
        page,
        limit: pageSize,
      });
      if (signal.cancelled) return;

      const rows = resp?.data || resp?.records || resp?.attendance || resp?.items || resp || [];
      const meta = resp?.meta || resp?.pagination || {};
      setRecords(Array.isArray(rows) ? rows : []);
      const tot = Number(meta.total ?? (Array.isArray(rows) ? rows.length : 0));
      setTotal(tot);
      setTotalPages(Number(meta.totalPages ?? Math.max(1, Math.ceil(tot / pageSize))));
    } catch (error) {
      if (signal.cancelled) return;
      setRecords([]);
      setTotal(0);
      setTotalPages(1);
      const msg = error?.response?.data?.message || error.message || 'Failed to load attendance.';
      setLoadError(msg);
      showToast('error', 'Network Error', msg);
    } finally {
      if (!signal.cancelled) setIsLoading(false);
    }
  }, [searchQuery, dateFrom, dateTo, batchId, residenceId, locationId, sourceFilter, page, pageSize, showToast]);

  useEffect(() => {
    const signal = { cancelled: false };
    const timer = setTimeout(() => loadAttendance(signal), 250);
    return () => { signal.cancelled = true; clearTimeout(timer); };
  }, [loadAttendance]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [searchQuery, dateFrom, dateTo, batchId, residenceId, locationId, sourceFilter, pageSize]);

  const safePage = Math.min(page, totalPages);
  const showingStart = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const showingEnd = Math.min(safePage * pageSize, total);

  const hasActiveFilters = useMemo(() => (
    !!searchQuery || (dateFrom && dateFrom !== today) || (dateTo && dateTo !== today)
      || !!batchId || !!residenceId || !!locationId || !!sourceFilter
  ), [searchQuery, dateFrom, dateTo, today, batchId, residenceId, locationId, sourceFilter]);

  // Filters that live inside the modal (everything except the inline search box)
  const modalFilterCount = useMemo(() => (
    (dateFrom && dateFrom !== today ? 1 : 0)
      + (dateTo && dateTo !== today ? 1 : 0)
      + (batchId ? 1 : 0)
      + (residenceId ? 1 : 0)
      + (locationId ? 1 : 0)
      + (sourceFilter ? 1 : 0)
  ), [dateFrom, dateTo, today, batchId, residenceId, locationId, sourceFilter]);
  const hasModalFilters = modalFilterCount > 0;

  function clearFilters() {
    setSearchQuery('');
    setDateFrom(today);
    setDateTo(today);
    setBatchId('');
    setResidenceId('');
    setLocationId('');
    setSourceFilter('');
  }

  function applyPreset(preset) {
    const d = new Date();
    if (preset === 'today') {
      setDateFrom(today); setDateTo(today);
    } else if (preset === 'yesterday') {
      const y = new Date(d); y.setDate(d.getDate() - 1);
      const v = y.toISOString().slice(0, 10);
      setDateFrom(v); setDateTo(v);
    } else if (preset === '7d') {
      const start = new Date(d); start.setDate(d.getDate() - 6);
      setDateFrom(start.toISOString().slice(0, 10)); setDateTo(today);
    } else if (preset === '30d') {
      const start = new Date(d); start.setDate(d.getDate() - 29);
      setDateFrom(start.toISOString().slice(0, 10)); setDateTo(today);
    } else if (preset === 'thisMonth') {
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      setDateFrom(start.toISOString().slice(0, 10)); setDateTo(today);
    }
  }

  function toggleSort(col) {
    if (sortColumn === col) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDirection('desc');
    }
  }

  const visibleRecords = useMemo(() => {
    const list = [...records];
    const dir = sortDirection === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      let av; let bv;
      switch (sortColumn) {
        case 'name':
          av = String(a.name || a.candidateName || '').toLowerCase();
          bv = String(b.name || b.candidateName || '').toLowerCase();
          break;
        case 'candidateId':
          av = Number(a.candidateId ?? a.id) || 0;
          bv = Number(b.candidateId ?? b.id) || 0;
          break;
        case 'batch':
          av = String(a.batch || a.batchName || '').toLowerCase();
          bv = String(b.batch || b.batchName || '').toLowerCase();
          break;
        case 'residence':
          av = String(a.residence || a.residenceName || '').toLowerCase();
          bv = String(b.residence || b.residenceName || '').toLowerCase();
          break;
        case 'location':
          av = String(a.location || a.locationName || '').toLowerCase();
          bv = String(b.location || b.locationName || '').toLowerCase();
          break;
        case 'timestamp':
        default: {
          const aRaw = a.timestamp ?? a.attendanceTimestamp ?? a.markedAt ?? a.createdAt;
          const bRaw = b.timestamp ?? b.attendanceTimestamp ?? b.markedAt ?? b.createdAt;
          av = new Date(aRaw).getTime() || 0;
          bv = new Date(bRaw).getTime() || 0;
          break;
        }
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return list;
  }, [records, sortColumn, sortDirection]);

  function getSortIcon(col) {
    if (sortColumn !== col) return 'ti-arrows-vertical';
    return sortDirection === 'asc' ? 'ti-arrow-up' : 'ti-arrow-down';
  }

  // ── Summary cards ───────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const isToday = dateFrom === today && dateTo === today;
    const todays = isToday ? records : records.filter((r) => {
      const raw = r.timestamp ?? r.attendanceTimestamp ?? r.markedAt ?? r.createdAt;
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return false;
      return d.toISOString().slice(0, 10) === today;
    });
    const presentToday = todays.length;
    const residenceCount = todays.filter((r) => !!(r.residenceId || r.residence || r.residenceName)).length;
    const dayScholars = presentToday - residenceCount;
    return {
      total,
      presentToday,
      residenceCount,
      dayScholars: Math.max(0, dayScholars),
    };
  }, [records, total, dateFrom, dateTo, today]);

  async function handleManualSubmit(student, locId) {
    setManualSubmitting(true);
    try {
      await createManualAttendance({ candidateId: student.id, locationId: locId });
      showToast('success', 'Attendance Marked', `${student.name} marked present.`);
      setShowManualModal(false);
      loadAttendance();
    } catch (error) {
      const msg = error?.response?.data?.message || error.message || 'Failed to mark attendance.';
      showToast('error', 'Failed to Mark', msg);
    } finally {
      setManualSubmitting(false);
    }
  }

  function handleExport() {
    if (visibleRecords.length === 0) {
      showToast('info', 'Nothing to export', 'There are no records in the current view.');
      return;
    }
    const columns = [
      { label: 'Candidate ID', value: (r) => r.candidateId ?? r.id ?? '' },
      { label: 'Name', value: (r) => r.name || r.candidateName || '' },
      { label: 'Mobile', value: (r) => r.mobile || r.phone || '' },
      { label: 'Batch', value: (r) => r.batch || r.batchName || '' },
      { label: 'Residence', value: (r) => r.residence || r.residenceName || '' },
      { label: 'Location', value: (r) => r.location || r.locationName || '' },
      { label: 'Timestamp', value: (r) => formatTimestamp(r.timestamp ?? r.attendanceTimestamp ?? r.markedAt ?? r.createdAt) },
      { label: 'Date', value: (r) => formatDateOnly(r.attendanceDate ?? r.date ?? r.timestamp ?? r.markedAt ?? r.createdAt) },
      { label: 'Source', value: (r) => r.source || '' },
      { label: 'Status', value: (r) => r.status || '' },
    ];
    downloadCSV(`attendance_${dateFrom || 'all'}_${dateTo || 'all'}.csv`, toCSV(visibleRecords, columns));
    showToast('success', 'Export Ready', 'Attendance CSV downloaded.');
  }

  return (
    <div className="quiz-attempt-report-page data-table-page">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((cur) => cur.filter((t) => t.id !== id))} />

      {/* ── Standard Page Header ── */}
      <div className="page-header-section">
        <div>
          <h2><i className="ti ti-fingerprint" /> Offline Attendance</h2>
          <p>View biometric and offline attendance entries across batches, residences and locations.</p>
        </div>
        <Can permission={PERMS.ATTENDANCE_MARK}>
          <button type="button" className="page-action-button" onClick={() => setShowManualModal(true)}>
            <i className="ti ti-plus" /> Add Manual Attendance
          </button>
        </Can>
      </div>

      {/* ── Summary Cards ── */}
      <div className="qar-stats-row" style={{ marginBottom: 20 }}>
        <div className="qar-stat-card">
          <div className="qar-stat-icon indigo"><i className="ti ti-clipboard" /></div>
          <div className="qar-stat-info">
            <h3>{summary.total}</h3>
            <p>Total Records</p>
          </div>
        </div>
        <div className="qar-stat-card">
          <div className="qar-stat-icon green"><i className="ti ti-check" /></div>
          <div className="qar-stat-info">
            <h3>{summary.presentToday}</h3>
            <p>Present Today</p>
          </div>
        </div>
        <div className="qar-stat-card">
          <div className="qar-stat-icon teal"><i className="ti ti-home" /></div>
          <div className="qar-stat-info">
            <h3>{summary.residenceCount}</h3>
            <p>Residence Students</p>
          </div>
        </div>
        <div className="qar-stat-card">
          <div className="qar-stat-icon orange"><i className="ti ti-walk" /></div>
          <div className="qar-stat-info">
            <h3>{summary.dayScholars}</h3>
            <p>Day Scholars</p>
          </div>
        </div>
      </div>

      {/* ── Search bar + Filters button (modal-based) ── */}
      <div className="filter-bar">
        <div className="search-wrapper">
          <i className="ti ti-search search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by candidate name, mobile or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          type="button"
          className={`filter-toggle-btn${hasModalFilters ? ' active' : ''}`}
          onClick={() => setShowFilterModal(true)}
        >
          <i className="ti ti-filter" /> Filters
          {modalFilterCount > 0 && <span className="filter-count">{modalFilterCount}</span>}
        </button>
        {hasActiveFilters && (
          <button type="button" className="filter-clear-btn" onClick={clearFilters}>
            <i className="ti ti-reload" /> Clear
          </button>
        )}
        <Can permission={PERMS.ATTENDANCE_EXPORT}>
          <button
            type="button"
            className="qar-btn-export"
            style={{ marginLeft: 'auto' }}
            disabled={visibleRecords.length === 0}
            onClick={handleExport}
          >
            <i className="ti ti-download" /> Export to CSV
          </button>
        </Can>
      </div>

      {/* ── Filter Modal ── */}
      {showFilterModal && (
        <div
          className="crispr-modal-backdrop active"
          role="presentation"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowFilterModal(false); }}
        >
          <div className="crispr-modal-dialog" style={{ maxWidth: 620 }} role="dialog" aria-modal="true">
            <div className="crispr-modal-header">
              <h3><i className="ti ti-filter" /> Filter Attendance</h3>
              <button type="button" className="crispr-modal-close" onClick={() => setShowFilterModal(false)}>
                <i className="ti ti-close" />
              </button>
            </div>
            <div className="crispr-modal-body">
              <div className="qar-modal-presets">
                <button type="button" className="qar-clear-btn" onClick={() => applyPreset('today')}>Today</button>
                <button type="button" className="qar-clear-btn" onClick={() => applyPreset('yesterday')}>Yesterday</button>
                <button type="button" className="qar-clear-btn" onClick={() => applyPreset('7d')}>Last 7d</button>
                <button type="button" className="qar-clear-btn" onClick={() => applyPreset('30d')}>Last 30d</button>
                <button type="button" className="qar-clear-btn" onClick={() => applyPreset('thisMonth')}>This Month</button>
              </div>

              <div className="qar-modal-grid">
                <div className="qar-filter-field">
                  <label className="qar-filter-label"><i className="ti ti-calendar" /> Date From</label>
                  <input
                    type="date"
                    className="qar-input"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="qar-filter-field">
                  <label className="qar-filter-label"><i className="ti ti-calendar" /> Date To</label>
                  <input
                    type="date"
                    className="qar-input"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
                <div className="qar-filter-field">
                  <label className="qar-filter-label"><i className="ti ti-layout-grid2" /> Batch</label>
                  <select className="qar-select" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
                    <option value="">All Batches</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name || b.batchName}</option>
                    ))}
                  </select>
                </div>
                <div className="qar-filter-field">
                  <label className="qar-filter-label"><i className="ti ti-home" /> Residence</label>
                  <select className="qar-select" value={residenceId} onChange={(e) => setResidenceId(e.target.value)}>
                    <option value="">All Residences</option>
                    {residences.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div className="qar-filter-field">
                  <label className="qar-filter-label"><i className="ti ti-location-pin" /> Location</label>
                  <select
                    className="qar-select"
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    disabled={locations.length === 0}
                  >
                    <option value="">{locations.length === 0 ? 'No locations available' : 'All Locations'}</option>
                    {locations.map((l) => (
                      <option key={l.id ?? l.code} value={l.id ?? l.code}>{l.name || l.title || l.code}</option>
                    ))}
                  </select>
                </div>
                <div className="qar-filter-field">
                  <label className="qar-filter-label"><i className="ti ti-mobile" /> Source</label>
                  <select className="qar-select" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
                    <option value="">All Sources</option>
                    <option value="biometric">Biometric</option>
                    <option value="manual">Manual</option>
                    <option value="rfid">RFID</option>
                  </select>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="qar-active-filters">
                  <span className="qar-active-label">Active Filters:</span>
                  {searchQuery && (
                    <span className="qar-filter-badge">
                      Search: &ldquo;{searchQuery}&rdquo;
                      <i className="ti ti-close" onClick={() => setSearchQuery('')} />
                    </span>
                  )}
                  {dateFrom && (
                    <span className="qar-filter-badge">From: {dateFrom}
                      <i className="ti ti-close" onClick={() => setDateFrom('')} />
                    </span>
                  )}
                  {dateTo && (
                    <span className="qar-filter-badge">To: {dateTo}
                      <i className="ti ti-close" onClick={() => setDateTo('')} />
                    </span>
                  )}
                  {batchId && (
                    <span className="qar-filter-badge">
                      Batch: {batches.find((b) => String(b.id) === String(batchId))?.name || batchId}
                      <i className="ti ti-close" onClick={() => setBatchId('')} />
                    </span>
                  )}
                  {residenceId && (
                    <span className="qar-filter-badge">
                      Residence: {residences.find((r) => String(r.id) === String(residenceId))?.name || residenceId}
                      <i className="ti ti-close" onClick={() => setResidenceId('')} />
                    </span>
                  )}
                  {locationId && (
                    <span className="qar-filter-badge">
                      Location: {locations.find((l) => String(l.id ?? l.code) === String(locationId))?.name || locationId}
                      <i className="ti ti-close" onClick={() => setLocationId('')} />
                    </span>
                  )}
                  {sourceFilter && (
                    <span className="qar-filter-badge">Source: {sourceFilter}
                      <i className="ti ti-close" onClick={() => setSourceFilter('')} />
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="crispr-modal-footer">
              <button type="button" className="btn btn-default" onClick={clearFilters}>
                <i className="ti ti-reload" /> Clear Filters
              </button>
              <button type="button" className="btn btn-success" onClick={() => setShowFilterModal(false)}>
                <i className="ti ti-check" /> Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Manual Attendance Modal ── */}
      {showManualModal && (
        <ManualAttendanceModal
          locations={locations}
          submitting={manualSubmitting}
          onClose={() => setShowManualModal(false)}
          onSubmit={handleManualSubmit}
        />
      )}

      {/* ── Table ── */}
      {isLoading ? (
        <div className="students-table-container">
          <table className="students-table">
            <thead>
              <tr>
                <th>Candidate ID</th>
                <th>Name</th>
                <th>Mobile</th>
                <th>Batch</th>
                <th>Residence</th>
                <th>Location</th>
                <th>Timestamp</th>
                <th>Date</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }, (_, i) => (
                <tr key={`sk-${i}`}>
                  {Array.from({ length: 9 }, (_, j) => (
                    <td key={j}><div className="batch-skeleton medium" /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : visibleRecords.length > 0 ? (
        <div className="students-table-container">
          <table className="students-table">
            <thead>
              <tr>
                <th className={`sortable${sortColumn === 'candidateId' ? ' active' : ''}`} onClick={() => toggleSort('candidateId')}>
                  Candidate ID <i className={`ti ${getSortIcon('candidateId')} sort-icon`} />
                </th>
                <th className={`sortable${sortColumn === 'name' ? ' active' : ''}`} onClick={() => toggleSort('name')}>
                  Name <i className={`ti ${getSortIcon('name')} sort-icon`} />
                </th>
                <th>Mobile</th>
                <th className={`sortable${sortColumn === 'batch' ? ' active' : ''}`} onClick={() => toggleSort('batch')}>
                  Batch <i className={`ti ${getSortIcon('batch')} sort-icon`} />
                </th>
                <th className={`sortable${sortColumn === 'residence' ? ' active' : ''}`} onClick={() => toggleSort('residence')}>
                  Residence <i className={`ti ${getSortIcon('residence')} sort-icon`} />
                </th>
                <th className={`sortable${sortColumn === 'location' ? ' active' : ''}`} onClick={() => toggleSort('location')}>
                  Location <i className={`ti ${getSortIcon('location')} sort-icon`} />
                </th>
                <th className={`sortable${sortColumn === 'timestamp' ? ' active' : ''}`} onClick={() => toggleSort('timestamp')}>
                  Timestamp <i className={`ti ${getSortIcon('timestamp')} sort-icon`} />
                </th>
                <th>Date</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {visibleRecords.map((r, idx) => {
                const ts = r.timestamp ?? r.attendanceTimestamp ?? r.markedAt ?? r.createdAt;
                const dateVal = r.attendanceDate ?? r.date ?? ts;
                return (
                  <tr key={r.id ?? `${r.candidateId ?? 'row'}-${idx}-${ts ?? idx}`}>
                    <td>{r.candidateId ?? r.id ?? '—'}</td>
                    <td><strong>{r.name || r.candidateName || '—'}</strong></td>
                    <td>{r.mobile || r.phone || '—'}</td>
                    <td>{r.batch || r.batchName || '—'}</td>
                    <td>{r.residence || r.residenceName || '—'}</td>
                    <td>{r.location || r.locationName || '—'}</td>
                    <td className="qar-datetime">{formatTimestamp(ts)}</td>
                    <td>{formatDateOnly(dateVal)}</td>
                    <td>
                      {r.source ? (
                        <span className="batch-course-badge"><i className="ti ti-mobile" /> {r.source}</span>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

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
          <h4>Unable to load attendance</h4>
          <p>{loadError}</p>
          <button type="button" className="qar-btn-export" style={{ marginTop: 12 }} onClick={() => loadAttendance()}>
            <i className="ti ti-reload" /> Retry
          </button>
        </div>
      ) : (
        <div className="qar-empty-state">
          <i className="ti ti-search" />
          <h4>No Attendance Records</h4>
          {hasActiveFilters
            ? <p>Try adjusting your filters or expanding the date range.</p>
            : <p>No attendance has been captured for the selected date.</p>}
        </div>
      )}
    </div>
  );
}

// ── Manual attendance entry: searchable student picker + location select ──────
function ManualAttendanceModal({ locations, submitting, onClose, onSubmit }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [locationId, setLocationId] = useState('');

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Debounced student search (skipped once a student is locked in)
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
    const id = c.candidateKey || c.id;
    const mobile = c.mobile || c.registeredMobile || c.communicationMobile || '';
    setSelected({ id, name: c.name || 'Unknown', mobile });
    setOpen(false);
    setResults([]);
  }

  const canSubmit = !!selected && !!locationId && !submitting;

  return (
    <div
      className="crispr-modal-backdrop active"
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="crispr-modal-dialog" style={{ maxWidth: 520 }} role="dialog" aria-modal="true">
        <div className="crispr-modal-header">
          <h3><i className="ti ti-plus" /> Add Manual Attendance</h3>
          <button type="button" className="crispr-modal-close" onClick={onClose}>
            <i className="ti ti-close" />
          </button>
        </div>
        <div className="crispr-modal-body">
          {/* Student picker */}
          <div className="qar-filter-field" style={{ position: 'relative', marginBottom: 18 }}>
            <label className="qar-filter-label"><i className="ti ti-user" /> Student</label>
            {selected ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 12px', border: '1px solid #d7e1e7', borderRadius: 6, background: '#f8f9fa' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#2c3e50' }}>{selected.name}</div>
                  <div style={{ fontSize: 12, color: '#6c757d' }}>ID: {selected.id}{selected.mobile ? ` · ${selected.mobile}` : ''}</div>
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
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                />
                {open && query.trim().length >= 2 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 5, background: '#fff', border: '1px solid #d7e1e7', borderRadius: 6, marginTop: 4, maxHeight: 240, overflowY: 'auto', boxShadow: '0 8px 20px rgba(0,0,0,0.12)' }}>
                    {searching ? (
                      <div style={{ padding: '12px 14px', color: '#6c757d', fontSize: 13 }}>Searching…</div>
                    ) : results.length === 0 ? (
                      <div style={{ padding: '12px 14px', color: '#6c757d', fontSize: 13 }}>No students found.</div>
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

          {/* Location picker */}
          <div className="qar-filter-field">
            <label className="qar-filter-label"><i className="ti ti-location-pin" /> Location</label>
            <select
              className="qar-select"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              disabled={locations.length === 0}
            >
              <option value="">{locations.length === 0 ? 'No locations available' : 'Select a location'}</option>
              {locations.map((l) => (
                <option key={l.id ?? l.code} value={l.id ?? l.code}>{l.name || l.title || l.code}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="crispr-modal-footer">
          <button type="button" className="btn btn-default" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn btn-success"
            disabled={!canSubmit}
            style={!canSubmit ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
            onClick={() => onSubmit(selected, locationId)}
          >
            <i className="ti ti-check" /> {submitting ? 'Saving…' : 'Mark Attendance'}
          </button>
        </div>
      </div>
    </div>
  );
}
