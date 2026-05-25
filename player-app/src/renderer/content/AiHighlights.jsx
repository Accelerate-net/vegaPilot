import React from 'react';

const SAMPLE = [
  { name: 'Sneha Iyer',  metric: '+38%',  caption: 'Biggest jump in mock test scores this week' },
  { name: 'Rohan Verma', metric: '14/14', caption: 'Perfect attendance for the 6th consecutive week' },
  { name: 'Aaditi K.',   metric: 'Top 5', caption: 'Cracked the Physics chapter test with 96%' },
];

export default function AiHighlights({ data, screen }) {
  const entries = (data.entries && data.entries.length) ? data.entries : SAMPLE;
  return (
    <div className="kiosk-hero" style={{ background: 'linear-gradient(135deg,#0c4a6e,#1e1b4b)', justifyContent: 'flex-start', paddingTop: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 28 }}>✨</span>
        <p className="kiosk-h2" style={{ opacity: 0.7, margin: 0 }}>AI-generated highlights · {screen?.branch_name}</p>
      </div>
      <h1 className="kiosk-h1">This Week's Standouts</h1>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, entries.length)}, 1fr)`, gap: 22, marginTop: 30, width: '90%' }}>
        {entries.map((e, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 18, padding: 22 }}>
            <div style={{ fontSize: 'clamp(28px,3.5vw,56px)', fontWeight: 900, color: '#67e8f9' }}>{e.metric}</div>
            <div style={{ marginTop: 8, fontWeight: 700, fontSize: 'clamp(18px,1.8vw,28px)' }}>{e.name}</div>
            <div style={{ opacity: 0.7, marginTop: 6 }}>{e.caption}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
