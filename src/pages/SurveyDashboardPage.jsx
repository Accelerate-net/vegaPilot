import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ToastRegion from '../components/ToastRegion';
import { availableBatches, availableCourses } from '../data/attemptReportsDemo';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
        <div className="qar-batch-dropdown" style={{ zIndex: 100 }}>
          <div className="qar-batch-actions">
            <button type="button" className="qar-batch-select-all" onClick={() => onChange(batches.map((b) => b.id))}>Select All</button>
            <button type="button" className="qar-batch-clear-all" onClick={() => onChange([])}>Clear All</button>
          </div>
          {batches.length === 0 ? (
            <div className="qar-batch-empty">No batches available</div>
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

function CourseMultiSelect({ courses, selected, onChange, disabled }) {
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
    if (!selected.length) return 'Select Courses';
    if (selected.length === 1) return courses.find((c) => c.id === selected[0])?.name || '1 selected';
    return `${selected.length} courses selected`;
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
        <div className="qar-batch-dropdown" style={{ zIndex: 100 }}>
          <div className="qar-batch-actions">
            <button type="button" className="qar-batch-select-all" onClick={() => onChange(courses.map((c) => c.id))}>Select All</button>
            <button type="button" className="qar-batch-clear-all" onClick={() => onChange([])}>Clear All</button>
          </div>
          {courses.length === 0 ? (
            <div className="qar-batch-empty">No courses available</div>
          ) : (
            courses.map((course) => (
              <label key={course.id} className={`qar-batch-item${selected.includes(course.id) ? ' selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={selected.includes(course.id)}
                  onChange={() => toggle(course.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span>{course.name}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function KebabMenu({ survey, onAction }) {
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
          <button type="button" className="ear-kebab-item" onClick={() => { setOpen(false); onAction(survey, 'view_survey'); }}>
            <i className="ti ti-desktop" /> Preview Survey Form
          </button>
          {survey.status === 'published' && (
            <button type="button" className="ear-kebab-item" onClick={() => { setOpen(false); onAction(survey, 'end'); }}>
              <i className="ti ti-close" /> End Survey
            </button>
          )}
          {survey.status === 'scheduled' && (
            <button type="button" className="ear-kebab-item" onClick={() => { setOpen(false); onAction(survey, 'recall'); }}>
              <i className="ti ti-back-left" /> Recall Survey
            </button>
          )}
          <button type="button" className="ear-kebab-item" onClick={() => { setOpen(false); onAction(survey, 'view_responses'); }}>
            <i className="ti ti-list" /> View Responses
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Default Data ─────────────────────────────────────────────────────────────
const initialSurveys = [
  {
    id: 'SRV-101',
    title: 'Course Well-being check',
    targetAudience: 'Batch A',
    status: 'published',
    timeWindow: 'Open ended',
    acceptsAnonymous: true,
    questions: [
      { text: 'How stressed were you?', type: 'Star Rating', required: true },
      { text: 'Any suggestions?', type: 'Text Input', required: false },
      { text: "What's your mode of commute?", type: 'Multi Select', required: true, options: ['Scooter', 'Car', 'School Bus'] },
    ],
    responses: [
      { id: 'R1', studentName: 'John Doe', studentEmail: 'john@example.com', courseId: 'CR-101', batchId: 'BAT-01', date: '2026-05-10T10:00:00Z', isAnonymous: false, answers: ['4', 'None', 'School Bus'] },
      { id: 'R2', studentName: 'Jane Smith', studentEmail: 'jane@example.com', courseId: 'CR-101', batchId: 'BAT-01', date: '2026-05-11T14:30:00Z', isAnonymous: true, answers: ['5', 'Loved the course!', 'Scooter'] },
      { id: 'R3', studentName: 'Amit Singh', studentEmail: 'amit@example.com', courseId: 'CR-101', batchId: 'BAT-01', date: '2026-05-11T16:00:00Z', isAnonymous: false, answers: ['3', '', 'School Bus'] },
      { id: 'R4', studentName: 'Priya L', studentEmail: 'priya@example.com', courseId: 'CR-101', batchId: 'BAT-01', date: '2026-05-12T09:00:00Z', isAnonymous: false, answers: ['5', 'Awesome', 'Car'] },
    ]
  },
  {
    id: 'SRV-102',
    title: 'Mid-term Review',
    targetAudience: 'All Enrolled',
    status: 'scheduled',
    timeWindow: 'Ends May 30 08:00 PM',
    acceptsAnonymous: false,
    questions: [],
    responses: []
  }
];

export default function SurveyDashboardPage() {
  const [toasts, setToasts] = useState([]);
  function showToast(type, title, message) {
    const id = Date.now() + Math.random();
    setToasts((cur) => [...cur, { id, type, title, message }]);
    setTimeout(() => setToasts((cur) => cur.filter((t) => t.id !== id)), 5000);
  }

  const [currentView, setCurrentView] = useState('list'); // 'list' | 'create' | 'responses'
  const [surveys, setSurveys] = useState(initialSurveys);
  const [activeSurvey, setActiveSurvey] = useState(null);
  const [surveyToView, setSurveyToView] = useState(null);

  // ─── Survey List Filters ────────────────────────────────────────────────────
  const [listStatusFilter, setListStatusFilter] = useState('all');
  const [listResponseFilter, setListResponseFilter] = useState('all');
  const [listAudienceFilter, setListAudienceFilter] = useState('');

  const filteredSurveys = useMemo(() => {
    let next = [...surveys];
    if (listStatusFilter !== 'all') {
      next = next.filter(s => s.status === listStatusFilter);
    }
    if (listResponseFilter !== 'all') {
      if (listResponseFilter === 'zero_responses') {
        next = next.filter(s => s.responses.length === 0);
      } else if (listResponseFilter === 'has_responses') {
        next = next.filter(s => s.responses.length > 0);
      }
    }
    if (listAudienceFilter) {
      next = next.filter(s => s.targetAudience === listAudienceFilter);
    }
    return next;
  }, [surveys, listStatusFilter, listResponseFilter, listAudienceFilter]);

  const hasActiveListFilters = listStatusFilter !== 'all' || listResponseFilter !== 'all' || listAudienceFilter !== '';

  // ─── Create Survey State ────────────────────────────────────────────────────
  const [csTitle, setCsTitle] = useState('');
  const [csAudience, setCsAudience] = useState('All Registered Students');
  const [csSelectedCourses, setCsSelectedCourses] = useState([]);
  const [csSelectedBatches, setCsSelectedBatches] = useState([]);
  const [csWindowType, setCsWindowType] = useState('open'); // 'open', 'strict'
  const [csDeadline, setCsDeadline] = useState('');
  const [csAnonymous, setCsAnonymous] = useState(false);
  const [csQuestions, setCsQuestions] = useState([{ text: '', type: 'Text Input', required: true, options: ['', ''] }]);

  // ─── Filter State for Responses View ───────────────────────────────────────
  const [rsSearch, setRsSearch] = useState('');
  const [rsCourse, setRsCourse] = useState('');
  const [rsBatches, setRsBatches] = useState([]);
  const [rsFrom, setRsFrom] = useState('');
  const [rsTo, setRsTo] = useState('');

  const filteredBatchesForCourse = useMemo(
    () => availableBatches.filter((b) => !rsCourse || b.courseId === rsCourse),
    [rsCourse]
  );

  const filteredResponses = useMemo(() => {
    if (!activeSurvey) return [];
    let next = [...(activeSurvey.responses || [])];
    
    if (rsSearch.trim()) {
      const q = rsSearch.toLowerCase();
      next = next.filter(r => (r.studentName || '').toLowerCase().includes(q) || (r.studentEmail || '').toLowerCase().includes(q));
    }
    if (rsCourse) {
      next = next.filter(r => r.courseId === rsCourse);
    }
    if (rsBatches.length) {
      next = next.filter(r => rsBatches.includes(r.batchId));
    }
    if (rsFrom) next = next.filter(r => new Date(r.date) >= new Date(rsFrom));
    if (rsTo) next = next.filter(r => new Date(r.date) <= new Date(rsTo));
    
    return next;
  }, [activeSurvey, rsSearch, rsCourse, rsBatches, rsFrom, rsTo]);

  const hasActiveRsFilters = rsSearch || rsCourse || rsBatches.length || rsFrom || rsTo;

  function handleDownloadCsv() {
    if (!activeSurvey || filteredResponses.length === 0) return showToast('error', 'Error', 'No responses to download.');

    const headers = ['Date', 'Student_Name', 'Student_Email', 'Course_ID', 'Batch_ID', 'Is_Anonymous'];
    activeSurvey.questions.forEach((q, i) => headers.push(`Q${i+1}: ${q.text.replace(/,/g, '')}`));

    const rows = filteredResponses.map(r => {
      const row = [
        r.date,
        r.isAnonymous ? 'Anonymous' : (r.studentName || ''),
        r.isAnonymous ? '' : (r.studentEmail || ''),
        r.courseId || '',
        r.batchId || '',
        r.isAnonymous ? 'Yes' : 'No'
      ];
      activeSurvey.questions.forEach((q, i) => {
        let ans = r.answers[i] || '';
        if (typeof ans === 'string') ans = ans.replace(/"/g, '""');
        row.push(`"${ans}"`);
      });
      return row.join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Survey_${activeSurvey.id}_Responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('success', 'Download Started', 'Your CSV file is downloading.');
  }

  function handleAction(survey, action) {
    if (action === 'end') {
      setSurveys(s => s.map(x => x.id === survey.id ? { ...x, status: 'completed' } : x));
      showToast('success', 'Survey Ended', 'The survey has been successfully marked as completed.');
    } else if (action === 'recall') {
      setSurveys(s => s.map(x => x.id === survey.id ? { ...x, status: 'draft' } : x));
      showToast('info', 'Survey Recalled', 'The survey has been moved back to drafts.');
    } else if (action === 'view_responses') {
      setActiveSurvey(survey);
      setCurrentView('responses');
      setRsSearch(''); setRsCourse(''); setRsBatches([]); setRsFrom(''); setRsTo('');
    } else if (action === 'view_survey') {
      setSurveyToView(survey);
    }
  }

  function handleCreateSurvey(e) {
    e.preventDefault();
    if (!csTitle.trim()) return showToast('error', 'Error', 'Please enter a title.');

    for (let i = 0; i < csQuestions.length; i++) {
       const q = csQuestions[i];
       if (q.type === 'Multi Select') {
          if (!q.options || q.options.length < 2) return showToast('error', 'Error', `Question ${i+1} needs at least 2 options defined.`);
          if (q.options.some(o => !o.trim())) return showToast('error', 'Error', `All options in Question ${i+1} must be filled.`);
       }
    }
    
    let audStr = csAudience;
    if (csAudience === 'Multi Selected Courses') {
      if (csSelectedCourses.length === 0) return showToast('error', 'Error', 'Please select at least one course.');
      audStr = `${csSelectedCourses.length} Courses`;
    } else if (csAudience === 'Multi Selected Batches') {
      if (csSelectedBatches.length === 0) return showToast('error', 'Error', 'Please select at least one batch.');
      audStr = `${csSelectedBatches.length} Batches`;
    }

    const newSurvey = {
      id: `SRV-${100 + surveys.length + 1}`,
      title: csTitle,
      targetAudience: audStr,
      status: csWindowType === 'open' ? 'published' : 'scheduled',
      timeWindow: csWindowType === 'open' ? 'Open ended' : `Ends ${new Date(csDeadline).toLocaleString()}`,
      acceptsAnonymous: csAnonymous,
      questions: csQuestions,
      responses: []
    };

    setSurveys([newSurvey, ...surveys]);
    showToast('success', 'Survey Created', 'Your survey has been published/scheduled.');
    setCurrentView('list');
    
    // Reset
    setCsTitle(''); setCsWindowType('open'); setCsDeadline(''); setCsAnonymous(false); setCsQuestions([{ text: '', type: 'Text Input', required: true, options: ['', ''] }]);
    setCsSelectedCourses([]); setCsSelectedBatches([]); setCsAudience('All Registered Students');
  }

  return (
    <div className="quiz-attempt-report-page" style={{ minHeight: '100vh', padding: '24px' }}>
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((cur) => cur.filter((t) => t.id !== id))} />

      {currentView === 'list' && (
        <section className="courses-list-page" style={{ padding: 0 }}>
          <div className="page-header-section" style={{ background: 'white', padding: '24px', borderRadius: '18px', border: '1px solid var(--line)', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="ti ti-bar-chart-alt" style={{ color: '#006073' }} /> Survey Dashboard
              </h2>
              <p style={{ margin: '6px 0 0', color: '#59757b' }}>Create, dispatch, and review custom surveys for students.</p>
            </div>
            <button type="button" className="create-course-button" onClick={() => setCurrentView('create')}>
              <i className="ti ti-plus" /> Create Survey
            </button>
          </div>

          <div className="qar-filter-card" style={{ marginBottom: '24px' }}>
            <div className="qar-filter-header">
              <h4><i className="ti ti-filter" /> Filter Surveys</h4>
              {hasActiveListFilters && (
                <button type="button" className="qar-clear-btn" onClick={() => {
                  setListStatusFilter('all'); setListResponseFilter('all'); setListAudienceFilter('');
                }}>
                  <i className="ti ti-reload" /> Clear Filters
                </button>
              )}
            </div>

            <div className="qar-filter-row1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <div className="qar-filter-field">
                <label className="qar-filter-label">Status</label>
                <select className="qar-select" value={listStatusFilter} onChange={(e) => setListStatusFilter(e.target.value)}>
                  <option value="all">All</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="qar-filter-field">
                <label className="qar-filter-label">Responses</label>
                <select className="qar-select" value={listResponseFilter} onChange={(e) => setListResponseFilter(e.target.value)}>
                  <option value="all">All</option>
                  <option value="has_responses">Has Responses (&gt; 0)</option>
                  <option value="zero_responses">No Responses (0)</option>
                </select>
              </div>
              <div className="qar-filter-field">
                <label className="qar-filter-label">Target Audience</label>
                <select className="qar-select" value={listAudienceFilter} onChange={(e) => setListAudienceFilter(e.target.value)}>
                  <option value="">All Audiences</option>
                  <option value="All Registered Students">All Registered Students</option>
                  <option value="All Enrolled Students">All Enrolled Students</option>
                  <option value="Batch A">Batch A</option>
                  <option value="Batch B">Batch B</option>
                </select>
              </div>
            </div>
          </div>

          <div className="students-table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Survey Details</th>
                  <th>Target Audience</th>
                  <th>Time Window</th>
                  <th>Anonymous</th>
                  <th>Status</th>
                  <th>Responses</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSurveys.length > 0 ? filteredSurveys.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div className="student-name-cell">
                        <div className="student-avatar-placeholder" style={{ background: '#006073', color: 'white' }}>
                          <i className="ti ti-bar-chart" />
                        </div>
                        <div>
                          <div className="student-name">{s.title}</div>
                          <div className="student-id">ID: {s.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <i className="ti ti-target" style={{ marginRight: '6px' }} />
                        {s.targetAudience}
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <i className="ti ti-calendar" style={{ marginRight: '6px' }} />
                        {s.timeWindow}
                      </div>
                    </td>
                    <td>{s.acceptsAnonymous ? <span style={{ color: '#006073', fontWeight: 'bold' }}>Yes</span> : <span style={{ color: '#dc2626', fontWeight: 'bold' }}>No</span>}</td>
                    <td>
                      <span className={`ear-status-badge ${s.status === 'published' ? 'ear-stat-teal' : s.status === 'completed' ? 'ear-stat-indigo' : 'ear-status-in-progress'}`} style={{ textTransform: 'uppercase' }}>
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <span className="courses-badge" style={{ fontWeight: 'bold', background: '#eef4f5', color: '#006073', padding: '4px 12px', borderRadius: '12px' }}>
                        {s.responses.length}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <KebabMenu survey={s} onAction={handleAction} />
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                      <div className="qar-empty-state" style={{ border: 'none', background: 'transparent' }}>
                        <i className="ti ti-search" />
                        <h4>No Surveys Found</h4>
                        <p>Adjust your filters or create a new survey.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {currentView === 'create' && (
        <div style={{ background: 'white', borderRadius: '18px', border: '1px solid var(--line)', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--line)', paddingBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--ink)' }}><i className="ti ti-pencil" /> Create a New Survey</h2>
            <button type="button" className="ghost-button" onClick={() => setCurrentView('list')}><i className="ti ti-arrow-left" /> Back</button>
          </div>

          <form onSubmit={handleCreateSurvey} style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 'bold' }}>Survey Title <span style={{ color: 'red' }}>*</span></label>
                <input type="text" className="ear-filter-input" value={csTitle} onChange={e => setCsTitle(e.target.value)} required />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 'bold' }}>Target Audience</label>
                <select className="ear-filter-input" value={csAudience} onChange={e => setCsAudience(e.target.value)}>
                  <option value="All Registered Students">All Registered Students</option>
                  <option value="All Enrolled Students">All Enrolled Students</option>
                  <option value="Multi Selected Courses">Multi Selected Courses</option>
                  <option value="Multi Selected Batches">Multi Selected Batches</option>
                </select>
              </div>
              {csAudience === 'Multi Selected Courses' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: 'bold' }}>Select Courses</label>
                  <CourseMultiSelect courses={availableCourses} selected={csSelectedCourses} onChange={setCsSelectedCourses} />
                </div>
              )}
              {csAudience === 'Multi Selected Batches' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: 'bold' }}>Select Batches</label>
                  <BatchMultiSelect batches={availableBatches} selected={csSelectedBatches} onChange={setCsSelectedBatches} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 'bold' }}>Time Window</label>
                <select className="ear-filter-input" value={csWindowType} onChange={e => setCsWindowType(e.target.value)}>
                  <option value="open">Open Ended</option>
                  <option value="strict">Strict Deadline</option>
                </select>
              </div>
              {csWindowType === 'strict' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: 'bold' }}>Deadline Date & Time</label>
                  <input type="datetime-local" className="ear-filter-input" value={csDeadline} onChange={e => setCsDeadline(e.target.value)} required />
                </div>
              )}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="checkbox" id="anonToggle" checked={csAnonymous} onChange={e => setCsAnonymous(e.target.checked)} style={{ width: '20px', height: '20px' }} />
                <label htmlFor="anonToggle" style={{ fontWeight: 'bold', cursor: 'pointer' }}>Accept Anonymous Responses</label>
              </div>
            </div>

            <div>
              <h3 style={{ margin: '0 0 16px', color: '#006073' }}>Questions Base</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {csQuestions.map((q, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#fff', border: '1px solid var(--line)', padding: '16px', borderRadius: '8px' }}>
                    
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#59757b' }}>Question {idx + 1}</label>
                        <input type="text" className="ear-filter-input" value={q.text} onChange={e => {
                          const n = [...csQuestions]; n[idx].text = e.target.value; setCsQuestions(n);
                        }} placeholder="What would you like to ask?" required />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#59757b' }}>Type</label>
                        <select className="ear-filter-input" value={q.type} onChange={e => {
                          const n = [...csQuestions]; n[idx].type = e.target.value; setCsQuestions(n);
                        }}>
                          <option>Text Input</option>
                          <option>Star Rating</option>
                          <option>Multi Select</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#59757b' }}>Required</label>
                        <input type="checkbox" checked={q.required} onChange={e => {
                          const n = [...csQuestions]; n[idx].required = e.target.checked; setCsQuestions(n);
                        }} />
                      </div>
                      {csQuestions.length > 1 && (
                        <button type="button" onClick={() => setCsQuestions(csQuestions.filter((_, i) => i !== idx))} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', padding: '8px', cursor: 'pointer', marginTop: '20px' }}>
                          <i className="ti ti-trash" />
                        </button>
                      )}
                    </div>

                    {q.type === 'Multi Select' && (
                      <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#59757b' }}>Define Options</label>
                        {(q.options || []).map((opt, oIdx) => (
                           <div key={oIdx} style={{ display: 'flex', gap: '8px' }}>
                             <input type="text" className="ear-filter-input" value={opt} onChange={e => {
                               const n = [...csQuestions]; n[idx].options[oIdx] = e.target.value; setCsQuestions(n);
                             }} placeholder={`Option ${oIdx + 1}`} style={{ flex: 1 }} />
                             {(q.options || []).length > 2 && (
                               <button type="button" onClick={() => {
                                 const n = [...csQuestions]; n[idx].options = n[idx].options.filter((_, i) => i !== oIdx); setCsQuestions(n);
                               }} style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '0 12px', borderRadius: '8px', cursor: 'pointer' }}>
                                 <i className="ti ti-trash" />
                               </button>
                             )}
                           </div>
                        ))}
                        <button type="button" onClick={() => {
                           const n = [...csQuestions]; 
                           if(!n[idx].options) n[idx].options = [];
                           n[idx].options.push(''); 
                           setCsQuestions(n);
                        }} style={{ alignSelf: 'flex-start', background: 'transparent', border: '1px dashed #006073', color: '#006073', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>
                          <i className="ti ti-plus" /> Add Option
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setCsQuestions([...csQuestions, { text: '', type: 'Text Input', required: true, options: ['', ''] }])} style={{ marginTop: '16px', background: '#eef4f5', color: '#006073', border: '1px dashed #006073', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                <i className="ti ti-plus" /> Add Next Question
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
              <button type="button" className="ear-btn-default" onClick={() => setCurrentView('list')}>Cancel</button>
              <button type="submit" style={{ background: '#006073', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                Create Survey
              </button>
            </div>
          </form>
        </div>
      )}

      {currentView === 'responses' && activeSurvey && (
        <>
          <div className="qar-header-card" style={{ marginBottom: '24px' }}>
            <div className="qar-header-top">
              <div className="qar-header-main">
                <h2><i className="ti ti-bar-chart-alt" /> {activeSurvey.title} - Responses</h2>
                <p className="qar-description">Detailed analytical view of all feedback received for this survey.</p>
              </div>
              <div className="qar-header-actions">
                <button type="button" className="qar-back-btn" onClick={() => setCurrentView('list')}>
                  <i className="ti ti-arrow-left" /> Back to Dashboard
                </button>
              </div>
            </div>
          </div>

          <div className="qar-filter-card">
            <div className="qar-filter-header">
              <h4><i className="ti ti-filter" /> Filters</h4>
              {hasActiveRsFilters && (
                <button type="button" className="qar-clear-btn" onClick={() => {
                  setRsSearch(''); setRsCourse(''); setRsBatches([]); setRsFrom(''); setRsTo('');
                }}>
                  <i className="ti ti-reload" /> Clear Filters
                </button>
              )}
            </div>

            <div className="qar-filter-row1">
              <div className="qar-filter-field qar-filter-field-wide">
                <label className="qar-filter-label">Search</label>
                <input type="text" className="qar-input" placeholder="Search by student name or email..." value={rsSearch} onChange={(e) => setRsSearch(e.target.value)} />
              </div>
              <div className="qar-filter-field">
                <label className="qar-filter-label"><i className="ti ti-calendar" /> From Date</label>
                <input type="datetime-local" className="qar-input" value={rsFrom} onChange={(e) => setRsFrom(e.target.value)} />
              </div>
              <div className="qar-filter-field">
                <label className="qar-filter-label"><i className="ti ti-calendar" /> To Date</label>
                <input type="datetime-local" className="qar-input" value={rsTo} onChange={(e) => setRsTo(e.target.value)} />
              </div>
            </div>

            <div className="qar-filter-row2">
              <div className="qar-filter-field">
                <label className="qar-filter-label"><i className="ti ti-book" /> Course</label>
                <select className="qar-select" value={rsCourse} onChange={(e) => { setRsCourse(e.target.value); setRsBatches([]); }}>
                  <option value="">All Courses</option>
                  {availableCourses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="qar-filter-field">
                <label className="qar-filter-label"><i className="ti ti-layout-grid2" /> Batch</label>
                <BatchMultiSelect batches={filteredBatchesForCourse} selected={rsBatches} onChange={(val) => setRsBatches(val)} disabled={!rsCourse} />
              </div>
            </div>
          </div>

          <div className="qar-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingBottom: '12px' }}>
            <div className="qar-record-count">
              <strong>{filteredResponses.length}</strong> record(s) found
            </div>
            <div className="qar-action-btns">
              <button
                type="button"
                className="ear-btn-export"
                disabled={filteredResponses.length === 0}
                onClick={handleDownloadCsv}
                style={{ background: '#006073', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: filteredResponses.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: filteredResponses.length === 0 ? 0.5 : 1 }}
              >
                <i className="ti ti-download" /> Export to CSV
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            {activeSurvey.questions.map((q, qIndex) => {
              if (q.type === 'Text Input') return null;

              if (q.type === 'Star Rating' || q.type === 'Rating') {
                let totalRating = 0;
                let count = 0;
                filteredResponses.forEach(r => {
                  const val = Number(r.answers[qIndex]);
                  if (!isNaN(val) && val > 0) {
                    totalRating += val;
                    count++;
                  }
                });
                if (count === 0) return null;
                const avg = (totalRating / count).toFixed(1);
                return (
                  <div key={qIndex} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ fontSize: '13px', color: '#59757b', marginBottom: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>Avg. Rating on QN #{qIndex + 1}</div>
                    <div style={{ fontWeight: 'bold', marginBottom: '16px', color: 'var(--ink)' }}>{q.text}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#006073', lineHeight: 1 }}>{avg}</span>
                      <div style={{ display: 'flex', color: '#fbbf24', fontSize: '20px', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <i key={star} className={`ti ${star <= Math.round(Number(avg)) ? 'ti-star' : 'ti-star'}`} style={{ fontWeight: star <= Math.round(Number(avg)) ? 'bold' : 'normal', opacity: star <= Math.round(Number(avg)) ? 1 : 0.3 }} />
                        ))}
                      </div>
                      <span style={{ fontSize: '12px', color: '#59757b', marginLeft: 'auto' }}>{count} responses</span>
                    </div>
                  </div>
                );
              }

              if (q.type === 'Multi Select' && q.options) {
                const counts = {};
                q.options.forEach(opt => counts[opt] = 0);
                let total = 0;
                filteredResponses.forEach(r => {
                  const ans = r.answers[qIndex] || '';
                  q.options.forEach(opt => {
                    if (ans.includes(opt)) {
                      counts[opt]++;
                      total++;
                    }
                  });
                });
                
                if (total === 0) return null;
                return (
                  <div key={qIndex} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ fontSize: '13px', color: '#59757b', marginBottom: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>Summary of QN #{qIndex + 1}</div>
                    <div style={{ fontWeight: 'bold', marginBottom: '16px', color: 'var(--ink)' }}>{q.text}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {q.options.map(opt => {
                        const c = counts[opt] || 0;
                        const pct = Math.round((c / total) * 100);
                        return (
                          <div key={opt} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                              <span style={{ fontWeight: '500' }}>{opt}</span>
                              <span style={{ color: '#59757b' }}><strong>{pct}%</strong> <span style={{ opacity: 0.7 }}>({c} responses)</span></span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: '#eef4f5', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: '#00a8cc', borderRadius: '4px' }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>

          <div className="students-table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  {activeSurvey.questions.map((q, i) => (
                    <th key={i} style={{ maxWidth: '200px' }}>Q{i + 1}: {q.text}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredResponses.length > 0 ? filteredResponses.map(r => (
                  <tr key={r.id}>
                    <td className="qar-datetime">{formatDateTime(r.date)}</td>
                    <td>
                      {r.isAnonymous ? (
                        <div className="student-name-cell">
                          <div className="student-avatar-placeholder" style={{ background: '#e9ecef', color: '#6c757d' }}><i className="ti ti-incognito" /></div>
                          <div>
                            <div className="student-name" style={{ fontStyle: 'italic', color: '#6c757d' }}>Anonymous</div>
                            <div className="student-id">Hidden Response</div>
                          </div>
                        </div>
                      ) : (
                        <div className="student-name-cell">
                          <div className="student-avatar-placeholder" style={{ background: '#006073', color: 'white' }}>{(r.studentName || 'Un').slice(0, 2).toUpperCase()}</div>
                          <div>
                            <div className="student-name">{r.studentName}</div>
                            <div className="student-id" style={{ color: '#59757b' }}><i className="ti ti-email" style={{ marginRight: '4px' }} />{r.studentEmail}</div>
                          </div>
                        </div>
                      )}
                    </td>
                    {activeSurvey.questions.map((q, i) => (
                      <td key={i}>{r.answers[i] || '-'}</td>
                    ))}
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={2 + activeSurvey.questions.length} style={{ textAlign: 'center', padding: '40px' }}>
                      <div className="qar-empty-state" style={{ border: 'none', background: 'transparent' }}>
                        <i className="ti ti-search" />
                        <h4>No Responses Found</h4>
                        <p>Adjust your filters or wait for students to submit.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── View Survey Preview Modal ── */}
      {surveyToView && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1050, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '600px', borderRadius: '18px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', background: '#006073', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}><i className="ti ti-desktop" /> Survey Preview: {surveyToView.title}</h3>
              <button type="button" onClick={() => setSurveyToView(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><i className="ti ti-close" /></button>
            </div>
            
            <div style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--line)', paddingBottom: '16px' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--ink)' }}>{surveyToView.title}</h4>
                  <div style={{ fontSize: '13px', color: '#59757b' }}>Audience: {surveyToView.targetAudience}</div>
                  <div style={{ fontSize: '13px', color: '#59757b' }}>Anonymous: {surveyToView.acceptsAnonymous ? 'Allowed' : 'Disabled'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`ear-status-badge ${surveyToView.status === 'published' ? 'ear-stat-teal' : surveyToView.status === 'completed' ? 'ear-stat-indigo' : 'ear-status-in-progress'}`} style={{ textTransform: 'uppercase' }}>
                    {surveyToView.status}
                  </span>
                </div>
              </div>

              <div>
                <h4 style={{ color: '#006073', marginBottom: '16px' }}>Configured Questions ({surveyToView.questions.length})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {surveyToView.questions.map((q, i) => (
                    <div key={i} style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '16px', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong style={{ color: 'var(--ink)', fontSize: '14px' }}>{i + 1}. {q.text}</strong>
                        {q.required && <span style={{ color: '#dc2626', fontSize: '12px', fontWeight: 'bold' }}>Required</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: '#59757b', marginBottom: '12px' }}><i className="ti ti-info-circle" /> Type: {q.type}</div>
                      
                      {q.type === 'Text Input' && (
                        <input type="text" disabled placeholder="Text response block..." style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--line)', borderRadius: '6px', background: '#eef4f5', color: '#a0aab2' }} />
                      )}
                      {(q.type === 'Star Rating' || q.type === 'Rating') && (
                        <div style={{ display: 'flex', color: '#fbbf24', fontSize: '24px', gap: '4px' }}>
                          {[1,2,3,4,5].map(s => <i key={s} className="ti ti-star" style={{ opacity: 0.4 }} /> )}
                        </div>
                      )}
                      {q.type === 'Multi Select' && q.options && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {q.options.map((opt, oItx) => (
                            <label key={oItx} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'not-allowed', opacity: 0.7 }}>
                              <input type="checkbox" disabled style={{ width: '16px', height: '16px' }} />
                              <span style={{ fontSize: '14px' }}>{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {surveyToView.questions.length === 0 && (
                    <div style={{ color: '#59757b', fontSize: '13px', fontStyle: 'italic' }}>No questions configured for this survey.</div>
                  )}
                </div>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--line)', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setSurveyToView(null)} style={{ border: 'none', background: '#006073', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Close Preview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
