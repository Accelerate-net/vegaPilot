import React from 'react';

const SAMPLE = [
  { class_name: 'JEE Physics — Rotational Motion',     room: 'Hall A', faculty: 'MBK',           start_time: '09:00', end_time: '10:30', status: 'ongoing' },
  { class_name: 'NEET Biology — Genetics',             room: 'Hall B', faculty: 'Anjali Gupta',  start_time: '09:30', end_time: '11:00', status: 'ongoing' },
  { class_name: 'JEE Chemistry — Organic Reactions',   room: 'Hall C', faculty: 'Vikram Singh',  start_time: '11:00', end_time: '12:30', status: 'upcoming' },
];

export default function LiveClassBoard({ data, screen }) {
  const rows = (data.classes && data.classes.length) ? data.classes : SAMPLE;
  return (
    <div className="kiosk-hero" style={{ background: '#0f172a', justifyContent: 'flex-start', paddingTop: 80 }}>
      <h1 className="kiosk-h1" style={{ marginBottom: 8 }}>Live Classes</h1>
      <p className="kiosk-h2" style={{ opacity: 0.6, marginBottom: 40 }}>{screen?.branch_name}</p>
      <table style={{ width: '90%', borderCollapse: 'collapse', fontSize: 'clamp(16px,1.8vw,28px)' }}>
        <thead>
          <tr style={{ opacity: 0.6, textAlign: 'left' }}>
            <th style={{ padding: '12px 0' }}>Class</th>
            <th>Room</th>
            <th>Faculty</th>
            <th>Time</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <td style={{ padding: '14px 0', fontWeight: 700 }}>{r.class_name}</td>
              <td>{r.room}</td>
              <td>{r.faculty}</td>
              <td>{r.start_time} – {r.end_time}</td>
              <td>
                <span style={{ padding: '4px 10px', borderRadius: 999, background: r.status === 'ongoing' ? '#059669' : '#1d4ed8', fontSize: '0.7em' }}>
                  {r.status.toUpperCase()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
