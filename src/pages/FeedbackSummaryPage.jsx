import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ToastRegion from '../components/ToastRegion';
import { availableBatches, availableCourses } from '../data/attemptReportsDemo';
import { examsDemo } from '../data/examsDemo';
import { feedbackDemoData } from '../data/feedbackDemo';
import { feedbackSummary, listFeedback } from '../lib/feedbackApi';

function formatLastReceived(unixSeconds) {
  if (!unixSeconds) return 'No submissions yet';
  const d = new Date(unixSeconds * 1000);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (sameDay) return 'Last received today';
  if (isYesterday) return 'Last received yesterday';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `Last received ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function RatingStars({ rating }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.25 && rating - full < 0.75;
  const fullCount = rating - full >= 0.75 ? full + 1 : full;
  return (
    <span style={{ color: '#fbbf24', fontSize: '14px', letterSpacing: '1px' }}>
      {[1, 2, 3, 4, 5].map((i) => {
        if (i <= fullCount) return <i key={i} className="ti ti-star" style={{ fontWeight: 'bold' }} />;
        if (i === fullCount + 1 && hasHalf) return <i key={i} className="ti ti-star-half" />;
        return <i key={i} className="ti ti-star" style={{ opacity: 0.3 }} />;
      })}
    </span>
  );
}

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

function StarRating({ rating }) {
  return (
    <div style={{ display: 'flex', color: '#fbbf24', fontSize: '16px', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <i key={star} className={`ti ${star <= rating ? 'ti-star' : 'ti-star'} `} style={{ fontWeight: star <= rating ? 'bold' : 'normal', opacity: star <= rating ? 1 : 0.3 }} />
      ))}
    </div>
  );
}

const SORT_COL_TO_API = {
  studentName: 'name',
  itemType: 'type',
  rating: 'rating',
  submittedAt: 'createdAt',
};

const TYPE_LABEL = { COURSE: 'Course', MODULE: 'Module', CHAPTER: 'Chapter', EXAM: 'Exam' };

function getSummaryTileTitle(item) {
  if (item.title) return item.title;
  const parts = [TYPE_LABEL[item.type] || item.type];
  if (item.courseId != null) parts.push(`C${item.courseId}`);
  if (item.moduleId != null) parts.push(`M${item.moduleId}`);
  if (item.chapterId != null) parts.push(`Ch${item.chapterId}`);
  return parts.join(' · ');
}

export default function FeedbackSummaryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');
  const [selectedChapterFilter, setSelectedChapterFilter] = useState('');
  const [selectedExamFilter, setSelectedExamFilter] = useState('');
  const [selectedBatchFilters, setSelectedBatchFilters] = useState([]);

  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState('submittedAt');
  const [sortDirection, setSortDirection] = useState('desc');

  const [toasts, setToasts] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);

  // ── Summary tiles (from /feedback/summary) ──
  const [summaryTiles, setSummaryTiles] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [tilesPage, setTilesPage] = useState(1);
  const [tilesLastPage, setTilesLastPage] = useState(1);
  const [selectedTile, setSelectedTile] = useState(null);
  const TILES_PER_PAGE = 10;

  useEffect(() => {
    let cancelled = false;
    setSummaryLoading(true);
    setSummaryError('');
    feedbackSummary({ sortBy: 'rating', sortOrder: 'DESC', page: tilesPage, limit: TILES_PER_PAGE })
      .then((body) => {
        if (cancelled) return;
        setSummaryTiles(Array.isArray(body?.data) ? body.data : []);
        setTilesLastPage(body?.pagination?.lastPage ?? 1);
      })
      .catch((err) => {
        if (cancelled) return;
        setSummaryError(err?.message || 'Failed to load summary');
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });
    return () => { cancelled = true; };
  }, [tilesPage]);

  function tilesMatch(a, b) {
    if (!a || !b) return false;
    return a.type === b.type
      && (a.courseId ?? null) === (b.courseId ?? null)
      && (a.moduleId ?? null) === (b.moduleId ?? null)
      && (a.chapterId ?? null) === (b.chapterId ?? null);
  }

  function handleTileClick(tile) {
    setSelectedTile((cur) => (tilesMatch(cur, tile) ? null : tile));
    setCurrentPage(1);
  }

  // ── List (from /feedback/list) ──
  const [listRows, setListRows] = useState([]);
  const [listTotal, setListTotal] = useState(0);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setListLoading(true);
    setListError('');
    const params = {
      page: currentPage,
      size: pageSize,
      sortBy: SORT_COL_TO_API[sortColumn] || 'createdAt',
      sortOrder: sortDirection.toUpperCase(),
    };
    if (searchQuery.trim()) {
      params.filterBy = 'Title';
      params.searchKey = searchQuery.trim();
    }
    if (selectedTile) {
      params.type = selectedTile.type;
      if (selectedTile.courseId != null) params.courseId = selectedTile.courseId;
      if (selectedTile.moduleId != null) params.moduleId = selectedTile.moduleId;
      if (selectedTile.chapterId != null) params.chapterId = selectedTile.chapterId;
    }
    listFeedback(params)
      .then((body) => {
        if (cancelled) return;
        setListRows(Array.isArray(body?.data) ? body.data : []);
        setListTotal(body?.pagination?.total ?? 0);
      })
      .catch((err) => {
        if (cancelled) return;
        setListError(err?.message || 'Failed to load feedback');
        setListRows([]);
        setListTotal(0);
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => { cancelled = true; };
  }, [currentPage, pageSize, sortColumn, sortDirection, searchQuery, selectedTile]);

  function showToast(type, title, message) {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 5000);
  }

  const filteredBatches = useMemo(
    () => availableBatches.filter((b) => !selectedCourseFilter || b.courseId === selectedCourseFilter),
    [selectedCourseFilter]
  );

  const availableChaptersForCourse = useMemo(() => {
    if (!selectedCourseFilter) return [];
    const chapters = new Set();
    feedbackDemoData.forEach((fb) => {
      if (fb.itemType === 'course' && fb.itemId === selectedCourseFilter && fb.chapterName) {
        chapters.add(fb.chapterName);
      }
    });
    return Array.from(chapters).sort();
  }, [selectedCourseFilter]);

  const filteredFeedbacks = useMemo(() => {
    let next = [...feedbackDemoData];
    
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      next = next.filter((r) => 
        (r.studentName && r.studentName.toLowerCase().includes(q)) ||
        (r.studentEmail && r.studentEmail.toLowerCase().includes(q)) ||
        (r.remarks && r.remarks.toLowerCase().includes(q))
      );
    }
    
    if (dateFrom) next = next.filter((r) => new Date(r.submittedAt) >= new Date(dateFrom));
    if (dateTo) next = next.filter((r) => new Date(r.submittedAt) <= new Date(dateTo));
    
    if (selectedCourseFilter) {
      next = next.filter((r) => r.itemType === 'course' && r.itemId === selectedCourseFilter);
      if (selectedChapterFilter) {
        next = next.filter((r) => r.chapterName === selectedChapterFilter);
      }
    }
    
    if (selectedExamFilter) {
      next = next.filter((r) => r.itemType === 'exam' && r.itemId === selectedExamFilter);
    }

    if (selectedBatchFilters.length) {
      const studentIds = new Set(
        availableBatches.filter((b) => selectedBatchFilters.includes(b.id)).flatMap((b) => b.students)
      );
      next = next.filter((r) => !r.isAnonymous && studentIds.has(r.studentId));
    }
    
    next.sort((a, b) => {
      let av = a[sortColumn] ?? '';
      let bv = b[sortColumn] ?? '';
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      
      if (av < bv) return sortDirection === 'asc' ? -1 : 1;
      if (av > bv) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return next;
  }, [searchQuery, dateFrom, dateTo, selectedCourseFilter, selectedChapterFilter, selectedExamFilter, selectedBatchFilters, sortColumn, sortDirection]);

  const summary = useMemo(() => {
    if (filteredFeedbacks.length === 0) return { avg: 0, count: 0 };
    const total = filteredFeedbacks.reduce((sum, fb) => sum + fb.rating, 0);
    return {
      avg: (total / filteredFeedbacks.length).toFixed(2),
      count: filteredFeedbacks.length,
    };
  }, [filteredFeedbacks]);

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
    setSearchQuery(''); 
    setDateFrom(''); 
    setDateTo('');
    setSelectedCourseFilter(''); 
    setSelectedChapterFilter('');
    setSelectedExamFilter('');
    setSelectedBatchFilters([]); 
    setCurrentPage(1);
  }

  const hasActiveFilters = searchQuery || dateFrom || dateTo || selectedCourseFilter || selectedChapterFilter || selectedExamFilter || selectedBatchFilters.length > 0;

  const totalPages = Math.max(1, Math.ceil(listTotal / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = listTotal === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndex = Math.min(safePage * pageSize, listTotal);

  function getCourseName(id) {
    const c = availableCourses.find((course) => course.id === id);
    return c ? c.name : id;
  }

  function getExamName(id) {
    const e = examsDemo.find((exam) => String(exam.id) === String(id));
    return e ? e.title : id;
  }

  function getBatchName(id) {
    const b = availableBatches.find((batch) => batch.id === id);
    return b ? b.name : id;
  }

  return (
    <section className="screen-card report-page exam-attempt-report-page">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((c) => c.filter((t) => t.id !== id))} />

      {/* ── Header Card ── */}
      <div className="ear-header-card">
        <div className="ear-header-top">
          <div className="ear-header-main">
            <h2 className="ear-header-title">
              <i className="ti ti-star" style={{ color: '#fbbf24' }} /> Feedback Summary
            </h2>
            <p className="ear-header-desc">Consolidated view of all student feedback for courses and exams.</p>
          </div>
        </div>

        <div className="ear-header-body">
          <div className="ear-stats-row">
            <div className="ear-stat-card" style={{ flex: 'none', width: '300px' }}>
              <div className="ear-stat-icon ear-stat-orange"><i className="ti ti-bar-chart" /></div>
              <div className="ear-stat-info">
                <h3 style={{ color: '#006073' }}>
                  {summary.avg} <span style={{ fontSize: '14px', color: '#59757b', fontWeight: 'normal' }}>from {summary.count} feedbacks</span>
                </h3>
                <p>Average Rating (Filtered)</p>
              </div>
            </div>
            
            <div className="ear-stat-card">
              <div className="ear-stat-icon ear-stat-teal"><i className="ti ti-comments" /></div>
              <div className="ear-stat-info">
                <h3>{filteredFeedbacks.filter(r => r.remarks && r.remarks.trim().length > 0).length}</h3>
                <p>Written Remarks</p>
              </div>
            </div>

            <div className="ear-stat-card">
              <div className="ear-stat-icon ear-stat-indigo"><i className="ti ti-na" /></div>
              <div className="ear-stat-info">
                <h3>{filteredFeedbacks.filter(r => r.isAnonymous).length}</h3>
                <p>Anonymous</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Summary Tiles (paged 10 at a time, click to filter table) ── */}
      <div className="ear-summary-tiles-section" style={{ margin: '0 0 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 12 }}>
          <h4 style={{ margin: 0, color: '#16353c', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-medal" style={{ color: '#fbbf24' }} />
            Top Rated
            {summaryLoading && <span style={{ fontSize: 12, color: '#59757b', fontWeight: 'normal' }}>Loading…</span>}
            {summaryError && <span style={{ fontSize: 12, color: '#c0392b', fontWeight: 'normal' }}>{summaryError}</span>}
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {selectedTile && (
              <button
                type="button"
                className="ear-btn-default"
                style={{ fontSize: 12, padding: '4px 10px' }}
                onClick={() => { setSelectedTile(null); setCurrentPage(1); }}
              >
                <i className="ti ti-list" /> Show All Reviews
              </button>
            )}
            <button
              type="button"
              className="ear-page-btn"
              disabled={tilesPage <= 1 || summaryLoading}
              onClick={() => setTilesPage((p) => Math.max(1, p - 1))}
              aria-label="Previous tiles"
            >
              <i className="ti ti-angle-left" />
            </button>
            <span style={{ fontSize: 12, color: '#59757b', minWidth: 56, textAlign: 'center' }}>
              {tilesPage} / {tilesLastPage}
            </span>
            <button
              type="button"
              className="ear-page-btn"
              disabled={tilesPage >= tilesLastPage || summaryLoading}
              onClick={() => setTilesPage((p) => Math.min(tilesLastPage, p + 1))}
              aria-label="Next tiles"
            >
              <i className="ti ti-angle-right" />
            </button>
          </div>
        </div>
        {!summaryLoading && !summaryError && summaryTiles.length === 0 ? (
          <div style={{ padding: 16, background: '#fafbfc', borderRadius: 8, color: '#59757b', fontSize: 13 }}>
            No feedback summary available yet.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            {summaryTiles.map((item, idx) => {
              const ratingNum = Number(item.rating) || 0;
              const isSelected = tilesMatch(selectedTile, item);
              return (
                <button
                  type="button"
                  key={`${item.type}-${item.courseId}-${item.moduleId}-${item.chapterId}-${idx}`}
                  onClick={() => handleTileClick(item)}
                  style={{
                    background: isSelected ? '#e6f6f9' : '#fff',
                    border: `1px solid ${isSelected ? '#00a8cc' : '#e3e8ec'}`,
                    borderRadius: 8,
                    padding: '12px 14px',
                    boxShadow: isSelected ? '0 0 0 2px rgba(0,168,204,0.18)' : '0 1px 2px rgba(0,0,0,0.03)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    font: 'inherit',
                  }}
                >
                  <div
                    title={getSummaryTileTitle(item)}
                    style={{
                      fontWeight: 600,
                      color: '#16353c',
                      fontSize: 13,
                      marginBottom: 6,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {getSummaryTileTitle(item)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#006073' }}>
                      {ratingNum.toFixed(2)}
                    </span>
                    <span style={{ fontSize: 12, color: '#59757b' }}>of 5</span>
                    <RatingStars rating={ratingNum} />
                  </div>
                  <div style={{ fontSize: 11, color: '#59757b' }}>
                    from <strong>{item.totalCount ?? 0}</strong> review{item.totalCount === 1 ? '' : 's'}
                  </div>
                  <div style={{ fontSize: 11, color: '#59757b', marginTop: 2 }}>
                    {formatLastReceived(item.lastSubmissionAt)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Filter Section ── */}
      <div className="ear-filter-section ear-filter-compact">
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
              placeholder="Search student or remarks..."
              value={searchQuery}
              onChange={(event) => { setSearchQuery(event.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="ear-filter-group">
            <label className="ear-filter-label"><i className="ti ti-calendar" /> From</label>
            <input
              type="date"
              className="ear-filter-input"
              value={dateFrom}
              onChange={(event) => { setDateFrom(event.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="ear-filter-group">
            <label className="ear-filter-label"><i className="ti ti-calendar" /> To</label>
            <input
              type="date"
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
              onChange={(event) => { 
                setSelectedCourseFilter(event.target.value); 
                setSelectedChapterFilter('');
                if (event.target.value) setSelectedExamFilter('');
                setSelectedBatchFilters([]); 
                setCurrentPage(1); 
              }}
            >
              <option value="">All Courses</option>
              {availableCourses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
            </select>
          </div>

          <div className="ear-filter-group">
            <label className="ear-filter-label"><i className="ti ti-bookmark" /> Chapter</label>
            <select
              className="ear-filter-input"
              value={selectedChapterFilter}
              onChange={(event) => { setSelectedChapterFilter(event.target.value); setCurrentPage(1); }}
              disabled={!selectedCourseFilter}
            >
              <option value="">All Chapters</option>
              {availableChaptersForCourse.map((ch) => <option key={ch} value={ch}>{ch}</option>)}
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

          <div className="ear-filter-group">
            <label className="ear-filter-label"><i className="ti ti-receipt" /> Exam</label>
            <select
              className="ear-filter-input"
              value={selectedExamFilter}
              onChange={(event) => { 
                setSelectedExamFilter(event.target.value); 
                if (event.target.value) {
                  setSelectedCourseFilter('');
                  setSelectedBatchFilters([]);
                }
                setCurrentPage(1); 
              }}
            >
              <option value="">All Exams</option>
              {examsDemo.map((ex) => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
            </select>
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
            {dateFrom && (
              <span className="ear-filter-badge">
                From: {new Date(dateFrom).toLocaleDateString()}
                <button type="button" onClick={() => setDateFrom('')}><i className="ti ti-close" /></button>
              </span>
            )}
            {dateTo && (
              <span className="ear-filter-badge">
                To: {new Date(dateTo).toLocaleDateString()}
                <button type="button" onClick={() => setDateTo('')}><i className="ti ti-close" /></button>
              </span>
            )}
            {selectedCourseFilter && (
              <span className="ear-filter-badge">
                Course: {getCourseName(selectedCourseFilter)}
                <button type="button" onClick={() => { setSelectedCourseFilter(''); setSelectedChapterFilter(''); setSelectedBatchFilters([]); }}><i className="ti ti-close" /></button>
              </span>
            )}
            {selectedChapterFilter && (
              <span className="ear-filter-badge">
                Chapter: {selectedChapterFilter}
                <button type="button" onClick={() => setSelectedChapterFilter('')}><i className="ti ti-close" /></button>
              </span>
            )}
            {selectedExamFilter && (
              <span className="ear-filter-badge">
                Exam: {getExamName(selectedExamFilter)}
                <button type="button" onClick={() => setSelectedExamFilter('')}><i className="ti ti-close" /></button>
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

      {/* ── Selected-tile banner ── */}
      {selectedTile && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: '8px 12px',
            background: '#e6f6f9',
            border: '1px solid #00a8cc',
            borderRadius: 6,
            marginBottom: 10,
            fontSize: 13,
            color: '#16353c',
          }}
        >
          <span>
            <i className="ti ti-filter" style={{ marginRight: 6, color: '#006073' }} />
            Showing reviews for <strong>{getSummaryTileTitle(selectedTile)}</strong>
          </span>
          <button
            type="button"
            className="ear-btn-default"
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={() => { setSelectedTile(null); setCurrentPage(1); }}
          >
            <i className="ti ti-list" /> Show All Reviews
          </button>
        </div>
      )}

      {/* ── Action Row ── */}
      <div className="ear-action-row">
        <div className="ear-record-count">
          <strong>{listTotal}</strong> record(s) found
          {listLoading && <span style={{ marginLeft: 8, color: '#59757b', fontSize: 12 }}>Loading…</span>}
          {listError && <span style={{ marginLeft: 8, color: '#c0392b', fontSize: 12 }}>{listError}</span>}
        </div>
        <div className="ear-action-buttons">
          <button
            type="button"
            className="ear-btn-export"
            disabled={listTotal === 0}
            onClick={() => setShowExportModal(true)}
          >
            <i className="ti ti-download" /> Export List to PDF
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      {listRows.length > 0 ? (
        <div className="ear-table-container">
          <table className="ear-rank-table">
            <thead>
              <tr>
                <th className={`ear-th-sortable${sortColumn === 'studentName' ? ' ear-th-active' : ''}`} onClick={() => toggleSort('studentName')}>
                  Student <i className={`ti ${getSortIcon('studentName')} ear-sort-icon`} />
                </th>
                <th className={`ear-th-sortable${sortColumn === 'itemType' ? ' ear-th-active' : ''}`} onClick={() => toggleSort('itemType')}>
                  Context <i className={`ti ${getSortIcon('itemType')} ear-sort-icon`} />
                </th>
                <th>Remarks</th>
                <th className={`ear-th-sortable${sortColumn === 'rating' ? ' ear-th-active' : ''}`} style={{ width: 140 }} onClick={() => toggleSort('rating')}>
                  Rating <i className={`ti ${getSortIcon('rating')} ear-sort-icon`} />
                </th>
                <th className={`ear-th-sortable${sortColumn === 'submittedAt' ? ' ear-th-active' : ''}`} style={{ width: 180 }} onClick={() => toggleSort('submittedAt')}>
                  Date <i className={`ti ${getSortIcon('submittedAt')} ear-sort-icon`} />
                </th>
              </tr>
            </thead>
            <tbody>
              {listRows.map((fb) => {
                const candidate = fb.candidate || {};
                const createdMs = fb.createdAt ? fb.createdAt * 1000 : null;
                return (
                  <tr key={fb.id}>
                    <td>
                      {candidate.name ? (
                        <>
                          <strong>{candidate.name}</strong>
                          {candidate.email && (
                            <div style={{ fontSize: '11px', color: '#59757b' }}>{candidate.email}</div>
                          )}
                        </>
                      ) : (
                        <span className="ear-td-muted"><i className="ti ti-na" /> Anonymous</span>
                      )}
                    </td>
                    <td>
                      <div>
                        <strong>{fb.title || '-'}</strong>{' '}
                        <span className="ear-td-muted" style={{ fontSize: '11px' }}>({TYPE_LABEL[fb.type] || fb.type})</span>
                      </div>
                    </td>
                    <td>
                      {fb.comments ? (
                        <span style={{ fontStyle: 'italic', color: '#16353c' }}>&quot;{fb.comments}&quot;</span>
                      ) : (
                        <span className="ear-td-muted">-</span>
                      )}
                    </td>
                    <td>
                      <StarRating rating={fb.rating} />
                    </td>
                    <td className="ear-td-datetime">{createdMs ? formatDateTime(createdMs) : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="ear-pagination">
            <div className="ear-pagination-info">
              Showing <strong>{startIndex}</strong> to <strong>{endIndex}</strong> of <strong>{listTotal}</strong> records
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
        </div>
      ) : (
        <div className="ear-empty-state">
          <i className="ti ti-search" />
          <h4>No Feedbacks Found</h4>
          <p>{hasActiveFilters ? 'Try adjusting your search or filters.' : 'No student feedback has been submitted yet.'}</p>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="ear-modal-scrim" role="presentation" onClick={() => setShowExportModal(false)}>
          <div className="ear-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="ear-modal-header ear-modal-header-teal">
              <h3><i className="ti ti-download" /> Export Feedback Report</h3>
              <button type="button" className="ear-modal-close" onClick={() => setShowExportModal(false)}>
                <i className="ti ti-close" />
              </button>
            </div>
            <div className="ear-modal-body">
              <div className="ear-modal-center">
                <i className="ti ti-file-pdf" style={{ fontSize: 48, color: '#00a8cc', marginBottom: 12 }} />
                <h4 className="ear-modal-heading">Generate PDF Report</h4>
                <p className="ear-modal-subtext">You are about to export <strong>{listTotal}</strong> feedback(s) based on your current filters.</p>
              </div>
            </div>
            <div className="ear-modal-footer">
              <button type="button" className="ear-btn-default" onClick={() => setShowExportModal(false)}>Cancel</button>
              <button
                type="button"
                className="ear-btn-export"
                style={{ background: '#004d5c', color: 'white', borderColor: 'transparent' }}
                onClick={() => {
                  setShowExportModal(false);
                  showToast('success', 'Download Started', 'Your PDF export is being generated.');
                }}
              >
                <i className="ti ti-download" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
