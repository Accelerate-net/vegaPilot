import React, { useEffect, useMemo, useRef, useState } from 'react';
import ToastRegion from '../components/ToastRegion';
import {
  CONTENT_TYPES, CONTENT_TYPE_MAP, ORIENTATIONS, RESOLUTIONS, TIMEZONES,
  TRANSITIONS, SEVERITIES, WEEKDAYS, SCOPE_STYLES,
  useAlerts, useBranches, useMedia, useSchedules, useScreens, useTimelines,
  createAlert, createBranch, createMedia, createSchedule, createScreen, createTimeline,
  updateAlert, updateBranch, updateScreen, updateTimeline, updateSchedule,
  deleteAlert, deleteBranch, deleteMedia, deleteSchedule, deleteScreen, deleteTimeline,
  duplicateTimeline, broadcastAlert, dismissAlert, assignTimelineToScreens,
  addTimelineItem, updateTimelineItem, deleteTimelineItem, duplicateTimelineItem,
  reorderTimelineItem, bulkUpdateItemDurations, ensureLoopDetail,
  fmtBytes, fmtRelTime, fmtDuration,
} from '../lib/digitalSignageStore';

// ─── Tabs ─────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',  label: 'Overview',  icon: 'ti-layout-grid2' },
  { id: 'schedules', label: 'Schedules', icon: 'ti-calendar' },
  { id: 'timelines', label: 'Loops',     icon: 'ti-layers' },
  { id: 'screens',   label: 'Screens',   icon: 'ti-device-desktop' },
  { id: 'alerts',    label: 'Emergency', icon: 'ti-alert' },
  { id: 'branches',  label: 'Branches',  icon: 'ti-building' },
  { id: 'media',     label: 'Media',     icon: 'ti-photo' },
];

export default function DigitalSignagePage() {
  const [tab, setTab] = useState('overview');
  const [branchFilter, setBranchFilter] = useState('');
  const [editingTimelineId, setEditingTimelineId] = useState(null);
  const [toasts, setToasts] = useState([]);

  function showToast(type, title, message = '') {
    const id = Date.now() + Math.random();
    setToasts((cur) => [...cur, { id, type, title, message }]);
    setTimeout(() => setToasts((cur) => cur.filter((t) => t.id !== id)), 3500);
  }
  function removeToast(id) { setToasts((cur) => cur.filter((t) => t.id !== id)); }

  function openTimelineEditor(id) {
    setEditingTimelineId(id);
    setTab('timelines');
  }

  return (
    <section style={{ position: 'relative', minHeight: '100vh', paddingBottom: 40 }}>
      <ToastRegion toasts={toasts} onDismiss={removeToast} />
      <PageHeader branchFilter={branchFilter} setBranchFilter={setBranchFilter} />
      <TabBar tab={tab} setTab={(t) => { setTab(t); if (t !== 'timelines') setEditingTimelineId(null); }} />

      <div style={{ marginTop: 16 }}>
        {tab === 'overview'  && <OverviewTab branchFilter={branchFilter} onJump={setTab} />}
        {tab === 'screens'   && <ScreensTab branchFilter={branchFilter} showToast={showToast} />}
        {tab === 'timelines' && <TimelinesTab branchFilter={branchFilter} editingId={editingTimelineId} setEditingId={setEditingTimelineId} showToast={showToast} />}
        {tab === 'media'     && <MediaTab branchFilter={branchFilter} showToast={showToast} />}
        {tab === 'schedules' && <SchedulesTab branchFilter={branchFilter} showToast={showToast} />}
        {tab === 'alerts'    && <AlertsTab branchFilter={branchFilter} showToast={showToast} />}
        {tab === 'branches'  && <BranchesTab showToast={showToast} />}
      </div>
    </section>
  );
}

