import React, { useEffect } from 'react';

// Fullscreen override that pre-empts whatever slide is playing.
// Driven by the `emergency:<branch_id>` socket channel. Auto-clears
// when the alert's end_time passes (caller controls the dismiss).

export default function EmergencyOverlay({ alert, onDismiss }) {
  useEffect(() => {
    if (!alert?.end_time) return;
    const ms = new Date(alert.end_time).getTime() - Date.now();
    if (ms <= 0) { onDismiss?.(); return; }
    const t = setTimeout(() => onDismiss?.(), ms);
    return () => clearTimeout(t);
  }, [alert?.end_time, onDismiss]);

  // Optional siren (commented — autoplay-with-sound is blocked in most
  // browsers until a user gesture, which TVs may not provide).
  // if (alert.audio_enabled) { new Audio('/siren.mp3').play().catch(() => {}); }

  return (
    <div className="kiosk-emergency">
      <div className="title">{alert.title || 'EMERGENCY'}</div>
      <div className="msg">{alert.message}</div>
      {alert.ticker && (
        <div className="kiosk-emergency-ticker"><span>{alert.ticker}</span></div>
      )}
    </div>
  );
}
