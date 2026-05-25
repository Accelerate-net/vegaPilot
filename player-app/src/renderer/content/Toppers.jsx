import React from 'react';

export default function Toppers({ data }) {
  const entries = data.entries || [];
  return (
    <div className="kiosk-hero" style={{ background: 'linear-gradient(135deg,#78350f,#000)', justifyContent: 'flex-start', paddingTop: 60 }}>
      <h1 className="kiosk-h1" style={{ background: 'linear-gradient(90deg,#fde68a,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Hall of Fame
      </h1>
      <p className="kiosk-h2" style={{ opacity: 0.7, marginBottom: 24 }}>Our toppers are why we exist</p>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, Math.max(1, entries.length))}, 1fr)`, gap: 24, width: '90%' }}>
        {entries.map((t, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 18, padding: 28, textAlign: 'center', border: '1px solid rgba(251,191,36,0.3)' }}>
            <div style={{ fontSize: 'clamp(28px,3vw,48px)', fontWeight: 900, color: '#fbbf24' }}>{t.rank}</div>
            <div style={{ fontSize: 'clamp(20px,2vw,32px)', fontWeight: 700, marginTop: 8 }}>{t.name}</div>
            <div style={{ opacity: 0.7, marginTop: 6 }}>{t.exam}</div>
            {t.college && <div style={{ marginTop: 10, fontSize: 18, opacity: 0.85 }}>→ {t.college}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
