import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ToastRegion from '../components/ToastRegion';
import {
  CONTENT_TYPES, CONTENT_TYPE_MAP, ORIENTATIONS, RESOLUTIONS, TIMEZONES,
  TRANSITIONS, SEVERITIES, WEEKDAYS, SCOPE_STYLES,
  useAlerts, useBranches, useMedia, useSchedules, useScreens, useTimelines, useDashboard,
  createAlert, createMedia, createSchedule, createScreen, createTimeline,
  updateAlert, updateScreen, updateTimeline, updateSchedule,
  deleteAlert, deleteMedia, deleteSchedule, deleteScreen, deleteTimeline,
  duplicateTimeline, broadcastAlert, dismissAlert, assignTimelineToScreens,
  ensureLoopDetail, commitLoopDraft,
  fmtBytes, fmtRelTime, fmtDuration,
} from '../lib/digitalSignageStore';
import { listLocations } from '../lib/locationsApi';

// Content types currently shippable in the loop editor. Everything else
// renders disabled with a "Coming soon" badge.
const ENABLED_CONTENT_TYPES = new Set(['BRANDING', 'VIDEO', 'POSTER']);

// ─── Unsaved loop draft persistence ──────────────────────────────────
// While a loop is being edited, the staged (unsaved) item list is mirrored to
// localStorage so a page refresh doesn't lose work. Cleared on save/discard.
function loopDraftKey(id) { return `signage_loop_draft:${id}`; }
function readLoopDraft(id) {
  try { const raw = localStorage.getItem(loopDraftKey(id)); const v = raw ? JSON.parse(raw) : null; return Array.isArray(v) ? v : null; }
  catch { return null; }
}
function writeLoopDraft(id, items) { try { localStorage.setItem(loopDraftKey(id), JSON.stringify(items)); } catch { /* quota/private mode */ } }
function clearLoopDraft(id) { try { localStorage.removeItem(loopDraftKey(id)); } catch { /* ignore */ } }

// ─── Tabs ─────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',  label: 'Overview',  icon: 'ti-layout-grid2' },
  { id: 'schedules', label: 'Schedules', icon: 'ti-calendar' },
  { id: 'timelines', label: 'Loops',     icon: 'ti-layers' },
  { id: 'screens',   label: 'Screens',   icon: 'ti-device-desktop' },
  { id: 'alerts',    label: 'Emergency', icon: 'ti-alert' },
  { id: 'media',     label: 'Media',     icon: 'ti-photo' },
];

const VALID_TABS = TABS.map((t) => t.id);

export default function DigitalSignagePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  // The URL ?tab= param is the source of truth so a refresh restores the tab.
  const tabParam = searchParams.get('tab');
  const tab = VALID_TABS.includes(tabParam) ? tabParam : 'overview';

  const [toasts, setToasts] = useState([]);

  // The selected branch lives in the URL (?branch=<id>) so a refresh keeps it.
  const branches = useBranches();
  const branchFilter = searchParams.get('branch') || '';
  const branchFilterLabel = branches.find((b) => String(b.id) === String(branchFilter))?.name || '';

  function setBranchFilter(id) {
    setSearchParams((prev) => {
      const sp = new URLSearchParams(prev);
      if (id) sp.set('branch', String(id));
      else sp.delete('branch');
      return sp;
    });
  }

  // If the URL carries a branch id that doesn't exist (once branches load),
  // drop it and fall back to "All branches".
  useEffect(() => {
    if (!branchFilter || branches.length === 0) return;
    const exists = branches.some((b) => String(b.id) === String(branchFilter));
    if (!exists) {
      setSearchParams((prev) => {
        const sp = new URLSearchParams(prev);
        sp.delete('branch');
        return sp;
      }, { replace: true });
    }
  }, [branchFilter, branches]); // eslint-disable-line react-hooks/exhaustive-deps

  // The loop being edited lives in the URL (?loop=<id>) so a refresh restores
  // the editor. Only meaningful on the timelines tab.
  const editingTimelineId = tab === 'timelines' ? (searchParams.get('loop') || null) : null;

  function setEditingTimelineId(id) {
    setSearchParams((prev) => {
      const sp = new URLSearchParams(prev);
      sp.set('tab', 'timelines');
      if (id) sp.set('loop', id);
      else sp.delete('loop');
      return sp;
    });
  }

  function setTab(next) {
    setSearchParams((prev) => {
      const sp = new URLSearchParams(prev);
      sp.set('tab', next);
      // Leaving the timelines tab closes any open loop editor.
      if (next !== 'timelines') sp.delete('loop');
      return sp;
    });
  }

  // Normalise the URL when no (or an invalid) tab is present.
  useEffect(() => {
    if (!VALID_TABS.includes(tabParam)) {
      setSearchParams((prev) => {
        const sp = new URLSearchParams(prev);
        sp.set('tab', 'overview');
        return sp;
      }, { replace: true });
    }
  }, [tabParam]); // eslint-disable-line react-hooks/exhaustive-deps

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
      <PageHeader branchFilter={branchFilter} setBranchFilter={setBranchFilter} branchFilterLabel={branchFilterLabel} />
      <TabBar tab={tab} setTab={setTab} />

      <div style={{ marginTop: 16 }}>
        {tab === 'overview'  && <OverviewTab branchFilter={branchFilter} onJump={setTab} />}
        {tab === 'screens'   && <ScreensTab branchFilter={branchFilter} showToast={showToast} />}
        {tab === 'timelines' && <TimelinesTab branchFilter={branchFilter} editingId={editingTimelineId} setEditingId={setEditingTimelineId} showToast={showToast} />}
        {tab === 'media'     && <MediaTab branchFilter={branchFilter} showToast={showToast} />}
        {tab === 'schedules' && <SchedulesTab branchFilter={branchFilter} showToast={showToast} />}
        {tab === 'alerts'    && <AlertsTab branchFilter={branchFilter} showToast={showToast} />}
      </div>
    </section>
  );
}

