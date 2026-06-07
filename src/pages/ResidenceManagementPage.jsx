import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';
import ToastRegion from '../components/ToastRegion';
import { Can, usePermission } from '../lib/userStore';
import { PERMS } from '../lib/permissions';
import {
  createResidence,
  disableResidence,
  getResidence,
  listHouses,
  listResidenceStudents,
  listResidences,
  mapCandidate,
  unmapCandidate,
  updateResidence,
} from '../lib/residencesApi';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const AMENITY_OPTIONS = ['AC', 'Washing Machine', 'Drinking Water', 'Power Backup', 'Ready to Move'];

const EMPTY_HOUSE = { house: '', capacity: '', floor: '', amenities: [] };

const EMPTY_DRAFT = {
  id: null,
  name: '',
  code: '',
  location: '',
  address: '',
  contact: '',
  wardenName: '',
  wardenContact: '',
  capacity: '',
  notes: '',
  housesBlueprint: [{ ...EMPTY_HOUSE }],
};

function parseAmenities(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function residenceToDraft(residence) {
  if (!residence) return { ...EMPTY_DRAFT };
  const houses = Array.isArray(residence.housesBlueprint) && residence.housesBlueprint.length > 0
    ? residence.housesBlueprint.map((h) => ({
        house: h.house || '',
        capacity: h.capacity ?? '',
        floor: h.floor ?? '',
        amenities: parseAmenities(h.amenities),
      }))
    : [{ ...EMPTY_HOUSE }];

  return {
    id: residence.id ?? residence._id ?? null,
    name: residence.name || '',
    code: residence.code || '',
    location: residence.location || '',
    address: residence.address || '',
    contact: residence.contact || '',
    wardenName: residence.wardenName || '',
    wardenContact: residence.wardenContact || '',
    capacity: residence.capacity ?? '',
    notes: residence.notes || '',
    housesBlueprint: houses,
  };
}

function buildPayload(draft) {
  const houses = (draft.housesBlueprint || [])
    .map((h) => ({
      house: String(h.house || '').trim(),
      capacity: Number(h.capacity) || 0,
      floor: Number(h.floor) || 0,
      amenities: parseAmenities(h.amenities),
    }))
    .filter((h) => h.house);

  return {
    name: draft.name.trim(),
    location: draft.location.trim(),
    address: draft.address.trim(),
    contact: draft.contact.trim(),
    wardenName: draft.wardenName.trim(),
    wardenContact: draft.wardenContact.trim(),
    code: draft.code.trim(),
    capacity: Number(draft.capacity) || 0,
    notes: draft.notes || '',
    housesBlueprint: houses,
  };
}

function getResidenceStatus(residence) {
  if (residence?.status) return residence.status;
  if (residence?.active === 0 || residence?.isActive === false || residence?.disabled) return 'Disabled';
  return 'Active';
}

function getStatusClass(status) {
  if (status === 'Disabled') return 'status-completed';
  return 'status-active';
}

function getCapacity(residence) {
  return Number(residence?.capacity ?? residence?.totalCapacity ?? 0);
}

function getOccupied(residence) {
  return Number(residence?.occupied ?? residence?.occupiedCount ?? 0);
}

function getAvailable(residence) {
  const cap = getCapacity(residence);
  const occ = getOccupied(residence);
  const available = Number(residence?.available ?? residence?.availableCount);
  if (Number.isFinite(available) && !Number.isNaN(available)) return available;
  return Math.max(0, cap - occ);
}

function formatDate(value) {
  if (!value) return '—';
  const numValue = Number(value);
  const date = Number.isFinite(numValue) && numValue > 0
    ? new Date(numValue < 1e11 ? numValue * 1000 : numValue)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()}`;
}

function getPageNumbers(currentPage, totalPages) {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
  for (let p = start; p <= end; p += 1) pages.push(p);
  return pages;
}

export default function ResidenceManagementPage() {
  const { can } = usePermission();
  const [residences, setResidences] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeKebabId, setActiveKebabId] = useState(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedResidence, setSelectedResidence] = useState(null);
  const [houses, setHouses] = useState([]);
  const [housesLoading, setHousesLoading] = useState(false);

  const [studentsModalOpen, setStudentsModalOpen] = useState(false);
  const [residenceStudents, setResidenceStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  const [mapDrawerOpen, setMapDrawerOpen] = useState(false);
  const [candidateQuery, setCandidateQuery] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedHouse, setSelectedHouse] = useState('');
  const [isMapping, setIsMapping] = useState(false);

  const [confirmAction, setConfirmAction] = useState(null); // { kind, payload, title, message }
  const [isConfirming, setIsConfirming] = useState(false);

  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  const kebabRef = useRef(null);

  const showToast = useCallback((type, title, message) => {
    const id = toastIdRef.current + 1;
    toastIdRef.current = id;
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const loadResidences = useCallback(async (signal = { cancelled: false }) => {
    setIsLoading(true);
    try {
      const response = await listResidences({
        activeOnly: statusFilter === 'active' ? 1 : 0,
        q: searchQuery.trim(),
        perPage: pageSize,
        page: currentPage,
      });
      if (signal.cancelled) return;

      const rows = response?.data || response?.residences || response || [];
      const meta = response?.meta || {};
      setResidences(Array.isArray(rows) ? rows : []);
      setTotal(Number(meta.total ?? (Array.isArray(rows) ? rows.length : 0)));
      setTotalPages(Number(meta.totalPages ?? Math.max(1, Math.ceil((meta.total ?? rows.length) / pageSize))));
    } catch (error) {
      if (!signal.cancelled) {
        setResidences([]);
        setTotal(0);
        setTotalPages(1);
        showToast('error', 'Network Error', error?.response?.data?.message || error.message || 'Failed to load residences.');
      }
    } finally {
      if (!signal.cancelled) setIsLoading(false);
    }
  }, [statusFilter, searchQuery, pageSize, currentPage, showToast]);

  useEffect(() => {
    const signal = { cancelled: false };
    loadResidences(signal);
    return () => { signal.cancelled = true; };
  }, [loadResidences]);

  useEffect(() => {
    const handleClick = (event) => {
      if (kebabRef.current && !kebabRef.current.contains(event.target)) {
        setActiveKebabId(null);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const safePage = Math.min(currentPage, totalPages);
  const showingStart = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const showingEnd = Math.min(safePage * pageSize, total);
  const paginationPages = useMemo(() => getPageNumbers(safePage, totalPages), [safePage, totalPages]);

  function toggleKebab(id, event) {
    event.stopPropagation();
    setActiveKebabId((current) => (current === id ? null : id));
  }

  function openCreateModal() {
    setIsEditing(false);
    setDraft({ ...EMPTY_DRAFT, housesBlueprint: [{ ...EMPTY_HOUSE }] });
    setFormErrors({});
    setFormModalOpen(true);
  }

  function openEditModal(residence) {
    setActiveKebabId(null);
    setIsEditing(true);
    setDraft(residenceToDraft(residence));
    setFormErrors({});
    setFormModalOpen(true);
  }

  function validateDraft(d) {
    const errors = {};
    if (!d.name.trim()) errors.name = 'Name is required';
    if (!d.address.trim()) errors.address = 'Address is required';
    if (!d.wardenName.trim()) errors.wardenName = 'Contact person is required';
    if (!d.wardenContact.trim()) errors.wardenContact = 'Contact number is required';
    if (!d.capacity || Number(d.capacity) < 1) errors.capacity = 'Capacity must be at least 1';
    if (!isEditing && !d.code.trim()) errors.code = 'Code is required';
    return errors;
  }

  async function handleSave() {
    const errors = validateDraft(draft);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      showToast('info', 'Validation', 'Please fix the highlighted fields.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = buildPayload(draft);
      if (isEditing && draft.id != null) {
        await updateResidence(draft.id, payload);
        showToast('success', 'Residence Updated', `${payload.name} has been updated.`);
      } else {
        await createResidence(payload);
        showToast('success', 'Residence Created', `${payload.name} has been created.`);
      }
      setFormModalOpen(false);
      loadResidences();
    } catch (error) {
      showToast('error', 'Save failed', error?.response?.data?.message || error.message || 'Could not save residence.');
    } finally {
      setIsSaving(false);
    }
  }

  function updateDraftField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((errs) => {
        const next = { ...errs };
        delete next[field];
        return next;
      });
    }
  }

  function updateHouseField(index, field, value) {
    setDraft((current) => {
      const next = [...current.housesBlueprint];
      next[index] = { ...next[index], [field]: value };
      return { ...current, housesBlueprint: next };
    });
  }

  function toggleHouseAmenity(index, amenity) {
    setDraft((current) => {
      const next = [...current.housesBlueprint];
      const currentAmenities = Array.isArray(next[index].amenities)
        ? next[index].amenities
        : parseAmenities(next[index].amenities);
      const has = currentAmenities.includes(amenity);
      const updated = has
        ? currentAmenities.filter((a) => a !== amenity)
        : [...currentAmenities, amenity];
      next[index] = { ...next[index], amenities: updated };
      return { ...current, housesBlueprint: next };
    });
  }

  function addHouseRow() {
    setDraft((current) => ({
      ...current,
      housesBlueprint: [...current.housesBlueprint, { ...EMPTY_HOUSE }],
    }));
  }

  function removeHouseRow(index) {
    setDraft((current) => {
      const next = current.housesBlueprint.filter((_, i) => i !== index);
      return { ...current, housesBlueprint: next.length === 0 ? [{ ...EMPTY_HOUSE }] : next };
    });
  }

  async function openDetails(residence) {
    setActiveKebabId(null);
    setSelectedResidence(residence);
    setDetailsModalOpen(true);
    setDetailsLoading(true);
    setHouses([]);
    try {
      const [detail, housesResp] = await Promise.all([
        getResidence(residence.id),
        listHouses(residence.id),
      ]);
      setSelectedResidence(detail?.data || detail?.residence || detail || residence);
      const houseRows = housesResp?.data || housesResp?.houses || housesResp || [];
      setHouses(Array.isArray(houseRows) ? houseRows : []);
    } catch (error) {
      showToast('error', 'Load failed', error?.response?.data?.message || error.message || 'Could not load residence details.');
    } finally {
      setDetailsLoading(false);
    }
  }

  async function loadHousesOnly(residenceId) {
    setHousesLoading(true);
    try {
      const resp = await listHouses(residenceId);
      const rows = resp?.data || resp?.houses || resp || [];
      setHouses(Array.isArray(rows) ? rows : []);
    } catch (error) {
      showToast('error', 'Refresh failed', error?.response?.data?.message || error.message || 'Could not refresh houses.');
    } finally {
      setHousesLoading(false);
    }
  }

  async function openStudentsModal(residence) {
    setActiveKebabId(null);
    setSelectedResidence(residence);
    setStudentsModalOpen(true);
    setStudentSearch('');
    await Promise.all([
      loadStudents(residence.id, ''),
      loadHousesOnly(residence.id),
    ]);
  }

  const loadStudents = useCallback(async (residenceId, q) => {
    if (!residenceId) return;
    setStudentsLoading(true);
    try {
      const resp = await listResidenceStudents(residenceId, { q, perPage: 100, page: 1 });
      const rows = resp?.data || resp?.students || resp || [];
      setResidenceStudents(Array.isArray(rows) ? rows : []);
    } catch (error) {
      setResidenceStudents([]);
      showToast('error', 'Load failed', error?.response?.data?.message || error.message || 'Could not load students.');
    } finally {
      setStudentsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!studentsModalOpen || !selectedResidence?.id) return undefined;
    const timer = setTimeout(() => {
      loadStudents(selectedResidence.id, studentSearch.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [studentSearch, studentsModalOpen, selectedResidence?.id, loadStudents]);

  function askDisable(residence) {
    setActiveKebabId(null);
    setConfirmAction({
      kind: 'disable',
      payload: residence,
      title: 'Disable Residence',
      message: `Are you sure you want to disable "${residence.name}"? It will no longer accept new mappings.`,
      confirmLabel: 'Disable',
      danger: true,
    });
  }

  function askUnmap(student) {
    setConfirmAction({
      kind: 'unmap',
      payload: student,
      title: 'Remove Student',
      message: `Remove ${student.name || student.candidateName || 'this student'} from ${selectedResidence?.name || 'this residence'}?`,
      confirmLabel: 'Remove',
      danger: true,
    });
  }

  async function runConfirm() {
    if (!confirmAction) return;
    setIsConfirming(true);
    try {
      if (confirmAction.kind === 'disable') {
        const r = confirmAction.payload;
        await disableResidence(r.id);
        showToast('success', 'Residence Disabled', `${r.name} has been disabled.`);
        loadResidences();
        if (detailsModalOpen && selectedResidence?.id === r.id) {
          setSelectedResidence((cur) => (cur ? { ...cur, status: 'Disabled', active: 0 } : cur));
        }
      } else if (confirmAction.kind === 'unmap') {
        const s = confirmAction.payload;
        const candidateId = s.candidateId ?? s.id;
        await unmapCandidate(candidateId);
        showToast('success', 'Student Removed', 'Student has been unmapped.');
        if (selectedResidence?.id) {
          await Promise.all([
            loadStudents(selectedResidence.id, studentSearch.trim()),
            loadHousesOnly(selectedResidence.id),
          ]);
        }
      }
      setConfirmAction(null);
    } catch (error) {
      showToast('error', 'Action failed', error?.response?.data?.message || error.message || 'Could not complete action.');
    } finally {
      setIsConfirming(false);
    }
  }

  function openMapDrawer() {
    setMapDrawerOpen(true);
    setCandidateQuery('');
    setSelectedCandidate(null);
    setSelectedHouse('');
    setCandidates([]);
  }

  const loadCandidates = useCallback(async (q) => {
    setCandidatesLoading(true);
    try {
      const response = await api.get('/restricted/people/candidate/list', {
        params: {
          page: 1,
          size: 30,
          sortBy: 'name',
          searchKey: q || undefined,
        },
      });
      const rows = response?.data?.data || [];
      setCandidates(Array.isArray(rows) ? rows : []);
    } catch (error) {
      setCandidates([]);
    } finally {
      setCandidatesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mapDrawerOpen) return undefined;
    const timer = setTimeout(() => {
      loadCandidates(candidateQuery.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [candidateQuery, mapDrawerOpen, loadCandidates]);

  async function submitMapping() {
    if (!selectedCandidate) {
      showToast('info', 'Select student', 'Please choose a student first.');
      return;
    }
    if (!selectedHouse) {
      showToast('info', 'Select house', 'Please choose a house.');
      return;
    }
    setIsMapping(true);
    try {
      await mapCandidate({
        candidateId: selectedCandidate.id,
        residenceId: selectedResidence.id,
        house: selectedHouse,
      });
      showToast('success', 'Student Mapped', `${selectedCandidate.name} has been allotted to ${selectedHouse}.`);
      setMapDrawerOpen(false);
      await Promise.all([
        loadStudents(selectedResidence.id, studentSearch.trim()),
        loadHousesOnly(selectedResidence.id),
      ]);
    } catch (error) {
      showToast('error', 'Mapping failed', error?.response?.data?.message || error.message || 'Could not map student.');
    } finally {
      setIsMapping(false);
    }
  }

  return (
    <section className="batch-management-page data-table-page">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((t) => t.id !== id))} />

      <div className="page-header-section">
        <div className="page-header-title-group">
          <span className="page-header-icon-box"><i className="fa fa-home" /></span>
          <div>
            <h2>Residences</h2>
            <p>Manage student residences, houses, occupancy, and student allotments.</p>
          </div>
        </div>
        <Can permission={PERMS.RESIDENCES_EDIT}>
          <button type="button" className="create-batch-button" onClick={openCreateModal}>
            <i className="ti ti-plus" /> Add Residence
          </button>
        </Can>
      </div>

      <div className="filter-bar">
        <div className="search-wrapper">
          <i
            className={`ti ${searchQuery ? 'ti-close' : 'ti-search'}`}
            onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
            aria-hidden="true"
          />
          <input
            type="text"
            className="search-input"
            value={searchQuery}
            onChange={(event) => { setSearchQuery(event.target.value); setCurrentPage(1); }}
            placeholder="Search residences by name, code, or address..."
          />
        </div>
        <select
          className="search-input"
          style={{ maxWidth: 180 }}
          value={statusFilter}
          onChange={(event) => { setStatusFilter(event.target.value); setCurrentPage(1); }}
        >
          <option value="active">Active only</option>
          <option value="all">All statuses</option>
        </select>
      </div>

      {(!isLoading && total === 0) ? (
        <div className="empty-state">
          <i className="ti ti-home" />
          <h3>No Residences Found</h3>
          <p>Add your first residence to start managing student housing.</p>
          <button type="button" className="legacy-btn legacy-btn-success" onClick={openCreateModal}>
            <i className="ti ti-plus" /> Add Residence
          </button>
        </div>
      ) : null}

      {(total > 0 || isLoading) && (
        <div className="students-table-container">
          <table className="students-table">
            <thead>
              <tr>
                <th>Residence</th>
                <th>Address</th>
                <th className="center-align">Capacity</th>
                <th className="center-align">Occupied</th>
                <th className="center-align">Available</th>
                <th className="center-align">Status</th>
                <th className="center-align actions-column">Actions</th>
              </tr>
            </thead>
            {isLoading ? (
              <tbody>
                {Array.from({ length: 8 }, (_, index) => (
                  <tr key={`sk-${index}`}>
                    <td>
                      <div className="batch-skeleton long" />
                      <div className="batch-skeleton medium small-gap" />
                    </td>
                    <td><div className="batch-skeleton medium" /></td>
                    <td><div className="batch-skeleton short centered" /></td>
                    <td><div className="batch-skeleton short centered" /></td>
                    <td><div className="batch-skeleton short centered" /></td>
                    <td><div className="batch-skeleton short centered" /></td>
                    <td><div className="batch-skeleton icon centered" /></td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody ref={kebabRef}>
                {residences.map((residence) => {
                  const capacity = getCapacity(residence);
                  const occupied = getOccupied(residence);
                  const available = getAvailable(residence);
                  const status = getResidenceStatus(residence);
                  const occupancyPct = capacity > 0 ? Math.min(100, Math.round((occupied / capacity) * 100)) : 0;
                  return (
                    <tr key={residence.id} className={activeKebabId === residence.id ? 'row-active-menu' : ''}>
                      <td>
                        <div className="batch-name-container">
                          <div className="batch-name">{residence.name}</div>
                          {residence.code ? (
                            <span className="batch-journey-tag">{residence.code}</span>
                          ) : null}
                        </div>
                        {residence.location ? (
                          <div className="batch-description"><i className="ti ti-location-pin" /> {residence.location}</div>
                        ) : null}
                      </td>
                      <td>
                        <div className="course-info">{residence.address || '—'}</div>
                        {residence.wardenName ? (
                          <div className="course-info muted">
                            <i className="ti ti-user" /> {residence.wardenName}
                            {residence.wardenContact ? ` · ${residence.wardenContact}` : ''}
                          </div>
                        ) : null}
                      </td>
                      <td className="center-align">{capacity}</td>
                      <td className="center-align">
                        <div className="student-count">{occupied}</div>
                        <div className="course-info muted" style={{ marginTop: 4 }}>
                          <div
                            aria-hidden="true"
                            style={{
                              width: 80,
                              height: 6,
                              background: 'rgba(0,0,0,0.08)',
                              borderRadius: 999,
                              overflow: 'hidden',
                              margin: '0 auto',
                            }}
                          >
                            <div style={{
                              width: `${occupancyPct}%`,
                              height: '100%',
                              background: occupancyPct >= 90 ? '#dc2626' : occupancyPct >= 70 ? '#d97706' : '#059669',
                            }} />
                          </div>
                          <span style={{ fontSize: 11 }}>{occupancyPct}%</span>
                        </div>
                      </td>
                      <td className="center-align">
                        {available === 0 ? (
                          <span className="badge badge-warning"><i className="ti ti-alert" /> Full</span>
                        ) : available}
                      </td>
                      <td className="center-align">
                        <span className={`batch-status ${getStatusClass(status)}`}>{status}</span>
                      </td>
                      <td className={`center-align ${activeKebabId === residence.id ? 'cell-active-menu' : ''}`}>
                        <div className="kebab-menu-container">
                          <button type="button" className="kebab-button" onClick={(e) => toggleKebab(residence.id, e)}>
                            <i className="ti ti-more-alt" />
                          </button>
                          <div className={`kebab-dropdown ${activeKebabId === residence.id ? 'active' : ''}`}>
                            <button type="button" className="kebab-dropdown-item view-profile" onClick={() => openDetails(residence)}>
                              <i className="ti ti-eye" />
                              <span className="item-label">View Details</span>
                            </button>
                            {can(PERMS.RESIDENCES_STUDENTS_EDIT) && (
                              <button type="button" className="kebab-dropdown-item manage-students" onClick={() => openStudentsModal(residence)}>
                                <i className="ti ti-user" />
                                <span className="item-label">Manage Students</span>
                              </button>
                            )}
                            {can(PERMS.RESIDENCES_EDIT) && (
                              <button type="button" className="kebab-dropdown-item edit-action" onClick={() => openEditModal(residence)}>
                                <i className="ti ti-pencil" />
                                <span className="item-label">Edit Residence</span>
                              </button>
                            )}
                            {status !== 'Disabled' && can(PERMS.RESIDENCES_DISABLE) && (
                              <button type="button" className="kebab-dropdown-item draft-action" onClick={() => askDisable(residence)}>
                                <i className="ti ti-na" />
                                <span className="item-label">Disable</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>

          <div className="pagination-container">
            <div className="pagination-info">
              <span>Showing {showingStart} to {showingEnd} of {total} entries</span>
              <select
                className="page-size-select"
                value={pageSize}
                onChange={(event) => { setPageSize(Number(event.target.value)); setCurrentPage(1); }}
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>Show {n}</option>
                ))}
              </select>
            </div>
            <div className="pagination-controls">
              <button type="button" className="pagination-btn" disabled={safePage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                <i className="ti ti-angle-left" /> Previous
              </button>
              {paginationPages.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`pagination-btn ${safePage === p ? 'active' : ''}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="pagination-btn"
                disabled={safePage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <i className="ti ti-angle-right" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit Modal ───────────────────────────────────────── */}
      <div className={`legacy-modal-backdrop ${formModalOpen ? 'active' : ''}`} onClick={() => !isSaving && setFormModalOpen(false)}>
        <div className="legacy-modal-dialog legacy-large" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <div className="legacy-modal-header">
            <h3>{isEditing ? 'Edit Residence' : 'Add Residence'}</h3>
            <button type="button" className="legacy-modal-close" onClick={() => !isSaving && setFormModalOpen(false)}>
              <i className="ti ti-close" />
            </button>
          </div>
          <div className="legacy-modal-body">
            <div className="batch-form-grid">
              <label>
                <span>Name *</span>
                <input
                  type="text"
                  className="search-input"
                  value={draft.name}
                  onChange={(e) => updateDraftField('name', e.target.value)}
                />
                {formErrors.name ? <small style={{ color: '#dc2626' }}>{formErrors.name}</small> : null}
              </label>
              <label>
                <span>Code {isEditing ? '' : '*'}</span>
                <input
                  type="text"
                  className="search-input"
                  value={draft.code}
                  onChange={(e) => updateDraftField('code', e.target.value)}
                  disabled={isEditing}
                />
                {formErrors.code ? <small style={{ color: '#dc2626' }}>{formErrors.code}</small> : null}
              </label>
              <label>
                <span>Location</span>
                <input
                  type="text"
                  className="search-input"
                  value={draft.location}
                  onChange={(e) => updateDraftField('location', e.target.value)}
                />
              </label>
              <label>
                <span>Total Capacity *</span>
                <input
                  type="number"
                  min="1"
                  className="search-input"
                  value={draft.capacity}
                  onChange={(e) => updateDraftField('capacity', e.target.value)}
                />
                {formErrors.capacity ? <small style={{ color: '#dc2626' }}>{formErrors.capacity}</small> : null}
              </label>
              <label className="full-span">
                <span>Address *</span>
                <input
                  type="text"
                  className="search-input"
                  value={draft.address}
                  onChange={(e) => updateDraftField('address', e.target.value)}
                />
                {formErrors.address ? <small style={{ color: '#dc2626' }}>{formErrors.address}</small> : null}
              </label>
              <label>
                <span>Contact Person *</span>
                <input
                  type="text"
                  className="search-input"
                  value={draft.wardenName}
                  onChange={(e) => updateDraftField('wardenName', e.target.value)}
                />
                {formErrors.wardenName ? <small style={{ color: '#dc2626' }}>{formErrors.wardenName}</small> : null}
              </label>
              <label>
                <span>Contact Number *</span>
                <input
                  type="text"
                  className="search-input"
                  value={draft.wardenContact}
                  onChange={(e) => updateDraftField('wardenContact', e.target.value)}
                />
                {formErrors.wardenContact ? <small style={{ color: '#dc2626' }}>{formErrors.wardenContact}</small> : null}
              </label>
              <label>
                <span>Alternate Contact</span>
                <input
                  type="text"
                  className="search-input"
                  value={draft.contact}
                  onChange={(e) => updateDraftField('contact', e.target.value)}
                />
              </label>
              <label className="full-span">
                <span>Notes</span>
                <textarea
                  className="search-input textarea-like"
                  rows={2}
                  value={draft.notes}
                  onChange={(e) => updateDraftField('notes', e.target.value)}
                />
              </label>
            </div>

            <div style={{ marginTop: 16 }}>
              <div className="page-header-section" style={{ marginBottom: 8 }}>
                <div>
                  <h3 style={{ fontSize: 16, margin: 0 }}>Houses</h3>
                  <p style={{ fontSize: 12, margin: 0 }}>Define the houses/rooms inside this residence.</p>
                </div>
                <button type="button" className="legacy-btn legacy-btn-success" onClick={addHouseRow}>
                  <i className="ti ti-plus" /> Add House
                </button>
              </div>
              <div className="students-table-container" style={{ marginTop: 0 }}>
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>House Code</th>
                      <th className="center-align">Capacity</th>
                      <th className="center-align">Floor</th>
                      <th>Amenities</th>
                      <th className="center-align actions-column">&nbsp;</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.housesBlueprint.map((house, index) => (
                      <tr key={index}>
                        <td>
                          <input
                            type="text"
                            className="search-input"
                            value={house.house}
                            placeholder="e.g. CRG001-01"
                            onChange={(e) => updateHouseField(index, 'house', e.target.value)}
                          />
                        </td>
                        <td className="center-align">
                          <input
                            type="number"
                            min="1"
                            className="search-input"
                            value={house.capacity}
                            onChange={(e) => updateHouseField(index, 'capacity', e.target.value)}
                          />
                        </td>
                        <td className="center-align">
                          <input
                            type="number"
                            className="search-input"
                            value={house.floor}
                            onChange={(e) => updateHouseField(index, 'floor', e.target.value)}
                          />
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {AMENITY_OPTIONS.map((amenity) => {
                              const selected = Array.isArray(house.amenities)
                                ? house.amenities.includes(amenity)
                                : false;
                              return (
                                <button
                                  key={amenity}
                                  type="button"
                                  className={`batch-course-badge${selected ? '' : ''}`}
                                  onClick={() => toggleHouseAmenity(index, amenity)}
                                  style={{
                                    cursor: 'pointer',
                                    border: selected ? '1px solid #006073' : '1px solid rgba(0,0,0,0.12)',
                                    background: selected ? '#006073' : '#fff',
                                    color: selected ? '#fff' : 'rgba(0,0,0,0.7)',
                                    padding: '4px 10px',
                                    borderRadius: 999,
                                    fontSize: 12,
                                    lineHeight: 1.4,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                  }}
                                >
                                  <i className={`ti ${selected ? 'ti-check' : 'ti-plus'}`} />
                                  {amenity}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="center-align">
                          <button type="button" className="kebab-button" title="Remove" onClick={() => removeHouseRow(index)}>
                            <i className="ti ti-trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="legacy-modal-footer" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: 16 }}>
            <button type="button" className="legacy-btn" disabled={isSaving} onClick={() => setFormModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="legacy-btn legacy-btn-success" disabled={isSaving} onClick={handleSave}>
              {isSaving ? (<><i className="ti ti-reload" /> Saving...</>) : (<><i className="ti ti-check" /> {isEditing ? 'Save Changes' : 'Create Residence'}</>)}
            </button>
          </div>
        </div>
      </div>

      {/* ── Details Modal ─────────────────────────────────────────────── */}
      <div className={`legacy-modal-backdrop ${detailsModalOpen ? 'active' : ''}`} onClick={() => setDetailsModalOpen(false)}>
        <div className="legacy-modal-dialog legacy-large" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <div className="legacy-modal-header">
            <h3>{selectedResidence?.name || 'Residence Details'}</h3>
            <button type="button" className="legacy-modal-close" onClick={() => setDetailsModalOpen(false)}>
              <i className="ti ti-close" />
            </button>
          </div>
          <div className="legacy-modal-body">
            {detailsLoading ? (
              <div style={{ padding: 24 }}>
                <div className="batch-skeleton long" />
                <div className="batch-skeleton medium small-gap" />
                <div className="batch-skeleton medium small-gap" />
              </div>
            ) : selectedResidence ? (
              <>
                <div className="batch-form-grid">
                  <div>
                    <small>Code</small>
                    <div className="batch-name">{selectedResidence.code || '—'}</div>
                  </div>
                  <div>
                    <small>Location</small>
                    <div className="batch-name">{selectedResidence.location || '—'}</div>
                  </div>
                  <div className="full-span">
                    <small>Address</small>
                    <div>{selectedResidence.address || '—'}</div>
                  </div>
                  <div>
                    <small>Contact Person</small>
                    <div>{selectedResidence.wardenName || '—'}</div>
                  </div>
                  <div>
                    <small>Contact Number</small>
                    <div>{selectedResidence.wardenContact || '—'}</div>
                  </div>
                  <div>
                    <small>Created</small>
                    <div>{formatDate(selectedResidence.createdAt || selectedResidence.dateCreated)}</div>
                  </div>
                  <div>
                    <small>Status</small>
                    <div>
                      <span className={`batch-status ${getStatusClass(getResidenceStatus(selectedResidence))}`}>
                        {getResidenceStatus(selectedResidence)}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, margin: '16px 0' }}>
                  <OccupancyCard label="Total Capacity" value={getCapacity(selectedResidence)} color="#0891b2" />
                  <OccupancyCard label="Occupied" value={getOccupied(selectedResidence)} color="#d97706" />
                  <OccupancyCard label="Available" value={getAvailable(selectedResidence)} color="#059669" />
                </div>

                <div className="page-header-section" style={{ marginBottom: 8 }}>
                  <div>
                    <h3 style={{ fontSize: 16, margin: 0 }}>Houses</h3>
                    <p style={{ fontSize: 12, margin: 0 }}>Live occupancy by house.</p>
                  </div>
                </div>
                <div className="students-table-container">
                  <table className="students-table">
                    <thead>
                      <tr>
                        <th>House</th>
                        <th className="center-align">Floor</th>
                        <th className="center-align">Capacity</th>
                        <th className="center-align">Occupied</th>
                        <th className="center-align">Available</th>
                        <th>Amenities</th>
                      </tr>
                    </thead>
                    <tbody>
                      {houses.length === 0 ? (
                        <tr><td colSpan={6} className="center-align muted">No houses defined.</td></tr>
                      ) : houses.map((h) => {
                        const hCap = Number(h.capacity || 0);
                        const hOcc = Number(h.occupied ?? h.occupiedCount ?? 0);
                        const hAvail = Number(h.available ?? h.availableCount ?? Math.max(0, hCap - hOcc));
                        const pct = hCap > 0 ? Math.min(100, Math.round((hOcc / hCap) * 100)) : 0;
                        return (
                          <tr key={h.house}>
                            <td><div className="batch-name">{h.house}</div></td>
                            <td className="center-align">{h.floor ?? '—'}</td>
                            <td className="center-align">{hCap}</td>
                            <td className="center-align">
                              {hOcc}
                              <div aria-hidden="true" style={{
                                width: 80, height: 6, background: 'rgba(0,0,0,0.08)', borderRadius: 999,
                                overflow: 'hidden', margin: '4px auto 0',
                              }}>
                                <div style={{
                                  width: `${pct}%`,
                                  height: '100%',
                                  background: pct >= 90 ? '#dc2626' : pct >= 70 ? '#d97706' : '#059669',
                                }} />
                              </div>
                            </td>
                            <td className="center-align">
                              {hAvail === 0 ? (
                                <span className="badge badge-warning">Full</span>
                              ) : hAvail}
                            </td>
                            <td>
                              {parseAmenities(h.amenities).map((a) => (
                                <span key={a} className="batch-course-badge" style={{ marginRight: 4 }}>{a}</span>
                              ))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </div>
          <div className="legacy-modal-footer" style={{ display: 'flex', gap: 8, justifyContent: 'space-between', padding: 16 }}>
            <button type="button" className="legacy-btn" onClick={() => setDetailsModalOpen(false)}>Close</button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="legacy-btn" onClick={() => selectedResidence && openStudentsModal(selectedResidence)}>
                <i className="ti ti-user" /> Manage Students
              </button>
              <button type="button" className="legacy-btn legacy-btn-success" onClick={() => selectedResidence && openEditModal(selectedResidence)}>
                <i className="ti ti-pencil" /> Edit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Students Modal ────────────────────────────────────────────── */}
      <div className={`legacy-modal-backdrop ${studentsModalOpen ? 'active' : ''}`} onClick={() => setStudentsModalOpen(false)}>
        <div className="legacy-modal-dialog legacy-large" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <div className="legacy-modal-header">
            <h3>Students · {selectedResidence?.name || ''}</h3>
            <button type="button" className="legacy-modal-close" onClick={() => setStudentsModalOpen(false)}>
              <i className="ti ti-close" />
            </button>
          </div>
          <div className="legacy-modal-body">
            <div className="filter-bar" style={{ marginTop: 0 }}>
              <div className="search-wrapper">
                <i
                  className={`ti ${studentSearch ? 'ti-close' : 'ti-search'}`}
                  onClick={() => setStudentSearch('')}
                  aria-hidden="true"
                />
                <input
                  type="text"
                  className="search-input"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search students..."
                />
              </div>
              <button type="button" className="create-batch-button" onClick={openMapDrawer}>
                <i className="ti ti-plus" /> Allot Student
              </button>
            </div>

            <div className="students-table-container">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Candidate ID</th>
                    <th>Name</th>
                    <th>Mobile</th>
                    <th>Accommodation</th>
                    <th>House</th>
                    <th>Mapped Date</th>
                    <th className="center-align actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsLoading ? (
                    Array.from({ length: 5 }, (_, i) => (
                      <tr key={`stsk-${i}`}>
                        {Array.from({ length: 7 }, (_, j) => (
                          <td key={j}><div className="batch-skeleton medium" /></td>
                        ))}
                      </tr>
                    ))
                  ) : residenceStudents.length === 0 ? (
                    <tr><td colSpan={7} className="center-align muted">No students mapped yet.</td></tr>
                  ) : residenceStudents.map((s) => (
                    <tr key={s.candidateId ?? s.id}>
                      <td>{s.candidateId ?? s.id}</td>
                      <td><div className="batch-name">{s.name || s.candidateName}</div></td>
                      <td>{s.mobile || s.phone || '—'}</td>
                      <td>{s.accommodationType || '—'}</td>
                      <td>{s.house || '—'}</td>
                      <td>{formatDate(s.mappedDate || s.mappedAt || s.createdAt)}</td>
                      <td className="center-align">
                        <button type="button" className="legacy-btn" onClick={() => askUnmap(s)}>
                          <i className="ti ti-trash" /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="legacy-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', padding: 16 }}>
            <button type="button" className="legacy-btn" onClick={() => setStudentsModalOpen(false)}>Close</button>
          </div>
        </div>
      </div>

      {/* ── Map Student Drawer ────────────────────────────────────────── */}
      <div className={`legacy-modal-backdrop ${mapDrawerOpen ? 'active' : ''}`} onClick={() => !isMapping && setMapDrawerOpen(false)}>
        <div className="legacy-modal-dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <div className="legacy-modal-header">
            <h3>Allot Student to {selectedResidence?.name || ''}</h3>
            <button type="button" className="legacy-modal-close" onClick={() => !isMapping && setMapDrawerOpen(false)}>
              <i className="ti ti-close" />
            </button>
          </div>
          <div className="legacy-modal-body">
            <label style={{ display: 'block', marginBottom: 12 }}>
              <span>Search Student</span>
              <input
                type="text"
                className="search-input"
                value={candidateQuery}
                onChange={(e) => setCandidateQuery(e.target.value)}
                placeholder="Search by name, mobile or ID..."
              />
            </label>
            <div className="students-table-container" style={{ maxHeight: 240, overflowY: 'auto' }}>
              <table className="students-table">
                <thead>
                  <tr>
                    <th>&nbsp;</th>
                    <th>Name</th>
                    <th>Mobile</th>
                  </tr>
                </thead>
                <tbody>
                  {candidatesLoading ? (
                    <tr><td colSpan={3} className="center-align muted">Loading...</td></tr>
                  ) : candidates.length === 0 ? (
                    <tr><td colSpan={3} className="center-align muted">Type to search students</td></tr>
                  ) : candidates.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCandidate(c)}
                      className={selectedCandidate?.id === c.id ? 'row-active-menu' : ''}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="center-align">
                        <input type="radio" readOnly checked={selectedCandidate?.id === c.id} />
                      </td>
                      <td><div className="batch-name">{c.name}</div></td>
                      <td>{c.mobile || c.phone || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <label style={{ display: 'block', marginTop: 12 }}>
              <span>Select House</span>
              <select
                className="search-input"
                value={selectedHouse}
                onChange={(e) => setSelectedHouse(e.target.value)}
              >
                <option value="">Choose a house...</option>
                {houses.map((h) => {
                  const hCap = Number(h.capacity || 0);
                  const hOcc = Number(h.occupied ?? h.occupiedCount ?? 0);
                  const hAvail = Number(h.available ?? h.availableCount ?? Math.max(0, hCap - hOcc));
                  const disabled = hAvail <= 0;
                  return (
                    <option key={h.house} value={h.house} disabled={disabled}>
                      {h.house} — {hAvail}/{hCap} available{disabled ? ' (Full)' : ''}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>
          <div className="legacy-modal-footer" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: 16 }}>
            <button type="button" className="legacy-btn" disabled={isMapping} onClick={() => setMapDrawerOpen(false)}>Cancel</button>
            <button type="button" className="legacy-btn legacy-btn-success" disabled={isMapping || !selectedCandidate || !selectedHouse} onClick={submitMapping}>
              {isMapping ? (<><i className="ti ti-reload" /> Mapping...</>) : (<><i className="ti ti-check" /> Confirm Mapping</>)}
            </button>
          </div>
        </div>
      </div>

      {/* ── Confirm Dialog ────────────────────────────────────────────── */}
      <div className={`legacy-modal-backdrop ${confirmAction ? 'active' : ''}`} onClick={() => !isConfirming && setConfirmAction(null)}>
        <div className="legacy-modal-dialog legacy-confirm" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <div className={`legacy-modal-header ${confirmAction?.danger ? 'legacy-danger-header' : ''}`}>
            <h3>{confirmAction?.danger && <i className="ti ti-alert" />} {confirmAction?.title || 'Confirm'}</h3>
            <button type="button" className="legacy-modal-close" onClick={() => !isConfirming && setConfirmAction(null)}>
              <i className="ti ti-close" />
            </button>
          </div>
          <div className="legacy-modal-body">
            <p className="legacy-confirm-copy">{confirmAction?.message}</p>
          </div>
          <div className="legacy-modal-footer">
            <button type="button" className="legacy-btn legacy-btn-default" disabled={isConfirming} onClick={() => setConfirmAction(null)}>Cancel</button>
            <button
              type="button"
              className={`legacy-btn ${confirmAction?.danger ? 'legacy-btn-danger' : 'legacy-btn-success'}`}
              disabled={isConfirming}
              onClick={runConfirm}
            >
              {isConfirming ? 'Working...' : (confirmAction?.confirmLabel || 'Confirm')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function OccupancyCard({ label, value, color }) {
  return (
    <div style={{
      border: '1px solid rgba(0,0,0,0.08)',
      borderRadius: 8,
      padding: 12,
      background: '#fff',
    }}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
    </div>
  );
}
