import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ToastRegion from '../components/ToastRegion';
import { api } from '../lib/api';
import { allScreens } from '../lib/legacyScreens';
import { canAccess } from '../lib/roles';
import { useUser } from '../lib/userStore';

function getGreeting(date) {
  const h = date.getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  if (h < 21) return 'Good Evening';
  return 'Good Night';
}

function formatHeaderLine(date) {
  const weekday = date.toLocaleDateString('en-IN', { weekday: 'long' });
  const time = date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  const day = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${weekday} ${time} | ${day}`;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, prefs, togglePin, updateUser } = useUser() || {};

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const role = user?.role || 'super_admin';
  const pinnedPaths = prefs?.pinnedPaths || [];

  const displayName = user?.name || 'User';
  const displayRole = (() => {
    const list = Array.isArray(user?.roles) ? user.roles : [];
    if (list.length > 0) {
      return list
        .map((r) =>
          String(r)
            .toLowerCase()
            .split('_')
            .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
            .join(' ')
        )
        .join(', ');
    }
    return user?.roleLabel || '';
  })();

  const pinnedScreens = useMemo(() => {
    return pinnedPaths
      .map((path) => allScreens.find((s) => s.path === path))
      .filter(Boolean)
      .filter((s) => s.protected && canAccess(role, s.path));
  }, [pinnedPaths, role]);

  const suggestedScreens = useMemo(() => {
    const pinned = new Set(pinnedPaths);
    return allScreens
      .filter((s) => s.protected && s.group && canAccess(role, s.path) && !pinned.has(s.path))
      .slice(0, 8);
  }, [pinnedPaths, role]);

  // ── Toasts ──────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  const showToast = useCallback((type, title, message) => {
    const id = toastIdRef.current + 1;
    toastIdRef.current = id;
    setToasts((cur) => [...cur, { id, type, title, message }]);
    window.setTimeout(() => setToasts((cur) => cur.filter((t) => t.id !== id)), 4500);
  }, []);

  // ── Edit Profile modal ─────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  function openEdit() {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setEditPhone(user?.phone || '');
    setEditOpen(true);
  }

  async function saveProfile() {
    if (!editName.trim()) {
      showToast('error', 'Validation', 'Name is required.');
      return;
    }
    setEditSaving(true);
    try {
      const res = await updateUser({
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
      });
      if (res?.ok === false) throw res.error || new Error('Update failed');
      showToast('success', 'Profile Updated', 'Your details have been saved.');
      setEditOpen(false);
    } catch (error) {
      showToast('error', 'Save failed', error?.response?.data?.error?.message || error?.response?.data?.message || error.message || 'Could not save profile.');
    } finally {
      setEditSaving(false);
    }
  }

  // ── Change Password modal ──────────────────────────────────────────
  const [pwOpen, setPwOpen] = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  function openChangePassword() {
    setPwCurrent(''); setPwNew(''); setPwConfirm('');
    setPwOpen(true);
  }

  async function submitChangePassword() {
    if (!pwCurrent || !pwNew || !pwConfirm) {
      showToast('error', 'Validation', 'All password fields are required.');
      return;
    }
    if (pwNew.length < 6) {
      showToast('error', 'Validation', 'New password must be at least 6 characters.');
      return;
    }
    if (pwNew !== pwConfirm) {
      showToast('error', 'Validation', 'New password and confirmation do not match.');
      return;
    }
    setPwSaving(true);
    try {
      await api.post('/user-profile/change-password', {
        currentPassword: pwCurrent,
        newPassword: pwNew,
      });
      showToast('success', 'Password Changed', 'Your password has been updated.');
      setPwOpen(false);
    } catch (error) {
      showToast('error', 'Change failed', error?.response?.data?.error?.message || error?.response?.data?.message || error.message || 'Could not change password.');
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <section className="quiz-listing-page">
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((cur) => cur.filter((t) => t.id !== id))} />

      {/* ── Greeting header ── */}
      <div className="page-header-section">
        <div>
          <h2 style={{ margin: 0 }}>
            <i className="ti ti-sun" style={{ color: '#d97706' }} /> {getGreeting(now)}, {user?.name?.split(' ')[0] || 'there'}!
          </h2>
          <p style={{ margin: '4px 0 0', color: '#52606d' }}>
            {formatHeaderLine(now)}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── Profile Card ── */}
        <div style={{
          background: '#fff',
          border: '1px solid #e6edf0',
          borderRadius: 12,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: '#006073',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 20,
            }}>
              {user?.initials || 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#1f2933' }}>{displayName}</div>
              {displayRole && (
                <div style={{ fontSize: 12, color: user?.badgeColor || '#006073', fontWeight: 600 }}>
                  {displayRole}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ProfileRow icon="ti-email" label="Email" value={user?.email} />
            <ProfileRow icon="ti-mobile" label="Phone" value={user?.phone} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            <button type="button" className="btn btn-default" onClick={openEdit}>
              <i className="ti ti-pencil" /> Edit Profile
            </button>
            <button type="button" className="btn btn-default" onClick={openChangePassword}>
              <i className="ti ti-lock" /> Change Password
            </button>
          </div>
        </div>

        {/* ── Right column: pinned tiles ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16, color: '#1f2933' }}>
              <i className="ti ti-thumb-tack" style={{ color: '#006073' }} /> Your Pinned Pages
            </h3>
            <span style={{ fontSize: 12, color: '#6c757d' }}>
              {pinnedScreens.length} pinned
            </span>
          </div>

          {pinnedScreens.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <i className="ti ti-thumb-tack" />
              <h4>No pinned pages yet</h4>
              <p>Pin frequently used pages from the sidebar to access them quickly here.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 12,
            }}>
              {pinnedScreens.map((s) => (
                <TileCard
                  key={s.path}
                  screen={s}
                  onOpen={() => navigate(s.path)}
                  onUnpin={() => togglePin?.(s.path)}
                />
              ))}
            </div>
          )}

          {suggestedScreens.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '24px 0 12px' }}>
                <h3 style={{ margin: 0, fontSize: 16, color: '#1f2933' }}>
                  <i className="ti ti-star" style={{ color: '#d97706' }} /> Suggested
                </h3>
                <span style={{ fontSize: 12, color: '#6c757d' }}>Pin any to keep them on this dashboard.</span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 12,
              }}>
                {suggestedScreens.map((s) => (
                  <TileCard
                    key={s.path}
                    screen={s}
                    onOpen={() => navigate(s.path)}
                    onPin={() => togglePin?.(s.path)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Edit Profile Modal ── */}
      {editOpen && (
        <div className="crispr-modal-backdrop active" onClick={() => !editSaving && setEditOpen(false)}>
          <div className="crispr-modal-dialog" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="crispr-modal-header" style={{ background: 'linear-gradient(135deg, #006073 0%, #005a6b 100%)' }}>
              <h3><i className="ti ti-pencil" /> Edit Profile</h3>
              <button className="crispr-modal-close" onClick={() => !editSaving && setEditOpen(false)}>
                <i className="ti ti-close" />
              </button>
            </div>
            <div className="crispr-modal-body">
              <div className="batch-form-grid">
                <label className="full-span">
                  <span>Name *</span>
                  <input type="text" className="search-input" value={editName} onChange={(e) => setEditName(e.target.value)} />
                </label>
                <label className="full-span">
                  <span>Email</span>
                  <input type="email" className="search-input" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                </label>
                <label className="full-span">
                  <span>Phone</span>
                  <input type="text" className="search-input" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                </label>
              </div>
            </div>
            <div className="crispr-modal-footer">
              <button type="button" className="btn btn-default" disabled={editSaving} onClick={() => setEditOpen(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" disabled={editSaving} onClick={saveProfile}>
                {editSaving ? (<><i className="ti ti-reload" /> Saving...</>) : (<><i className="ti ti-check" /> Save Changes</>)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Change Password Modal ── */}
      {pwOpen && (
        <div className="crispr-modal-backdrop active" onClick={() => !pwSaving && setPwOpen(false)}>
          <div className="crispr-modal-dialog" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="crispr-modal-header" style={{ background: 'linear-gradient(135deg, #006073 0%, #005a6b 100%)' }}>
              <h3><i className="ti ti-lock" /> Change Password</h3>
              <button className="crispr-modal-close" onClick={() => !pwSaving && setPwOpen(false)}>
                <i className="ti ti-close" />
              </button>
            </div>
            <div className="crispr-modal-body">
              <div className="batch-form-grid">
                <label className="full-span">
                  <span>Current Password *</span>
                  <input type="password" className="search-input" value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} autoComplete="current-password" />
                </label>
                <label className="full-span">
                  <span>New Password *</span>
                  <input type="password" className="search-input" value={pwNew} onChange={(e) => setPwNew(e.target.value)} autoComplete="new-password" />
                </label>
                <label className="full-span">
                  <span>Confirm New Password *</span>
                  <input type="password" className="search-input" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} autoComplete="new-password" />
                </label>
              </div>
            </div>
            <div className="crispr-modal-footer">
              <button type="button" className="btn btn-default" disabled={pwSaving} onClick={() => setPwOpen(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" disabled={pwSaving} onClick={submitChangePassword}>
                {pwSaving ? (<><i className="ti ti-reload" /> Updating...</>) : (<><i className="ti ti-check" /> Update Password</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ProfileRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#52606d' }}>
      <i className={`ti ${icon}`} style={{ color: '#006073', width: 16 }} />
      <span style={{ fontWeight: 600, minWidth: 50 }}>{label}:</span>
      <span style={{ color: value ? '#1f2933' : '#9aa5b1' }}>{value || '—'}</span>
    </div>
  );
}

function TileCard({ screen, onOpen, onUnpin, onPin }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}
      style={{
        background: '#fff',
        border: '1px solid #e6edf0',
        borderRadius: 12,
        padding: 16,
        cursor: 'pointer',
        position: 'relative',
        transition: 'transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minHeight: 110,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#006073';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 96, 115, 0.10)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e6edf0';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: '#eef4f5',
          color: '#006073',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
        }}>
          <i className={`fa ${screen.icon || 'fa-square-o'}`} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1f2933', lineHeight: 1.2 }}>{screen.title}</div>
      </div>
      {screen.summary ? (
        <p style={{ margin: 0, fontSize: 12, color: '#6c757d', lineHeight: 1.4 }}>
          {screen.summary.length > 90 ? `${screen.summary.slice(0, 90)}…` : screen.summary}
        </p>
      ) : null}

      {(onUnpin || onPin) && (
        <button
          type="button"
          title={onUnpin ? 'Unpin' : 'Pin'}
          onClick={(e) => { e.stopPropagation(); (onUnpin || onPin)(); }}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: onUnpin ? '#006073' : '#9aa5b1',
            fontSize: 14,
          }}
        >
          <i className="fa fa-thumb-tack" />
        </button>
      )}
    </div>
  );
}
