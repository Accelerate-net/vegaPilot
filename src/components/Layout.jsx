import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { clearToken } from '../lib/auth';
import { protectedScreens, NAV_GROUPS } from '../lib/legacyScreens';
import { useUser } from '../lib/userStore';
import { canAccess } from '../lib/roles';

export default function Layout({ children, currentScreen }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, prefs, togglePin } = useUser() || {};

  const pinnedPaths = prefs?.pinnedPaths || [];

  // ── Sidebar collapsed state ────────────────────────────────────────
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sb_collapsed') === 'true'
  );

  function toggleSidebar() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem('sb_collapsed', String(next));
      return next;
    });
  }

  // ── Group open/close state ─────────────────────────────────────────
  const activeGroupId = useMemo(() => {
    const s = protectedScreens.find((s) => s.path === location.pathname);
    return s?.group ?? null;
  }, [location.pathname]);

  const [openGroups, setOpenGroups] = useState(() => {
    const s = protectedScreens.find((s) => s.path === location.pathname);
    return s?.group ? { [s.group]: true } : {};
  });

  useEffect(() => {
    if (activeGroupId) {
      setOpenGroups((prev) => ({ ...prev, [activeGroupId]: true }));
    }
  }, [activeGroupId]);

  function toggleGroup(id) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // ── Allowed screens (role-filtered) ───────────────────────────────
  const role = user?.role || 'super_admin';

  const allowedScreens = useMemo(
    () => protectedScreens.filter((s) => canAccess(role, s.path)),
    [role]
  );

  const grouped = useMemo(() =>
    NAV_GROUPS.map((g) => ({
      ...g,
      screens: allowedScreens.filter((s) => s.group === g.id),
    })).filter((g) => g.screens.length > 0),
  [allowedScreens]);

  const pinnedScreens = useMemo(
    () => allowedScreens.filter((s) => pinnedPaths.includes(s.path)),
    [allowedScreens, pinnedPaths]
  );

  // ── Profile popover ───────────────────────────────────────────────
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    if (!showProfileMenu) return;
    function onClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [showProfileMenu]);

  // ── Logout ────────────────────────────────────────────────────────
  function handleLogout() {
    clearToken();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar${collapsed ? ' sidebar-collapsed' : ''}`}>

        {/* ── Logo / collapse toggle ────────────────────────────── */}
        <div
          className="sb-brand"
          role="button"
          tabIndex={0}
          onClick={toggleSidebar}
          onKeyDown={(e) => e.key === 'Enter' && toggleSidebar()}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <img
            src="/assets/icons/favicon.png"
            alt="Crispr"
            className="sb-logo-img"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          {!collapsed && (
            <>
              <div className="sb-brand-text">
                <strong>Crispr</strong>
                <small>Admin Panel</small>
              </div>
              <i className="fa fa-angle-left sb-collapse-arrow" />
            </>
          )}
        </div>

        {/* ── Nav ───────────────────────────────────────────────── */}
        <nav className="sb-nav" aria-label="Primary">

          {/* Pinned section */}
          {pinnedScreens.length > 0 && (
            <div className="sb-group">
              {!collapsed && (
                <div className="sb-group-hdr sb-group-hdr--pinned">
                  <i className="fa fa-thumb-tack sb-icon" />
                  <span className="sb-label">Pinned</span>
                </div>
              )}
              <div className="sb-group-items">
                {pinnedScreens.map((screen) => (
                  <NavItem
                    key={screen.path}
                    screen={screen}
                    collapsed={collapsed}
                    pinned
                    onTogglePin={togglePin}
                  />
                ))}
              </div>
              {!collapsed && <div className="sb-group-divider" />}
            </div>
          )}

          {/* Role-filtered groups */}
          {grouped.map((group) => {
            const isOpen    = collapsed || openGroups[group.id];
            const hasActive = group.screens.some((s) => s.path === location.pathname);

            return (
              <div key={group.id} className="sb-group">
                <button
                  type="button"
                  title={collapsed ? group.label : undefined}
                  className={`sb-group-hdr${hasActive ? ' has-active' : ''}${(isOpen && !collapsed) ? ' open' : ''}`}
                  onClick={() => { if (!collapsed) toggleGroup(group.id); }}
                >
                  <i className={`fa ${group.icon} sb-icon`} />
                  {!collapsed && (
                    <>
                      <span className="sb-label">{group.label}</span>
                      <i className="fa fa-chevron-down sb-chevron" />
                    </>
                  )}
                </button>

                {isOpen && (
                  <div className="sb-group-items">
                    {group.screens.map((screen) => (
                      <NavItem
                        key={screen.path}
                        screen={screen}
                        collapsed={collapsed}
                        pinned={pinnedPaths.includes(screen.path)}
                        onTogglePin={togglePin}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── User profile strip ────────────────────────────────── */}
        <div className="sb-profile-strip" ref={profileRef}>
          <button
            type="button"
            className={`sb-profile-btn${showProfileMenu ? ' open' : ''}`}
            onClick={() => setShowProfileMenu((v) => !v)}
            title={collapsed ? user?.name || 'User' : undefined}
          >
            <div className="sb-avatar">{user?.initials || 'U'}</div>
            {!collapsed && (
              <>
                <div className="sb-user-info">
                  <span className="sb-user-name">{user?.name || 'Admin'}</span>
                  <span
                    className="sb-user-role"
                    style={user?.badgeColor ? { color: user.badgeColor } : undefined}
                  >
                    {user?.roleLabel || 'Super Admin'}
                  </span>
                </div>
                <i className="fa fa-ellipsis-v sb-profile-dots" />
              </>
            )}
          </button>

          {/* Popover menu */}
          {showProfileMenu && (
            <div className="sb-profile-menu">
              <button type="button" className="sb-profile-menu-item"
                onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}>
                <i className="fa fa-user-circle-o" />
                <span>My Profile</span>
              </button>
              <button type="button" className="sb-profile-menu-item"
                onClick={() => { setShowProfileMenu(false); navigate('/change-password'); }}>
                <i className="fa fa-lock" />
                <span>Change Password</span>
              </button>
              <div className="sb-profile-menu-divider" />
              <button type="button" className="sb-profile-menu-item danger"
                onClick={handleLogout}>
                <i className="fa fa-sign-out" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>

      </aside>

      {/* ── Main content ──────────────────────────────────────────── */}
      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Current Screen</p>
            <h2>{currentScreen.title}</h2>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

// ─── Individual nav item with pin button ──────────────────────────────────────
function NavItem({ screen, collapsed, pinned, onTogglePin }) {
  return (
    <div className="sb-item-wrap">
      <NavLink
        to={screen.path}
        title={collapsed ? screen.title : undefined}
        className={({ isActive }) => `sb-item${isActive ? ' active' : ''}`}
      >
        <i className={`fa ${screen.icon} sb-icon`} />
        {!collapsed && <span className="sb-label">{screen.title}</span>}
      </NavLink>
      {!collapsed && (
        <button
          type="button"
          className={`sb-pin-btn${pinned ? ' pinned' : ''}`}
          title={pinned ? 'Unpin' : 'Pin to top'}
          onClick={() => onTogglePin(screen.path)}
        >
          <i className="fa fa-thumb-tack" />
        </button>
      )}
    </div>
  );
}
