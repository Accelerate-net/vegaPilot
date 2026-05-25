import React from 'react';
import Player from './Player.jsx';

// Lightweight URL parsing — avoids pulling react-router for a one-route app.
function parseScreenCode() {
  // Expected: /player/<SCREEN_CODE>  (or /player → no code)
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts[0] !== 'player') return null;
  return parts[1] ? decodeURIComponent(parts[1]) : null;
}

export default function App() {
  const code = parseScreenCode();
  if (!code) {
    return (
      <div className="kiosk-hero">
        <h1 className="kiosk-h1">Crispr Kiosk Player</h1>
        <p className="kiosk-h2">Open <code>/player/&lt;SCREEN_CODE&gt;</code> to start playback.</p>
      </div>
    );
  }
  return <Player screenCode={code} />;
}
