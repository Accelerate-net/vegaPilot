import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ToastRegion from '../components/ToastRegion';

const studentPool = ['All Registered', 'Unrestricted', 'Batch A', 'Batch B', 'Course: IAT 2026', 'Course: NEET 2026'];
const hostPool = ['Rajesh Kumar', 'Priya Sharma', 'Vikram Singh', 'Anjali Gupta'];

const demoLiveClasses = [
  {
    id: 'LC-1001',
    title: 'Solving HCV Mechanics - Part 1',
    host: 'Vikram Singh',
    participants: 'Batch A',
    scheduledAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    isInstant: false,
    status: 'completed',
    duration: '1h 30m',
    mode: 'System',
    rating: 4.8,
  },
  {
    id: 'LC-1002',
    title: 'Organic Chemistry Revision',
    host: 'Priya Sharma',
    participants: 'Course: NEET 2026',
    scheduledAt: new Date(Date.now() + 3600000 * 24).toISOString(),
    isInstant: false,
    status: 'scheduled',
    duration: '2h',
    mode: 'YouTube',
    rating: null,
  },
  {
    id: 'LC-1003',
    title: 'Live Doubt Clearing',
    host: 'Rajesh Kumar',
    participants: 'All Registered',
    scheduledAt: new Date(Date.now() - 1800000).toISOString(),
    isInstant: true,
    status: 'live',
    duration: '30m (ongoing)',
    mode: 'System',
    rating: null,
  },
  {
    id: 'LC-1004',
    title: 'Biology Masterclass',
    host: 'Anjali Gupta',
    participants: 'Unrestricted',
    scheduledAt: new Date(Date.now() + 3600000 * 48).toISOString(),
    isInstant: false,
    status: 'scheduled',
    duration: '1h',
    mode: 'System',
    rating: null,
  },
  {
    id: 'LC-1005',
    title: 'Physics Mock Test Discussion',
    host: 'Vikram Singh',
    participants: 'Batch B',
    scheduledAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    isInstant: false,
    status: 'completed',
    duration: '2h 15m',
    mode: 'YouTube',
    rating: 4.5,
  }
];

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

function StarRating({ rating }) {
  if (!rating) return <span className="ear-td-muted">-</span>;
  return (
    <div style={{ display: 'flex', color: '#fbbf24', fontSize: '15px', gap: '2px', alignItems: 'center' }}>
      <strong>{rating}</strong>
      <i className="ti ti-star" style={{ fontWeight: 'bold' }} />
    </div>
  );
}

