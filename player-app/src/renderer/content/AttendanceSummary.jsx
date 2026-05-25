import React from 'react';

export default function AttendanceSummary({ data, screen }) {
  const stats = [
    { label: 'Present',     value: data.present ?? 0, color: '#10b981' },
    { label: 'Absent',      value: data.absent ?? 0,  color: '#ef4444' },
    { label: 'Late entries',value: data.late ?? 0,    color: '#f59e0b' },
    { label: 'Total',       value: data.total ?? 0,   color: '#a78bfa' },
  ];
  return (
    <div className="kiosk-hero" style={{ background: 'linear-gradient(135deg,#064e3b,#022c22)' }}>
      <p className="kiosk-h2" style={{ opacity: 0.7 }}>{screen?.branch_name || 'Branch'} · Live Attendance</p>
      <h1 className="kiosk-h1">Today at a Glance</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, marginTop: 12 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(48px,7vw,120px)', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ marginTop: 8, fontSize: 'clamp(14px,1.5vw,22px)', textTransform: 'uppercase', letterSpacing: '.1em', opacity: 0.7 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
