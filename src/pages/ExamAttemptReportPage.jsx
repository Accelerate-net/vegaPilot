import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ToastRegion from '../components/ToastRegion';
import { availableBatches, availableCourses, ensureAttempts } from '../data/attemptReportsDemo';
import { examsDemo } from '../data/examsDemo';

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString('en-IN') : 'Pending';
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
  const [showReEvaluateModal, setShowReEvaluateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
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
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 5000);
  }

  const rankings = useMemo(() => {
    const maximumMarks = exam.maximumMarks || 240;
    const completed = (exam.attempts || [])
      .filter((attempt) => attempt.status === 'completed')
      .sort((left, right) => right.score - left.score)
      .map((attempt, index, list) => ({
        ...attempt,
        rank: index > 0 && list[index - 1].score === attempt.score ? list[index - 1].rank : index + 1,
        percentage: Math.round((attempt.score / maximumMarks) * 100),
        timeTaken: formatMinutes(attempt.startedAt, attempt.completedAt),
      }));
    const progress = (exam.attempts || [])
      .filter((attempt) => attempt.status !== 'completed')
      .map((attempt) => ({ ...attempt, rank: '-', percentage: 0, timeTaken: '-' }));
    return [...completed, ...progress];
  }, [exam]);

  const filteredBatches = useMemo(
    () => availableBatches.filter((batch) => !selectedCourseFilter || batch.courseId === selectedCourseFilter),
    [selectedCourseFilter],
  );

  const filteredRankings = useMemo(() => {
    let next = [...rankings];
    if (statusFilter !== 'all') {
      next = next.filter((item) => item.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      next = next.filter((item) => [item.studentName, item.studentEmail, item.rollNumber].some((value) => String(value || '').toLowerCase().includes(query)));
    }
    if (dateFrom) {
      next = next.filter((item) => item.startedAt && new Date(item.startedAt) >= new Date(dateFrom));
    }
    if (dateTo) {
      next = next.filter((item) => item.startedAt && new Date(item.startedAt) <= new Date(`${dateTo}T23:59:59`));
    }
    if (selectedCourseFilter) {
      next = next.filter((item) => item.courseId === selectedCourseFilter);
    }
    if (selectedBatchFilters.length) {
      const studentIds = new Set(
        availableBatches
          .filter((batch) => selectedBatchFilters.includes(batch.id))
          .flatMap((batch) => batch.students),
      );
      next = next.filter((item) => studentIds.has(item.studentId));
    }

    next.sort((left, right) => {
      const leftValue = left[sortColumn] ?? '';
      const rightValue = right[sortColumn] ?? '';
      if (leftValue < rightValue) return sortDirection === 'asc' ? -1 : 1;
      if (leftValue > rightValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return next;
  }, [rankings, statusFilter, searchQuery, dateFrom, dateTo, selectedCourseFilter, selectedBatchFilters, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredRankings.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRankings = filteredRankings.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  function toggleSort(column) {
    setCurrentPage(1);
    if (sortColumn === column) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortColumn(column);
    setSortDirection('asc');
  }

  function toggleBatch(batchId) {
    setCurrentPage(1);
    setSelectedBatchFilters((current) => (current.includes(batchId) ? current.filter((value) => value !== batchId) : [...current, batchId]));
  }

  function clearFilters() {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setSelectedCourseFilter('');
    setSelectedBatchFilters([]);
    setCurrentPage(1);
  }

  const sections = Array.isArray(exam.sectionsData)
    ? exam.sectionsData
    : (() => {
        try {
          return JSON.parse(exam.sectionsData || '[]');
        } catch (error) {
          return [];
        }
      })();

  return (
    <section className="screen-card report-page">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
      <div className="hero-row">
        <div>
          <p className="eyebrow">Exam Report</p>
          <h3>{exam.title}</h3>
          <p className="muted-copy">{exam.brief}</p>
        </div>
        <div className="action-row">
          <button type="button" className="ghost-button" onClick={() => navigate('/exam-listing')}>Back to Exams</button>
          <button type="button" className="ghost-button" onClick={() => setShowReEvaluateModal(true)}>Re-evaluate</button>
          <button type="button" className="primary-button" onClick={() => setShowExportModal(true)}>Export PDF</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="detail-panel"><h4>Total Attempts</h4><p className="big-stat">{exam.attempts?.length || 0}</p></div>
        <div className="detail-panel"><h4>Completed</h4><p className="big-stat">{rankings.filter((item) => item.status === 'completed').length}</p></div>
        <div className="detail-panel"><h4>Max Marks</h4><p className="big-stat">{exam.maximumMarks || 240}</p></div>
        <div className="detail-panel"><h4>Sections</h4><p className="big-stat">{sections.length || exam.numberOfSections || 0}</p></div>
      </div>

      <div className="chip-row report-chip-row">
        {sections.map((section, index) => (
          <span key={`${section.name}-${index}`} className="status-pill">{section.name} · {section.questions?.length || section.totalQuestions || 0} Q</span>
        ))}
      </div>

      <div className="report-filter-grid">
        <div className="search-shell">
          <input className="search-input" placeholder="Search student, email, roll number..." value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); setCurrentPage(1); }} />
        </div>
        <select className="filter-select" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setCurrentPage(1); }}>
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="in-progress">In Progress</option>
        </select>
        <select className="filter-select" value={selectedCourseFilter} onChange={(event) => { setSelectedCourseFilter(event.target.value); setSelectedBatchFilters([]); setCurrentPage(1); }}>
          <option value="">All Courses</option>
          {availableCourses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
        </select>
        <input className="filter-select" type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setCurrentPage(1); }} />
        <input className="filter-select" type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setCurrentPage(1); }} />
        <button type="button" className="ghost-button" onClick={clearFilters}>Clear Filters</button>
      </div>

      <div className="batch-filter-panel">
        <p className="eyebrow">Batch Filter</p>
        <div className="chip-row">
          {filteredBatches.map((batch) => (
            <button key={batch.id} type="button" className={`table-button ${selectedBatchFilters.includes(batch.id) ? 'selected-chip' : ''}`} onClick={() => toggleBatch(batch.id)}>
              {batch.name}
            </button>
          ))}
        </div>
      </div>

      <div className="student-table-shell">
        <table className="student-table">
          <thead>
            <tr>
              <th><button type="button" className="sort-button" onClick={() => toggleSort('rank')}>Rank</button></th>
              <th><button type="button" className="sort-button" onClick={() => toggleSort('studentName')}>Student</button></th>
              <th><button type="button" className="sort-button" onClick={() => toggleSort('rollNumber')}>Roll Number</button></th>
              <th>Status</th>
              <th><button type="button" className="sort-button" onClick={() => toggleSort('percentage')}>Percentage</button></th>
              <th>Time Taken</th>
              <th>Started</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRankings.map((ranking) => (
              <tr key={`${ranking.studentId}-${ranking.startedAt}`}>
                <td>{ranking.rank}</td>
                <td><strong>{ranking.studentName}</strong><div className="student-subtle">{ranking.studentEmail}</div></td>
                <td>{ranking.rollNumber}</td>
                <td><span className={`status-pill ${ranking.status === 'completed' ? 'active' : 'expiring-soon'}`}>{ranking.status}</span></td>
                <td>{ranking.status === 'completed' ? `${ranking.percentage}%` : '-'}</td>
                <td>{ranking.timeTaken}</td>
                <td>{formatDateTime(ranking.startedAt)}</td>
              </tr>
            ))}
            {paginatedRankings.length === 0 ? <tr><td colSpan="7" className="empty-row">No attempts match the current filters.</td></tr> : null}
          </tbody>
        </table>
      </div>

      <div className="pagination-bar">
        <div className="pagination-controls">
          <button type="button" className="ghost-button compact" disabled={safeCurrentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>Previous</button>
          <span>Page {safeCurrentPage} of {totalPages}</span>
          <button type="button" className="ghost-button compact" disabled={safeCurrentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>Next</button>
        </div>
        <select className="filter-select compact" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setCurrentPage(1); }}>
          {[20, 50, 100].map((size) => <option key={size} value={size}>{size}/page</option>)}
        </select>
      </div>

      {showReEvaluateModal ? (
        <div className="modal-scrim" role="presentation" onClick={() => setShowReEvaluateModal(false)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <p className="eyebrow">Re-evaluate</p>
            <h4>Recompute all completed attempts?</h4>
            <p className="muted-copy">This mirrors the legacy re-evaluation flow and would normally trigger a server-side scoring pass.</p>
            <div className="action-row">
              <button type="button" className="ghost-button" onClick={() => setShowReEvaluateModal(false)}>Cancel</button>
              <button type="button" className="primary-button" onClick={() => { setShowReEvaluateModal(false); showToast('success', 'Re-evaluation Started', 'Attempt re-evaluation has been queued.'); }}>Start Re-evaluation</button>
            </div>
          </div>
        </div>
      ) : null}

      {showExportModal ? (
        <div className="modal-scrim" role="presentation" onClick={() => setShowExportModal(false)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <p className="eyebrow">Export Columns</p>
            <h4>Choose the columns to include</h4>
            <div className="report-column-grid">
              {Object.keys(exportColumns).map((column) => (
                <label key={column} className="selection-card">
                  <input
                    type="checkbox"
                    checked={exportColumns[column]}
                    onChange={() => setExportColumns((current) => ({ ...current, [column]: !current[column] }))}
                  />
                  <span>{column.replace(/([A-Z])/g, ' $1')}</span>
                </label>
              ))}
            </div>
            <div className="action-row">
              <button type="button" className="ghost-button" onClick={() => setShowExportModal(false)}>Cancel</button>
              <button type="button" className="primary-button" onClick={() => { setShowExportModal(false); showToast('success', 'Export Ready', `Prepared PDF export for ${filteredRankings.length} attempt records.`); }}>Export</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
