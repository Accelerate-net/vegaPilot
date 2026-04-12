import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ToastRegion from '../components/ToastRegion';
import { availableBatches, availableCourses, ensureAttempts } from '../data/attemptReportsDemo';
import { examsDemo } from '../data/examsDemo';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(value) {
  if (!value) return 'Not set';
  const d = new Date(value);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  const mm = String(minutes).padStart(2, '0');
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${h12}:${mm} ${ampm}`;
}

function formatMinutes(startedAt, completedAt) {
  if (!startedAt || !completedAt) return '-';
  const diff = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${mins} min ${secs} sec`;
}

function getExamFromStorage(examId) {
  const handoff = window.localStorage.getItem('reportExamData');
  if (handoff) {
    try {
      window.localStorage.removeItem('reportExamData');
      return JSON.parse(handoff);
    } catch (error) {
      console.error('Failed to parse reportExamData', error);
    }
  }
  const drafts = JSON.parse(window.localStorage.getItem('examDrafts') || '[]');
  const published = JSON.parse(window.localStorage.getItem('publishedExams') || '[]');
  return [...published, ...drafts, ...examsDemo].find((exam) => String(exam.id) === String(examId)) || null;
}

function getStatusLabel(status) {
  const map = { draft: 'Draft', published: 'Published', scheduled: 'Scheduled', completed: 'Completed', archived: 'Archived', 1: 'Published' };
  return map[status] || String(status);
}

function getRankClass(rank) {
  if (rank === 1) return 'ear-rank-1';
  if (rank === 2) return 'ear-rank-2';
  if (rank === 3) return 'ear-rank-3';
  return 'ear-rank-other';
}

function getScoreClass(percentage) {
  if (percentage >= 90) return 'ear-score-excellent';
  if (percentage >= 75) return 'ear-score-good';
  if (percentage >= 60) return 'ear-score-average';
  return 'ear-score-poor';
}

function getPageNumbers(currentPage, totalPages) {
  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else if (currentPage <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push('...');
    pages.push(totalPages);
  } else if (currentPage >= totalPages - 3) {
    pages.push(1);
    pages.push('...');
    for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    pages.push('...');
    for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
    pages.push('...');
    pages.push(totalPages);
  }
  return pages;
}

// ─── BatchMultiselect ──────────────────────────────────────────────────────────

