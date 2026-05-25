import React from 'react';

const SAMPLE = [
  { faculty_name: 'MBK',           subject: 'Physics — Rotational Motion', timing: '09:00 – 10:30', classroom: 'Hall A', status: 'now' },
  { faculty_name: 'Priya Sharma',  subject: 'Maths — Probability',         timing: '10:45 – 12:15', classroom: 'Hall A', status: 'next' },
  { faculty_name: 'Anjali Gupta',  subject: 'Biology — Genetics',          timing: '09:30 – 11:00', classroom: 'Hall B', status: 'now' },
  { faculty_name: 'Vikram Singh',  subject: 'Chemistry — Organic',         timing: '11:00 – 12:30', classroom: 'Hall C', status: 'next' },
];

export default function FacultySchedule({ data, screen }) {
  const rows = (data.entries && data.entries.length) ? data.entries : SAMPLE;
  return (
    <div className="kiosk-hero" style={{ background: '#1e1b4b', justifyContent: 'flex-start', paddingTop: 80 }}>
      <h1 className="kiosk-h1">Faculty Today</h1>
      <p className="kiosk-h2" style={{ opacity: 0.6, marginBottom: 30 }}>{screen?.branch_name}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, width: '90%' }}>
        {rows.map((r, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 18, padding: 22, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: 'clamp(20px,2vw,32px)' }}>{r.faculty_name}</strong>
              <span style={{ background: r.status === 'now' ? '#059669' : '#475569', padding: '4px 12px', borderRadius: 999, fontSize: 14, textTransform: 'uppercase', letterSpacing: '.08em' }}>{r.status}</span>
            </div>
            <div style={{ opacity: 0.85, fontSize: 'clamp(16px,1.5vw,22px)' }}>{r.subject}</div>
            <div style={{ opacity: 0.6 }}>{r.timing} · {r.classroom}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