// ───────────────────────── Header + Tabs ──────────────────────────────
function PageHeader({ branchFilter, setBranchFilter }) {
  const branches = useBranches();
  return (
    <div style={{ background: '#fff', padding: 24, borderRadius: 18, border: '1px solid var(--line)', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="ti ti-device-desktop" style={{ color: 'var(--brand)' }} /> Digital Signage
        </h2>
        <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>
          Manage TV kiosks, build loops, broadcast emergency alerts across all branches.
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Branch</span>
        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} style={{ ...selStyle, minWidth: 180 }}>
          <option value="">All branches</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
    </div>
  );
}

function TabBar({ tab, setTab }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: 6, display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
      {TABS.map((t) => {
        const sel = t.id === tab;
        return (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            style={{
              border: 'none', background: sel ? 'var(--brand)' : 'transparent', color: sel ? '#fff' : 'var(--ink)',
              padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13,
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
            <i className={`ti ${t.icon}`} /> {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ───────────────────────── Overview ───────────────────────────────────
function OverviewTab({ branchFilter, onJump }) {
  const screens   = useScreens();
  const timelines = useTimelines();
  const alerts    = useAlerts();
  const branches  = useBranches();

  const filteredScreens = useMemo(
    () => branchFilter ? screens.filter((s) => s.branch_id === branchFilter) : screens,
    [screens, branchFilter]
  );

  const activeAlerts = alerts.filter((a) => a.is_active);

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {/* Active emergency banner */}
      {activeAlerts.length > 0 && (
        <div style={{ background: 'linear-gradient(90deg,#fee2e2,#fecaca)', border: '1px solid #fca5a5', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 8, background: '#dc2626', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            <i className="ti ti-alert" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#7f1d1d', fontSize: 14 }}>{activeAlerts.length} active emergency broadcast{activeAlerts.length === 1 ? '' : 's'}</div>
            <div style={{ fontSize: 12, color: '#991b1b', marginTop: 2 }}>{activeAlerts.map((a) => a.title).join(' · ')}</div>
          </div>
          <button type="button" style={btnGhost} onClick={() => onJump('alerts')}>
            <i className="ti ti-arrow-right" /> Manage
          </button>
        </div>
      )}

      {/* Now playing */}
      <Card title="Now playing" icon="ti-player-play">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
          {filteredScreens.filter((s) => s.playback_status === 'playing').slice(0, 9).map((s) => {
            const tl = timelines.find((t) => t.id === s.assigned_timeline_id);
            return (
              <div key={s.id} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 12, background: '#fbfcfd' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: '#10b981', animation: 'pulse 1.5s infinite' }} />
                  <strong style={{ fontSize: 13 }}>{s.name}</strong>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--muted)' }}>{s.screen_code}</span>
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--ink)' }}>
                  <i className="ti ti-layers" style={{ color: 'var(--brand)', marginRight: 4 }} />
                  {tl ? tl.name : <em style={{ color: 'var(--muted)' }}>No loop</em>}
                </div>
              </div>
            );
          })}
          {filteredScreens.filter((s) => s.playback_status === 'playing').length === 0 && (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>No screens currently playing.</div>
          )}
        </div>
      </Card>

      {/* Branch-wise screen counts */}
      <Card title="Branch overview" icon="ti-building">
        <table style={tableStyle}>
          <thead>
            <tr><th style={thStyle}>Branch</th><th style={thStyle}>Screens</th><th style={thStyle}>Online</th><th style={thStyle}>Offline</th><th style={thStyle}>Timezone</th><th style={{ ...thStyle, textAlign: 'right' }}>Status</th></tr>
          </thead>
          <tbody>
            {branches.map((b) => {
              const ss = screens.filter((s) => s.branch_id === b.id);
              const on = ss.filter((s) => s.device_status === 'online').length;
              const off = ss.filter((s) => s.device_status === 'offline').length;
              return (
                <tr key={b.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={tdStyle}><strong>{b.name}</strong> <span style={{ color: 'var(--muted)', marginLeft: 6, fontSize: 11 }}>{b.code}</span></td>
                  <td style={tdStyle}>{ss.length}</td>
                  <td style={tdStyle}><span style={{ color: '#059669', fontWeight: 700 }}>{on}</span></td>
                  <td style={tdStyle}><span style={{ color: '#dc2626', fontWeight: 700 }}>{off}</span></td>
                  <td style={tdStyle}>{b.timezone}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    {b.active ? <Pill color="#059669" bg="#d1fae5">Active</Pill> : <Pill color="#475569" bg="#e2e8f0">Dormant</Pill>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ───────────────────────── Screens ────────────────────────────────────
function ScreensTab({ branchFilter, showToast }) {
  const screens   = useScreens();
  const branches  = useBranches();
  const timelines = useTimelines();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [bulkAssign, setBulkAssign] = useState(false);
  const [selected, setSelected] = useState(new Set());

  const filtered = useMemo(() => {
    return screens
      .filter((s) => !branchFilter || s.branch_id === branchFilter)
      .filter((s) => !statusFilter || s.device_status === statusFilter)
      .filter((s) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.screen_code.toLowerCase().includes(q);
      });
  }, [screens, branchFilter, statusFilter, search]);

  function toggleSel(id) { setSelected((cur) => { const n = new Set(cur); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  function toggleAll() { setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((s) => s.id))); }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Toolbar>
        <SearchBox value={search} onChange={setSearch} placeholder="Search by name or code…" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selStyle}>
          <option value="">All statuses</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="warning">Warning</option>
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {selected.size > 0 && (
            <button type="button" style={btnGhost} onClick={() => setBulkAssign(true)}>
              <i className="ti ti-layers" /> Assign loop ({selected.size})
            </button>
          )}
          <button type="button" style={btnPrimary} onClick={() => setCreating(true)}>
            <i className="ti ti-plus" /> Register screen
          </button>
        </div>
      </Toolbar>

      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 36 }}>
                <input type="checkbox" checked={selected.size > 0 && selected.size === filtered.length} onChange={toggleAll} />
              </th>
              <th style={thStyle}>Screen</th>
              <th style={thStyle}>Branch</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Now playing</th>
              <th style={thStyle}>Last seen</th>
              <th style={thStyle}>Resolution</th>
              <th style={{ ...thStyle, textAlign: 'right', width: 200 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const branch = branches.find((b) => b.id === s.branch_id);
              const tl = timelines.find((t) => t.id === s.assigned_timeline_id);
              return (
                <tr key={s.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={tdStyle}>
                    <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSel(s.id)} />
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 700 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{s.screen_code}</span>
                      <span style={{ marginLeft: 8 }}>{s.orientation}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>{branch?.name || <em style={{ color: 'var(--muted)' }}>Unassigned</em>}</td>
                  <td style={tdStyle}><StatusBadge status={s.device_status} /></td>
                  <td style={tdStyle}>
                    {tl ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {s.playback_status === 'playing' && <span style={{ width: 8, height: 8, borderRadius: 999, background: '#10b981' }} />}
                        <span style={{ fontSize: 13 }}>{tl.name}</span>
                      </div>
                    ) : <em style={{ color: 'var(--muted)' }}>No loop</em>}
                  </td>
                  <td style={tdStyle}><span style={{ color: 'var(--muted)', fontSize: 12 }}>{fmtRelTime(s.last_seen_at)}</span></td>
                  <td style={tdStyle}><span style={{ fontSize: 12, color: 'var(--muted)' }}>{s.resolution}</span></td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <a href={`/player/${s.screen_code}`} target="_blank" rel="noreferrer" style={btnGhost} title="Open player URL">
                        <i className="ti ti-external-link" /> Player
                      </a>
                      <button type="button" style={btnGhost} onClick={() => setEditing(s)}><i className="ti ti-pencil" /> Edit</button>
                      <button type="button" style={btnDanger} onClick={() => setConfirmDelete(s)}><i className="ti ti-trash" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No screens match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {(creating || editing) && (
        <ScreenModal
          screen={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={async (payload) => {
            try {
              if (editing) {
                await updateScreen(editing.id, payload);
                showToast('success', 'Screen updated', payload.name);
              } else {
                const sc = await createScreen(payload);
                const pairing = sc.pairing_code ? ` · pairing code ${sc.pairing_code}` : '';
                showToast('success', 'Screen registered', `${sc.name} · ${sc.screen_code}${pairing}`);
              }
              setCreating(false); setEditing(null);
            } catch (e) {
              showToast('error', e.code || 'Save failed', e.message);
            }
          }}
        />
      )}
      {confirmDelete && (
        <ConfirmModal title="Remove this screen?" message={<>The kiosk <strong>{confirmDelete.name}</strong> will stop receiving content. Re-registering uses the same screen code.</>}
          confirmLabel="Remove" confirmStyle={btnDanger}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={async () => {
            try { await deleteScreen(confirmDelete.id); showToast('success', 'Screen removed', confirmDelete.name); }
            catch (e) { showToast('error', e.code || 'Delete failed', e.message); }
            setConfirmDelete(null);
          }} />
      )}
      {bulkAssign && (
        <BulkAssignModal
          timelines={timelines}
          onClose={() => setBulkAssign(false)}
          onAssign={async (tlId) => {
            try {
              await assignTimelineToScreens(tlId, Array.from(selected));
              const tl = timelines.find((t) => t.id === tlId);
              showToast('success', 'Loop assigned', `${tl?.name || ''} → ${selected.size} screen(s)`);
              setBulkAssign(false); setSelected(new Set());
            } catch (e) { showToast('error', e.code || 'Assign failed', e.message); }
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    online:  { bg: '#d1fae5', color: '#065f46', dot: '#10b981', label: 'Online' },
    offline: { bg: '#fee2e2', color: '#7f1d1d', dot: '#dc2626', label: 'Offline' },
    warning: { bg: '#fef3c7', color: '#78350f', dot: '#f59e0b', label: 'Warning' },
  }[status] || { bg: '#e2e8f0', color: '#334155', dot: '#64748b', label: status };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: map.bg, color: map.color, padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: map.dot }} />
      {map.label}
    </span>
  );
}

function ScreenModal({ screen, onClose, onSave }) {
  const branches  = useBranches();
  const timelines = useTimelines();
  const [name, setName] = useState(screen?.name || '');
  const [branchId, setBranchId] = useState(screen?.branch_id || '');
  const [code, setCode] = useState(screen?.screen_code || '');
  const [resolution, setResolution] = useState(screen?.resolution || '1920x1080');
  const [orientation, setOrientation] = useState(screen?.orientation || 'landscape');
  const [timezone, setTimezone] = useState(screen?.timezone || 'Asia/Kolkata');
  const [assigned, setAssigned] = useState(screen?.assigned_timeline_id || '');

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name, branch_id: branchId || null, screen_code: code, resolution, orientation, timezone,
      assigned_timeline_id: assigned || null,
    });
  }

  return (
    <Modal title={screen ? 'Edit screen' : 'Register screen'} onClose={onClose} maxWidth={560}>
      <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        <Field label="Display name"><input autoFocus value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="e.g. Reception TV" /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Branch">
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} style={selStyle}>
              <option value="">— Unassigned —</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Screen code" hint="Used for /player/{code}">
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder="auto" />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Field label="Resolution">
            <select value={resolution} onChange={(e) => setResolution(e.target.value)} style={selStyle}>
              {RESOLUTIONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Orientation">
            <select value={orientation} onChange={(e) => setOrientation(e.target.value)} style={selStyle}>
              {ORIENTATIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Timezone">
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} style={selStyle}>
              {TIMEZONES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Assigned loop">
          <select value={assigned} onChange={(e) => setAssigned(e.target.value)} style={selStyle}>
            <option value="">— None —</option>
            {timelines.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
        <FormActions onCancel={onClose} submitLabel={screen ? 'Save' : 'Register'} />
      </form>
    </Modal>
  );
}

function BulkAssignModal({ timelines, onClose, onAssign }) {
  const [id, setId] = useState('');
  return (
    <Modal title="Assign loop" onClose={onClose} maxWidth={460}>
      <Field label="Pick a loop">
        <select value={id} onChange={(e) => setId(e.target.value)} style={selStyle}>
          <option value="">— Select —</option>
          {timelines.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button type="button" onClick={onClose} style={btnGhost}>Cancel</button>
        <button type="button" onClick={() => id && onAssign(id)} disabled={!id} style={{ ...btnPrimary, opacity: id ? 1 : 0.5 }}>Assign</button>
      </div>
    </Modal>
  );
}

// ───────────────────────── Timelines ──────────────────────────────────
function TimelinesTab({ branchFilter, editingId, setEditingId, showToast }) {
  const timelines = useTimelines();
  const branches  = useBranches();
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => branchFilter ? timelines.filter((t) => !t.branch_id || t.branch_id === branchFilter) : timelines, [timelines, branchFilter]);
  const editing = editingId ? timelines.find((t) => t.id === editingId) : null;

  if (editing) {
    return <TimelineEditor timeline={editing} onBack={() => setEditingId(null)} showToast={showToast} />;
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Toolbar>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>{filtered.length} loop{filtered.length === 1 ? '' : 's'}</div>
        <button type="button" style={{ ...btnPrimary, marginLeft: 'auto' }} onClick={() => setCreating(true)}>
          <i className="ti ti-plus" /> New loop
        </button>
      </Toolbar>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12 }}>
        {filtered.map((t) => {
          const branch = branches.find((b) => b.id === t.branch_id);
          const totalSecs = t.items.reduce((a, it) => a + it.duration_seconds, 0);
          return (
            <div key={t.id} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--brand)15', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-layers" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <strong style={{ fontSize: 15, color: 'var(--ink)' }}>{t.name}</strong>
                    {t.is_active ? <Pill color="#059669" bg="#d1fae5">Active</Pill> : <Pill color="#475569" bg="#e2e8f0">Draft</Pill>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    {branch?.name || 'All branches'} · {t.items.length} item{t.items.length === 1 ? '' : 's'} · {fmtDuration(totalSecs)}
                  </div>
                </div>
              </div>
              {t.description && <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{t.description}</p>}

              {/* mini visual */}
              <div style={{ display: 'flex', gap: 2, height: 6, borderRadius: 999, overflow: 'hidden', background: '#f1f5f9' }}>
                {t.items.map((it) => {
                  const ct = CONTENT_TYPE_MAP[it.content_type];
                  const pct = totalSecs ? (it.duration_seconds / totalSecs) * 100 : 0;
                  return <div key={it.id} style={{ width: `${pct}%`, background: ct?.color || '#cbd5e1' }} title={`${ct?.label}: ${it.duration_seconds}s`} />;
                })}
              </div>

              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button type="button" style={btnPrimary} onClick={() => setEditingId(t.id)}>
                  <i className="ti ti-pencil" /> Open editor
                </button>
                <button type="button" style={btnGhost} onClick={async () => {
                  try { const c = await duplicateTimeline(t.id); showToast('success', 'Loop duplicated', c?.name); }
                  catch (e) { showToast('error', e.code || 'Duplicate failed', e.message); }
                }}>
                  <i className="ti ti-copy" /> Duplicate
                </button>
                <button type="button" style={btnGhost} onClick={() => updateTimeline(t.id, { is_active: !t.is_active })}>
                  <i className={`ti ${t.is_active ? 'ti-pause' : 'ti-player-play'}`} /> {t.is_active ? 'Pause' : 'Activate'}
                </button>
                <button type="button" style={{ ...btnDanger, marginLeft: 'auto' }} onClick={() => setConfirmDelete(t)}><i className="ti ti-trash" /></button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ background: '#fff', border: '1px dashed var(--line)', borderRadius: 14, padding: 40, textAlign: 'center', color: 'var(--muted)', gridColumn: '1 / -1' }}>
            <i className="ti ti-layers" style={{ fontSize: 24, display: 'block', marginBottom: 8 }} />
            <div style={{ fontWeight: 600, color: 'var(--ink)' }}>No loops yet</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Build your first loop of branding, attendance, and toppers.</div>
            <div style={{ marginTop: 14 }}>
              <button type="button" style={btnPrimary} onClick={() => setCreating(true)}><i className="ti ti-plus" /> New loop</button>
            </div>
          </div>
        )}
      </div>

      {creating && (
        <TimelineModal
          onClose={() => setCreating(false)}
          onSave={async (payload) => {
            try {
              const tl = await createTimeline(payload);
              showToast('success', 'Loop created', tl.name);
              setCreating(false);
              setEditingId(tl.id);
            } catch (e) { showToast('error', e.code || 'Create failed', e.message); }
          }}
        />
      )}
      {confirmDelete && (
        <ConfirmModal title="Delete this loop?" message={<>"<strong>{confirmDelete.name}</strong>" and all its items will be removed. Screens using it become unassigned.</>}
          confirmLabel="Delete" confirmStyle={btnDanger}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={async () => {
            try { await deleteTimeline(confirmDelete.id); showToast('success', 'Loop deleted', confirmDelete.name); }
            catch (e) { showToast('error', e.code || 'Delete failed', e.message); }
            setConfirmDelete(null);
          }} />
      )}
    </div>
  );
}

function TimelineModal({ timeline, onClose, onSave }) {
  const branches = useBranches();
  const [name, setName] = useState(timeline?.name || '');
  const [description, setDescription] = useState(timeline?.description || '');
  const [branchId, setBranchId] = useState(timeline?.branch_id || '');
  const [active, setActive] = useState(timeline?.is_active ?? false);
  const [loop, setLoop] = useState(timeline?.loop_enabled ?? true);
  const [emergency, setEmergency] = useState(timeline?.emergency_override_enabled ?? true);

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name, description, branch_id: branchId || null, is_active: active, loop_enabled: loop, emergency_override_enabled: emergency });
  }
  return (
    <Modal title={timeline ? 'Edit loop' : 'New loop'} onClose={onClose} maxWidth={520}>
      <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        <Field label="Name"><input autoFocus value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="e.g. Morning Branding Loop" /></Field>
        <Field label="Description (optional)"><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} /></Field>
        <Field label="Branch (optional)">
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} style={selStyle}>
            <option value="">All branches</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </Field>
        <div style={{ display: 'grid', gap: 8 }}>
          <Toggle label="Active" hint="Eligible to play on assigned screens" checked={active} onChange={setActive} />
          <Toggle label="Auto-replay" hint="Restart from item 1 when reaching end" checked={loop} onChange={setLoop} />
          <Toggle label="Allow emergency override" hint="Pause this loop when an emergency broadcast fires" checked={emergency} onChange={setEmergency} />
        </div>
        <FormActions onCancel={onClose} submitLabel={timeline ? 'Save' : 'Create loop'} />
      </form>
    </Modal>
  );
}

// ───────────────────────── Timeline Editor (visual) ─────────────────
function TimelineEditor({ timeline, onBack, showToast }) {
  const media = useMedia();
  const [addOpen, setAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [preview, setPreview] = useState({ playing: false, idx: 0, elapsed: 0 });
  const [bulkOpen, setBulkOpen] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [dropIdx, setDropIdx] = useState(null);

  // List endpoint omits items[]; pull the full loop on entry so the editor
  // has something to render. ensureLoopDetail is idempotent.
  useEffect(() => { ensureLoopDetail(timeline.id); }, [timeline.id]);

  const items = Array.isArray(timeline.items) ? timeline.items : [];
  const totalSecs = items.reduce((a, it) => a + it.duration_seconds, 0);

  // Preview ticker
  useEffect(() => {
    if (!preview.playing || items.length === 0) return;
    const interval = setInterval(() => {
      setPreview((p) => {
        const cur = items[p.idx];
        if (!cur) return { ...p, playing: false };
        if (p.elapsed + 1 >= cur.duration_seconds) {
          const next = p.idx + 1;
          if (next >= items.length) {
            return timeline.loop_enabled ? { ...p, idx: 0, elapsed: 0 } : { ...p, playing: false, elapsed: cur.duration_seconds };
          }
          return { ...p, idx: next, elapsed: 0 };
        }
        return { ...p, elapsed: p.elapsed + 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [preview.playing, items, timeline.loop_enabled]);

  function onDragStart(idx) { setDragIdx(idx); }
  function onDragOver(e, idx) { e.preventDefault(); setDropIdx(idx); }
  function onDrop() {
    if (dragIdx != null && dropIdx != null && dragIdx !== dropIdx) {
      reorderTimelineItem(timeline.id, dragIdx, dropIdx);
    }
    setDragIdx(null); setDropIdx(null);
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {/* Header */}
      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button type="button" style={btnGhost} onClick={onBack}><i className="ti ti-arrow-left" /> Back</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ti ti-layers" style={{ color: 'var(--brand)', fontSize: 18 }} />
          <strong style={{ fontSize: 16 }}>{timeline.name}</strong>
          {timeline.is_active ? <Pill color="#059669" bg="#d1fae5">Active</Pill> : <Pill color="#475569" bg="#e2e8f0">Draft</Pill>}
          {timeline.loop_enabled && <Pill color="#1d4ed8" bg="#dbeafe">Auto-replay</Pill>}
        </div>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>{items.length} items · {fmtDuration(totalSecs)}</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button type="button" style={btnGhost} onClick={() => setBulkOpen(true)}><i className="ti ti-clock" /> Bulk durations</button>
          <button type="button" style={btnGhost} onClick={() => setPreview((p) => ({ ...p, playing: !p.playing }))}>
            <i className={`ti ${preview.playing ? 'ti-pause' : 'ti-player-play'}`} /> {preview.playing ? 'Pause preview' : 'Preview'}
          </button>
          <button type="button" style={btnPrimary} onClick={() => setAddOpen(true)}><i className="ti ti-plus" /> Add item</button>
        </div>
      </div>

      {/* Preview pane */}
      <div style={{ background: '#0f172a', borderRadius: 14, overflow: 'hidden', position: 'relative', aspectRatio: '16 / 6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PreviewSurface items={items} preview={preview} />
      </div>

      {/* Loop strip */}
      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Loop strip</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'stretch', overflowX: 'auto', paddingBottom: 6 }} onDrop={onDrop}>
          {items.map((it, idx) => {
            const ct = CONTENT_TYPE_MAP[it.content_type];
            const pct = totalSecs ? (it.duration_seconds / totalSecs) * 100 : 100 / items.length;
            const minW = Math.max(120, pct * 8);
            const isCur = preview.playing && preview.idx === idx;
            const progress = isCur ? (preview.elapsed / it.duration_seconds) * 100 : 0;
            return (
              <div key={it.id}
                draggable onDragStart={() => onDragStart(idx)} onDragOver={(e) => onDragOver(e, idx)}
                style={{
                  flex: `0 0 ${minW}px`, minWidth: minW,
                  border: `2px solid ${dropIdx === idx && dragIdx !== idx ? 'var(--brand)' : (isCur ? ct?.color : 'var(--line)')}`,
                  borderRadius: 10, background: isCur ? `${ct?.color}10` : '#fff',
                  cursor: 'grab', position: 'relative', overflow: 'hidden',
                }}>
                <div style={{ height: 4, background: ct?.color || '#cbd5e1' }} />
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className={`ti ${ct?.icon}`} style={{ color: ct?.color }} />
                    <strong style={{ fontSize: 12, color: 'var(--ink)' }}>{ct?.label}</strong>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 11, color: 'var(--muted)' }}>
                    <i className="ti ti-clock" /> {fmtDuration(it.duration_seconds)}
                    <span>·</span>
                    <i className="ti ti-arrows-shrink-1" /> {it.transition_type}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                    <button type="button" style={miniBtn} onClick={() => setEditingItem(it)}><i className="ti ti-pencil" /></button>
                    <button type="button" style={miniBtn} onClick={() => duplicateTimelineItem(timeline.id, it.id)}><i className="ti ti-copy" /></button>
                    <button type="button" style={{ ...miniBtn, color: '#dc2626' }} onClick={() => deleteTimelineItem(timeline.id, it.id)}><i className="ti ti-trash" /></button>
                  </div>
                </div>
                {isCur && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: '#e2e8f0' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: ct?.color, transition: 'width 1s linear' }} />
                  </div>
                )}
              </div>
            );
          })}
          {items.length === 0 && (
            <div style={{ flex: 1, padding: 40, textAlign: 'center', color: 'var(--muted)', border: '1px dashed var(--line)', borderRadius: 10 }}>
              No items yet. Click <strong>Add item</strong> to start.
            </div>
          )}
        </div>
      </div>

      {/* Content types catalog */}
      <Card title="Available content types" icon="ti-sparkles">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {CONTENT_TYPES.map((ct) => {
            const sc = SCOPE_STYLES[ct.scope];
            return (
              <button key={ct.id} type="button" onClick={() => { addTimelineItem(timeline.id, { content_type: ct.id }); showToast('success', `${ct.label} added`); }}
                style={{ textAlign: 'left', background: '#fff', border: '1px solid var(--line)', borderRadius: 10, padding: 12, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${ct.color}15`, color: ct.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`ti ${ct.icon}`} />
                  </div>
                  <strong style={{ fontSize: 13, color: 'var(--ink)' }}>{ct.label}</strong>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {ct.scope === 'CENTER' && (
                      <i className="ti ti-bolt" title="Realtime data pull" style={{ color: '#b45309', fontSize: 12 }} />
                    )}
                    <span title={sc.hint} style={{ background: sc.bg, color: sc.color, fontSize: 9, fontWeight: 800, letterSpacing: '.06em', padding: '2px 6px', borderRadius: 4 }}>{sc.label}</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, lineHeight: 1.45 }}>{ct.desc}</div>
              </button>
            );
          })}
        </div>
      </Card>

      {addOpen && (
        <ItemModal media={media} onClose={() => setAddOpen(false)} onSave={(payload) => {
          addTimelineItem(timeline.id, payload);
          showToast('success', 'Item added', payload.title);
          setAddOpen(false);
        }} />
      )}
      {editingItem && (
        <ItemModal item={editingItem} media={media} onClose={() => setEditingItem(null)} onSave={(payload) => {
          updateTimelineItem(timeline.id, editingItem.id, payload);
          showToast('success', 'Item updated', payload.title);
          setEditingItem(null);
        }} />
      )}
      {bulkOpen && (
        <BulkDurationsModal onClose={() => setBulkOpen(false)} onApply={(secs) => {
          bulkUpdateItemDurations(timeline.id, secs);
          showToast('success', `All items set to ${secs}s`);
          setBulkOpen(false);
        }} />
      )}
    </div>
  );
}

function PreviewSurface({ items, preview }) {
  const cur = items[preview.idx];
  if (!cur) {
    return <div style={{ color: '#94a3b8', fontSize: 14 }}>No content to preview.</div>;
  }
  const ct = CONTENT_TYPE_MAP[cur.content_type];
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', textAlign: 'center', padding: 20, background: `radial-gradient(circle at 30% 30%, ${ct.color}40, transparent 60%), radial-gradient(circle at 70% 80%, ${ct.color}30, transparent 60%)` }}>
      <i className={`ti ${ct.icon}`} style={{ fontSize: 48, color: ct.color, marginBottom: 14, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,.5))' }} />
      <div style={{ fontSize: 11, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 6 }}>{ct.label}</div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{cur.title}</div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>Item {preview.idx + 1} of {items.length} · {cur.transition_type} · {fmtDuration(cur.duration_seconds)}</div>
    </div>
  );
}

function ItemModal({ item, media, onClose, onSave }) {
  const [contentType, setContentType] = useState(item?.content_type || 'BRANDING');
  const [title, setTitle] = useState(item?.title || CONTENT_TYPE_MAP[contentType]?.label || '');
  const [duration, setDuration] = useState(item?.duration_seconds ?? 15);
  const [transition, setTransition] = useState(item?.transition_type || 'fade');
  const [mediaId, setMediaId] = useState(item?.content_reference_id || '');
  const [overlay, setOverlay] = useState(item?.overlay_enabled !== false);
  const [audio, setAudio] = useState(!!item?.background_audio_enabled);

  useEffect(() => { if (!item) setTitle(CONTENT_TYPE_MAP[contentType]?.label || ''); }, [contentType, item]);

  const mediaPickable = ['VIDEO','POSTER','BRANDING','TESTIMONIALS','TOPPERS'].includes(contentType);

  function submit(e) {
    e.preventDefault();
    onSave({
      content_type: contentType, title: title.trim() || CONTENT_TYPE_MAP[contentType]?.label,
      duration_seconds: Math.max(1, Number(duration) || 15), transition_type: transition,
      content_reference_id: mediaId || null, overlay_enabled: overlay, background_audio_enabled: audio,
    });
  }

  return (
    <Modal title={item ? 'Edit loop item' : 'Add loop item'} onClose={onClose} maxWidth={600}>
      <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        <Field label="Content type">
          <select value={contentType} onChange={(e) => setContentType(e.target.value)} style={selStyle}>
            {CONTENT_TYPES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} /></Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Duration (sec)"><input type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} style={inputStyle} /></Field>
          <Field label="Transition">
            <select value={transition} onChange={(e) => setTransition(e.target.value)} style={selStyle}>
              {TRANSITIONS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </Field>
        </div>

        {mediaPickable && (
          <Field label="Linked media (optional)">
            <select value={mediaId} onChange={(e) => setMediaId(e.target.value)} style={selStyle}>
              <option value="">— None —</option>
              {media.map((m) => <option key={m.id} value={m.id}>{m.thumb} {m.name}</option>)}
            </select>
          </Field>
        )}

        <div style={{ display: 'grid', gap: 8 }}>
          <Toggle label="Show overlay (attendance check-ins, etc.)" checked={overlay} onChange={setOverlay} />
          <Toggle label="Enable background audio" checked={audio} onChange={setAudio} />
        </div>

        <FormActions onCancel={onClose} submitLabel={item ? 'Save' : 'Add item'} />
      </form>
    </Modal>
  );
}

function BulkDurationsModal({ onClose, onApply }) {
  const [secs, setSecs] = useState(15);
  return (
    <Modal title="Bulk set durations" onClose={onClose} maxWidth={400}>
      <p style={{ margin: '0 0 14px', color: 'var(--muted)', fontSize: 13 }}>Apply the same duration to every item in this loop.</p>
      <Field label="Duration (sec)"><input type="number" min={1} value={secs} onChange={(e) => setSecs(Number(e.target.value))} style={inputStyle} /></Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button type="button" onClick={onClose} style={btnGhost}>Cancel</button>
        <button type="button" onClick={() => onApply(Math.max(1, secs))} style={btnPrimary}>Apply</button>
      </div>
    </Modal>
  );
}

// ───────────────────────── Media library ──────────────────────────────
function MediaTab({ branchFilter, showToast }) {
  const media    = useMedia();
  const branches = useBranches();
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => media
    .filter((m) => !branchFilter || m.branch_id === branchFilter || m.branch_id === null)
    .filter((m) => !typeFilter || m.type === typeFilter)
    .filter((m) => !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.tags.join(',').toLowerCase().includes(search.toLowerCase())),
  [media, branchFilter, typeFilter, search]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Toolbar>
        <SearchBox value={search} onChange={setSearch} placeholder="Search by name or tag…" />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={selStyle}>
          <option value="">All types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="lottie">Lottie</option>
        </select>
        <button type="button" style={{ ...btnPrimary, marginLeft: 'auto' }} onClick={() => setUploadOpen(true)}><i className="ti ti-upload" /> Upload</button>
      </Toolbar>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {filtered.map((m) => {
          const branch = branches.find((b) => b.id === m.branch_id);
          return (
            <div key={m.id} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ aspectRatio: '4 / 3', background: 'linear-gradient(135deg,#f1f5f9,#e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 54 }}>
                {m.thumb}
              </div>
              <div style={{ padding: 12, display: 'grid', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <strong style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</strong>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  <span style={{ textTransform: 'uppercase', fontWeight: 700 }}>{m.type}</span> · {fmtBytes(m.size)} · used {m.uses}×
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{branch?.name || 'All branches'}</div>
                {m.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {m.tags.map((t) => <span key={t} style={{ fontSize: 10, padding: '2px 6px', background: '#eaf3f5', color: 'var(--brand)', borderRadius: 999 }}>{t}</span>)}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                  <button type="button" style={miniBtn} onClick={() => setConfirmDelete(m)}><i className="ti ti-trash" style={{ color: '#dc2626' }} /></button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No media matches your filters.</div>
        )}
      </div>

      {uploadOpen && (
        <UploadMediaModal branches={branches} onClose={() => setUploadOpen(false)} onSave={async (payload) => {
          try { const m = await createMedia(payload); showToast('success', 'Media uploaded', m.name); setUploadOpen(false); }
          catch (e) { showToast('error', e.code || 'Upload failed', e.message); }
        }} />
      )}
      {confirmDelete && (
        <ConfirmModal title="Delete this asset?" message={<><strong>{confirmDelete.name}</strong> will be removed. Loops referencing it will show a missing placeholder.</>}
          confirmLabel="Delete" confirmStyle={btnDanger}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={async () => {
            try { await deleteMedia(confirmDelete.id); showToast('success', 'Media deleted'); }
            catch (e) {
              if (e.code === 'MEDIA_IN_USE') {
                if (window.confirm('This asset is in use by loop items. Force delete and unlink them?')) {
                  try { await deleteMedia(confirmDelete.id, { force: true }); showToast('success', 'Media deleted (force)'); }
                  catch (e2) { showToast('error', e2.code || 'Delete failed', e2.message); }
                }
              } else { showToast('error', e.code || 'Delete failed', e.message); }
            }
            setConfirmDelete(null);
          }} />
      )}
    </div>
  );
}

function UploadMediaModal({ branches, onClose, onSave }) {
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [branchId, setBranchId] = useState('');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function pickFile(f) {
    if (!f) return;
    setFile(f);
    if (!name) setName(f.name);
  }
  async function submit(e) {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);
    try {
      await onSave({
        file,
        name: (name || file.name).trim(),
        branch_id: branchId || null,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
    } finally { setSubmitting(false); }
  }
  return (
    <Modal title="Upload media" onClose={onClose} maxWidth={480}>
      <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        <label style={{ border: '2px dashed var(--line)', borderRadius: 10, padding: 24, textAlign: 'center', background: '#fbfcfd', cursor: 'pointer', display: 'block' }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0]); }}>
          <input type="file" hidden onChange={(e) => pickFile(e.target.files?.[0])}
            accept="image/*,video/*,audio/*,application/json,application/lottie+json" />
          <i className="ti ti-cloud-upload" style={{ fontSize: 32, color: 'var(--muted)' }} />
          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8 }}>{file ? file.name : 'Drop a file here or click to browse'}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
            {file ? fmtBytes(file.size) : 'Images, videos (mp4/webm), audio, Lottie JSON · max 200 MB'}
          </div>
        </label>
        <Field label="Display name"><input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="optional — defaults to filename" /></Field>
        <Field label="Branch (optional)">
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} style={selStyle}>
            <option value="">All branches</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </Field>
        <Field label="Tags (comma separated)"><input value={tags} onChange={(e) => setTags(e.target.value)} style={inputStyle} placeholder="hero, branding" /></Field>
        <FormActions onCancel={onClose} submitLabel={submitting ? 'Uploading…' : 'Upload'} disabled={!file || submitting} />
      </form>
    </Modal>
  );
}

// ───────────────────────── Schedules ──────────────────────────────────
function SchedulesTab({ branchFilter, showToast }) {
  const schedules = useSchedules();
  const timelines = useTimelines();
  const screens   = useScreens();
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => {
    if (!branchFilter) return schedules;
    return schedules.filter((s) => s.screen_ids.some((id) => {
      const sc = screens.find((x) => x.id === id);
      return sc && sc.branch_id === branchFilter;
    }));
  }, [schedules, branchFilter, screens]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Toolbar>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>{filtered.length} schedule{filtered.length === 1 ? '' : 's'}</div>
        <button type="button" style={{ ...btnPrimary, marginLeft: 'auto' }} onClick={() => setCreating(true)}><i className="ti ti-plus" /> New schedule</button>
      </Toolbar>

      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Schedule</th>
              <th style={thStyle}>Loop</th>
              <th style={thStyle}>Screens</th>
              <th style={thStyle}>When</th>
              <th style={thStyle}>Active period</th>
              <th style={thStyle}>Priority</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const tl = timelines.find((t) => t.id === s.timeline_id);
              return (
                <tr key={s.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {s.is_active ? <Pill color="#059669" bg="#d1fae5">On</Pill> : <Pill color="#475569" bg="#e2e8f0">Off</Pill>}
                      <strong>{s.name}</strong>
                    </div>
                  </td>
                  <td style={tdStyle}>{tl?.name || <em style={{ color: 'var(--muted)' }}>Missing</em>}</td>
                  <td style={tdStyle}><span style={{ fontWeight: 700 }}>{s.screen_ids.length}</span></td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      {WEEKDAYS.map((d) => (
                        <span key={d.id} style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: s.days.includes(d.id) ? 'var(--brand)' : '#f1f5f9', color: s.days.includes(d.id) ? '#fff' : 'var(--muted)' }}>{d.label}</span>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{s.start_time} – {s.end_time}</div>
                  </td>
                  <td style={tdStyle}><span style={{ fontSize: 12 }}>{s.start_date} {s.end_date && `→ ${s.end_date}`}</span></td>
                  <td style={tdStyle}>{s.priority}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button type="button" style={btnGhost} onClick={() => updateSchedule(s.id, { is_active: !s.is_active }).catch((e) => showToast('error', e.code || 'Update failed', e.message))}>
                        <i className={`ti ${s.is_active ? 'ti-pause' : 'ti-player-play'}`} />
                      </button>
                      <button type="button" style={btnGhost} onClick={() => setEditing(s)}><i className="ti ti-pencil" /></button>
                      <button type="button" style={btnDanger} onClick={() => setConfirmDelete(s)}><i className="ti ti-trash" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No schedules yet. Create one to time-bound your loops.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {(creating || editing) && (
        <ScheduleModal schedule={editing} timelines={timelines} screens={screens}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={async (payload) => {
            try {
              if (editing) { await updateSchedule(editing.id, payload); showToast('success', 'Schedule updated', payload.name); }
              else         { const sch = await createSchedule(payload); showToast('success', 'Schedule created', sch.name); }
            } catch (e) { showToast('error', e.code || 'Save failed', e.message); return; }
            setCreating(false); setEditing(null);
          }} />
      )}
      {confirmDelete && (
        <ConfirmModal title="Delete this schedule?" message={<><strong>{confirmDelete.name}</strong> will be removed. Screens revert to their assigned default loop.</>}
          confirmLabel="Delete" confirmStyle={btnDanger}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={async () => {
            try { await deleteSchedule(confirmDelete.id); showToast('success', 'Schedule deleted'); }
            catch (e) { showToast('error', e.code || 'Delete failed', e.message); }
            setConfirmDelete(null);
          }} />
      )}
    </div>
  );
}

function ScheduleModal({ schedule, timelines, screens, onClose, onSave }) {
  const [name, setName] = useState(schedule?.name || '');
  const [timelineId, setTimelineId] = useState(schedule?.timeline_id || timelines[0]?.id || '');
  const [screenIds, setScreenIds] = useState(new Set(schedule?.screen_ids || []));
  const [days, setDays] = useState(new Set(schedule?.days || ['mon','tue','wed','thu','fri']));
  const [startTime, setStartTime] = useState(schedule?.start_time || '09:00');
  const [endTime, setEndTime] = useState(schedule?.end_time || '18:00');
  const [startDate, setStartDate] = useState(schedule?.start_date || new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(schedule?.end_date || '');
  const [priority, setPriority] = useState(schedule?.priority ?? 5);
  const [active, setActive] = useState(schedule?.is_active ?? true);

  function toggleDay(d) { setDays((cur) => { const n = new Set(cur); n.has(d) ? n.delete(d) : n.add(d); return n; }); }
  function toggleScreen(id) { setScreenIds((cur) => { const n = new Set(cur); n.has(id) ? n.delete(id) : n.add(id); return n; }); }

  function submit(e) {
    e.preventDefault();
    if (!name.trim() || !timelineId) return;
    onSave({
      name: name.trim(), timeline_id: timelineId, screen_ids: Array.from(screenIds),
      days: Array.from(days), start_time: startTime, end_time: endTime,
      start_date: startDate, end_date: endDate, priority: Number(priority) || 0, is_active: active,
    });
  }
  return (
    <Modal title={schedule ? 'Edit schedule' : 'New schedule'} onClose={onClose} maxWidth={620}>
      <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        <Field label="Name"><input autoFocus value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="e.g. Morning Branding" /></Field>
        <Field label="Loop">
          <select value={timelineId} onChange={(e) => setTimelineId(e.target.value)} style={selStyle}>
            {timelines.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
        <div>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Days</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {WEEKDAYS.map((d) => {
              const sel = days.has(d.id);
              return (
                <button key={d.id} type="button" onClick={() => toggleDay(d.id)}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `1px solid ${sel ? 'var(--brand)' : 'var(--line)'}`, background: sel ? 'var(--brand)' : '#fff', color: sel ? '#fff' : 'var(--ink)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Start time"><input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={inputStyle} /></Field>
          <Field label="End time"><input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={inputStyle} /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Field label="Start date"><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} /></Field>
          <Field label="End date (optional)"><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} /></Field>
          <Field label="Priority (1-10)"><input type="number" min={1} max={10} value={priority} onChange={(e) => setPriority(e.target.value)} style={inputStyle} /></Field>
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Screens ({screenIds.size})</div>
          <div style={{ maxHeight: 200, overflow: 'auto', border: '1px solid var(--line)', borderRadius: 8, padding: 8, display: 'grid', gap: 4 }}>
            {screens.map((s) => {
              const sel = screenIds.has(s.id);
              return (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, background: sel ? '#eaf3f5' : 'transparent', cursor: 'pointer' }}>
                  <input type="checkbox" checked={sel} onChange={() => toggleScreen(s.id)} />
                  <span style={{ flex: 1, fontSize: 13 }}>{s.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>{s.screen_code}</span>
                </label>
              );
            })}
          </div>
        </div>
        <Toggle label="Activate immediately" checked={active} onChange={setActive} />
        <FormActions onCancel={onClose} submitLabel={schedule ? 'Save' : 'Create'} />
      </form>
    </Modal>
  );
}

// ───────────────────────── Emergency Alerts ───────────────────────────
function AlertsTab({ branchFilter, showToast }) {
  const alerts   = useAlerts();
  const branches = useBranches();
  const screens  = useScreens();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => branchFilter ? alerts.filter((a) => a.branch_ids.length === 0 || a.branch_ids.includes(branchFilter)) : alerts, [alerts, branchFilter]);
  const active = filtered.filter((a) => a.is_active);

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <i className="ti ti-alert" style={{ color: '#c2410c', fontSize: 22 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: '#7c2d12', fontSize: 14 }}>Emergency broadcasts override all content</div>
          <div style={{ fontSize: 12, color: '#9a3412', marginTop: 4 }}>Active alerts replace whatever is playing on the targeted screens — across branches if no branch is selected.</div>
        </div>
        <button type="button" style={{ ...btnDanger, background: '#dc2626', color: '#fff', borderColor: '#dc2626' }} onClick={() => setCreating(true)}>
          <i className="ti ti-alert" /> New emergency
        </button>
      </div>

      {active.length > 0 && (
        <Card title={`Active broadcasts (${active.length})`} icon="ti-radio">
          <div style={{ display: 'grid', gap: 10 }}>
            {active.map((a) => <AlertCard key={a.id} alert={a} branches={branches} screens={screens}
              onDismiss={() => { dismissAlert(a.id); showToast('success', 'Broadcast stopped'); }}
              onEdit={() => setEditing(a)} onDelete={() => setConfirmDelete(a)} />)}
          </div>
        </Card>
      )}

      <Card title="All broadcasts" icon="ti-list">
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.map((a) => <AlertCard key={a.id} alert={a} branches={branches} screens={screens}
            onBroadcast={() => { broadcastAlert(a.id); showToast('success', 'Broadcasting now', a.title); }}
            onDismiss={() => { dismissAlert(a.id); showToast('success', 'Broadcast stopped'); }}
            onEdit={() => setEditing(a)} onDelete={() => setConfirmDelete(a)} />)}
          {filtered.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: 'var(--muted)' }}>No emergency alerts yet.</div>}
        </div>
      </Card>

      {(creating || editing) && (
        <AlertModal alert={editing} branches={branches} screens={screens}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={async (payload) => {
            try {
              if (editing) { await updateAlert(editing.id, payload); showToast('success', 'Alert updated', payload.title); }
              else         { const al = await createAlert(payload); showToast(al.is_active ? 'error' : 'success', al.is_active ? 'Broadcasting' : 'Alert saved', al.title); }
            } catch (e) { showToast('error', e.code || 'Save failed', e.message); return; }
            setCreating(false); setEditing(null);
          }} />
      )}
      {confirmDelete && (
        <ConfirmModal title="Delete this alert?" message={<><strong>{confirmDelete.title}</strong> will be removed permanently.</>}
          confirmLabel="Delete" confirmStyle={btnDanger}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={async () => {
            try { await deleteAlert(confirmDelete.id); showToast('success', 'Alert deleted'); }
            catch (e) { showToast('error', e.code || 'Delete failed', e.message); }
            setConfirmDelete(null);
          }} />
      )}
    </div>
  );
}

function AlertCard({ alert: a, branches, screens, onBroadcast, onDismiss, onEdit, onDelete }) {
  const sev = SEVERITIES.find((s) => s.id === a.severity) || SEVERITIES[1];
  const branchNames = a.branch_ids.length === 0 ? 'All branches' : a.branch_ids.map((id) => branches.find((b) => b.id === id)?.name).filter(Boolean).join(', ');
  return (
    <div style={{ border: `1px solid ${a.is_active ? '#fca5a5' : 'var(--line)'}`, borderRadius: 10, padding: 14, display: 'flex', alignItems: 'flex-start', gap: 12, background: a.is_active ? '#fef2f2' : '#fff' }}>
      <div style={{ width: 38, height: 38, borderRadius: 8, background: sev.bg, color: sev.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
        <i className="ti ti-alert" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <strong style={{ fontSize: 14, color: 'var(--ink)' }}>{a.title}</strong>
          <Pill color={sev.color} bg={sev.bg}>{sev.label}</Pill>
          {a.is_active && <Pill color="#fff" bg="#dc2626">● LIVE</Pill>}
          {a.audio_enabled && <Pill color="#7c2d12" bg="#fef3c7"><i className="ti ti-volume" /> Audio</Pill>}
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>{a.message}</p>
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--muted)' }}>
          {branchNames} · {a.start_time} → {a.end_time}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {a.is_active
          ? <button type="button" style={btnGhost} onClick={onDismiss}><i className="ti ti-player-stop" /> Stop</button>
          : (onBroadcast && <button type="button" style={{ ...btnPrimary, background: '#dc2626' }} onClick={onBroadcast}><i className="ti ti-radio" /> Broadcast</button>)
        }
        <button type="button" style={btnGhost} onClick={onEdit}><i className="ti ti-pencil" /></button>
        <button type="button" style={btnDanger} onClick={onDelete}><i className="ti ti-trash" /></button>
      </div>
    </div>
  );
}

function AlertModal({ alert, branches, screens, onClose, onSave }) {
  const [title, setTitle] = useState(alert?.title || '');
  const [message, setMessage] = useState(alert?.message || '');
  const [severity, setSeverity] = useState(alert?.severity || 'warning');
  const [branchIds, setBranchIds] = useState(new Set(alert?.branch_ids || []));
  const [audio, setAudio] = useState(!!alert?.audio_enabled);
  const [startTime, setStartTime] = useState(alert?.start_time || new Date().toISOString().slice(0, 16).replace('T', ' '));
  const [endTime, setEndTime] = useState(alert?.end_time || '');
  const [active, setActive] = useState(alert?.is_active ?? true);

  function toggleBranch(id) { setBranchIds((cur) => { const n = new Set(cur); n.has(id) ? n.delete(id) : n.add(id); return n; }); }

  function submit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title, message, severity, audio_enabled: audio,
      branch_ids: Array.from(branchIds), screen_ids: [],
      start_time: startTime, end_time: endTime, is_active: active,
    });
  }
  return (
    <Modal title={alert ? 'Edit alert' : 'New emergency broadcast'} onClose={onClose} maxWidth={580}>
      <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        <Field label="Title"><input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} placeholder="e.g. Branch Closed Today" /></Field>
        <Field label="Message"><textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} placeholder="Short message to display on every screen…" /></Field>
        <Field label="Severity">
          <div style={{ display: 'flex', gap: 6 }}>
            {SEVERITIES.map((s) => {
              const sel = severity === s.id;
              return (
                <button key={s.id} type="button" onClick={() => setSeverity(s.id)}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: `1px solid ${sel ? s.color : 'var(--line)'}`, background: sel ? s.bg : '#fff', color: sel ? s.color : 'var(--ink)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  {s.label}
                </button>
              );
            })}
          </div>
        </Field>
        <div>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Target branches</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>Leave empty to broadcast to all branches.</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {branches.map((b) => {
              const sel = branchIds.has(b.id);
              return (
                <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: `1px solid ${sel ? 'var(--brand)' : 'var(--line)'}`, background: sel ? '#eaf3f5' : '#fff', cursor: 'pointer' }}>
                  <input type="checkbox" checked={sel} onChange={() => toggleBranch(b.id)} />
                  <span style={{ fontSize: 13 }}>{b.name}</span>
                </label>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Start"><input value={startTime} onChange={(e) => setStartTime(e.target.value)} style={inputStyle} placeholder="2026-05-25 09:00" /></Field>
          <Field label="End"><input value={endTime} onChange={(e) => setEndTime(e.target.value)} style={inputStyle} placeholder="2026-05-25 18:00" /></Field>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          <Toggle label="Play siren audio" hint="Loud audio cue accompanies the visual" checked={audio} onChange={setAudio} />
          <Toggle label="Broadcast immediately" hint="Overrides all assigned loops right now" checked={active} onChange={setActive} />
        </div>
        <FormActions onCancel={onClose} submitLabel={active ? 'Broadcast' : 'Save'} primaryStyle={active ? { ...btnPrimary, background: '#dc2626' } : btnPrimary} />
      </form>
    </Modal>
  );
}

// ───────────────────────── Branches ───────────────────────────────────
function BranchesTab({ showToast }) {
  const branches = useBranches();
  const screens  = useScreens();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Toolbar>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>{branches.length} branch{branches.length === 1 ? '' : 'es'}</div>
        <button type="button" style={{ ...btnPrimary, marginLeft: 'auto' }} onClick={() => setCreating(true)}><i className="ti ti-plus" /> New branch</button>
      </Toolbar>
      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={tableStyle}>
          <thead>
            <tr><th style={thStyle}>Branch</th><th style={thStyle}>Code</th><th style={thStyle}>City</th><th style={thStyle}>Timezone</th><th style={thStyle}>Screens</th><th style={thStyle}>Status</th><th style={{ ...thStyle, textAlign: 'right' }}>Actions</th></tr>
          </thead>
          <tbody>
            {branches.map((b) => {
              const cnt = screens.filter((s) => s.branch_id === b.id).length;
              return (
                <tr key={b.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={tdStyle}><strong>{b.name}</strong></td>
                  <td style={tdStyle}><span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{b.code}</span></td>
                  <td style={tdStyle}>{b.city}</td>
                  <td style={tdStyle}>{b.timezone}</td>
                  <td style={tdStyle}>{cnt}</td>
                  <td style={tdStyle}>{b.active ? <Pill color="#059669" bg="#d1fae5">Active</Pill> : <Pill color="#475569" bg="#e2e8f0">Dormant</Pill>}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button type="button" style={btnGhost} onClick={() => updateBranch(b.id, { active: !b.active })}>
                        <i className={`ti ${b.active ? 'ti-pause' : 'ti-player-play'}`} />
                      </button>
                      <button type="button" style={btnGhost} onClick={() => setEditing(b)}><i className="ti ti-pencil" /></button>
                      <button type="button" style={btnDanger} onClick={() => setConfirmDelete(b)} disabled={cnt > 0} title={cnt > 0 ? 'Move screens out first' : 'Delete branch'}><i className="ti ti-trash" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(creating || editing) && (
        <BranchModal branch={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={(payload) => {
            if (editing) { updateBranch(editing.id, payload); showToast('success', 'Branch updated', payload.name); }
            else { const b = createBranch(payload); showToast('success', 'Branch created', b.name); }
            setCreating(false); setEditing(null);
          }} />
      )}
      {confirmDelete && (
        <ConfirmModal title="Delete this branch?" message={<><strong>{confirmDelete.name}</strong> will be removed.</>}
          confirmLabel="Delete" confirmStyle={btnDanger}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => { deleteBranch(confirmDelete.id); showToast('success', 'Branch deleted'); setConfirmDelete(null); }} />
      )}
    </div>
  );
}

function BranchModal({ branch, onClose, onSave }) {
  const [name, setName] = useState(branch?.name || '');
  const [code, setCode] = useState(branch?.code || '');
  const [city, setCity] = useState(branch?.city || '');
  const [timezone, setTimezone] = useState(branch?.timezone || 'Asia/Kolkata');
  function submit(e) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    onSave({ name, code, city, timezone });
  }
  return (
    <Modal title={branch ? 'Edit branch' : 'New branch'} onClose={onClose} maxWidth={460}>
      <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        <Field label="Branch name"><input autoFocus value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Code (3 letters)"><input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} style={{ ...inputStyle, fontFamily: 'monospace' }} maxLength={6} /></Field>
          <Field label="City"><input value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} /></Field>
        </div>
        <Field label="Timezone">
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)} style={selStyle}>{TIMEZONES.map((t) => <option key={t}>{t}</option>)}</select>
        </Field>
        <FormActions onCancel={onClose} submitLabel={branch ? 'Save' : 'Create'} />
      </form>
    </Modal>
  );
}

// ───────────────────────── Shared building blocks ────────────────────
function Card({ title, icon, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        {icon && <i className={`ti ${icon}`} style={{ color: 'var(--brand)' }} />}
        <strong style={{ fontSize: 14, color: 'var(--ink)' }}>{title}</strong>
      </div>
      {children}
    </div>
  );
}

function Toolbar({ children }) {
  return <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>{children}</div>;
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div style={{ position: 'relative' }}>
      <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 12 }} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ ...inputStyle, paddingLeft: 30, width: 240 }} />
    </div>
  );
}

function Pill({ color, bg, children }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: bg, color, padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em' }}>{children}</span>;
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 8, background: checked ? '#eaf3f5' : '#fff', cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ marginTop: 2 }} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{hint}</div>}
      </div>
    </label>
  );
}

function Field({ label, hint, children }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>{label}</span>
      {children}
      {hint && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{hint}</span>}
    </label>
  );
}

function FormActions({ onCancel, submitLabel, primaryStyle, disabled }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
      <button type="button" onClick={onCancel} style={btnGhost}>Cancel</button>
      <button type="submit" disabled={disabled} style={{ ...(primaryStyle || btnPrimary), opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>{submitLabel}</button>
    </div>
  );
}

function ConfirmModal({ title, message, confirmLabel, confirmStyle, onCancel, onConfirm }) {
  return (
    <Modal title={title} onClose={onCancel} maxWidth={420}>
      <p style={{ margin: '0 0 16px', color: 'var(--ink)', fontSize: 14, lineHeight: 1.5 }}>{message}</p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" onClick={onCancel} style={btnGhost}>Cancel</button>
        <button type="button" onClick={onConfirm} style={confirmStyle}><i className="ti ti-trash" /> {confirmLabel}</button>
      </div>
    </Modal>
  );
}

function Modal({ title, children, onClose, maxWidth = 520 }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15, 30, 35, 0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth, boxShadow: '0 20px 50px rgba(0,0,0,0.25)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 17, color: 'var(--ink)' }}>{title}</h3>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 18 }}><i className="ti ti-close" /></button>
        </div>
        <div style={{ padding: 20, overflow: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Style tokens ─────────────────────────────────────────────────────
const inputStyle  = { padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, color: 'var(--ink)', background: '#fff', outline: 'none' };
const selStyle    = { ...inputStyle, appearance: 'auto' };
const btnPrimary  = { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--brand)', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const btnGhost    = { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: 'var(--ink)', border: '1px solid var(--line)', padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12, textDecoration: 'none' };
const btnDanger   = { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: 'var(--danger)', border: '1px solid #f3cdc8', padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12 };
const miniBtn     = { background: '#fff', border: '1px solid var(--line)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11, color: 'var(--ink)' };
const tableStyle  = { width: '100%', borderCollapse: 'collapse', fontSize: 13 };
const thStyle     = { padding: '10px 18px', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '1px solid var(--line)', textAlign: 'left', background: '#fbfcfd' };
const tdStyle     = { padding: '12px 18px', verticalAlign: 'middle', color: 'var(--ink)' };
