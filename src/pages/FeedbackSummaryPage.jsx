import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ToastRegion from '../components/ToastRegion';
import { availableBatches, availableCourses } from '../data/attemptReportsDemo';
import { examsDemo } from '../data/examsDemo';
import { feedbackDemoData } from '../data/feedbackDemo';

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

  const totalPages = Math.max(1, Math.ceil(filteredFeedbacks.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedFeedbacks = filteredFeedbacks.slice((safePage - 1) * pageSize, safePage * pageSize);
  const startIndex = filteredFeedbacks.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndex = Math.min(safePage * pageSize, filteredFeedbacks.length);

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

      {/* ── Action Row ── */}
      <div className="ear-action-row">
        <div className="ear-record-count">
          <strong>{filteredFeedbacks.length}</strong> record(s) found
        </div>
        <div className="ear-action-buttons">
          <button
            type="button"
            className="ear-btn-export"
            disabled={filteredFeedbacks.length === 0}
            onClick={() => setShowExportModal(true)}
          >
            <i className="ti ti-download" /> Export List to PDF
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      {filteredFeedbacks.length > 0 ? (
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
              {paginatedFeedbacks.map((fb) => (
                <tr key={fb.id}>
                  <td>
                    {fb.isAnonymous ? (
                      <span className="ear-td-muted"><i className="ti ti-na" /> Anonymous</span>
                    ) : (
                      <>
                        <strong>{fb.studentName}</strong>
                        <div style={{ fontSize: '11px', color: '#59757b' }}>{fb.studentEmail}</div>
                      </>
                    )}
                  </td>
                  <td>
                    <div><strong>{fb.itemName}</strong> <span className="ear-td-muted" style={{ fontSize: '11px' }}>({fb.itemType})</span></div>
                    {fb.chapterName && <div style={{ fontSize: '12px', color: '#006073' }}><i className="ti ti-book" /> {fb.chapterName}</div>}
                  </td>
                  <td>
                    {fb.remarks ? (
                      <span style={{ fontStyle: 'italic', color: '#16353c' }}>&quot;{fb.remarks}&quot;</span>
                    ) : (
                      <span className="ear-td-muted">-</span>
                    )}
                  </td>
                  <td>
                    <StarRating rating={fb.rating} />
                  </td>
                  <td className="ear-td-datetime">{formatDateTime(fb.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="ear-pagination">
            <div className="ear-pagination-info">
              Showing <strong>{startIndex}</strong> to <strong>{endIndex}</strong> of <strong>{filteredFeedbacks.length}</strong> records
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
                <p className="ear-modal-subtext">You are about to export <strong>{filteredFeedbacks.length}</strong> feedback(s) based on your current filters.</p>
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