function KebabMenu({ cls, onAction }) {
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
            onClick={() => { setOpen(false); onAction(cls, 'attendance'); }}
          >
            <i className="ti ti-user" /> View Attendance Report
          </button>
          
          {cls.status !== 'completed' && (
            <button
              type="button"
              className="ear-kebab-item"
              onClick={() => { setOpen(false); onAction(cls, 'plan-activity'); }}
            >
              <i className="ti ti-layout-media-overlay" /> Plan Activity
            </button>
          )}

          {cls.status === 'completed' && (
            <button
              type="button"
              className="ear-kebab-item"
              onClick={() => { setOpen(false); onAction(cls, 'feedback'); }}
            >
              <i className="ti ti-comments" /> Feedback Summary
            </button>
          )}

          {cls.status === 'scheduled' && (
            <>
              <button
                type="button"
                className="ear-kebab-item"
                onClick={() => { setOpen(false); onAction(cls, 'reschedule'); }}
              >
                <i className="ti ti-calendar" /> Reschedule
              </button>
              <button
                type="button"
                className="ear-kebab-item ear-kebab-reset"
                onClick={() => { setOpen(false); onAction(cls, 'cancel'); }}
              >
                <i className="ti ti-close" /> Cancel Class
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function LiveClassSchedulerPage() {
  const navigate = useNavigate();
  const [classesList, setClassesList] = useState(demoLiveClasses);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  
  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formHost, setFormHost] = useState(hostPool[0]);
  const [formParticipants, setFormParticipants] = useState(studentPool[0]);
  const [formMode, setFormMode] = useState('System');
  const [formIsInstant, setFormIsInstant] = useState(false);
  const [formScheduledAt, setFormScheduledAt] = useState('');
  const [formDuration, setFormDuration] = useState('1h');
  
  // Toggles
  const [tglStrictModeration, setTglStrictModeration] = useState(false);
  const [tglAutoFeedback, setTglAutoFeedback] = useState(false);
  const [tglWebinarMode, setTglWebinarMode] = useState(false);
  const [tglAskToJoin, setTglAskToJoin] = useState(false);

  const [toasts, setToasts] = useState([]);

  function showToast(type, title, message) {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 5000);
  }

  const filteredClasses = useMemo(() => {
    let next = [...classesList];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      next = next.filter(c => c.title.toLowerCase().includes(q) || c.host.toLowerCase().includes(q));
    }
    if (statusFilter) {
      next = next.filter(c => c.status === statusFilter);
    }
    if (modeFilter) {
      next = next.filter(c => c.mode === modeFilter);
    }
    // Sort by scheduledAt descending by default
    next.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
    return next;
  }, [classesList, searchQuery, statusFilter, modeFilter]);

  function handleAction(cls, actionName) {
    if (actionName === 'cancel') {
      setClassesList(current => current.filter(c => c.id !== cls.id));
      showToast('success', 'Class Cancelled', `"${cls.title}" has been removed.`);
    } else if (actionName === 'feedback') {
      navigate('/feedback-summary');
    } else if (actionName === 'plan-activity') {
      navigate(`/live-class-activity-planner?classId=${cls.id}`);
    } else {
      showToast('info', 'Action Triggered', `Triggered ${actionName} for "${cls.title}".`);
    }
  }

  function handleCreateSubmit(e) {
    e.preventDefault();
    if (!formTitle) return showToast('error', 'Error', 'Please enter a title.');
    if (!formIsInstant && !formScheduledAt) return showToast('error', 'Error', 'Please provide a schedule time.');

    const newClass = {
      id: `LC-${1000 + classesList.length + 1}`,
      title: formTitle,
      host: formHost,
      participants: formParticipants,
      scheduledAt: formIsInstant ? new Date().toISOString() : new Date(formScheduledAt).toISOString(),
      isInstant: formIsInstant,
      status: formIsInstant ? 'live' : 'scheduled',
      duration: formDuration,
      mode: formMode,
      rating: null,
    };

    setClassesList(current => [newClass, ...current]);
    setShowCreateModal(false);
    showToast('success', 'Class Created', `"${formTitle}" is successfully added.`);
    
    // Reset form
    setFormTitle('');
    setFormIsInstant(false);
    setFormScheduledAt('');
  }

  const hasActiveFilters = searchQuery || statusFilter || modeFilter;

  function clearFilters() {
    setSearchQuery('');
    setStatusFilter('');
    setModeFilter('');
  }

  return (
    <section className="courses-list-page exam-attempt-report-page" style={{ position: 'relative', minHeight: '100vh', paddingBottom: '40px' }}>
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />

      {/* ── Page Header (Courses-list style) ── */}
      <div className="page-header-section" style={{ background: 'white', padding: '24px', borderRadius: '18px', border: '1px solid var(--line)', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="ti ti-video-camera" style={{ color: '#006073' }} /> Live Class Scheduler
          </h2>
          <p style={{ margin: '6px 0 0', color: '#59757b' }}>Schedule, manage, and monitor live streaming classes and interactive webinars.</p>
        </div>
        <button type="button" className="create-course-button" style={{ background: '#006073', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }} onClick={() => setShowCreateModal(true)}>
          <i className="ti ti-video-clapper" /> Schedule Live
        </button>
      </div>

      {/* ── Filters (Exam-attempt-report style) ── */}
      <div className="ear-filter-section" style={{ background: 'white', border: '1px solid var(--line)' }}>
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
              placeholder="Search by title or host..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="ear-filter-group">
            <label className="ear-filter-label">Status</label>
            <select
              className="ear-filter-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="scheduled">Scheduled</option>
              <option value="live">Live Now</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="ear-filter-group">
            <label className="ear-filter-label">Mode</label>
            <select
              className="ear-filter-input"
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="System">System</option>
              <option value="YouTube">YouTube</option>
            </select>
          </div>
        </div>
      </div>

      <div className="ear-action-row" style={{ marginTop: '24px' }}>
        <div className="ear-record-count">
          <strong>{filteredClasses.length}</strong> record(s) found
        </div>
      </div>

      {/* ── Table (Exam-attempt-report style) ── */}
      {filteredClasses.length > 0 ? (
        <div className="ear-table-container" style={{ background: 'white', border: '1px solid var(--line)' }}>
          <table className="ear-rank-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Host</th>
                <th>Participants</th>
                <th>Status</th>
                <th>Scheduled Time / Live</th>
                <th>Duration</th>
                <th>Mode</th>
                <th>Rating</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredClasses.map((cls) => (
                <tr key={cls.id}>
                  <td>
                    <strong>{cls.title}</strong>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#006073', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                        {cls.host.slice(0, 2).toUpperCase()}
                      </div>
                      {cls.host}
                    </div>
                  </td>
                  <td className="ear-td-muted">
                    <span style={{ display: 'inline-block', background: '#f4f7f8', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                      {cls.participants}
                    </span>
                  </td>
                  <td>
                    {cls.status === 'live' && <span className="ear-status-badge" style={{ background: '#fca5a5', color: '#991b1b' }}><span className="pulsing-dot" style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#dc2626', marginRight: '4px', animation: 'blink 1.5s infinite' }}></span>Live Now</span>}
                    {cls.status === 'scheduled' && <span className="ear-status-badge ear-status-in-progress">Scheduled</span>}
                    {cls.status === 'completed' && <span className="ear-status-badge ear-status-completed">Completed</span>}
                  </td>
                  <td className="ear-td-datetime">{formatDateTime(cls.scheduledAt)}</td>
                  <td>{cls.duration}</td>
                  <td>{cls.mode}</td>
                  <td><StarRating rating={cls.rating} /></td>
                  <td>
                    <KebabMenu cls={cls} onAction={handleAction} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="ear-empty-state" style={{ background: 'white', border: '1px solid var(--line)', marginTop: '24px' }}>
          <i className="ti ti-search" />
          <h4>No Live Classes Found</h4>
          <p>No classes match your current filters. Schedule one to get started!</p>
        </div>
      )}

      {/* ── Create Modal ── */}
      {showCreateModal && (
        <div className="ear-modal-scrim" style={{ zIndex: 9999, background: 'rgba(0,0,0,0.6)' }} role="presentation" onClick={() => setShowCreateModal(false)}>
          <div className="ear-modal" style={{ maxWidth: '560px' }} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="ear-modal-header" style={{ background: '#006073', color: 'white' }}>
              <h3><i className="ti ti-video-clapper" /> Schedule Live Class</h3>
              <button type="button" className="ear-modal-close" style={{ color: 'white' }} onClick={() => setShowCreateModal(false)}>
                <i className="ti ti-close" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="ear-modal-body" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '13px' }}>Class Title <span style={{ color: '#dc2626' }}>*</span></label>
                    <input 
                      type="text" 
                      className="ear-filter-input" 
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Physics Revision Class" 
                      autoFocus
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                      <label style={{ fontWeight: 'bold', fontSize: '13px' }}>Host / Instructor</label>
                      <select className="ear-filter-input" value={formHost} onChange={(e) => setFormHost(e.target.value)}>
                        {hostPool.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                      <label style={{ fontWeight: 'bold', fontSize: '13px' }}>Participants</label>
                      <select className="ear-filter-input" value={formParticipants} onChange={(e) => setFormParticipants(e.target.value)}>
                        {studentPool.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                      <label style={{ fontWeight: 'bold', fontSize: '13px' }}>Streaming Mode</label>
                      <select className="ear-filter-input" value={formMode} onChange={(e) => setFormMode(e.target.value)}>
                        <option value="System">System Integrated</option>
                        <option value="YouTube">YouTube Live</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                      <label style={{ fontWeight: 'bold', fontSize: '13px' }}>Duration</label>
                      <input type="text" className="ear-filter-input" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} placeholder="e.g. 1h 30m" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                      Schedule Time 
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'normal', cursor: 'pointer' }}>
                        <input type="checkbox" checked={formIsInstant} onChange={(e) => setFormIsInstant(e.target.checked)} /> Go Live Instantly
                      </label>
                    </label>
                    <input 
                      type="datetime-local" 
                      className="ear-filter-input" 
                      value={formScheduledAt}
                      onChange={(e) => setFormScheduledAt(e.target.value)}
                      disabled={formIsInstant}
                      style={{ opacity: formIsInstant ? 0.5 : 1 }}
                    />
                  </div>

                  <hr style={{ borderTop: '1px solid var(--line)', borderBottom: 'none', margin: '8px 0' }} />
                  
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Advanced Settings</div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={tglStrictModeration} onChange={(e) => setTglStrictModeration(e.target.checked)} style={{ marginTop: '4px' }} />
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '13px' }}>Strict Moderation</div>
                        <div style={{ fontSize: '11px', color: '#59757b' }}>Chat is limited and actively moderated.</div>
                      </div>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={tglAutoFeedback} onChange={(e) => setTglAutoFeedback(e.target.checked)} style={{ marginTop: '4px' }} />
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '13px' }}>Auto Send Feedback</div>
                        <div style={{ fontSize: '11px', color: '#59757b' }}>Trigger survey at session end.</div>
                      </div>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={tglWebinarMode} onChange={(e) => setTglWebinarMode(e.target.checked)} style={{ marginTop: '4px' }} />
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '13px' }}>Webinar Mode</div>
                        <div style={{ fontSize: '11px', color: '#59757b' }}>One-way video streaming.</div>
                      </div>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={tglAskToJoin} onChange={(e) => setTglAskToJoin(e.target.checked)} style={{ marginTop: '4px' }} />
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '13px' }}>Ask To Join</div>
                        <div style={{ fontSize: '11px', color: '#59757b' }}>Host manual admission.</div>
                      </div>
                    </label>
                  </div>

                </div>
              </div>
              <div className="ear-modal-footer">
                <button type="button" className="ear-btn-default" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" style={{ background: '#006073', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {formIsInstant ? 'Launch Live Now' : 'Schedule Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
      `}} />
    </section>
  );
}