// ───────────────────────── Header + Tabs ──────────────────────────────
function PageHeader({ branchFilter, setBranchFilter, branchFilterLabel }) {
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
        <div style={{ minWidth: 220 }}>
          <LocationPicker
            value={branchFilter || null}
            initialLabel={branchFilterLabel}
            placeholder="All branches"
            onChange={(picked) => setBranchFilter(picked ? picked.id : '')}
          />
        </div>
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
  const dash      = useDashboard();

  // Loose comparison so int <-> string location ids both match.
  const sameId = (a, b) => a != null && b != null && String(a) === String(b);

  const filteredScreens = useMemo(
    () => branchFilter ? screens.filter((s) => sameId(s.branch_id, branchFilter)) : screens,
    [screens, branchFilter]
  );

  const activeAlerts = alerts.filter((a) => a.is_active);

  // Prefer the server-authoritative dashboard.now_playing when available;
  // fall back to the locally-cached screens otherwise.
  const nowPlaying = useMemo(() => {
    if (dash?.now_playing?.length) {
      return dash.now_playing
        .filter((np) => !branchFilter || sameId(np.screen?.location_id, branchFilter))
        .map((np) => ({
          screen_id:    np.screen?.id,
          name:         np.screen?.name,
          screen_code:  np.screen?.screen_code,
          loop_name:    np.loop?.name || null,
          current_item: np.current_item?.title || null,
        }));
    }
    return filteredScreens
      .filter((s) => s.playback_status === 'playing')
      .map((s) => {
        const tl = timelines.find((t) => t.id === s.assigned_timeline_id);
        return { screen_id: s.id, name: s.name, screen_code: s.screen_code, loop_name: tl?.name || null, current_item: null };
      });
  }, [dash, branchFilter, filteredScreens, timelines]);

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
      <Card title="Now playing" icon="ti-control-play">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
          {nowPlaying.slice(0, 9).map((np) => (
            <div key={np.screen_id} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 12, background: '#fbfcfd' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: '#10b981', animation: 'pulse 1.5s infinite' }} />
                <strong style={{ fontSize: 13 }}>{np.name}</strong>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--muted)' }}>{np.screen_code}</span>
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--ink)' }}>
                <i className="ti ti-layers" style={{ color: 'var(--brand)', marginRight: 4 }} />
                {np.loop_name || <em style={{ color: 'var(--muted)' }}>No loop</em>}
              </div>
              {np.current_item && (
                <div style={{ marginTop: 4, fontSize: 11, color: 'var(--muted)' }}>
                  <i className="ti ti-control-play" /> {np.current_item}
                </div>
              )}
            </div>
          ))}
          {nowPlaying.length === 0 && (
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
              const ss = screens.filter((s) => sameId(s.branch_id, b.id));
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
      .filter((s) => !branchFilter || String(s.branch_id) === String(branchFilter))
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
  const initialBranchLabel = branches.find((b) => b.id === screen?.branch_id)?.name || '';
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
            <LocationPicker
              value={branchId || null}
              initialLabel={initialBranchLabel}
              placeholder="— Unassigned —"
              onChange={(picked) => setBranchId(picked ? picked.id : '')}
            />
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
  const [previewLoopId, setPreviewLoopId] = useState(null);

  const filtered = useMemo(() => branchFilter ? timelines.filter((t) => !t.branch_id || String(t.branch_id) === String(branchFilter)) : timelines, [timelines, branchFilter]);
  const previewLoop = previewLoopId ? timelines.find((t) => String(t.id) === String(previewLoopId)) : null;
  const editing = editingId ? timelines.find((t) => String(t.id) === String(editingId)) : null;

  if (editing) {
    return <TimelineEditor key={editing.id} timeline={editing} onBack={() => setEditingId(null)} showToast={showToast} />;
  }

  // Deep-linked (?loop=<id>) but the loops list hasn't resolved it yet —
  // show a placeholder instead of flashing the full list grid.
  if (editingId && timelines.length === 0) {
    return (
      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
        <i className="ti ti-reload" style={{ fontSize: 22, display: 'block', marginBottom: 10 }} />
        Loading loop…
      </div>
    );
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
                <KebabMenu items={[
                  { label: 'Open editor', icon: 'ti-pencil', onClick: () => setEditingId(t.id) },
                  { label: 'Preview', icon: 'ti-control-play', onClick: async () => {
                    try { await ensureLoopDetail(t.id); setPreviewLoopId(t.id); }
                    catch (e) { showToast('error', e.code || 'Preview failed', e.message); }
                  } },
                  { label: 'Duplicate', icon: 'ti-copy', onClick: async () => {
                    try { const c = await duplicateTimeline(t.id); showToast('success', 'Loop duplicated', c?.name); }
                    catch (e) { showToast('error', e.code || 'Duplicate failed', e.message); }
                  } },
                  { label: t.is_active ? 'Pause' : 'Activate', icon: t.is_active ? 'ti-control-pause' : 'ti-control-play',
                    onClick: () => updateTimeline(t.id, { is_active: !t.is_active }) },
                  { label: 'Delete', icon: 'ti-trash', danger: true, onClick: () => setConfirmDelete(t) },
                ]} />
              </div>
              {t.description && <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{t.description}</p>}
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
      {previewLoop && (
        <PreviewModal
          timeline={previewLoop} items={Array.isArray(previewLoop.items) ? previewLoop.items : []}
          onClose={() => setPreviewLoopId(null)}
        />
      )}
    </div>
  );
}

function TimelineModal({ timeline, onClose, onSave }) {
  const branches = useBranches();
  const [name, setName] = useState(timeline?.name || '');
  const [description, setDescription] = useState(timeline?.description || '');
  const [branchId, setBranchId] = useState(timeline?.branch_id || '');
  const initialBranchLabel = branches.find((b) => b.id === timeline?.branch_id)?.name || '';
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
          <LocationPicker
            value={branchId || null}
            initialLabel={initialBranchLabel}
            placeholder="All branches"
            onChange={(picked) => setBranchId(picked ? picked.id : '')}
          />
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
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [dropIdx, setDropIdx] = useState(null);
  const [hoverIdx, setHoverIdx] = useState(null);

  // ── Draft editing ──────────────────────────────────────────────────
  // All item edits stage into `draft` and only hit the API on "Save changes".
  // A persisted draft (from a prior, un-saved session) is restored on mount so
  // a page refresh doesn't lose work.
  const serverItems = Array.isArray(timeline.items) ? timeline.items : [];
  const restoredDraft = useMemo(() => readLoopDraft(timeline.id), [timeline.id]);
  const [draft, setDraft] = useState(restoredDraft || serverItems);
  const [dirty, setDirty] = useState(!!restoredDraft);
  const [saving, setSaving] = useState(false);
  // Seed the temp-id counter past any tmp ids carried in a restored draft.
  const tmpCounter = useRef((restoredDraft || []).reduce((m, it) => {
    const mt = /^tmp-(\d+)$/.exec(String(it?.id || ''));
    return mt ? Math.max(m, Number(mt[1])) : m;
  }, 0));

  // List endpoint omits items[]; pull the full loop on entry so the editor
  // has something to render. ensureLoopDetail is idempotent.
  useEffect(() => { ensureLoopDetail(timeline.id); }, [timeline.id]);

  // Sync the draft from the server whenever the canonical items change AND we
  // have no pending edits (initial load, post-save refresh, external change).
  useEffect(() => {
    if (!dirty) setDraft(Array.isArray(timeline.items) ? timeline.items : []);
  }, [timeline.items, dirty]);

  // Mirror the draft to localStorage while dirty; clear it once saved/discarded.
  useEffect(() => {
    if (dirty) writeLoopDraft(timeline.id, draft);
    else clearLoopDraft(timeline.id);
  }, [draft, dirty, timeline.id]);

  const items = draft;
  const totalSecs = items.reduce((a, it) => a + (it.duration_seconds || 0), 0);

  // Local mutators (operate on the draft only)
  function makeNewItem(payload = {}) {
    const ctId = payload.content_type || 'BRANDING';
    return {
      id: `tmp-${++tmpCounter.current}`, _new: true,
      content_type: ctId,
      title: payload.title || CONTENT_TYPE_MAP[ctId]?.label || 'Untitled',
      duration_seconds: payload.duration_seconds ?? 15,
      transition_type: payload.transition_type || 'fade',
      content_reference_id: payload.content_reference_id ?? null,
      overlay_enabled: payload.overlay_enabled !== false,
      background_audio_enabled: !!payload.background_audio_enabled,
    };
  }
  function addDraftItem(payload) { setDraft((d) => [...d, makeNewItem(payload)]); setDirty(true); }
  function updateDraftItem(id, payload) { setDraft((d) => d.map((x) => x.id === id ? { ...x, ...payload } : x)); setDirty(true); }
  function deleteDraftItem(id) { setDraft((d) => d.filter((x) => x.id !== id)); setDirty(true); }
  function duplicateDraftItem(id) {
    setDraft((d) => {
      const i = d.findIndex((x) => x.id === id);
      if (i < 0) return d;
      const copy = { ...d[i], id: `tmp-${++tmpCounter.current}`, _new: true };
      const next = d.slice();
      next.splice(i + 1, 0, copy);
      return next;
    });
    setDirty(true);
  }
  function bulkDraftDurations(secs) { setDraft((d) => d.map((x) => ({ ...x, duration_seconds: secs }))); setDirty(true); }

  async function saveChanges() {
    setSaving(true);
    try {
      await commitLoopDraft(timeline.id, draft);
      setDirty(false);                          // sync effect will pull fresh items
      showToast('success', 'Changes saved', timeline.name);
    } catch (e) {
      showToast('error', e.code || 'Save failed', e.message);
    } finally { setSaving(false); }
  }
  function discardChanges() {
    setDraft(Array.isArray(timeline.items) ? timeline.items : []);
    setDirty(false);
    setPreview({ playing: false, idx: 0, elapsed: 0 });
  }
  function handleBack() {
    if (dirty && !window.confirm('Discard unsaved changes to this loop?')) return;
    if (dirty) clearLoopDraft(timeline.id);   // user chose to abandon the draft
    onBack();
  }

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
      setDraft((d) => {
        const next = d.slice();
        const [moved] = next.splice(dragIdx, 1);
        next.splice(dropIdx, 0, moved);
        return next;
      });
      setDirty(true);
    }
    setDragIdx(null); setDropIdx(null);
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {/* Header */}
      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button type="button" style={btnGhost} onClick={handleBack}><i className="ti ti-arrow-left" /> Back</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <strong style={{ fontSize: 16 }}>{timeline.name}</strong>
          {timeline.is_active ? <Pill color="#059669" bg="#d1fae5">Active</Pill> : <Pill color="#475569" bg="#e2e8f0">Draft</Pill>}
          {dirty && <Pill color="#b45309" bg="#fef3c7">Unsaved</Pill>}
        </div>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>{items.length} items · {fmtDuration(totalSecs)}</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button type="button" style={btnGhost} disabled={items.length === 0}
            onClick={() => setPreviewModalOpen(true)}>
            <i className="ti ti-control-play" /> Preview In Action
          </button>
          <span style={{ width: 1, alignSelf: 'stretch', background: 'var(--line)', margin: '0 2px' }} />
          <button type="button" style={{ ...btnGhost, opacity: dirty && !saving ? 1 : 0.5, cursor: dirty && !saving ? 'pointer' : 'not-allowed' }}
            disabled={!dirty || saving} onClick={discardChanges}>
            <i className="ti ti-back-left" /> Discard
          </button>
          <button type="button" style={{ ...btnPrimary, opacity: dirty && !saving ? 1 : 0.5, cursor: dirty && !saving ? 'pointer' : 'not-allowed' }}
            disabled={!dirty || saving} onClick={saveChanges}>
            <i className="ti ti-check" /> {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Preview pane */}
      <div style={{ background: '#0f172a', borderRadius: 14, overflow: 'hidden', position: 'relative', aspectRatio: '16 / 6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PreviewSurface items={items} preview={preview} />
      </div>

      {/* Timeline (Premiere-style) */}
      <TimelineTrack
        items={items} totalSecs={totalSecs} timeline={timeline}
        preview={preview} setPreview={setPreview}
        dragIdx={dragIdx} dropIdx={dropIdx} hoverIdx={hoverIdx}
        setHoverIdx={setHoverIdx} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}
        onEditItem={setEditingItem}
        onDuplicateItem={duplicateDraftItem}
        onDeleteItem={deleteDraftItem}
        onSetFixedDuration={() => setBulkOpen(true)}
      />

      {/* Content types catalog */}
      <Card title="Add Content to Loop Timeline" icon="ti-sparkles">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {CONTENT_TYPES.filter((ct) => ENABLED_CONTENT_TYPES.has(ct.id)).map((ct) => (
            <ContentTypeCard key={ct.id} ct={ct} enabled
              onAdd={() => { addDraftItem({ content_type: ct.id }); showToast('info', `${ct.label} added to draft`); }} />
          ))}
        </div>

        {CONTENT_TYPES.some((ct) => !ENABLED_CONTENT_TYPES.has(ct.id)) && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 12px' }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>Coming soon</span>
              <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {CONTENT_TYPES.filter((ct) => !ENABLED_CONTENT_TYPES.has(ct.id)).map((ct) => (
                <ContentTypeCard key={ct.id} ct={ct} enabled={false} />
              ))}
            </div>
          </>
        )}
      </Card>

      {addOpen && (
        <ItemModal media={media} onClose={() => setAddOpen(false)} onSave={(payload) => {
          addDraftItem(payload);
          setAddOpen(false);
        }} />
      )}
      {editingItem && (
        <ItemModal item={editingItem} media={media} onClose={() => setEditingItem(null)} onSave={(payload) => {
          updateDraftItem(editingItem.id, payload);
          setEditingItem(null);
        }} />
      )}
      {bulkOpen && (
        <BulkDurationsModal onClose={() => setBulkOpen(false)} onApply={(secs) => {
          bulkDraftDurations(secs);
          setBulkOpen(false);
        }} />
      )}
      {previewModalOpen && (
        <PreviewModal
          timeline={timeline} items={items}
          onClose={() => setPreviewModalOpen(false)}
        />
      )}
    </div>
  );
}

