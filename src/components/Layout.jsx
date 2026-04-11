import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clearToken } from '../lib/auth';
import { protectedScreens } from '../lib/legacyScreens';

export default function Layout({ children, currentScreen }) {
  const navigate = useNavigate();

  function handleLogout() {
    clearToken();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="brand-kicker">VegaPilot</p>
          <h1>React Migration</h1>
          <p className="brand-copy">Side-by-side rebuild surface for the legacy Angular admin.</p>
        </div>
        <nav className="nav-list" aria-label="Primary">
          {protectedScreens.map((screen) => (
            <NavLink
              key={screen.path}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              to={screen.path}
            >
              <span>{screen.title}</span>
              <small>{screen.legacyHtml}</small>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Current Screen</p>
            <h2>{currentScreen.title}</h2>
          </div>
          <button className="ghost-button" type="button" onClick={handleLogout}>
            Sign Out
          </button>
        </header>
        {children}
      </main>
    </div>
  );
}
