import React from 'react';

// Slide-level emergency content (loop-embedded). For the override overlay
// triggered via the socket, see overlays/EmergencyOverlay.jsx.
export default function EmergencySlide({ data }) {
  return (
    <div className="kiosk-emergency" style={{ position: 'absolute' }}>
      <div className="title">{data.title || 'NOTICE'}</div>
      <div className="msg">{data.message || ''}</div>
    </div>
  );
}
