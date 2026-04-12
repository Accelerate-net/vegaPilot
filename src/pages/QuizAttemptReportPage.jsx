import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ToastRegion from '../components/ToastRegion';
import { availableBatches, availableCourses, ensureAttempts } from '../data/attemptReportsDemo';
import { draftQuizzesDemo, publishedQuizzesDemo } from '../data/quizzesDemo';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatFilterDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function getScoreClass(pct) {
  if (pct >= 75) return 'score-excellent';
  if (pct >= 50) return 'score-good';
  if (pct >= 25) return 'score-average';
  return 'score-poor';
}

function getRankClass(rank) {
  if (rank === 1) return 'rank-1';
  if (rank === 2) return 'rank-2';
  if (rank === 3) return 'rank-3';
  return 'rank-other';
}

function getSortIcon(col, sortCol, sortDir) {
  if (sortCol !== col) return 'ti-arrows-vertical';
  return sortDir === 'asc' ? 'ti-arrow-up' : 'ti-arrow-down';
}

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', total);
  } else if (current >= total - 3) {
    pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total);
  }
  return pages;
}

function getQuizFromStorage(quizId) {
  const handoff = window.localStorage.getItem('reportQuizData');
  if (handoff) {
    try {
      window.localStorage.removeItem('reportQuizData');
      return JSON.parse(handoff);
    } catch (e) {
      /* ignore */
    }
  }
  const drafts = JSON.parse(window.localStorage.getItem('quizDrafts') || '[]');
  const published = JSON.parse(window.localStorage.getItem('publishedQuizzes') || '[]');
  return [...published, ...drafts, ...publishedQuizzesDemo, ...draftQuizzesDemo].find(
    (q) => String(q.id) === String(quizId),
  ) || null;
}

