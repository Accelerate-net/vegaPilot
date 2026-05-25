import React, { useEffect, useState } from 'react';
import * as socket from '../lib/socket.js';

// Floating bottom-right toast stack for biometric check-ins.
// Subscribes to the per-branch channel; auto-dismisses after 5s.
// Up to 3 visible at a time; older ones drop off.

const MAX = 3;
const AUTODISMISS_MS = 5000;

export default function CheckinOverlay({ branchId }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!branchId) return;
    return socket.subscribe(`checkin:${branchId}`, (evt) => {
      setItems((prev) => [...prev, evt].slice(-MAX));
      setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== evt.id));
      }, AUTODISMISS_MS);
    });
  }, [branchId]);

  if (!items.length) return null;
  return (
    <div className="kiosk-checkin-stack">
      {items.map((it) => (
        <div key={it.id} className="kiosk-checkin">
          <div className="name">WELCOME {it.name?.toUpperCase()}</div>
          <div className="msg">{it.message || 'Checked in successfully'}</div>
        </div>
      ))}
    </div>
  );
}
