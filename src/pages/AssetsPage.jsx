import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ToastRegion from '../components/ToastRegion';
import { Can, usePermission } from '../lib/userStore';
import { PERMS } from '../lib/permissions';
import {
  ASSET_STATUS,
  ASSET_TYPES,
  ASSET_TYPE_OPTIONS,
  addAsset,
  listAssets,
  removeInvoice,
  updateAsset,
  uploadInvoice,
} from '../lib/assetsApi';

const PAGE_SIZE_OPTIONS = [20, 50, 100, 200];

// Values are stored in paise (lowest unit) per backend convention; display in rupees.
const PAISE_DIVISOR = 100;

const TYPE_ICONS = {
  1: 'ti-mobile',
  2: 'ti-package',
  3: 'ti-book',
  4: 'ti-bolt',
  5: 'ti-layout-grid2',
};

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function formatINR(paise) {
  const n = Number(paise);
  if (!Number.isFinite(n)) return '—';
  return inrFormatter.format(n / PAISE_DIVISOR);
}

function formatPercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${n.toFixed(1)}%`;
}

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

function dateToUnix(dateStr) {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return undefined;
  return Math.floor(d.getTime() / 1000);
}

function formatDate(value) {
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
  if (currentPage <= 4) out.push(1, 2, 3, 4, 5, '...', totalPages);
  else if (currentPage >= totalPages - 3) out.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
  else out.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
  return out;
}

function computeDepreciation(asset) {
  const original = Number(asset?.valueOriginal) || 0;
  const current = Number(asset?.valueAtPurchase ?? asset?.currentValue) || 0;
  if (original <= 0) return 0;
  return Math.max(0, Math.min(100, ((original - current) / original) * 100));
}

function getInvoiceUrl(asset) {
  if (!asset) return null;
  return asset.invoiceURL || asset.invoiceUrl || asset.invoicePath || asset.invoiceFile || asset.invoice || null;
}

function hasInvoice(asset) {
  if (!asset) return false;
  if (getInvoiceUrl(asset)) return true;
  if (asset.hasInvoice === true || asset.hasInvoice === 1) return true;
  return false;
}

function getAssetStatus(asset) {
  if (asset?.status === 1 || asset?.status === '1') return 'Active';
  if (asset?.status === 0 || asset?.status === '0') return 'Inactive';
  if (asset?.active === 0 || asset?.isActive === false) return 'Inactive';
  return ASSET_STATUS[asset?.status] || 'Active';
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

function download(filename, content, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const EMPTY_DRAFT = {
  id: null,
  name: '',
  type: '',
  code: '',
  locationId: '',
  valueOriginal: '',
  valueAtPurchase: '',
  yearlyDepreciationPercentage: '',
  purchasedDate: '',
  status: 1,
};

export default function AssetsPage() {
  const { can } = usePermission();
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | inactive
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [valueMin, setValueMin] = useState('');
  const [valueMax, setValueMax] = useState('');
  const [locationId, setLocationId] = useState('');

  // Pagination / sort
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Data
  const [assets, setAssets] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Modal
  const [formOpen, setFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const [exportOpen, setExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [activeKebabId, setActiveKebabId] = useState(null);
  const kebabRef = useRef(null);
  const invoiceInputRef = useRef(null);
  const [invoiceUploadAssetId, setInvoiceUploadAssetId] = useState(null);
  const [removeInvoiceTarget, setRemoveInvoiceTarget] = useState(null);
  const [isInvoiceBusy, setIsInvoiceBusy] = useState(false);

  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

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

  const loadAssetsList = useCallback(async (signal = { cancelled: false }) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const resp = await listAssets({
        page,
        size: pageSize,
        timestampFrom: dateToUnix(dateFrom),
        timestampTo: dateToUnix(dateTo),
        filterBy: statusFilter,
        type: typeFilter || undefined,
        locationId: locationId || undefined,
        sortBy,
        sortOrder,
      });
      if (signal.cancelled) return;

      const rows = resp?.data || resp?.assets || resp?.items || (Array.isArray(resp) ? resp : []) || [];
      const meta = resp?.meta || resp?.pagination || {};
      setAssets(Array.isArray(rows) ? rows : []);
      const tot = Number(meta.total ?? (Array.isArray(rows) ? rows.length : 0));
      setTotal(tot);
      setTotalPages(Number(meta.totalPages ?? meta.lastPage ?? Math.max(1, Math.ceil(tot / pageSize))));
    } catch (error) {
      if (signal.cancelled) return;
      setAssets([]); setTotal(0); setTotalPages(1);
      const msg = error?.response?.data?.message || error.message || 'Failed to load assets.';
      setLoadError(msg);
      showToast('error', 'Network Error', msg);
    } finally {
      if (!signal.cancelled) setIsLoading(false);
    }
  }, [page, pageSize, dateFrom, dateTo, statusFilter, typeFilter, locationId, sortBy, sortOrder, showToast]);

  useEffect(() => {
    const signal = { cancelled: false };
    const timer = setTimeout(() => loadAssetsList(signal), 250);
    return () => { signal.cancelled = true; clearTimeout(timer); };
  }, [loadAssetsList]);

  useEffect(() => { setPage(1); }, [typeFilter, statusFilter, dateFrom, dateTo, locationId, pageSize, sortBy, sortOrder]);

  const safePage = Math.min(page, totalPages);
  const showingStart = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const showingEnd = Math.min(safePage * pageSize, total);

  // Client-side refinement (search, value range)
  const visibleAssets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const minPaise = valueMin ? Number(valueMin) * PAISE_DIVISOR : null;
    const maxPaise = valueMax ? Number(valueMax) * PAISE_DIVISOR : null;
    return assets.filter((a) => {
      if (q) {
        const hay = [a.id, a.name, a.code, a.serialNumber, a.serial].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const cv = Number(a.valueAtPurchase ?? a.currentValue ?? 0);
      if (minPaise != null && cv < minPaise) return false;
      if (maxPaise != null && cv > maxPaise) return false;
      return true;
    });
  }, [assets, searchQuery, valueMin, valueMax]);

  // Summary (computed across the current page's visible rows)
  const summary = useMemo(() => {
    let totalOriginal = 0;
    let totalCurrent = 0;
    let activeCount = 0;
    const byType = {};
    visibleAssets.forEach((a) => {
      totalOriginal += Number(a.valueOriginal) || 0;
      totalCurrent += Number(a.valueAtPurchase ?? a.currentValue) || 0;
      if (getAssetStatus(a) === 'Active') activeCount += 1;
      const t = Number(a.type);
      if (t) byType[t] = (byType[t] || 0) + 1;
    });
    return { totalOriginal, totalCurrent, activeCount, byType };
  }, [visibleAssets]);

  const hasActiveFilters = useMemo(() => (
    !!searchQuery || !!typeFilter || statusFilter !== 'all'
      || !!dateFrom || !!dateTo || !!valueMin || !!valueMax || !!locationId
  ), [searchQuery, typeFilter, statusFilter, dateFrom, dateTo, valueMin, valueMax, locationId]);

  function clearFilters() {
    setSearchQuery('');
    setTypeFilter('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setValueMin('');
    setValueMax('');
    setLocationId('');
  }

  function toggleSort(col) {
    if (sortBy === col) {
      setSortOrder((d) => (d === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(col);
      setSortOrder('DESC');
    }
  }

  function getSortIcon(col) {
    if (sortBy !== col) return 'ti-arrows-vertical';
    return sortOrder === 'ASC' ? 'ti-arrow-up' : 'ti-arrow-down';
  }

  function openCreateModal() {
    setIsEditing(false);
    setDraft({ ...EMPTY_DRAFT, purchasedDate: todayISODate(), yearlyDepreciationPercentage: '10' });
    setFormErrors({});
    setFormOpen(true);
  }

  function openEditModal(asset) {
    setIsEditing(true);
    const purchasedDateStr = asset.purchasedDate
      ? new Date((Number(asset.purchasedDate) < 1e11 ? Number(asset.purchasedDate) * 1000 : Number(asset.purchasedDate))).toISOString().slice(0, 10)
      : '';
    setDraft({
      id: asset.id,
      name: asset.name || '',
      type: String(asset.type ?? ''),
      code: asset.code || asset.serialNumber || '',
      locationId: String(asset.locationId ?? ''),
      valueOriginal: asset.valueOriginal != null ? String(Number(asset.valueOriginal) / PAISE_DIVISOR) : '',
      valueAtPurchase: asset.valueAtPurchase != null ? String(Number(asset.valueAtPurchase) / PAISE_DIVISOR) : '',
      yearlyDepreciationPercentage: asset.yearlyDepreciationPercentage != null ? String(asset.yearlyDepreciationPercentage) : '',
      purchasedDate: purchasedDateStr,
      status: getAssetStatus(asset) === 'Active' ? 1 : 0,
    });
    setFormErrors({});
    setFormOpen(true);
  }

  function updateDraft(field, value) {
    setDraft((cur) => ({ ...cur, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((errs) => { const next = { ...errs }; delete next[field]; return next; });
    }
  }

  function validateDraft(d) {
    const errors = {};
    if (!d.name.trim()) errors.name = 'Name is required';
    if (!d.type) errors.type = 'Type is required';
    if (!d.valueOriginal || Number(d.valueOriginal) <= 0) errors.valueOriginal = 'Original value must be > 0';
    if (!d.valueAtPurchase || Number(d.valueAtPurchase) < 0) errors.valueAtPurchase = 'Current value is required';
    if (!d.purchasedDate) errors.purchasedDate = 'Purchase date is required';
    if (d.yearlyDepreciationPercentage === '' || Number(d.yearlyDepreciationPercentage) < 0 || Number(d.yearlyDepreciationPercentage) > 100) {
      errors.yearlyDepreciationPercentage = 'Depreciation must be 0–100';
    }
    return errors;
  }

  async function saveAsset() {
    const errors = validateDraft(draft);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      showToast('info', 'Validation', 'Please fix the highlighted fields.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        name: draft.name.trim(),
        type: Number(draft.type),
        locationId: draft.locationId ? Number(draft.locationId) : undefined,
        valueOriginal: Math.round(Number(draft.valueOriginal) * PAISE_DIVISOR),
        valueAtPurchase: Math.round(Number(draft.valueAtPurchase) * PAISE_DIVISOR),
        yearlyDepreciationPercentage: Number(draft.yearlyDepreciationPercentage),
        purchasedDate: dateToUnix(draft.purchasedDate),
      };
      if (draft.code) payload.code = draft.code.trim();
      if (isEditing) {
        payload.id = draft.id;
        payload.status = Number(draft.status);
        await updateAsset(payload);
        showToast('success', 'Asset Updated', `${payload.name} has been updated.`);
      } else {
        await addAsset(payload);
        showToast('success', 'Asset Created', `${payload.name} has been added.`);
      }
      setFormOpen(false);
      loadAssetsList();
    } catch (error) {
      showToast('error', 'Save failed', error?.response?.data?.message || error.message || 'Could not save asset.');
    } finally {
      setIsSaving(false);
    }
  }

  async function quickToggleStatus(asset) {
    const nextStatus = getAssetStatus(asset) === 'Active' ? 0 : 1;
    try {
      await updateAsset({ id: asset.id, status: nextStatus });
      showToast('success', 'Status Updated', `${asset.name} is now ${nextStatus === 1 ? 'active' : 'inactive'}.`);
      loadAssetsList();
    } catch (error) {
      showToast('error', 'Update failed', error?.response?.data?.message || error.message || 'Could not update status.');
    }
  }

  function triggerInvoiceUpload(asset) {
    setActiveKebabId(null);
    setInvoiceUploadAssetId(asset.id);
    // Reset value so selecting the same file twice still fires onChange
    if (invoiceInputRef.current) invoiceInputRef.current.value = '';
    invoiceInputRef.current?.click();
  }

  async function handleInvoiceFileSelected(event) {
    const file = event.target.files?.[0];
    const assetId = invoiceUploadAssetId;
    event.target.value = '';
    if (!file || !assetId) return;
    setIsInvoiceBusy(true);
    try {
      await uploadInvoice(assetId, file);
      showToast('success', 'Invoice Uploaded', `Invoice attached to asset #${assetId}.`);
      loadAssetsList();
    } catch (error) {
      showToast('error', 'Upload failed', error?.response?.data?.message || error.message || 'Could not upload invoice.');
    } finally {
      setIsInvoiceBusy(false);
      setInvoiceUploadAssetId(null);
    }
  }

  function askRemoveInvoice(asset) {
    setActiveKebabId(null);
    setRemoveInvoiceTarget(asset);
  }

  async function confirmRemoveInvoice() {
    if (!removeInvoiceTarget) return;
    setIsInvoiceBusy(true);
    try {
      await removeInvoice(removeInvoiceTarget.id);
      showToast('success', 'Invoice Removed', `Invoice removed from asset #${removeInvoiceTarget.id}.`);
      setRemoveInvoiceTarget(null);
      loadAssetsList();
    } catch (error) {
      showToast('error', 'Remove failed', error?.response?.data?.message || error.message || 'Could not remove invoice.');
    } finally {
      setIsInvoiceBusy(false);
    }
  }

  const exportColumns = useMemo(() => ([
    { label: 'Asset ID', value: (r) => r.id ?? '' },
    { label: 'Asset Name', value: (r) => r.name ?? '' },
    { label: 'Type', value: (r) => ASSET_TYPES[r.type] || r.type || '' },
    { label: 'Code / Serial', value: (r) => r.code || r.serialNumber || r.serial || '' },
    { label: 'Purchase Date', value: (r) => formatDate(r.purchasedDate) },
    { label: 'Original Value (INR)', value: (r) => (Number(r.valueOriginal) / PAISE_DIVISOR).toFixed(2) },
    { label: 'Current Value (INR)', value: (r) => (Number(r.valueAtPurchase ?? r.currentValue) / PAISE_DIVISOR).toFixed(2) },
    { label: 'Depreciation %', value: (r) => computeDepreciation(r).toFixed(2) },
    { label: 'Yearly Depreciation %', value: (r) => r.yearlyDepreciationPercentage ?? '' },
    { label: 'Location ID', value: (r) => r.locationId ?? '' },
    { label: 'Status', value: (r) => getAssetStatus(r) },
    { label: 'Invoice URL', value: (r) => getInvoiceUrl(r) || '' },
    { label: 'Created At', value: (r) => formatDate(r.createdAt) },
  ]), []);

  async function exportCSV(scope) {
    setIsExporting(true);
    try {
      let rows = visibleAssets;
      if (scope === 'all' && total > visibleAssets.length) {
        // Pull all pages (capped) to export filtered totals across server.
        const aggregated = [];
        const perFetch = 200;
        const pages = Math.min(50, Math.ceil(total / perFetch));
        for (let p = 1; p <= pages; p += 1) {
          // eslint-disable-next-line no-await-in-loop
          const resp = await listAssets({
            page: p,
            size: perFetch,
            timestampFrom: dateToUnix(dateFrom),
            timestampTo: dateToUnix(dateTo),
            filterBy: statusFilter,
            type: typeFilter || undefined,
            locationId: locationId || undefined,
            sortBy,
            sortOrder,
          });
          const got = resp?.data || resp?.assets || resp?.items || [];
          aggregated.push(...got);
          if (got.length < perFetch) break;
        }
        rows = aggregated;
        // re-apply client-side search + value range filters
        const q = searchQuery.trim().toLowerCase();
        const minPaise = valueMin ? Number(valueMin) * PAISE_DIVISOR : null;
        const maxPaise = valueMax ? Number(valueMax) * PAISE_DIVISOR : null;
        rows = rows.filter((a) => {
          if (q) {
            const hay = [a.id, a.name, a.code, a.serialNumber].filter(Boolean).join(' ').toLowerCase();
            if (!hay.includes(q)) return false;
          }
          const cv = Number(a.valueAtPurchase ?? a.currentValue ?? 0);
          if (minPaise != null && cv < minPaise) return false;
          if (maxPaise != null && cv > maxPaise) return false;
          return true;
        });
      }
      if (rows.length === 0) {
        showToast('info', 'Nothing to export', 'No assets matched the filters.');
        return;
      }
      const csv = toCSV(rows, exportColumns);
      const fname = `assets_${todayISODate()}${typeFilter ? `_${ASSET_TYPES[typeFilter]}` : ''}.csv`;
      download(fname, csv);
      showToast('success', 'Export Ready', `${rows.length} record(s) exported to CSV.`);
      setExportOpen(false);
    } catch (error) {
      showToast('error', 'Export failed', error?.response?.data?.message || error.message || 'Could not export.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <section className="quiz-listing-page">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((cur) => cur.filter((t) => t.id !== id))} />

      {/* ── Page Header ── */}
      <div className="page-header-section">
        <div>
          <h2><i className="ti ti-package" /> Assets</h2>
          <p>Track asset inventory, valuation, depreciation and location assignment.</p>
        </div>
        <Can permission={PERMS.ASSETS_EDIT}>
          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            <i className="ti ti-plus" /> Add Asset
          </button>
        </Can>
      </div>

      {/* ── Summary Cards + Filter Card (uses qar-* styles) ── */}
      <div className="quiz-attempt-report-page">
        <div className="qar-header-body" style={{ padding: 0, marginTop: 0 }}>
          <div className="qar-stats-row">
            <div className="qar-stat-card">
              <div className="qar-stat-icon indigo"><i className="ti ti-package" /></div>
              <div className="qar-stat-info">
                <h3>{total}</h3>
                <p>Total Assets</p>
              </div>
            </div>
            <div className="qar-stat-card">
              <div className="qar-stat-icon green"><i className="ti ti-wallet" /></div>
              <div className="qar-stat-info">
                <h3>{formatINR(summary.totalOriginal)}</h3>
                <p>Total Original Value</p>
              </div>
            </div>
            <div className="qar-stat-card">
              <div className="qar-stat-icon orange"><i className="ti ti-stats-down" /></div>
              <div className="qar-stat-info">
                <h3>{formatINR(summary.totalCurrent)}</h3>
                <p>Total Current Value</p>
              </div>
            </div>
            <div className="qar-stat-card">
              <div className="qar-stat-icon teal"><i className="ti ti-check" /></div>
              <div className="qar-stat-info">
                <h3>{summary.activeCount}</h3>
                <p>Active (this page)</p>
              </div>
            </div>
          </div>

          {/* By-type chip row */}
          <div className="qar-active-filters" style={{ marginTop: 12 }}>
            <span className="qar-active-label">By Type:</span>
            {ASSET_TYPE_OPTIONS.map((opt) => {
              const active = typeFilter === String(opt.value);
              return (
                <span
                  key={opt.value}
                  role="button"
                  tabIndex={0}
                  className={`qar-filter-badge${active ? ' active' : ''}`}
                  onClick={() => setTypeFilter(active ? '' : String(opt.value))}
                  onKeyDown={(e) => { if (e.key === 'Enter') setTypeFilter(active ? '' : String(opt.value)); }}
                >
                  <i className={`ti ${TYPE_ICONS[opt.value]}`} /> {opt.label}: {summary.byType[opt.value] || 0}
                </span>
              );
            })}
          </div>
        </div>

      {/* ── Filters ── */}
      <div className="qar-filter-card">
        <div className="qar-filter-header">
          <h4><i className="ti ti-filter" /> Filters</h4>
          {hasActiveFilters && (
            <button type="button" className="qar-clear-btn" onClick={clearFilters}>
              <i className="ti ti-reload" /> Clear Filters
            </button>
          )}
        </div>

        <div className="qar-filter-row1">
          <div className="qar-filter-field qar-filter-field-wide">
            <label className="qar-filter-label">Search</label>
            <input
              type="text"
              className="qar-input"
              placeholder="Search by asset name, code or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="qar-filter-field">
            <label className="qar-filter-label"><i className="ti ti-tag" /> Type</label>
            <select className="qar-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              {ASSET_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="qar-filter-field">
            <label className="qar-filter-label"><i className="ti ti-info-alt" /> Status</label>
            <select className="qar-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
          </div>
        </div>

        <div className="qar-filter-row2">
          <div className="qar-filter-field">
            <label className="qar-filter-label"><i className="ti ti-calendar" /> Purchased From</label>
            <input type="date" className="qar-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="qar-filter-field">
            <label className="qar-filter-label"><i className="ti ti-calendar" /> Purchased To</label>
            <input type="date" className="qar-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="qar-filter-field">
            <label className="qar-filter-label"><i className="ti ti-money" /> Value Min (₹)</label>
            <input type="number" min="0" className="qar-input" value={valueMin} onChange={(e) => setValueMin(e.target.value)} placeholder="0" />
          </div>
          <div className="qar-filter-field">
            <label className="qar-filter-label"><i className="ti ti-money" /> Value Max (₹)</label>
            <input type="number" min="0" className="qar-input" value={valueMax} onChange={(e) => setValueMax(e.target.value)} placeholder="No limit" />
          </div>
          <div className="qar-filter-field">
            <label className="qar-filter-label"><i className="ti ti-location-pin" /> Location ID</label>
            <input type="text" className="qar-input" value={locationId} onChange={(e) => setLocationId(e.target.value)} placeholder="optional" />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="qar-active-filters">
            <span className="qar-active-label">Active Filters:</span>
            {searchQuery && (
              <span className="qar-filter-badge">Search: &ldquo;{searchQuery}&rdquo;
                <i className="ti ti-close" onClick={() => setSearchQuery('')} />
              </span>
            )}
            {typeFilter && (
              <span className="qar-filter-badge">Type: {ASSET_TYPES[typeFilter]}
                <i className="ti ti-close" onClick={() => setTypeFilter('')} />
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="qar-filter-badge">Status: {statusFilter}
                <i className="ti ti-close" onClick={() => setStatusFilter('all')} />
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
            {valueMin && (
              <span className="qar-filter-badge">Min: ₹{valueMin}
                <i className="ti ti-close" onClick={() => setValueMin('')} />
              </span>
            )}
            {valueMax && (
              <span className="qar-filter-badge">Max: ₹{valueMax}
                <i className="ti ti-close" onClick={() => setValueMax('')} />
              </span>
            )}
            {locationId && (
              <span className="qar-filter-badge">Location: {locationId}
                <i className="ti ti-close" onClick={() => setLocationId('')} />
              </span>
            )}
          </div>
        )}
      </div>

      </div>{/* /quiz-attempt-report-page inner wrapper */}

      {/* ── Toolbar ── */}
      <div className="filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#52606d', fontSize: 13 }}>
          <strong>{total}</strong> asset(s) total · <strong>{visibleAssets.length}</strong> on this page
        </span>
        <Can permission={PERMS.ASSETS_EXPORT}>
          <button type="button" className="btn btn-default" disabled={visibleAssets.length === 0} onClick={() => setExportOpen(true)}>
            <i className="ti ti-download" /> Export
          </button>
        </Can>
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <div className="students-table-container">
          <table className="students-table">
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Type</th><th>Code</th><th>Purchase Date</th>
                <th>Original</th><th>Current</th><th>Depr %</th><th>Location</th><th>Status</th><th>Invoice</th><th>Created</th><th>&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }, (_, i) => (
                <tr key={`sk-${i}`}>
                  {Array.from({ length: 13 }, (_, j) => (
                    <td key={j}><div className="batch-skeleton medium" /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : visibleAssets.length > 0 ? (
        <div className="students-table-container">
          <table className="students-table">
            <thead>
              <tr>
                <th className={`sortable ${sortBy === 'id' ? ' active' : ''}`} onClick={() => toggleSort('id')}>
                  ID <i className={`sort-icon ti ${getSortIcon('id')}`} />
                </th>
                <th className={`sortable ${sortBy === 'name' ? ' active' : ''}`} onClick={() => toggleSort('name')}>
                  Asset Name <i className={`sort-icon ti ${getSortIcon('name')}`} />
                </th>
                <th>Type</th>
                <th>Code / Serial</th>
                <th className={`sortable ${sortBy === 'purchasedDate' ? ' active' : ''}`} onClick={() => toggleSort('purchasedDate')}>
                  Purchase Date <i className={`sort-icon ti ${getSortIcon('purchasedDate')}`} />
                </th>
                <th className={`sortable center-align${sortBy === 'valueOriginal' ? ' active' : ''}`} onClick={() => toggleSort('valueOriginal')}>
                  Original <i className={`sort-icon ti ${getSortIcon('valueOriginal')}`} />
                </th>
                <th className={`sortable center-align${sortBy === 'valueAtPurchase' ? ' active' : ''}`} onClick={() => toggleSort('valueAtPurchase')}>
                  Current <i className={`sort-icon ti ${getSortIcon('valueAtPurchase')}`} />
                </th>
                <th className="center-align">Depr %</th>
                <th>Location</th>
                <th className="center-align">Status</th>
                <th className="center-align">Invoice</th>
                <th className={`sortable ${sortBy === 'createdAt' ? ' active' : ''}`} onClick={() => toggleSort('createdAt')}>
                  Created <i className={`sort-icon ti ${getSortIcon('createdAt')}`} />
                </th>
                <th className="center-align actions-column">Actions</th>
              </tr>
            </thead>
            <tbody ref={kebabRef}>
              {visibleAssets.map((asset) => {
                const status = getAssetStatus(asset);
                const dep = computeDepreciation(asset);
                return (
                  <tr key={asset.id} className={activeKebabId === asset.id ? 'row-active-menu' : ''}>
                    <td>#{asset.id}</td>
                    <td>
                      <div className="batch-name-container">
                        <div className="batch-name">{asset.name}</div>
                      </div>
                    </td>
                    <td>
                      <span className="batch-course-badge">
                        <i className={`ti ${TYPE_ICONS[asset.type] || 'ti-layout-grid2'}`} /> {ASSET_TYPES[asset.type] || 'Unknown'}
                      </span>
                    </td>
                    <td>{asset.code || asset.serialNumber || asset.serial || '—'}</td>
                    <td>
                      <div className="course-info"><i className="ti ti-calendar" /> {formatDate(asset.purchasedDate)}</div>
                    </td>
                    <td className="center-align">{formatINR(asset.valueOriginal)}</td>
                    <td className="center-align"><strong>{formatINR(asset.valueAtPurchase ?? asset.currentValue)}</strong></td>
                    <td className="center-align">{formatPercent(dep)}</td>
                    <td>
                      <div className={`course-info${asset.locationName || asset.location || asset.locationId ? '' : ' muted'}`}>
                        {asset.locationName || asset.location || (asset.locationId ? `Loc #${asset.locationId}` : '—')}
                      </div>
                    </td>
                    <td className="center-align">
                      <span className={`badge-status ${status === 'Active' ? 'badge-published' : 'badge-draft'}`}>{status}</span>
                    </td>
                    <td className="center-align">
                      {getInvoiceUrl(asset) ? (
                        <a
                          href={getInvoiceUrl(asset)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="attempts-link"
                          title="Open invoice"
                        >
                          <i className="ti ti-link" /> Invoice
                        </a>
                      ) : (
                        <span className="muted-table-text">—</span>
                      )}
                    </td>
                    <td>
                      <div className="course-info"><i className="ti ti-time" /> {formatDate(asset.createdAt)}</div>
                    </td>
                    <td className={`center-align ${activeKebabId === asset.id ? 'cell-active-menu' : ''}`}>
                      <div className="kebab-menu-container">
                        <button
                          type="button"
                          className="kebab-button"
                          onClick={(event) => { event.stopPropagation(); setActiveKebabId((cur) => (cur === asset.id ? null : asset.id)); }}
                        >
                          <i className="ti ti-more-alt" />
                        </button>
                        <div className={`kebab-dropdown ${activeKebabId === asset.id ? 'active' : ''}`}>
                          {can(PERMS.ASSETS_EDIT) && (
                            <button type="button" className="kebab-dropdown-item edit-action" onClick={() => { setActiveKebabId(null); openEditModal(asset); }}>
                              <i className="ti ti-pencil" />
                              <span className="item-label">Edit Asset</span>
                            </button>
                          )}
                          {can(PERMS.ASSETS_EDIT) && (
                            <button
                              type="button"
                              className={`kebab-dropdown-item ${status === 'Active' ? 'draft-action' : 'enable-action'}`}
                              onClick={() => { setActiveKebabId(null); quickToggleStatus(asset); }}
                            >
                              <i className={`ti ${status === 'Active' ? 'ti-na' : 'ti-check'}`} />
                              <span className="item-label">{status === 'Active' ? 'Mark Inactive' : 'Mark Active'}</span>
                            </button>
                          )}
                          {can(PERMS.ASSETS_INVOICE_EDIT) && (
                            hasInvoice(asset) ? (
                              <button
                                type="button"
                                className="kebab-dropdown-item delete-action"
                                onClick={() => askRemoveInvoice(asset)}
                              >
                                <i className="ti ti-trash" />
                                <span className="item-label">Remove Invoice</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="kebab-dropdown-item view-action"
                                onClick={() => triggerInvoiceUpload(asset)}
                              >
                                <i className="ti ti-upload" />
                                <span className="item-label">Upload Invoice</span>
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="pagination-container">
            <div className="pagination-info">
              <span>Showing {showingStart} to {showingEnd} of {total} entries</span>
              <select
                className="page-size-select"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>Show {s}</option>)}
              </select>
            </div>
            <div className="pagination-controls">
              <button type="button" className="pagination-btn" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <i className="ti ti-angle-left" /> Previous
              </button>
              {getPageNumbers(safePage, totalPages).map((p, idx) => (
                p === '...' ? (
                  <span key={`el-${idx}`} className="pagination-btn" style={{ pointerEvents: 'none', background: 'transparent', border: 'none' }}>...</span>
                ) : (
                  <button key={p} type="button" className={`pagination-btn ${safePage === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                )
              ))}
              <button type="button" className="pagination-btn" disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                Next <i className="ti ti-angle-right" />
              </button>
            </div>
          </div>
        </div>
      ) : loadError ? (
        <div className="empty-state">
          <i className="ti ti-alert" />
          <h4>Unable to load assets</h4>
          <p>{loadError}</p>
          <button type="button" className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => loadAssetsList()}>
            <i className="ti ti-reload" /> Retry
          </button>
        </div>
      ) : (
        <div className="empty-state">
          <i className="ti ti-package" />
          <h4>No Assets Found</h4>
          {hasActiveFilters
            ? <p>Try adjusting filters or clearing them.</p>
            : <p>Add your first asset to start tracking inventory.</p>}
          {!hasActiveFilters && (
            <button type="button" className="btn btn-primary" style={{ marginTop: 12 }} onClick={openCreateModal}>
              <i className="ti ti-plus" /> Add Asset
            </button>
          )}
        </div>
      )}

      {/* ── Create / Edit Modal ─────────────────────────────────────── */}
      {formOpen && (
        <div className="crispr-modal-backdrop active" onClick={() => !isSaving && setFormOpen(false)}>
          <div className="crispr-modal-dialog" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
            <div className="crispr-modal-header" style={{ background: 'linear-gradient(135deg, #006073 0%, #005a6b 100%)' }}>
              <h3><i className={`ti ${isEditing ? 'ti-pencil' : 'ti-plus'}`} /> {isEditing ? 'Edit Asset' : 'Add Asset'}</h3>
              <button className="crispr-modal-close" onClick={() => !isSaving && setFormOpen(false)}>
                <i className="ti ti-close" />
              </button>
            </div>
            <div className="crispr-modal-body">
              <div className="batch-form-grid">
                <label>
                  <span>Name *</span>
                  <input type="text" className="search-input" value={draft.name} onChange={(e) => updateDraft('name', e.target.value)} />
                  {formErrors.name ? <small style={{ color: '#dc2626' }}>{formErrors.name}</small> : null}
                </label>
                <label>
                  <span>Type *</span>
                  <select className="search-input" value={draft.type} onChange={(e) => updateDraft('type', e.target.value)}>
                    <option value="">Select Type</option>
                    {ASSET_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {formErrors.type ? <small style={{ color: '#dc2626' }}>{formErrors.type}</small> : null}
                </label>
                <label>
                  <span>Code / Serial</span>
                  <input type="text" className="search-input" value={draft.code} onChange={(e) => updateDraft('code', e.target.value)} />
                </label>
                <label>
                  <span>Location ID</span>
                  <input type="number" className="search-input" value={draft.locationId} onChange={(e) => updateDraft('locationId', e.target.value)} />
                </label>
                <label>
                  <span>Original Value (₹) *</span>
                  <input type="number" min="0" step="0.01" className="search-input" value={draft.valueOriginal} onChange={(e) => updateDraft('valueOriginal', e.target.value)} />
                  {formErrors.valueOriginal ? <small style={{ color: '#dc2626' }}>{formErrors.valueOriginal}</small> : null}
                </label>
                <label>
                  <span>Current Value (₹) *</span>
                  <input type="number" min="0" step="0.01" className="search-input" value={draft.valueAtPurchase} onChange={(e) => updateDraft('valueAtPurchase', e.target.value)} />
                  {formErrors.valueAtPurchase ? <small style={{ color: '#dc2626' }}>{formErrors.valueAtPurchase}</small> : null}
                </label>
                <label>
                  <span>Yearly Depreciation % *</span>
                  <input type="number" min="0" max="100" step="0.01" className="search-input" value={draft.yearlyDepreciationPercentage} onChange={(e) => updateDraft('yearlyDepreciationPercentage', e.target.value)} />
                  {formErrors.yearlyDepreciationPercentage ? <small style={{ color: '#dc2626' }}>{formErrors.yearlyDepreciationPercentage}</small> : null}
                </label>
                <label>
                  <span>Purchase Date *</span>
                  <input type="date" className="search-input" value={draft.purchasedDate} onChange={(e) => updateDraft('purchasedDate', e.target.value)} />
                  {formErrors.purchasedDate ? <small style={{ color: '#dc2626' }}>{formErrors.purchasedDate}</small> : null}
                </label>
                {isEditing && (
                  <label>
                    <span>Status</span>
                    <select className="search-input" value={draft.status} onChange={(e) => updateDraft('status', Number(e.target.value))}>
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </select>
                  </label>
                )}
              </div>
            </div>
            <div className="crispr-modal-footer">
              <button type="button" className="qar-clear-btn" disabled={isSaving} onClick={() => setFormOpen(false)}>Cancel</button>
              <button type="button" className="qar-btn-export" disabled={isSaving} onClick={saveAsset}>
                {isSaving ? (<><i className="ti ti-reload" /> Saving...</>) : (<><i className="ti ti-check" /> {isEditing ? 'Save Changes' : 'Create Asset'}</>)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Export Modal ────────────────────────────────────────────── */}
      {exportOpen && (
        <div className="crispr-modal-backdrop active" onClick={() => !isExporting && setExportOpen(false)}>
          <div className="crispr-modal-dialog" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="crispr-modal-header" style={{ background: 'linear-gradient(135deg, #006073 0%, #005a6b 100%)' }}>
              <h3><i className="ti ti-download" /> Export Assets Report</h3>
              <button className="crispr-modal-close" onClick={() => !isExporting && setExportOpen(false)}>
                <i className="ti ti-close" />
              </button>
            </div>
            <div className="crispr-modal-body">
              <p>Choose the scope for the CSV export. Active filters will be applied to both options.</p>
              <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                <button type="button" className="qar-btn-export" disabled={isExporting} onClick={() => exportCSV('page')}>
                  <i className="ti ti-file-text" /> Current Page ({visibleAssets.length})
                </button>
                <button type="button" className="qar-btn-export" disabled={isExporting} onClick={() => exportCSV('all')}>
                  <i className="ti ti-files" /> All Matching ({total})
                </button>
              </div>
              {isExporting && <p style={{ marginTop: 12 }}><i className="ti ti-reload" /> Preparing export...</p>}
            </div>
          </div>
        </div>
      )}

      {/* Hidden invoice file input (triggered from kebab) */}
      <input
        ref={invoiceInputRef}
        type="file"
        accept="application/pdf,image/*"
        style={{ display: 'none' }}
        onChange={handleInvoiceFileSelected}
      />

      {/* Remove Invoice confirmation */}
      {removeInvoiceTarget && (
        <div className="crispr-modal-backdrop active" onClick={() => !isInvoiceBusy && setRemoveInvoiceTarget(null)}>
          <div className="crispr-modal-dialog" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="crispr-modal-header" style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' }}>
              <h3><i className="ti ti-trash" /> Remove Invoice</h3>
              <button className="crispr-modal-close" onClick={() => !isInvoiceBusy && setRemoveInvoiceTarget(null)}>
                <i className="ti ti-close" />
              </button>
            </div>
            <div className="crispr-modal-body">
              <p>
                Remove the attached invoice from <strong>{removeInvoiceTarget.name}</strong> (#{removeInvoiceTarget.id})?
              </p>
              <p style={{ color: '#6c757d', fontSize: 13, marginTop: 8 }}>
                This action cannot be undone. The invoice file will be permanently deleted.
              </p>
            </div>
            <div className="crispr-modal-footer">
              <button type="button" className="btn btn-default" disabled={isInvoiceBusy} onClick={() => setRemoveInvoiceTarget(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={isInvoiceBusy}
                onClick={confirmRemoveInvoice}
              >
                {isInvoiceBusy ? (<><i className="ti ti-reload" /> Removing...</>) : (<><i className="ti ti-trash" /> Remove Invoice</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
