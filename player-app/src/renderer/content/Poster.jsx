import React from 'react';

export default function Poster({ data }) {
  if (data.image_url) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: `#000 url(${data.image_url}) center/cover no-repeat` }}>
        {(data.title || data.cta) && (
          <div style={{ position: 'absolute', left: 60, bottom: 60, maxWidth: '60%', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', padding: 24, borderRadius: 16 }}>
            {data.title    && <h1 className="kiosk-h1" style={{ textAlign: 'left' }}>{data.title}</h1>}
            {data.subtitle && <p className="kiosk-h2" style={{ textAlign: 'left' }}>{data.subtitle}</p>}
            {data.cta      && <div className="kiosk-cta" style={{ marginTop: 14 }}>{data.cta}</div>}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="kiosk-hero" style={{ background: 'linear-gradient(135deg,#0f172a,#312e81)' }}>
      {data.title    && <h1 className="kiosk-h1">{data.title}</h1>}
      {data.subtitle && <p className="kiosk-h2">{data.subtitle}</p>}
      {data.cta      && <div className="kiosk-cta">{data.cta}</div>}
    </div>
  );
}
