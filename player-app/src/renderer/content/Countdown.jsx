import React, { useEffect, useState } from 'react';

function parts(targetIso) {
  const ms = Math.max(0, new Date(targetIso).getTime() - Date.now());
  const d = Math.floor(ms / 86400_000);
  const h = Math.floor((ms % 86400_000) / 3600_000);
  const m = Math.floor((ms % 3600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return { d, h, m, s };
}

export default function Countdown({ data }) {
  const target = data.target;
  const [p, setP] = useState(() => parts(target));
  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setP(parts(target)), 1000);
    return () => clearInterval(t);
  }, [target]);

  if (!target) return <div className="kiosk-hero"><h1 className="kiosk-h1">{data.title || 'Countdown'}</h1></div>;

  const cells = [
    { label: 'Days',    value: String(p.d).padStart(2, '0') },
    { label: 'Hours',   value: String(p.h).padStart(2, '0') },
    { label: 'Minutes', value: String(p.m).padStart(2, '0') },
    { label: 'Seconds', value: String(p.s).padStart(2, '0') },
  ];

  return (
    <div className="kiosk-hero" style={{ background: 'linear-gradient(135deg,#581c87,#0f172a)' }}>
      <p className="kiosk-h2" style={{ opacity: 0.7 }}>{data.subtitle || 'Countdown to'}</p>
      <h1 className="kiosk-h1">{data.title}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 20 }}>
        {cells.map((c) => (
          <div key={c.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 18, padding: 28, minWidth: 140, textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(60px,8vw,140px)', fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{c.value}</div>
            <div style={{ marginTop: 10, fontSize: 'clamp(12px,1.2vw,18px)', textTransform: 'uppercase', letterSpacing: '.16em', opacity: 0.7 }}>{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