// Clock format: under a minute → "12s"; a minute or more → "M:SS min".
function fmtClock(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')} min`;
}

// Near-fullscreen "Preview In Action" — plays the loop as it would appear on a
// screen. Self-contained: owns its own playback state + ticker so it can be
// opened from the loop editor or from a loop card in the list.
function PreviewModal({ timeline, items, onClose }) {
  const [preview, setPreview] = useState({ playing: true, idx: 0, elapsed: 0 });

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Playback ticker
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

  const cur = items[preview.idx];
  // Cumulative elapsed across the whole loop, and the loop's total runtime.
  const totalSecs = items.reduce((a, it) => a + (it.duration_seconds || 0), 0);
  const elapsedSecs = items.slice(0, preview.idx).reduce((a, it) => a + (it.duration_seconds || 0), 0) + preview.elapsed;
  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.82)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5vh 2.5vw' }}>
      <div style={{ width: '95vw', height: '95vh', background: '#0f172a', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 80px rgba(0,0,0,0.55)' }}>
        {/* Controls bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid #1e293b', color: '#e2e8f0' }}>
          <i className="ti ti-layers" style={{ color: '#67e8f9', fontSize: 18 }} />
          <strong style={{ fontSize: 15 }}>{timeline.name}</strong>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>
            {items.length > 0 ? `Item ${preview.idx + 1} of ${items.length}` : 'Empty loop'}
            {cur ? ` · ${fmtDuration(cur.duration_seconds)} · ${cur.transition_type}` : ''}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setPreview((p) => ({ ...p, playing: !p.playing }))}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              <i className={`ti ${preview.playing ? 'ti-control-pause' : 'ti-control-play'}`} /> {preview.playing ? 'Pause' : 'Play'}
            </button>
            <button type="button" onClick={() => setPreview((p) => ({ ...p, idx: 0, elapsed: 0 }))}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              <i className="ti ti-control-skip-backward" /> Restart
            </button>
            <button type="button" onClick={onClose}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', color: '#cbd5e1', border: '1px solid #334155', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              <i className="ti ti-close" /> Close
            </button>
          </div>
        </div>
        {/* Stage */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
          <PreviewSurface items={items} preview={preview} />
          {/* Running time (elapsed / total), bottom-right */}
          {totalSecs > 0 && (
            <div style={{ position: 'absolute', bottom: 14, right: 16, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(15,23,42,0.75)', border: '1px solid #334155', color: '#e2e8f0', fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              <i className="ti ti-clock" style={{ color: '#67e8f9', fontSize: 13 }} />
              {fmtClock(elapsedSecs)} <span style={{ color: '#64748b' }}>/ {fmtClock(totalSecs)}</span>
            </div>
          )}
          {/* Progress bar — spans the whole loop's total duration */}
          {totalSecs > 0 && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'rgba(255,255,255,0.1)' }}>
              <div style={{ height: '100%', width: `${Math.min(100, (elapsedSecs / totalSecs) * 100)}%`, background: '#0ea5e9', transition: 'width 1s linear' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Premiere-style timeline track ───────────────────────────────────
// A dark NLE-style editor: a time ruler, a single "V1" video track whose
// clips are sized proportional to their duration, a draggable scrubber
// playhead, and per-clip hover controls. Click/scrub to move the playhead;
// drag clips to reorder.
const TL_PPS = 26;            // pixels per second
const TL_TRACK_H = 76;        // clip lane height
const TL_RULER_H = 24;        // time ruler height
const TL_GUTTER = 44;         // left track-label gutter width

function TimelineTrack({
  items, totalSecs, timeline, preview, setPreview,
  dragIdx, dropIdx, hoverIdx, setHoverIdx, onDragStart, onDragOver, onDrop,
  onEditItem, onDuplicateItem, onDeleteItem, onSetFixedDuration,
}) {
  const contentRef = useRef(null);
  const trackWidth = Math.max(Math.round(totalSecs * TL_PPS), 240);
  const tickStep = totalSecs <= 20 ? 2 : totalSecs <= 60 ? 5 : totalSecs <= 180 ? 15 : totalSecs <= 600 ? 30 : 60;

  const elapsedSecs = items.slice(0, preview.idx).reduce((a, it) => a + (it.duration_seconds || 0), 0) + (preview.elapsed || 0);

  // The ticker bumps `elapsed` once per second. A plain 1s transition toward
  // the *current* second would always trail real time by ~1s. Instead, while
  // playing we aim the head at the *next* second and glide there over 1s — so
  // at any instant it sits where playback actually is. When paused/scrubbing we
  // render the exact position with no transition.
  const targetSecs = preview.playing ? Math.min(totalSecs, elapsedSecs + 1) : elapsedSecs;
  const playheadX = Math.min(trackWidth, targetSecs * TL_PPS);

  // Suppress the glide when the head moves *backward* (loop wrap, restart, or a
  // manual scrub) so it snaps instead of sweeping back across the whole track.
  const prevXRef = useRef(0);
  const movedBackward = playheadX < prevXRef.current - 0.5;
  useEffect(() => { prevXRef.current = playheadX; });
  const playheadTransition = (preview.playing && !movedBackward) ? 'left 1s linear' : 'none';

  const ticks = [];
  for (let s = 0; s <= totalSecs; s += tickStep) ticks.push(s);

  // Map an x-pixel (within the content area) to a {idx, elapsed} and move there.
  function scrubToClientX(clientX) {
    const el = contentRef.current;
    if (!el || items.length === 0) return;
    const rect = el.getBoundingClientRect();
    const t = Math.max(0, Math.min(totalSecs, (clientX - rect.left) / TL_PPS));
    let acc = 0;
    for (let i = 0; i < items.length; i++) {
      const d = items[i].duration_seconds || 0;
      if (t < acc + d || i === items.length - 1) {
        setPreview((p) => ({ ...p, playing: false, idx: i, elapsed: Math.max(0, Math.min(d, Math.round(t - acc))) }));
        return;
      }
      acc += d;
    }
  }

  // Press-and-drag scrubbing (on the ruler or the playhead handle). Moves the
  // seeker continuously and pauses playback so the user can pick a start point.
  function beginScrub(e) {
    if (items.length === 0) return;
    e.preventDefault();
    scrubToClientX(e.clientX);
    const onMove = (ev) => scrubToClientX(ev.clientX);
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
    };
    document.body.style.userSelect = 'none';   // avoid text selection while dragging
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  return (
    <div style={{ background: '#0f1722', border: '1px solid #1e293b', borderRadius: 14, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid #1e293b', color: '#cbd5e1' }}>
        <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94a3b8' }}>Timeline</span>
        <div style={{ display: 'inline-flex', gap: 6, marginLeft: 6 }}>
          <button type="button" title="Restart" onClick={() => setPreview((p) => ({ ...p, idx: 0, elapsed: 0 }))} style={tlBtn}><i className="ti ti-control-skip-backward" /></button>
          <button type="button" title={preview.playing ? 'Pause' : 'Play'} disabled={items.length === 0}
            onClick={() => setPreview((p) => ({ ...p, playing: !p.playing }))} style={tlBtn}>
            <i className={`ti ${preview.playing ? 'ti-control-pause' : 'ti-control-play'}`} />
          </button>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{fmtClock(elapsedSecs)}</span> / {fmtClock(totalSecs)} · {items.length} clip{items.length === 1 ? '' : 's'}
        </span>
        {onSetFixedDuration && (
          <button type="button" title="Set the same duration for every clip" disabled={items.length === 0}
            onClick={onSetFixedDuration}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 7, padding: '6px 11px', cursor: items.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 12, opacity: items.length === 0 ? 0.5 : 1 }}>
            <i className="ti ti-clock" /> Set Fixed Duration
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div style={{ padding: 36, textAlign: 'center', color: '#64748b' }}>
          No clips yet. Pick from <strong style={{ color: '#cbd5e1' }}>Add Content to Loop Timeline</strong> below to start.
        </div>
      ) : (
        <div style={{ display: 'flex' }}>
          {/* Left gutter with track label */}
          <div style={{ flex: `0 0 ${TL_GUTTER}px`, background: '#0b121b', borderRight: '1px solid #1e293b' }}>
            <div style={{ height: TL_RULER_H, borderBottom: '1px solid #1e293b' }} />
            <div style={{ height: TL_TRACK_H, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 11, fontWeight: 800, letterSpacing: '.05em' }}>V1</div>
          </div>

          {/* Scrollable timeline body */}
          <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
            <div ref={contentRef} style={{ position: 'relative', width: trackWidth }}>
              {/* Ruler (click or drag to scrub) */}
              <div onMouseDown={beginScrub}
                style={{ position: 'relative', height: TL_RULER_H, borderBottom: '1px solid #1e293b', cursor: 'ew-resize', background: '#0b121b' }}>
                {ticks.map((s) => (
                  <div key={s} style={{ position: 'absolute', left: s * TL_PPS, top: 0, bottom: 0, borderLeft: '1px solid #243244' }}>
                    <span style={{ position: 'absolute', left: 4, top: 4, fontSize: 9, color: '#5b6b7f', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{fmtClock(s)}</span>
                  </div>
                ))}
              </div>

              {/* Clip lane */}
              <div onDrop={onDrop} onDragOver={(e) => e.preventDefault()}
                style={{ position: 'relative', height: TL_TRACK_H, display: 'flex', gap: 0, background: 'repeating-linear-gradient(90deg,#0f1722,#0f1722 ' + (tickStep * TL_PPS - 1) + 'px,#13202e ' + (tickStep * TL_PPS - 1) + 'px,#13202e ' + (tickStep * TL_PPS) + 'px)' }}>
                {items.map((it, idx) => {
                  const ct = CONTENT_TYPE_MAP[it.content_type];
                  const w = Math.max(2, it.duration_seconds) * TL_PPS;
                  const isCur = preview.idx === idx;
                  const isDropTarget = dropIdx === idx && dragIdx !== idx;
                  const color = ct?.color || '#64748b';
                  return (
                    <div key={it.id}
                      draggable
                      onDragStart={() => onDragStart(idx)}
                      onDragOver={(e) => onDragOver(e, idx)}
                      onMouseEnter={() => setHoverIdx(idx)}
                      onMouseLeave={() => setHoverIdx((h) => (h === idx ? null : h))}
                      onClick={() => setPreview((p) => ({ ...p, playing: false, idx, elapsed: 0 }))}
                      title={`${ct?.label} · ${it.title} · ${fmtDuration(it.duration_seconds)}`}
                      style={{
                        position: 'relative', width: w, minWidth: w, height: '100%',
                        boxSizing: 'border-box',
                        borderRight: '1px solid #0b121b',
                        outline: isCur ? `2px solid ${color}` : (isDropTarget ? '2px dashed #67e8f9' : 'none'),
                        outlineOffset: -2,
                        background: `linear-gradient(180deg, ${color}38, ${color}14)`,
                        cursor: 'grab', overflow: 'hidden',
                      }}>
                      {/* accent header */}
                      <div style={{ height: 5, background: color }} />
                      {/* clip body */}
                      <div style={{ padding: '5px 7px', height: `calc(100% - 5px)`, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                          <i className={`ti ${ct?.icon}`} style={{ color, fontSize: 12, flexShrink: 0 }} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.title}</span>
                        </div>
                        <div style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <i className="ti ti-clock" style={{ fontSize: 10 }} /> {fmtDuration(it.duration_seconds)}
                          {w > 110 && <> · {it.transition_type}</>}
                        </div>
                      </div>
                      {/* hover toolbar */}
                      {hoverIdx === idx && w >= 64 && (
                        <div style={{ position: 'absolute', top: 6, right: 4, display: 'inline-flex', gap: 3 }}>
                          <button type="button" style={tlClipBtn} onClick={(e) => { e.stopPropagation(); onEditItem(it); }}><i className="ti ti-pencil" /></button>
                          <button type="button" style={tlClipBtn} onClick={(e) => { e.stopPropagation(); onDuplicateItem(it.id); }}><i className="ti ti-copy" /></button>
                          <button type="button" style={{ ...tlClipBtn, color: '#fca5a5' }} onClick={(e) => { e.stopPropagation(); onDeleteItem(it.id); }}><i className="ti ti-trash" /></button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Playhead spanning ruler + lane */}
              <div style={{ position: 'absolute', top: 0, left: playheadX, transition: playheadTransition, height: TL_RULER_H + TL_TRACK_H, width: 2, background: '#ef4444', pointerEvents: 'none', zIndex: 5 }}>
                {/* Grabbable handle — drag to scrub */}
                <div onMouseDown={beginScrub} title="Drag to seek"
                  style={{ position: 'absolute', top: -1, left: -7, width: 16, height: 14, borderRadius: '3px 3px 6px 6px', background: '#ef4444', cursor: 'ew-resize', pointerEvents: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,.4)' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const tlBtn = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 28, background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 7, cursor: 'pointer', fontSize: 13 };
const tlClipBtn = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, background: 'rgba(2,6,23,0.7)', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 5, cursor: 'pointer', fontSize: 11, padding: 0 };

// A single tile in the "Available content types" catalog. `enabled` tiles
// are clickable (add to the loop); disabled ones show a "Coming soon" badge.
function ContentTypeCard({ ct, enabled, onAdd }) {
  const sc = SCOPE_STYLES[ct.scope];
  return (
    <button type="button" disabled={!enabled}
      onClick={() => { if (enabled && onAdd) onAdd(); }}
      title={enabled ? '' : 'Coming soon'}
      style={{ textAlign: 'left', background: enabled ? '#fff' : '#f8fafc', border: '1px solid var(--line)', borderRadius: 10, padding: 12, cursor: enabled ? 'pointer' : 'not-allowed', opacity: enabled ? 1 : 0.6, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${ct.color}15`, color: ct.color, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: enabled ? 'none' : 'grayscale(0.6)' }}>
          <i className={`ti ${ct.icon}`} />
        </div>
        <strong style={{ fontSize: 13, color: 'var(--ink)' }}>{ct.label}</strong>
        {enabled && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            {ct.scope === 'CENTER' && (
              <i className="ti ti-bolt" title="Realtime data pull" style={{ color: '#b45309', fontSize: 12 }} />
            )}
            <span title={sc.hint} style={{ background: sc.bg, color: sc.color, fontSize: 9, fontWeight: 800, letterSpacing: '.06em', padding: '2px 6px', borderRadius: 4 }}>{sc.label}</span>
          </div>
        )}
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, lineHeight: 1.45 }}>{ct.desc}</div>
    </button>
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
            {CONTENT_TYPES.map((c) => {
              const enabled = ENABLED_CONTENT_TYPES.has(c.id);
              return <option key={c.id} value={c.id} disabled={!enabled}>{c.label}{enabled ? '' : ' (Coming soon)'}</option>;
            })}
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
    <Modal title="Set Fixed Duration" onClose={onClose} maxWidth={400}>
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
    .filter((m) => !branchFilter || m.branch_id == null || String(m.branch_id) === String(branchFilter))
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
          <LocationPicker
            value={branchId || null}
            placeholder="All branches"
            onChange={(picked) => setBranchId(picked ? picked.id : '')}
          />
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
      return sc && String(sc.branch_id) === String(branchFilter);
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
                  <td style={tdStyle}>
                    {tl
                      ? <a href={`/digital-signage?tab=timelines&loop=${encodeURIComponent(tl.id)}`} style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>{tl.name}</a>
                      : <em style={{ color: 'var(--muted)' }}>Missing</em>}
                  </td>
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
                        <i className={`ti ${s.is_active ? 'ti-control-pause' : 'ti-control-play'}`} />
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

// Human-readable alert window. Collapses the date when start/end share a day:
//   "28 May 2026, 9:24 AM → 9:24 AM"  (same day)
//   "28 May 2026, 9:24 AM → 29 May 2026, 6:00 PM"  (spanning days)
function fmtAlertWindow(start, end) {
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;
  if (!s || isNaN(s)) return '—';
  const dateOpts = { day: '2-digit', month: 'short', year: 'numeric' };
  const timeOpts = { hour: 'numeric', minute: '2-digit' };
  const sDate = s.toLocaleDateString(undefined, dateOpts);
  const sTime = s.toLocaleTimeString(undefined, timeOpts);
  if (!e || isNaN(e)) return `${sDate}, ${sTime}`;
  const eDate = e.toLocaleDateString(undefined, dateOpts);
  const eTime = e.toLocaleTimeString(undefined, timeOpts);
  return sDate === eDate
    ? `${sDate}, ${sTime} → ${eTime}`
    : `${sDate}, ${sTime} → ${eDate}, ${eTime}`;
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
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <i className="ti ti-map-pin" /> {branchNames}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <i className="ti ti-clock" /> {fmtAlertWindow(a.start_time, a.end_time)}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {a.is_active
          ? <button type="button" style={btnGhost} onClick={onDismiss}><i className="ti ti-control-stop" /> Stop</button>
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
  const [branchIds, setBranchIds] = useState(alert?.branch_ids || []);
  const initialBranchLabels = useMemo(() => {
    const out = {};
    (alert?.branch_ids || []).forEach((id) => {
      const b = branches.find((x) => x.id === id);
      if (b) out[id] = b.name;
    });
    return out;
  }, [alert, branches]);
  const [branchLabels, setBranchLabels] = useState(initialBranchLabels);
  const [audio, setAudio] = useState(!!alert?.audio_enabled);
  const [startTime, setStartTime] = useState(alert?.start_time || new Date().toISOString().slice(0, 16).replace('T', ' '));
  const [endTime, setEndTime] = useState(alert?.end_time || '');
  const [active, setActive] = useState(alert?.is_active ?? true);

  function submit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title, message, severity, audio_enabled: audio,
      branch_ids: branchIds, screen_ids: [],
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
          <LocationMultiPicker
            valueIds={branchIds}
            initialLabels={branchLabels}
            placeholder="Add branches…"
            onChange={(ids, labels) => { setBranchIds(ids); setBranchLabels(labels); }}
          />
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

// Three-dot "kebab" action menu. `items`: [{ label, icon, onClick, danger }].
function KebabMenu({ items = [] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    function onDown(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    function onKey(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button type="button" title="Actions" onClick={() => setOpen((o) => !o)}
        style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--line)', background: open ? '#f1f5f9' : '#fff', color: 'var(--muted)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
        <i className="ti ti-more-alt" />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, minWidth: 168, background: '#fff', border: '1px solid var(--line)', borderRadius: 10, boxShadow: '0 14px 38px rgba(0,0,0,0.14)', zIndex: 50, padding: 4, overflow: 'hidden' }}>
          {items.map((it, i) => (
            <button key={i} type="button"
              onClick={() => { setOpen(false); it.onClick?.(); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', padding: '9px 10px', borderRadius: 7, fontSize: 13, fontWeight: 600, color: it.danger ? '#dc2626' : 'var(--ink)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = it.danger ? '#fef2f2' : '#f1f5f9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
              <i className={`ti ${it.icon}`} style={{ width: 16, textAlign: 'center' }} /> {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
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

// ─── Location typeahead (paginated) ──────────────────────────────────
// Drives every "branch" picker on this page off the Location API
// (/restricted/location/list). Pages 20 at a time, debounced search,
// IntersectionObserver-driven infinite scroll.
const LOC_PAGE_SIZE = 20;

function useLocationSearch(query, open) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);

  // Reset on query change (or when the panel opens)
  useEffect(() => {
    if (!open) return;
    const myReq = ++reqId.current;
    setLoading(true);
    setItems([]);
    setPage(1);
    setHasMore(true);
    const t = setTimeout(async () => {
      try {
        const resp = await listLocations({
          page: 1, size: LOC_PAGE_SIZE, filterBy: 'all',
          ...(query.trim() ? { searchKey: query.trim() } : {}),
        });
        if (reqId.current !== myReq) return;
        const rows = resp?.data || [];
        setItems(rows);
        setHasMore(rows.length === LOC_PAGE_SIZE);
      } catch {
        if (reqId.current === myReq) { setItems([]); setHasMore(false); }
      } finally {
        if (reqId.current === myReq) setLoading(false);
      }
    }, 220);
    return () => { clearTimeout(t); };
  }, [query, open]);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    const myReq = reqId.current;
    setLoading(true);
    try {
      const next = page + 1;
      const resp = await listLocations({
        page: next, size: LOC_PAGE_SIZE, filterBy: 'all',
        ...(query.trim() ? { searchKey: query.trim() } : {}),
      });
      if (reqId.current !== myReq) return;
      const rows = resp?.data || [];
      setItems((cur) => [...cur, ...rows]);
      setPage(next);
      setHasMore(rows.length === LOC_PAGE_SIZE);
    } catch {
      if (reqId.current === myReq) setHasMore(false);
    } finally {
      if (reqId.current === myReq) setLoading(false);
    }
  };

  return { items, loading, hasMore, loadMore };
}

function LocationDropdown({ rect, query, setQuery, items, loading, hasMore, loadMore, onPick, selectedIds, dropRef, allowClear, onClear, emptyHint }) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMore();
    }, { root: null, threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  return (
    <div ref={dropRef} style={{
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(260, rect.width),
      background: '#fff', border: '1px solid var(--line)', borderRadius: 8,
      boxShadow: '0 14px 38px rgba(0,0,0,0.12)', zIndex: 1200,
      maxHeight: Math.max(220, window.innerHeight - rect.bottom - 16),
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: 8, borderBottom: '1px solid var(--line)', display: 'flex', gap: 6 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 12 }} />
          <input
            autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search locations…"
            style={{ ...inputStyle, width: '100%', paddingLeft: 28 }}
          />
        </div>
        {allowClear && (
          <button type="button" onMouseDown={(e) => { e.preventDefault(); onClear(); }} style={btnGhost} title="Clear selection">
            <i className="ti ti-close" />
          </button>
        )}
      </div>
      <div style={{ overflow: 'auto', flex: 1 }}>
        {items.map((loc) => {
          const sel = selectedIds?.has(loc.id);
          return (
            <button
              key={loc.id} type="button"
              onMouseDown={(e) => { e.preventDefault(); onPick(loc); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', textAlign: 'left', background: sel ? '#eaf3f5' : '#fff',
                border: 'none', cursor: 'pointer', padding: '9px 12px',
                borderTop: '1px solid #f3f5f6',
              }}
            >
              <i className={`ti ${sel ? 'ti-check' : 'ti-building'}`} style={{ color: sel ? 'var(--brand)' : 'var(--muted)', fontSize: 13 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{loc.name}</div>
                {loc.address && (
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{loc.address}</div>
                )}
              </div>
            </button>
          );
        })}
        {!loading && items.length === 0 && (
          <div style={{ padding: '14px 12px', fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
            {emptyHint || (query ? `No matches for "${query}"` : 'No locations available')}
          </div>
        )}
        {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
        {loading && (
          <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
            <i className="ti ti-reload" style={{ marginRight: 6 }} />Loading…
          </div>
        )}
      </div>
    </div>
  );
}

// Single-select location/branch picker. value = id (string|null);
// initialLabel = best-effort display string when only id is known.
function LocationPicker({ value, initialLabel, onChange, placeholder = 'Select location…', allowClear = true, disabled = false }) {
  const [label, setLabel] = useState(initialLabel || '');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const dropRef = useRef(null);

  useEffect(() => { setLabel(initialLabel || ''); }, [initialLabel, value]);

  const { items, loading, hasMore, loadMore } = useLocationSearch(query, open);

  useEffect(() => {
    function onDown(e) {
      if (wrapRef.current?.contains(e.target)) return;
      if (dropRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    function onKey(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, []);

  useEffect(() => {
    if (!open) return;
    function update() { if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect()); }
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update); };
  }, [open]);

  function pick(loc) {
    setLabel(loc.name);
    onChange({ id: loc.id, name: loc.name, raw: loc });
    setOpen(false);
    setQuery('');
  }
  function clear() {
    setLabel('');
    onChange(null);
    setOpen(false);
    setQuery('');
  }

  const selectedIds = value ? new Set([value]) : new Set();

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        ref={triggerRef} type="button" disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        style={{
          ...inputStyle, width: '100%', textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 8,
          cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
        }}
      >
        <i className="ti ti-building" style={{ color: 'var(--muted)' }} />
        <span style={{ flex: 1, color: label ? 'var(--ink)' : 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label || (value ? `#${value}` : placeholder)}
        </span>
        <i className={`ti ${open ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ color: 'var(--muted)', fontSize: 12 }} />
      </button>
      {open && rect && (
        <LocationDropdown
          rect={rect} query={query} setQuery={setQuery}
          items={items} loading={loading} hasMore={hasMore} loadMore={loadMore}
          onPick={pick} selectedIds={selectedIds} dropRef={dropRef}
          allowClear={allowClear && !!value} onClear={clear}
        />
      )}
    </div>
  );
}

// Multi-select location picker — same dropdown, chip strip below.
function LocationMultiPicker({ valueIds = [], initialLabels = {}, onChange, placeholder = 'Add locations…' }) {
  const [labels, setLabels] = useState(initialLabels);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const dropRef = useRef(null);

  useEffect(() => { setLabels((cur) => ({ ...initialLabels, ...cur })); }, [initialLabels]);

  const { items, loading, hasMore, loadMore } = useLocationSearch(query, open);

  useEffect(() => {
    function onDown(e) {
      if (wrapRef.current?.contains(e.target)) return;
      if (dropRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    function onKey(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, []);

  useEffect(() => {
    if (!open) return;
    function update() { if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect()); }
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update); };
  }, [open]);

  const selectedSet = new Set(valueIds);

  function toggle(loc) {
    const next = new Set(valueIds);
    if (next.has(loc.id)) next.delete(loc.id);
    else next.add(loc.id);
    setLabels((cur) => ({ ...cur, [loc.id]: loc.name }));
    onChange(Array.from(next), { ...labels, [loc.id]: loc.name });
  }
  function remove(id) {
    const next = valueIds.filter((x) => x !== id);
    onChange(next, labels);
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'grid', gap: 8 }}>
      <button
        ref={triggerRef} type="button"
        onClick={() => setOpen((o) => !o)}
        style={{ ...inputStyle, width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
      >
        <i className="ti ti-search" style={{ color: 'var(--muted)' }} />
        <span style={{ flex: 1, color: 'var(--muted)' }}>{placeholder}</span>
        <i className={`ti ${open ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ color: 'var(--muted)', fontSize: 12 }} />
      </button>
      {valueIds.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {valueIds.map((id) => (
            <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px 4px 10px', borderRadius: 999, background: '#eaf3f5', color: 'var(--brand)', fontSize: 12, fontWeight: 600 }}>
              {labels[id] || `#${id}`}
              <button type="button" onClick={() => remove(id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--brand)', padding: 0, display: 'inline-flex' }} title="Remove">
                <i className="ti ti-close" style={{ fontSize: 12 }} />
              </button>
            </span>
          ))}
        </div>
      )}
      {open && rect && (
        <LocationDropdown
          rect={rect} query={query} setQuery={setQuery}
          items={items} loading={loading} hasMore={hasMore} loadMore={loadMore}
          onPick={toggle} selectedIds={selectedSet} dropRef={dropRef}
          allowClear={false}
        />
      )}
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