function BatchMultiselect({ batches, selected, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function getLabel() {
    if (!selected.length) return 'All Batches';
    if (selected.length === 1) {
      const b = batches.find((batch) => batch.id === selected[0]);
      return b ? b.name : '1 selected';
    }
    return `${selected.length} batches selected`;
  }

  function toggleBatch(id) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  return (
    <div className="ear-batch-multiselect" ref={ref}>
      <button
        type="button"
        className={`ear-batch-trigger${disabled ? ' disabled' : ''}`}
        onClick={() => !disabled && setOpen((v) => !v)}
      >
        <span>{getLabel()}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {selected.length > 0 && <span className="ear-batch-count">{selected.length}</span>}
          <i className="ti ti-angle-down" />
        </span>
      </button>
      {open && !disabled && (
        <div className="ear-batch-dropdown">
          <div className="ear-batch-actions">
            <button type="button" className="ear-batch-select-all" onClick={() => onChange(batches.map((b) => b.id))}>Select All</button>
            <button type="button" className="ear-batch-clear-all" onClick={() => onChange([])}>Clear All</button>
          </div>
          {batches.length === 0 ? (
            <div className="ear-batch-empty">No batches available for this course</div>
          ) : (
            batches.map((batch) => (
              <label key={batch.id} className={`ear-batch-item${selected.includes(batch.id) ? ' selected' : ''}`}>
                <input type="checkbox" checked={selected.includes(batch.id)} onChange={() => toggleBatch(batch.id)} />
                <span>{batch.name}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── KebabMenu ────────────────────────────────────────────────────────────────

function KebabMenu({ ranking, onViewAttempt, onResetAttempt, onDownloadReport }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="ear-kebab-container" ref={ref}>
      <button
        type="button"
        className="ear-kebab-button"
        onClick={(event) => { event.stopPropagation(); setOpen((v) => !v); }}
      >
        <i className="ti ti-more-alt" />
      </button>
      {open && (
        <div className="ear-kebab-dropdown">
          <button
            type="button"
            className="ear-kebab-item"
            onClick={() => { setOpen(false); onViewAttempt(ranking); }}
          >
            <i className="ti ti-eye" /> View Attempt
          </button>
          <button
            type="button"
            className="ear-kebab-item ear-kebab-download"
            onClick={() => { setOpen(false); onDownloadReport(ranking); }}
          >
            <i className="ti ti-download" /> Download Report
          </button>
          {ranking.status === 'completed' && (
            <button
              type="button"
              className="ear-kebab-item ear-kebab-reset"
              onClick={() => { setOpen(false); onResetAttempt(ranking); }}
            >
              <i className="ti ti-reload" /> Reset Attempt
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExamAttemptReportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');
  const [selectedBatchFilters, setSelectedBatchFilters] = useState([]);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState('rank');
  const [sortDirection, setSortDirection] = useState('asc');

  // Modal states
  const [showReEvaluateModal, setShowReEvaluateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [viewAttemptItem, setViewAttemptItem] = useState(null);
  const [resetAttemptItem, setResetAttemptItem] = useState(null);

  const [exportColumns, setExportColumns] = useState({
    rank: true,
    studentName: true,
    rollNumber: true,
    totalScore: true,
    percentage: true,
    totalAttempts: true,
    correctAttempts: true,
    wrongAttempts: true,
  });

  const [toasts, setToasts] = useState([]);

  const [exam] = useState(() => ensureAttempts(
    getExamFromStorage(params.get('exam')) || {
      id: params.get('exam') || 'EXAM-001',
      title: 'IAT 2026 - Full Length Mock Test 1',
      brief: 'Comprehensive mock test for IISER Aptitude Test 2026 preparation.',
      duration: 180,
      totalQuestions: 60,
      maximumMarks: 240,
      numberOfSections: 3,
      sectionsData: [{ name: 'Mathematics', questions: [{ qi: 1000 }] }, { name: 'Physics', questions: [{ qi: 1001 }] }],
      status: 1,
    },
    { totalQuestions: 60, maximumMarks: 240, count: 18 },
  ));

  function showToast(type, title, message) {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 5000);
  }

  const sections = useMemo(() => {
    if (Array.isArray(exam.sectionsData)) return exam.sectionsData;
    try { return JSON.parse(exam.sectionsData || '[]'); } catch { return []; }
  }, [exam]);

  const rankings = useMemo(() => {
    const maximumMarks = exam.maximumMarks || 240;
    const completed = (exam.attempts || [])
      .filter((a) => a.status === 'completed')
      .sort((a, b) => b.score - a.score)
      .map((a, i, list) => ({
        ...a,
        rank: i > 0 && list[i - 1].score === a.score ? list[i - 1].rank : i + 1,
        percentage: Math.round((a.score / maximumMarks) * 100),
        timeTaken: formatMinutes(a.startedAt, a.completedAt),
      }));
    const progress = (exam.attempts || [])
      .filter((a) => a.status !== 'completed')
      .map((a) => ({ ...a, rank: '-', percentage: 0, timeTaken: '-' }));
    return [...completed, ...progress];
  }, [exam]);

  const averageScore = useMemo(() => {
    const done = rankings.filter((r) => r.status === 'completed');
    if (!done.length) return 0;
    return Math.round(done.reduce((sum, r) => sum + r.percentage, 0) / done.length);
  }, [rankings]);

  const filteredBatches = useMemo(
    () => availableBatches.filter((b) => !selectedCourseFilter || b.courseId === selectedCourseFilter),
    [selectedCourseFilter],
  );

  const filteredRankings = useMemo(() => {
    let next = [...rankings];
    if (statusFilter !== 'all') next = next.filter((r) => r.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      next = next.filter((r) => [r.studentName, r.studentEmail, r.rollNumber].some((v) => String(v || '').toLowerCase().includes(q)));
    }
    if (dateFrom) next = next.filter((r) => r.startedAt && new Date(r.startedAt) >= new Date(dateFrom));
    if (dateTo) next = next.filter((r) => r.startedAt && new Date(r.startedAt) <= new Date(dateTo));
    if (selectedCourseFilter) next = next.filter((r) => r.courseId === selectedCourseFilter);
    if (selectedBatchFilters.length) {
      const studentIds = new Set(
        availableBatches.filter((b) => selectedBatchFilters.includes(b.id)).flatMap((b) => b.students),
      );
      next = next.filter((r) => studentIds.has(r.studentId));
    }
    next.sort((a, b) => {
      const av = a[sortColumn] ?? '';
      const bv = b[sortColumn] ?? '';
      if (av < bv) return sortDirection === 'asc' ? -1 : 1;
      if (av > bv) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return next;
  }, [rankings, statusFilter, searchQuery, dateFrom, dateTo, selectedCourseFilter, selectedBatchFilters, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredRankings.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRankings = filteredRankings.slice((safePage - 1) * pageSize, safePage * pageSize);
  const startIndex = filteredRankings.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndex = Math.min(safePage * pageSize, filteredRankings.length);

  function toggleSort(col) {
    setCurrentPage(1);
    if (sortColumn === col) { setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc')); return; }
    setSortColumn(col);
    setSortDirection('asc');
  }

  function getSortIcon(col) {
    if (sortColumn !== col) return 'ti-exchange-vertical';
    return sortDirection === 'asc' ? 'ti-angle-up' : 'ti-angle-down';
  }

  function clearFilters() {
    setSearchQuery(''); setStatusFilter('all'); setDateFrom(''); setDateTo('');
    setSelectedCourseFilter(''); setSelectedBatchFilters([]); setCurrentPage(1);
  }

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || dateFrom || dateTo || selectedCourseFilter || selectedBatchFilters.length > 0;

  function canToggleColumn(col) {
    if (col === 'studentName') return !exportColumns.studentName || exportColumns.rollNumber;
    if (col === 'rollNumber') return !exportColumns.rollNumber || exportColumns.studentName;
    if (col === 'rank') return !exportColumns.rank || exportColumns.totalScore;
    if (col === 'totalScore') return !exportColumns.totalScore || exportColumns.rank;
    return true;
  }

  function toggleExportColumn(col) {
    if (!canToggleColumn(col)) return;
    setExportColumns((c) => ({ ...c, [col]: !c[col] }));
  }

  const exportColumnLabels = {
    rank: 'Rank', studentName: 'Student Name', rollNumber: 'Roll Number',
    totalScore: 'Total Score', percentage: 'Percentage', totalAttempts: 'Total Attempts',
    correctAttempts: 'Correct Attempts', wrongAttempts: 'Wrong Attempts',
  };

  function getCourseName(id) {
    const c = availableCourses.find((course) => course.id === id);
    return c ? c.name : id;
  }

  function getBatchName(id) {
    const b = availableBatches.find((batch) => batch.id === id);
    return b ? b.name : id;
  }

  return (
    <section className="screen-card report-page exam-attempt-report-page">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((c) => c.filter((t) => t.id !== id))} />

      {/* ── Exam Header Card ── */}
      <div className="ear-header-card">
        <div className="ear-header-top">
          <div className="ear-header-main">
            <h2 className="ear-header-title">
              <i className="ti ti-bar-chart" /> {exam.title}
            </h2>
            <p className="ear-header-desc">{exam.brief}</p>
            {sections.length > 0 && (
              <div className="ear-section-chips">
                {sections.map((section, index) => (
                  <span key={`${section.name}-${index}`} className="ear-section-chip">{section.name}</span>
                ))}
              </div>
            )}
          </div>

          <div className="ear-header-info-group">
            <div className="ear-header-info-item">
              <div className="ear-header-info-icon"><i className="ti ti-help-alt" /></div>
              <div className="ear-header-info-content">
                <div className="ear-header-info-label">Questions</div>
                <div className="ear-header-info-value">{exam.totalQuestions || 0}</div>
              </div>
            </div>
            <div className="ear-header-info-item">
              <div className="ear-header-info-icon"><i className="ti ti-timer" /></div>
              <div className="ear-header-info-content">
                <div className="ear-header-info-label">Duration</div>
                <div className="ear-header-info-value">{exam.duration || 0} min</div>
              </div>
            </div>
            <div className="ear-header-info-item">
              <div className="ear-header-info-icon"><i className="ti ti-view-list" /></div>
              <div className="ear-header-info-content">
                <div className="ear-header-info-label">Sections</div>
                <div className="ear-header-info-value">{sections.length || exam.numberOfSections || 0}</div>
              </div>
            </div>
            <div className="ear-header-info-item">
              <div className="ear-header-info-icon"><i className="ti ti-info-alt" /></div>
              <div className="ear-header-info-content">
                <div className="ear-header-info-label">Status</div>
                <div className="ear-header-info-value">{getStatusLabel(exam.status)}</div>
              </div>
            </div>
          </div>

          <div className="ear-header-actions">
            <button type="button" className="ear-back-btn" onClick={() => navigate('/exam-listing')}>
              <i className="ti ti-arrow-left" /> Back
            </button>
          </div>
        </div>

        <div className="ear-header-body">
          <div className="ear-stats-row">
            <div className="ear-stat-card">
              <div className="ear-stat-icon ear-stat-indigo"><i className="ti ti-user" /></div>
              <div className="ear-stat-info">
                <h3>{exam.attempts?.length || 0}</h3>
                <p>Total Attempts</p>
              </div>
            </div>
            <div className="ear-stat-card">
              <div className="ear-stat-icon ear-stat-green"><i className="ti ti-check" /></div>
              <div className="ear-stat-info">
                <h3>{rankings.filter((r) => r.status === 'completed').length}</h3>
                <p>Completed</p>
              </div>
            </div>
            <div className="ear-stat-card">
              <div className="ear-stat-icon ear-stat-orange"><i className="ti ti-timer" /></div>
              <div className="ear-stat-info">
                <h3>{rankings.filter((r) => r.status !== 'completed').length}</h3>
                <p>In Progress</p>
              </div>
            </div>
            <div className="ear-stat-card">
              <div className="ear-stat-icon ear-stat-teal"><i className="ti ti-bar-chart" /></div>
              <div className="ear-stat-info">
                <h3>{averageScore}%</h3>
                <p>Avg Score</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter Section ── */}
      <div className="ear-filter-section">
        <div className="ear-filter-header">
          <h4 className="ear-filter-title"><i className="ti ti-filter" /> Filters</h4>
          {hasActiveFilters && (
            <button type="button" className="ear-clear-filters-btn" onClick={clearFilters}>
              <i className="ti ti-reload" /> Clear Filters
            </button>
          )}
        </div>

        <div className="ear-filter-row-1">
          <div className="ear-filter-group">
            <label className="ear-filter-label">Search</label>
            <input
              type="text"
              className="ear-filter-input"
              placeholder="Search by student name or roll number..."
              value={searchQuery}
              onChange={(event) => { setSearchQuery(event.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="ear-filter-group">
            <label className="ear-filter-label">Status</label>
            <select
              className="ear-filter-input"
              value={statusFilter}
              onChange={(event) => { setStatusFilter(event.target.value); setCurrentPage(1); }}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
            </select>
          </div>
          <div className="ear-filter-group">
            <label className="ear-filter-label"><i className="ti ti-calendar" /> From Date &amp; Time</label>
            <input
              type="datetime-local"
              className="ear-filter-input"
              value={dateFrom}
              onChange={(event) => { setDateFrom(event.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="ear-filter-group">
            <label className="ear-filter-label"><i className="ti ti-calendar" /> To Date &amp; Time</label>
            <input
              type="datetime-local"
              className="ear-filter-input"
              value={dateTo}
              onChange={(event) => { setDateTo(event.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        <div className="ear-filter-row-2">
          <div className="ear-filter-group">
            <label className="ear-filter-label"><i className="ti ti-book" /> Course</label>
            <select
              className="ear-filter-input"
              value={selectedCourseFilter}
              onChange={(event) => { setSelectedCourseFilter(event.target.value); setSelectedBatchFilters([]); setCurrentPage(1); }}
            >
              <option value="">All Courses</option>
              {availableCourses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
            </select>
          </div>
          <div className="ear-filter-group">
            <label className="ear-filter-label"><i className="ti ti-layout-grid2" /> Batch</label>
            <BatchMultiselect
              batches={filteredBatches}
              selected={selectedBatchFilters}
              onChange={(next) => { setSelectedBatchFilters(next); setCurrentPage(1); }}
              disabled={!selectedCourseFilter}
            />
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="ear-active-filters">
            <span className="ear-active-filters-label">Active Filters:</span>
            {searchQuery && (
              <span className="ear-filter-badge">
                Search: &ldquo;{searchQuery}&rdquo;
                <button type="button" onClick={() => setSearchQuery('')}><i className="ti ti-close" /></button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="ear-filter-badge">
                Status: {statusFilter}
                <button type="button" onClick={() => setStatusFilter('all')}><i className="ti ti-close" /></button>
              </span>
            )}
            {dateFrom && (
              <span className="ear-filter-badge">
                From: {new Date(dateFrom).toLocaleDateString('en-IN')}
                <button type="button" onClick={() => setDateFrom('')}><i className="ti ti-close" /></button>
              </span>
            )}
            {dateTo && (
              <span className="ear-filter-badge">
                To: {new Date(dateTo).toLocaleDateString('en-IN')}
                <button type="button" onClick={() => setDateTo('')}><i className="ti ti-close" /></button>
              </span>
            )}
            {selectedCourseFilter && (
              <span className="ear-filter-badge">
                Course: {getCourseName(selectedCourseFilter)}
                <button type="button" onClick={() => { setSelectedCourseFilter(''); setSelectedBatchFilters([]); }}><i className="ti ti-close" /></button>
              </span>
            )}
            {selectedBatchFilters.map((batchId) => (
              <span key={batchId} className="ear-filter-badge">
                Batch: {getBatchName(batchId)}
                <button type="button" onClick={() => setSelectedBatchFilters((c) => c.filter((id) => id !== batchId))}><i className="ti ti-close" /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Action Row ── */}
      <div className="ear-action-row">
        <div className="ear-record-count">
          <strong>{filteredRankings.length}</strong> record(s) found
        </div>
        <div className="ear-action-buttons">
          <button
            type="button"
            className="ear-btn-reevaluate"
            disabled={filteredRankings.length === 0}
            onClick={() => setShowReEvaluateModal(true)}
          >
            <i className="ti ti-reload" /> Re-evaluate Responses
          </button>
          <button
            type="button"
            className="ear-btn-export"
            disabled={filteredRankings.length === 0}
            onClick={() => setShowExportModal(true)}
          >
            <i className="ti ti-download" /> Export Rank List to PDF
          </button>
        </div>
      </div>

      {/* ── Rank Table ── */}
      {filteredRankings.length > 0 ? (
        <div className="ear-table-container">
          <table className="ear-rank-table">
            <thead>
              <tr>
                <th className={`ear-th-sortable${sortColumn === 'rank' ? ' ear-th-active' : ''}`} style={{ width: 80 }} onClick={() => toggleSort('rank')}>
                  Rank <i className={`ti ${getSortIcon('rank')} ear-sort-icon`} />
                </th>
                <th className={`ear-th-sortable${sortColumn === 'studentName' ? ' ear-th-active' : ''}`} onClick={() => toggleSort('studentName')}>
                  Student Name <i className={`ti ${getSortIcon('studentName')} ear-sort-icon`} />
                </th>
                <th className={`ear-th-sortable${sortColumn === 'rollNumber' ? ' ear-th-active' : ''}`} onClick={() => toggleSort('rollNumber')}>
                  Roll Number <i className={`ti ${getSortIcon('rollNumber')} ear-sort-icon`} />
                </th>
                <th>Email</th>
                <th>Status</th>
                <th>Score</th>
                <th className={`ear-th-sortable${sortColumn === 'percentage' ? ' ear-th-active' : ''}`} onClick={() => toggleSort('percentage')}>
                  Percentage <i className={`ti ${getSortIcon('percentage')} ear-sort-icon`} />
                </th>
                <th>Time Taken</th>
                <th>Started At</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {paginatedRankings.map((ranking) => (
                <tr key={`${ranking.studentId}-${ranking.startedAt}`}>
                  <td>
                    <div className={`ear-rank-badge ${getRankClass(ranking.rank)}`}>{ranking.rank}</div>
                  </td>
                  <td><strong>{ranking.studentName}</strong></td>
                  <td className="ear-td-mono">{ranking.rollNumber}</td>
                  <td className="ear-td-muted">{ranking.studentEmail}</td>
                  <td>
                    <span className={`ear-status-badge ${ranking.status === 'completed' ? 'ear-status-completed' : 'ear-status-in-progress'}`}>
                      {ranking.status === 'completed' ? 'Completed' : 'In Progress'}
                    </span>
                  </td>
                  <td>
                    {ranking.status === 'completed' ? (
                      <span className={`ear-score-badge ${getScoreClass(ranking.percentage)}`}>
                        {ranking.score}/{exam.maximumMarks}
                      </span>
                    ) : (
                      <span className="ear-td-muted">-</span>
                    )}
                  </td>
                  <td>
                    {ranking.status === 'completed' ? (
                      <strong>{ranking.percentage}%</strong>
                    ) : (
                      <span className="ear-td-muted">-</span>
                    )}
                  </td>
                  <td>{ranking.timeTaken}</td>
                  <td className="ear-td-datetime">{formatDateTime(ranking.startedAt)}</td>
                  <td>
                    <KebabMenu
                      ranking={ranking}
                      onViewAttempt={setViewAttemptItem}
                      onResetAttempt={setResetAttemptItem}
                      onDownloadReport={(r) => showToast('success', 'Download Started', `Generating report for ${r.studentName}...`)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="ear-pagination">
              <div className="ear-pagination-info">
                Showing <strong>{startIndex}</strong> to <strong>{endIndex}</strong> of <strong>{filteredRankings.length}</strong> records
              </div>
              <div className="ear-pagination-controls">
                <button
                  type="button"
                  className="ear-page-btn"
                  disabled={safePage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <i className="ti ti-angle-left" />
                </button>
                {getPageNumbers(safePage, totalPages).map((page, index) => (
                  page === '...'
                    ? <span key={`ellipsis-${index}`} className="ear-page-ellipsis">...</span>
                    : (
                      <button
                        key={page}
                        type="button"
                        className={`ear-page-btn${safePage === page ? ' ear-page-active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    )
                ))}
                <button
                  type="button"
                  className="ear-page-btn"
                  disabled={safePage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  <i className="ti ti-angle-right" />
                </button>
              </div>
              <select
                className="ear-page-size-select"
                value={pageSize}
                onChange={(event) => { setPageSize(Number(event.target.value)); setCurrentPage(1); }}
              >
                {[20, 50, 100, 200].map((size) => <option key={size} value={size}>{size} / page</option>)}
              </select>
            </div>
          )}
        </div>
      ) : (
        <div className="ear-empty-state">
          <i className="ti ti-search" />
          <h4>No Results Found</h4>
          <p>{hasActiveFilters ? 'Try adjusting your search or filters.' : 'No students have attempted this exam yet.'}</p>
        </div>
      )}

      {/* ══════════════ MODALS ══════════════ */}

      {/* Re-evaluate Modal */}
      {showReEvaluateModal && (
        <div className="ear-modal-scrim" role="presentation" onClick={() => setShowReEvaluateModal(false)}>
          <div className="ear-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="ear-modal-header ear-modal-header-orange">
              <h3><i className="ti ti-reload" /> Confirm Re-evaluation</h3>
              <button type="button" className="ear-modal-close" onClick={() => setShowReEvaluateModal(false)}>
                <i className="ti ti-close" />
              </button>
            </div>
            <div className="ear-modal-body">
              <div className="ear-modal-center">
                <div className="ear-modal-icon-circle ear-icon-warning">
                  <i className="ti ti-alert" style={{ fontSize: 32, color: '#856404' }} />
                </div>
                <h4 className="ear-modal-heading">Re-evaluate all student attempts?</h4>
                <p className="ear-modal-subtext">
                  This will re-evaluate <strong style={{ color: '#006073' }}>{filteredRankings.length}</strong> student response(s) based on the current answer keys.
                </p>
                <div className="ear-modal-info-box">
                  <div className="ear-modal-info-title">
                    <i className="ti ti-info-alt" style={{ color: '#006073', marginRight: 5 }} />
                    <strong>What this does:</strong>
                  </div>
                  <ul className="ear-modal-info-list">
                    <li>Recalculates scores for all filtered attempts</li>
                    <li>Updates rankings based on new scores</li>
                    <li>Reflects any changes made to answer keys</li>
                  </ul>
                </div>
                <div className="ear-modal-warning-box">
                  <i className="ti ti-alert-circle" style={{ color: '#856404', fontSize: 18, marginTop: 2 }} />
                  <div style={{ fontSize: 12, color: '#856404', lineHeight: 1.5 }}>
                    <strong>Note:</strong> This action cannot be undone. Student notifications may be sent if scores change significantly.
                  </div>
                </div>
              </div>
            </div>
            <div className="ear-modal-footer">
              <button type="button" className="ear-btn-default" onClick={() => setShowReEvaluateModal(false)}>Cancel</button>
              <button
                type="button"
                className="ear-btn-reevaluate"
                onClick={() => {
                  setShowReEvaluateModal(false);
                  showToast('success', 'Re-evaluation Started', `Successfully queued re-evaluation for ${filteredRankings.length} response(s).`);
                }}
              >
                <i className="ti ti-check" /> Yes, Re-evaluate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="ear-modal-scrim" role="presentation" onClick={() => setShowExportModal(false)}>
          <div className="ear-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="ear-modal-header ear-modal-header-teal">
              <h3><i className="ti ti-download" /> Export Rank List</h3>
              <button type="button" className="ear-modal-close" onClick={() => setShowExportModal(false)}>
                <i className="ti ti-close" />
              </button>
            </div>
            <div className="ear-modal-body">
              <div className="ear-modal-center">
                <div className="ear-modal-icon-circle ear-icon-teal">
                  <i className="ti ti-file-pdf" style={{ fontSize: 32, color: '#006073' }} />
                </div>
                <h4 className="ear-modal-heading">Confirm PDF Export</h4>
                <p className="ear-modal-subtext">
                  You are about to export <strong style={{ color: '#006073' }}>{filteredRankings.length}</strong> record(s) to PDF.
                </p>
                <div className="ear-modal-info-box">
                  <div className="ear-modal-info-title" style={{ justifyContent: 'space-between' }}>
                    <span>
                      <i className="ti ti-layout-list" style={{ color: '#006073', marginRight: 5 }} />
                      <strong>Select columns to include:</strong>
                    </span>
                    <button
                      type="button"
                      className="ear-select-all-btn"
                      onClick={() => setExportColumns(Object.fromEntries(Object.keys(exportColumns).map((k) => [k, true])))}
                    >
                      Select All
                    </button>
                  </div>
                  <div className="ear-export-columns-grid">
                    {Object.keys(exportColumns).map((col) => {
                      const locked = !canToggleColumn(col);
                      return (
                        <label
                          key={col}
                          className={`ear-export-col-label${exportColumns[col] ? ' checked' : ''}${locked ? ' locked' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={exportColumns[col]}
                            onChange={() => toggleExportColumn(col)}
                            disabled={locked}
                          />
                          <span>{exportColumnLabels[col]}</span>
                          {locked && <i className="ti ti-lock" style={{ fontSize: 10, color: '#6c757d', marginLeft: 'auto' }} />}
                        </label>
                      );
                    })}
                  </div>
                  <div className="ear-export-hint">
                    <i className="ti ti-info-alt" /> Either Student Name or Roll Number must be selected. Either Rank or Total Score must be selected.
                  </div>
                </div>
                {hasActiveFilters && (
                  <div className="ear-modal-filter-notice">
                    <i className="ti ti-filter" style={{ color: '#006073', fontSize: 18 }} />
                    <div style={{ fontSize: 12, color: '#006073', lineHeight: 1.5 }}>
                      Active filters are applied. Only filtered records will be exported.
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="ear-modal-footer">
              <button type="button" className="ear-btn-default" onClick={() => setShowExportModal(false)}>Cancel</button>
              <button
                type="button"
                className="ear-btn-export"
                onClick={() => {
                  setShowExportModal(false);
                  showToast('success', 'Export Ready', `Prepared PDF export for ${filteredRankings.length} attempt records.`);
                }}
              >
                <i className="ti ti-download" /> Export PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Attempt Modal */}
      {viewAttemptItem && (
        <div className="ear-modal-scrim" role="presentation" onClick={() => setViewAttemptItem(null)}>
          <div className="ear-modal ear-modal-wide" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="ear-modal-header ear-modal-header-teal">
              <h3><i className="ti ti-eye" /> Attempt Details</h3>
              <button type="button" className="ear-modal-close" onClick={() => setViewAttemptItem(null)}>
                <i className="ti ti-close" />
              </button>
            </div>
            <div className="ear-modal-body">
              <div className="ear-attempt-detail-grid">
                <div className="ear-attempt-detail-group">
                  <div className="ear-attempt-detail-label">Student Name</div>
                  <div className="ear-attempt-detail-value"><strong>{viewAttemptItem.studentName}</strong></div>
                </div>
                <div className="ear-attempt-detail-group">
                  <div className="ear-attempt-detail-label">Roll Number</div>
                  <div className="ear-attempt-detail-value ear-td-mono">{viewAttemptItem.rollNumber}</div>
                </div>
                <div className="ear-attempt-detail-group">
                  <div className="ear-attempt-detail-label">Email</div>
                  <div className="ear-attempt-detail-value">{viewAttemptItem.studentEmail}</div>
                </div>
                <div className="ear-attempt-detail-group">
                  <div className="ear-attempt-detail-label">Status</div>
                  <div className="ear-attempt-detail-value">
                    <span className={`ear-status-badge ${viewAttemptItem.status === 'completed' ? 'ear-status-completed' : 'ear-status-in-progress'}`}>
                      {viewAttemptItem.status === 'completed' ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                </div>
                <div className="ear-attempt-detail-group">
                  <div className="ear-attempt-detail-label">Rank</div>
                  <div className="ear-attempt-detail-value">
                    <div className={`ear-rank-badge ${getRankClass(viewAttemptItem.rank)}`}>{viewAttemptItem.rank}</div>
                  </div>
                </div>
                <div className="ear-attempt-detail-group">
                  <div className="ear-attempt-detail-label">Score</div>
                  <div className="ear-attempt-detail-value">
                    {viewAttemptItem.status === 'completed' ? (
                      <span className={`ear-score-badge ${getScoreClass(viewAttemptItem.percentage)}`}>
                        {viewAttemptItem.score}/{exam.maximumMarks}
                      </span>
                    ) : '-'}
                  </div>
                </div>
                <div className="ear-attempt-detail-group">
                  <div className="ear-attempt-detail-label">Percentage</div>
                  <div className="ear-attempt-detail-value">
                    {viewAttemptItem.status === 'completed' ? <strong>{viewAttemptItem.percentage}%</strong> : '-'}
                  </div>
                </div>
                <div className="ear-attempt-detail-group">
                  <div className="ear-attempt-detail-label">Time Taken</div>
                  <div className="ear-attempt-detail-value">{viewAttemptItem.timeTaken}</div>
                </div>
                <div className="ear-attempt-detail-group">
                  <div className="ear-attempt-detail-label">Started At</div>
                  <div className="ear-attempt-detail-value">{formatDateTime(viewAttemptItem.startedAt)}</div>
                </div>
                {viewAttemptItem.completedAt && (
                  <div className="ear-attempt-detail-group">
                    <div className="ear-attempt-detail-label">Completed At</div>
                    <div className="ear-attempt-detail-value">{formatDateTime(viewAttemptItem.completedAt)}</div>
                  </div>
                )}
                {viewAttemptItem.correctAnswers !== undefined && (
                  <div className="ear-attempt-detail-group">
                    <div className="ear-attempt-detail-label">Correct Answers</div>
                    <div className="ear-attempt-detail-value" style={{ color: '#155724' }}><strong>{viewAttemptItem.correctAnswers}</strong></div>
                  </div>
                )}
                {viewAttemptItem.incorrectAnswers !== undefined && (
                  <div className="ear-attempt-detail-group">
                    <div className="ear-attempt-detail-label">Wrong Answers</div>
                    <div className="ear-attempt-detail-value" style={{ color: '#721c24' }}><strong>{viewAttemptItem.incorrectAnswers}</strong></div>
                  </div>
                )}
              </div>
            </div>
            <div className="ear-modal-footer">
              <button type="button" className="ear-btn-default" onClick={() => setViewAttemptItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Attempt Modal */}
      {resetAttemptItem && (
        <div className="ear-modal-scrim" role="presentation" onClick={() => setResetAttemptItem(null)}>
          <div className="ear-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="ear-modal-header ear-modal-header-orange">
              <h3><i className="ti ti-reload" /> Reset Attempt</h3>
              <button type="button" className="ear-modal-close" onClick={() => setResetAttemptItem(null)}>
                <i className="ti ti-close" />
              </button>
            </div>
            <div className="ear-modal-body">
              <div className="ear-modal-center">
                <div className="ear-modal-icon-circle ear-icon-warning">
                  <i className="ti ti-alert" style={{ fontSize: 32, color: '#856404' }} />
                </div>
                <h4 className="ear-modal-heading">Reset this attempt?</h4>
                <p className="ear-modal-subtext">
                  You are about to reset the attempt for <strong style={{ color: '#006073' }}>{resetAttemptItem.studentName}</strong>. This will clear all their responses and scores.
                </p>
                <div className="ear-modal-warning-box">
                  <i className="ti ti-alert-circle" style={{ color: '#856404', fontSize: 18, marginTop: 2 }} />
                  <div style={{ fontSize: 12, color: '#856404', lineHeight: 1.5 }}>
                    <strong>Warning:</strong> This action cannot be undone. The student will lose their current attempt data.
                  </div>
                </div>
              </div>
            </div>
            <div className="ear-modal-footer">
              <button type="button" className="ear-btn-default" onClick={() => setResetAttemptItem(null)}>Cancel</button>
              <button
                type="button"
                className="ear-btn-reevaluate"
                onClick={() => {
                  setResetAttemptItem(null);
                  showToast('success', 'Attempt Reset', `Attempt for ${resetAttemptItem.studentName} has been reset.`);
                }}
              >
                <i className="ti ti-check" /> Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
