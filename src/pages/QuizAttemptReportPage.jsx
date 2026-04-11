import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ToastRegion from '../components/ToastRegion';
import { availableBatches, availableCourses, ensureAttempts } from '../data/attemptReportsDemo';
import { draftQuizzesDemo, publishedQuizzesDemo } from '../data/quizzesDemo';

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString('en-IN') : 'Pending';
}

function getQuizFromStorage(quizId) {
  const handoff = window.localStorage.getItem('reportQuizData');
  if (handoff) {
    try {
      window.localStorage.removeItem('reportQuizData');
      return JSON.parse(handoff);
    } catch (error) {
      console.error('Failed to parse reportQuizData', error);
    }
  }

  const drafts = JSON.parse(window.localStorage.getItem('quizDrafts') || '[]');
  const published = JSON.parse(window.localStorage.getItem('publishedQuizzes') || '[]');
  return [...published, ...drafts, ...publishedQuizzesDemo, ...draftQuizzesDemo].find((quiz) => String(quiz.id) === String(quizId)) || null;
}

export default function QuizAttemptReportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');
  const [selectedBatchFilters, setSelectedBatchFilters] = useState([]);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState('rank');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showExportModal, setShowExportModal] = useState(false);
  const [toasts, setToasts] = useState([]);
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

  function showToast(type, title, message) {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 5000);
  }

  const rankings = useMemo(() => {
    const maxMarks = quiz.maximumMarks || 240;
    const completed = (quiz.attempts || [])
      .filter((attempt) => attempt.status === 'completed')
      .sort((left, right) => right.score - left.score)
      .map((attempt, index, list) => ({
        ...attempt,
        rank: index > 0 && list[index - 1].score === attempt.score ? list[index - 1].rank : index + 1,
        percentage: Math.round((attempt.score / maxMarks) * 100),
        timeTaken: attempt.startedAt && attempt.completedAt
          ? `${Math.floor((new Date(attempt.completedAt) - new Date(attempt.startedAt)) / 60000)} min`
          : '-',
      }));
    const progress = (quiz.attempts || []).filter((attempt) => attempt.status !== 'completed').map((attempt) => ({ ...attempt, rank: '-', percentage: 0, timeTaken: '-' }));
    return [...completed, ...progress];
  }, [quiz]);

  const filteredRankings = useMemo(() => {
    let next = [...rankings];
    if (statusFilter !== 'all') next = next.filter((item) => item.status === statusFilter);
    if (selectedCourseFilter) next = next.filter((item) => item.courseId === selectedCourseFilter);
    if (selectedBatchFilters.length) {
      const studentIds = new Set(availableBatches.filter((batch) => selectedBatchFilters.includes(batch.id)).flatMap((batch) => batch.students));
      next = next.filter((item) => studentIds.has(item.studentId));
    }
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      next = next.filter((item) => [item.studentName, item.studentEmail, item.rollNumber].some((value) => String(value || '').toLowerCase().includes(query)));
    }
    next.sort((left, right) => {
      const leftValue = left[sortColumn] ?? '';
      const rightValue = right[sortColumn] ?? '';
      if (leftValue < rightValue) return sortDirection === 'asc' ? -1 : 1;
      if (leftValue > rightValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return next;
  }, [rankings, statusFilter, selectedCourseFilter, selectedBatchFilters, searchQuery, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredRankings.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const visibleRankings = filteredRankings.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  function toggleSort(column) {
    setCurrentPage(1);
    if (sortColumn === column) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortColumn(column);
    setSortDirection('asc');
  }

  return (
    <section className="screen-card report-page">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
      <div className="hero-row">
        <div>
          <p className="eyebrow">Quiz Report</p>
          <h3>{quiz.title}</h3>
          <p className="muted-copy">{quiz.description}</p>
        </div>
        <div className="action-row">
          <button type="button" className="ghost-button" onClick={() => navigate('/quiz-listing')}>Back to Quizzes</button>
          <button type="button" className="primary-button" onClick={() => setShowExportModal(true)}>Export PDF</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="detail-panel"><h4>Total Attempts</h4><p className="big-stat">{quiz.attempts?.length || 0}</p></div>
        <div className="detail-panel"><h4>Completed</h4><p className="big-stat">{rankings.filter((item) => item.status === 'completed').length}</p></div>
        <div className="detail-panel"><h4>Duration</h4><p className="big-stat">{quiz.duration} min</p></div>
        <div className="detail-panel"><h4>Maximum Marks</h4><p className="big-stat">{quiz.maximumMarks}</p></div>
      </div>

      <div className="report-filter-grid">
        <div className="search-shell">
          <input className="search-input" placeholder="Search attempts..." value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); setCurrentPage(1); }} />
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
      </div>

      <div className="batch-filter-panel">
        <p className="eyebrow">Batches</p>
        <div className="chip-row">
          {availableBatches
            .filter((batch) => !selectedCourseFilter || batch.courseId === selectedCourseFilter)
            .map((batch) => (
              <button key={batch.id} type="button" className={`table-button ${selectedBatchFilters.includes(batch.id) ? 'selected-chip' : ''}`} onClick={() => { setCurrentPage(1); setSelectedBatchFilters((current) => current.includes(batch.id) ? current.filter((value) => value !== batch.id) : [...current, batch.id]); }}>
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
              <th>Started</th>
            </tr>
          </thead>
          <tbody>
            {visibleRankings.map((ranking) => (
              <tr key={`${ranking.studentId}-${ranking.startedAt}`}>
                <td>{ranking.rank}</td>
                <td><strong>{ranking.studentName}</strong><div className="student-subtle">{ranking.studentEmail}</div></td>
                <td>{ranking.rollNumber}</td>
                <td><span className={`status-pill ${ranking.status === 'completed' ? 'active' : 'expiring-soon'}`}>{ranking.status}</span></td>
                <td>{ranking.status === 'completed' ? `${ranking.percentage}%` : '-'}</td>
                <td>{formatDateTime(ranking.startedAt)}</td>
              </tr>
            ))}
            {visibleRankings.length === 0 ? <tr><td colSpan="6" className="empty-row">No quiz attempts match the current filters.</td></tr> : null}
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

      {showExportModal ? (
        <div className="modal-scrim" role="presentation" onClick={() => setShowExportModal(false)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <p className="eyebrow">Export Quiz Report</p>
            <h4>Prepare export for {filteredRankings.length} attempts?</h4>
            <p className="muted-copy">The legacy screen exports a filtered ranking table. This React port keeps the same filtered-snapshot behavior.</p>
            <div className="action-row">
              <button type="button" className="ghost-button" onClick={() => setShowExportModal(false)}>Cancel</button>
              <button type="button" className="primary-button" onClick={() => { setShowExportModal(false); showToast('success', 'Export Ready', 'Quiz report export generated successfully.'); }}>Export</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