// ─── BatchMultiSelect ──────────────────────────────────────────────────────────
function BatchMultiSelect({ batches, selected, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggle(id) {
    if (selected.includes(id)) onChange(selected.filter((s) => s !== id));
    else onChange([...selected, id]);
  }

  function getLabel() {
    if (!selected.length) return 'Select Batches';
    if (selected.length === 1) return batches.find((b) => b.id === selected[0])?.name || '1 selected';
    return `${selected.length} batches selected`;
  }

  return (
    <div className="qar-batch-multiselect" ref={ref}>
      <div
        className={`qar-batch-trigger${disabled ? ' disabled' : ''}`}
        onClick={() => !disabled && setOpen((o) => !o)}
      >
        <span>{getLabel()}</span>
        <span style={{ display: 'flex', alignItems: 'center' }}>
          {selected.length > 0 && <span className="qar-batch-count">{selected.length}</span>}
          <i className="ti ti-angle-down" style={{ marginLeft: 8 }} />
        </span>
      </div>
      {open && !disabled && (
        <div className="qar-batch-dropdown">
          <div className="qar-batch-actions">
            <button type="button" className="qar-batch-select-all" onClick={() => onChange(batches.map((b) => b.id))}>Select All</button>
            <button type="button" className="qar-batch-clear-all" onClick={() => onChange([])}>Clear All</button>
          </div>
          {batches.length === 0 ? (
            <div className="qar-batch-empty">No batches available for this course</div>
          ) : (
            batches.map((batch) => (
              <label key={batch.id} className={`qar-batch-item${selected.includes(batch.id) ? ' selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={selected.includes(batch.id)}
                  onChange={() => toggle(batch.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span>{batch.name}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Export Columns Modal ──────────────────────────────────────────────────────
const ALL_EXPORT_COLS = [
  { key: 'rank', label: 'Rank' },
  { key: 'studentName', label: 'Student Name' },
  { key: 'rollNumber', label: 'Roll Number' },
  { key: 'totalScore', label: 'Total Score' },
  { key: 'percentage', label: 'Percentage' },
  { key: 'totalAttempts', label: 'Total Attempts' },
  { key: 'correctAttempts', label: 'Correct Attempts' },
  { key: 'wrongAttempts', label: 'Wrong Attempts' },
];

function canToggleColumn(key, exportColumns) {
  // Either Rank or Total Score must be selected
  if (key === 'rank' && !exportColumns.totalScore) return false;
  if (key === 'totalScore' && !exportColumns.rank) return false;
  // Either Student Name or Roll Number must be selected
  if (key === 'studentName' && !exportColumns.rollNumber) return false;
  if (key === 'rollNumber' && !exportColumns.studentName) return false;
  return true;
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function QuizAttemptReportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');
  const [selectedBatchFilters, setSelectedBatchFilters] = useState([]);

  // Table
  const [sortColumn, setSortColumn] = useState('rank');
  const [sortDirection, setSortDirection] = useState('asc');
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [showReEvaluateModal, setShowReEvaluateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportColumns, setExportColumns] = useState({
    rank: true, studentName: true, rollNumber: true, totalScore: true,
    percentage: true, totalAttempts: true, correctAttempts: true, wrongAttempts: true,
  });

  const [quiz] = useState(() => ensureAttempts(
    getQuizFromStorage(params.get('quiz')) || {
      id: params.get('quiz') || 'QUIZ-001',
      title: 'IAT 2026 - Mock Test 1',
      description: 'Comprehensive quiz report for practice attempts.',
      totalQuestions: 60,
      maximumMarks: 240,
      duration: 180,
      status: 'published',
    },
    { totalQuestions: 60, maximumMarks: 240, count: 16 },
  ));

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  function showToast(type, title, message) {
    const id = Date.now() + Math.random();
    setToasts((cur) => [...cur, { id, type, title, message }]);
    setTimeout(() => setToasts((cur) => cur.filter((t) => t.id !== id)), 5000);
  }

  // Rankings with rank/percentage/timeTaken computed
  const rankings = useMemo(() => {
    const maxMarks = quiz.maximumMarks || 240;
    const completed = (quiz.attempts || [])
      .filter((a) => a.status === 'completed')
      .sort((a, b) => b.score - a.score)
      .map((a, i, list) => ({
        ...a,
        rank: i > 0 && list[i - 1].score === a.score ? list[i - 1].rank : i + 1,
        percentage: Math.round((a.score / maxMarks) * 100),
        timeTaken: a.startedAt && a.completedAt
          ? `${Math.floor((new Date(a.completedAt) - new Date(a.startedAt)) / 60000)} min`
          : '-',
      }));
    const inProgress = (quiz.attempts || [])
      .filter((a) => a.status !== 'completed')
      .map((a) => ({ ...a, rank: '-', percentage: 0, timeTaken: '-' }));
    return [...completed, ...inProgress];
  }, [quiz]);

  const filteredBatchesForCourse = useMemo(
    () => availableBatches.filter((b) => !selectedCourseFilter || b.courseId === selectedCourseFilter),
    [selectedCourseFilter],
  );

  const filteredRankings = useMemo(() => {
    let next = [...rankings];
    if (statusFilter !== 'all') next = next.filter((r) => r.status === statusFilter);
    if (selectedCourseFilter) next = next.filter((r) => r.courseId === selectedCourseFilter);
    if (selectedBatchFilters.length) {
      const studentIds = new Set(
        availableBatches
          .filter((b) => selectedBatchFilters.includes(b.id))
          .flatMap((b) => b.students),
      );
      next = next.filter((r) => studentIds.has(r.studentId));
    }
    if (dateFrom) next = next.filter((r) => r.startedAt && new Date(r.startedAt) >= new Date(dateFrom));
    if (dateTo) next = next.filter((r) => r.startedAt && new Date(r.startedAt) <= new Date(dateTo));
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      next = next.filter((r) =>
        [r.studentName, r.studentEmail, r.rollNumber].some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    next.sort((a, b) => {
      const av = a[sortColumn] ?? '';
      const bv = b[sortColumn] ?? '';
      if (av < bv) return sortDirection === 'asc' ? -1 : 1;
      if (av > bv) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return next;
  }, [rankings, statusFilter, selectedCourseFilter, selectedBatchFilters, dateFrom, dateTo, searchQuery, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredRankings.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const visibleRankings = filteredRankings.slice((safePage - 1) * pageSize, safePage * pageSize);

  function toggleSort(col) {
    setCurrentPage(1);
    if (sortColumn === col) { setSortDirection((d) => d === 'asc' ? 'desc' : 'asc'); return; }
    setSortColumn(col);
    setSortDirection('asc');
  }

  const completedCount = rankings.filter((r) => r.status === 'completed').length;
  const inProgressCount = rankings.filter((r) => r.status !== 'completed').length;
  const avgScore = completedCount > 0
    ? Math.round(rankings.filter((r) => r.status === 'completed').reduce((s, r) => s + r.percentage, 0) / completedCount)
    : 0;

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || dateFrom || dateTo || selectedCourseFilter || selectedBatchFilters.length;

  function clearFilters() {
    setSearchQuery(''); setStatusFilter('all'); setDateFrom(''); setDateTo('');
    setSelectedCourseFilter(''); setSelectedBatchFilters([]); setCurrentPage(1);
  }

  function toggleExportColumn(key) {
    if (!canToggleColumn(key, exportColumns)) return;
    setExportColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function selectAllExportColumns() {
    setExportColumns({ rank: true, studentName: true, rollNumber: true, totalScore: true, percentage: true, totalAttempts: true, correctAttempts: true, wrongAttempts: true });
  }

  // ─── Skeleton ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="quiz-attempt-report-page">
        <div className="qar-skeleton-header" />
        <div className="qar-skeleton-stats">
          {[1, 2, 3, 4].map((i) => <div key={i} className="qar-skeleton-stat" />)}
        </div>
        <div className="qar-skeleton-filter" />
        <div className="students-table-container" style={{ marginTop: 20 }}>
          <table className="students-table">
            <thead><tr>{[...Array(9)].map((_, i) => <th key={i}><div className="qar-skel qar-skel-th" /></th>)}</tr></thead>
            <tbody>
              {[...Array(8)].map((_, i) => (
                <tr key={i}>
                  {[...Array(9)].map((_, j) => (
                    <td key={j}><div className={`qar-skel qar-skel-td${j === 1 ? ' wide' : ''}`} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-attempt-report-page">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((cur) => cur.filter((t) => t.id !== id))} />

      {/* ── Quiz Header Card ── */}
      <div className="qar-header-card">
        <div className="qar-header-top">
          <div className="qar-header-main">
            <h2><i className="ti ti-bar-chart" /> {quiz.title}</h2>
            <p className="qar-description">{quiz.description}</p>
          </div>

          <div className="qar-header-info-group">
            <div className="qar-info-item">
              <div className="qar-info-icon"><i className="ti ti-help-alt" /></div>
              <div className="qar-info-content">
                <div className="qar-info-label">Questions</div>
                <div className="qar-info-value">{quiz.totalQuestions}</div>
              </div>
            </div>
            <div className="qar-info-item">
              <div className="qar-info-icon"><i className="ti ti-timer" /></div>
              <div className="qar-info-content">
                <div className="qar-info-label">Duration</div>
                <div className="qar-info-value">{quiz.duration} min</div>
              </div>
            </div>
            <div className="qar-info-item">
              <div className="qar-info-icon"><i className="ti ti-cup" /></div>
              <div className="qar-info-content">
                <div className="qar-info-label">Max Marks</div>
                <div className="qar-info-value">{quiz.maximumMarks}</div>
              </div>
            </div>
            <div className="qar-info-item">
              <div className="qar-info-icon"><i className="ti ti-info-alt" /></div>
              <div className="qar-info-content">
                <div className="qar-info-label">Status</div>
                <div className="qar-info-value" style={{ textTransform: 'capitalize' }}>{quiz.status}</div>
              </div>
            </div>
          </div>

          <div className="qar-header-actions">
            <button type="button" className="qar-back-btn" onClick={() => navigate('/quiz-listing')}>
              <i className="ti ti-arrow-left" /> Back
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="qar-header-body">
          <div className="qar-stats-row">
            <div className="qar-stat-card">
              <div className="qar-stat-icon indigo"><i className="ti ti-user" /></div>
              <div className="qar-stat-info">
                <h3>{quiz.attempts?.length || 0}</h3>
                <p>Total Attempts</p>
              </div>
            </div>
            <div className="qar-stat-card">
              <div className="qar-stat-icon green"><i className="ti ti-check" /></div>
              <div className="qar-stat-info">
                <h3>{completedCount}</h3>
                <p>Completed</p>
              </div>
            </div>
            <div className="qar-stat-card">
              <div className="qar-stat-icon orange"><i className="ti ti-timer" /></div>
              <div className="qar-stat-info">
                <h3>{inProgressCount}</h3>
                <p>In Progress</p>
              </div>
            </div>
            <div className="qar-stat-card">
              <div className="qar-stat-icon teal"><i className="ti ti-bar-chart" /></div>
              <div className="qar-stat-info">
                <h3>{avgScore}%</h3>
                <p>Avg Score</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="qar-filter-card">
        <div className="qar-filter-header">
          <h4><i className="ti ti-filter" /> Filters</h4>
          {hasActiveFilters && (
            <button type="button" className="qar-clear-btn" onClick={clearFilters}>
              <i className="ti ti-reload" /> Clear Filters
            </button>
          )}
        </div>

        {/* Row 1 */}
        <div className="qar-filter-row1">
          <div className="qar-filter-field qar-filter-field-wide">
            <label className="qar-filter-label">Search</label>
            <input
              type="text"
              className="qar-input"
              placeholder="Search by student name or email..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="qar-filter-field">
            <label className="qar-filter-label">Status</label>
            <select className="qar-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
            </select>
          </div>
          <div className="qar-filter-field">
            <label className="qar-filter-label"><i className="ti ti-calendar" /> From Date &amp; Time</label>
            <input
              type="datetime-local"
              className="qar-input"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="qar-filter-field">
            <label className="qar-filter-label"><i className="ti ti-calendar" /> To Date &amp; Time</label>
            <input
              type="datetime-local"
              className="qar-input"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        {/* Row 2 */}
        <div className="qar-filter-row2">
          <div className="qar-filter-field">
            <label className="qar-filter-label"><i className="ti ti-book" /> Course</label>
            <select
              className="qar-select"
              value={selectedCourseFilter}
              onChange={(e) => { setSelectedCourseFilter(e.target.value); setSelectedBatchFilters([]); setCurrentPage(1); }}
            >
              <option value="">All Courses</option>
              {availableCourses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="qar-filter-field">
            <label className="qar-filter-label"><i className="ti ti-layout-grid2" /> Batch</label>
            <BatchMultiSelect
              batches={filteredBatchesForCourse}
              selected={selectedBatchFilters}
              onChange={(val) => { setSelectedBatchFilters(val); setCurrentPage(1); }}
              disabled={!selectedCourseFilter}
            />
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="qar-active-filters">
            <span className="qar-active-label">Active Filters:</span>
            {searchQuery && (
              <span className="qar-filter-badge">
                Search: &ldquo;{searchQuery}&rdquo;
                <i className="ti ti-close" onClick={() => setSearchQuery('')} />
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="qar-filter-badge">
                Status: {statusFilter}
                <i className="ti ti-close" onClick={() => setStatusFilter('all')} />
              </span>
            )}
            {dateFrom && (
              <span className="qar-filter-badge">
                From: {formatFilterDate(dateFrom)}
                <i className="ti ti-close" onClick={() => setDateFrom('')} />
              </span>
            )}
            {dateTo && (
              <span className="qar-filter-badge">
                To: {formatFilterDate(dateTo)}
                <i className="ti ti-close" onClick={() => setDateTo('')} />
              </span>
            )}
            {selectedCourseFilter && (
              <span className="qar-filter-badge">
                Course: {availableCourses.find((c) => c.id === selectedCourseFilter)?.name}
                <i className="ti ti-close" onClick={() => { setSelectedCourseFilter(''); setSelectedBatchFilters([]); }} />
              </span>
            )}
            {selectedBatchFilters.map((bId) => (
              <span key={bId} className="qar-filter-badge">
                Batch: {availableBatches.find((b) => b.id === bId)?.name}
                <i className="ti ti-close" onClick={() => setSelectedBatchFilters((prev) => prev.filter((id) => id !== bId))} />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Record count + action buttons ── */}
      <div className="qar-toolbar">
        <div className="qar-record-count">
          <strong>{filteredRankings.length}</strong> record(s) found
        </div>
        <div className="qar-action-btns">
          <button
            type="button"
            className="qar-btn-reevaluate"
            disabled={filteredRankings.length === 0}
            onClick={() => setShowReEvaluateModal(true)}
          >
            <i className="ti ti-reload" /> Re-evaluate Responses
          </button>
          <button
            type="button"
            className="qar-btn-export"
            disabled={filteredRankings.length === 0}
            onClick={() => setShowExportModal(true)}
          >
            <i className="ti ti-download" /> Export Rank List to PDF
          </button>
        </div>
      </div>

      {/* ── Rank Table ── */}
      {filteredRankings.length > 0 ? (
        <div className="students-table-container">
          <table className="students-table">
            <thead>
              <tr>
                <th className={`sortable${sortColumn === 'rank' ? ' active' : ''}`} style={{ width: 80 }} onClick={() => toggleSort('rank')}>
                  Rank <i className={`ti ${getSortIcon('rank', sortColumn, sortDirection)} sort-icon`} />
                </th>
                <th className={`sortable${sortColumn === 'studentName' ? ' active' : ''}`} onClick={() => toggleSort('studentName')}>
                  Student Name <i className={`ti ${getSortIcon('studentName', sortColumn, sortDirection)} sort-icon`} />
                </th>
                <th className={`sortable${sortColumn === 'rollNumber' ? ' active' : ''}`} onClick={() => toggleSort('rollNumber')}>
                  Roll Number <i className={`ti ${getSortIcon('rollNumber', sortColumn, sortDirection)} sort-icon`} />
                </th>
                <th>Email</th>
                <th>Status</th>
                <th>Score</th>
                <th className={`sortable${sortColumn === 'percentage' ? ' active' : ''}`} onClick={() => toggleSort('percentage')}>
                  Percentage <i className={`ti ${getSortIcon('percentage', sortColumn, sortDirection)} sort-icon`} />
                </th>
                <th>Time Taken</th>
                <th>Started At</th>
              </tr>
            </thead>
            <tbody>
              {visibleRankings.map((r) => (
                <tr key={`${r.studentId}-${r.startedAt}`}>
                  <td>
                    <div className={`qar-rank-badge ${getRankClass(r.rank)}`}>{r.rank}</div>
                  </td>
                  <td><strong>{r.studentName}</strong></td>
                  <td className="qar-roll">{r.rollNumber}</td>
                  <td className="qar-email">{r.studentEmail}</td>
                  <td>
                    <span className={`qar-status-badge${r.status === 'completed' ? ' status-completed' : ' status-in-progress'}`}>
                      {r.status === 'completed' ? 'Completed' : 'In Progress'}
                    </span>
                  </td>
                  <td>
                    {r.status === 'completed' ? (
                      <span className={`qar-score-badge ${getScoreClass(r.percentage)}`}>
                        {r.score}/{quiz.maximumMarks}
                      </span>
                    ) : <span className="qar-muted">-</span>}
                  </td>
                  <td>
                    {r.status === 'completed'
                      ? <strong>{r.percentage}%</strong>
                      : <span className="qar-muted">-</span>}
                  </td>
                  <td>
                    {r.status === 'completed' ? r.timeTaken : <span className="qar-muted">-</span>}
                  </td>
                  <td className="qar-datetime">{formatDateTime(r.startedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="qar-pagination">
              <div className="qar-pagination-info">
                Showing <strong>{(safePage - 1) * pageSize + 1}</strong> to{' '}
                <strong>{Math.min(safePage * pageSize, filteredRankings.length)}</strong> of{' '}
                <strong>{filteredRankings.length}</strong> records
              </div>
              <div className="qar-pagination-controls">
                <div className="qar-page-size">
                  <select className="qar-select compact" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                    {[20, 50, 100, 200].map((s) => <option key={s} value={s}>{s}/page</option>)}
                  </select>
                </div>
                <div className="qar-page-btns">
                  <button
                    type="button"
                    className="qar-page-btn"
                    disabled={safePage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    <i className="ti ti-angle-left" />
                  </button>
                  {getPageNumbers(safePage, totalPages).map((page, idx) =>
                    page === '...' ? (
                      <span key={`ellipsis-${idx}`} className="qar-page-ellipsis">...</span>
                    ) : (
                      <button
                        key={page}
                        type="button"
                        className={`qar-page-btn${safePage === page ? ' active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ),
                  )}
                  <button
                    type="button"
                    className="qar-page-btn"
                    disabled={safePage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <i className="ti ti-angle-right" />
                  </button>
                </div>
              </div>
            </div>
        </div>
      ) : (
        <div className="qar-empty-state">
          <i className="ti ti-search" />
          <h4>No Results Found</h4>
          {hasActiveFilters
            ? <p>Try adjusting your search or filters.</p>
            : <p>No students have attempted this quiz yet.</p>}
        </div>
      )}

      {/* ── Re-evaluate Modal ── */}
      {showReEvaluateModal && (
        <div className="crispr-modal-backdrop active" onClick={() => setShowReEvaluateModal(false)}>
          <div className="crispr-modal-dialog" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="crispr-modal-header" style={{ background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)' }}>
              <h3><i className="ti ti-reload" /> Confirm Re-evaluation</h3>
              <button className="crispr-modal-close" onClick={() => setShowReEvaluateModal(false)}>
                <i className="ti ti-close" />
              </button>
            </div>
            <div className="crispr-modal-body">
              <div className="qar-modal-center">
                <div className="qar-modal-icon warning">
                  <i className="ti ti-alert" style={{ fontSize: 32, color: '#856404' }} />
                </div>
                <h4 className="qar-modal-title">Re-evaluate all student attempts?</h4>
                <p className="qar-modal-desc">
                  This will re-evaluate <strong style={{ color: '#006073' }}>{filteredRankings.length}</strong> student
                  response(s) based on the current answer keys.
                </p>
                <div className="qar-info-box">
                  <div className="qar-info-box-title">
                    <i className="ti ti-info-circle" style={{ color: '#006073' }} />
                    <strong>What this does:</strong>
                  </div>
                  <ul>
                    <li>Recalculates scores for all filtered attempts</li>
                    <li>Updates rankings based on new scores</li>
                    <li>Reflects any changes made to answer keys</li>
                  </ul>
                </div>
                <div className="qar-warning-box">
                  <i className="ti ti-alert-circle" style={{ color: '#856404', fontSize: 18, marginTop: 2 }} />
                  <div>
                    <strong>Note:</strong> This action cannot be undone. Student notifications may be sent if scores change significantly.
                  </div>
                </div>
              </div>
            </div>
            <div className="crispr-modal-footer">
              <button type="button" className="crispr-btn crispr-btn-default" onClick={() => setShowReEvaluateModal(false)}>Cancel</button>
              <button
                type="button"
                className="crispr-btn crispr-btn-warning"
                onClick={() => {
                  setShowReEvaluateModal(false);
                  showToast('success', 'Re-evaluation Started', 'Student responses are being re-evaluated.');
                }}
              >
                <i className="ti ti-check" /> Yes, Re-evaluate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Export Modal ── */}
      {showExportModal && (
        <div className="crispr-modal-backdrop active" onClick={() => setShowExportModal(false)}>
          <div className="crispr-modal-dialog" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="crispr-modal-header" style={{ background: 'linear-gradient(135deg, #006073 0%, #005a6b 100%)' }}>
              <h3><i className="ti ti-download" /> Export Rank List</h3>
              <button className="crispr-modal-close" onClick={() => setShowExportModal(false)}>
                <i className="ti ti-close" />
              </button>
            </div>
            <div className="crispr-modal-body">
              <div className="qar-modal-center">
                <div className="qar-modal-icon teal">
                  <i className="ti ti-file-pdf" style={{ fontSize: 32, color: '#006073' }} />
                </div>
                <h4 className="qar-modal-title">Confirm PDF Export</h4>
                <p className="qar-modal-desc">
                  You are about to export <strong style={{ color: '#006073' }}>{filteredRankings.length}</strong> record(s) to PDF.
                </p>
                <div className="qar-info-box">
                  <div className="qar-export-col-header">
                    <span>
                      <i className="ti ti-layout-list" style={{ color: '#006073', marginRight: 5 }} />
                      <strong>Select columns to include:</strong>
                    </span>
                    <button type="button" className="qar-select-all-btn" onClick={selectAllExportColumns}>Select All</button>
                  </div>
                  <div className="qar-export-cols-grid">
                    {ALL_EXPORT_COLS.map(({ key, label }) => {
                      const locked = !canToggleColumn(key, exportColumns);
                      return (
                        <label
                          key={key}
                          className={`qar-export-col-item${exportColumns[key] ? ' checked' : ''}${locked ? ' locked' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={exportColumns[key]}
                            onChange={() => toggleExportColumn(key)}
                            disabled={locked}
                          />
                          <span>{label}</span>
                          {locked && <i className="ti ti-lock" title="Required — see note below" />}
                        </label>
                      );
                    })}
                  </div>
                  <div className="qar-export-note">
                    <i className="ti ti-info-circle" />
                    <span>Either Student Name or Roll Number must be selected. Either Rank or Total Score must be selected.</span>
                  </div>
                </div>
                {hasActiveFilters && (
                  <div className="qar-filter-notice">
                    <i className="ti ti-filter" style={{ color: '#006073', fontSize: 18, marginTop: 2 }} />
                    <div><strong>Note:</strong> Active filters are applied. Only filtered records will be exported.</div>
                  </div>
                )}
              </div>
            </div>
            <div className="crispr-modal-footer">
              <button type="button" className="crispr-btn crispr-btn-default" onClick={() => setShowExportModal(false)}>Cancel</button>
              <button
                type="button"
                className="crispr-btn crispr-btn-primary"
                onClick={() => {
                  setShowExportModal(false);
                  showToast('success', 'Export Ready', 'Quiz report export generated successfully.');
                }}
              >
                <i className="ti ti-download" /> Export PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
