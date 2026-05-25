import React, { useEffect, useState } from 'react';

export default function Testimonials({ data }) {
  const entries = data.entries || [];
  const [i, setI] = useState(0);

  useEffect(() => {
    if (entries.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % entries.length), 4000);
    return () => clearInterval(t);
  }, [entries.length]);

  const e = entries[i] || { name: 'Anonymous', quote: 'Great experience.', rating: 5 };
  return (
    <div className="kiosk-hero" style={{ background: 'linear-gradient(135deg,#831843,#581c87)' }}>
      <div style={{ fontSize: 'clamp(28px,3.5vw,56px)', maxWidth: '80%', fontWeight: 500, lineHeight: 1.3 }}>
        "{e.quote}"
      </div>
      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 'clamp(20px,2vw,32px)', fontWeight: 800 }}>{e.name}</div>
        <div style={{ color: '#facc15', marginTop: 6, letterSpacing: 4, fontSize: 28 }}>{'★'.repeat(e.rating || 5)}</div>
      </div>
      {data.qr_url && (
        <div style={{ position: 'absolute', right: 40, bottom: 40, background: '#fff', padding: 12, borderRadius: 8 }}>
          <div style={{ width: 110, height: 110, background: `url(${data.qr_url}) center/contain no-repeat` }} />
          <div style={{ color: '#111', fontSize: 12, textAlign: 'center', marginTop: 6 }}>{data.qr_label || 'Scan to review'}</div>
        </div>
      )}
    </div>
  );
}
