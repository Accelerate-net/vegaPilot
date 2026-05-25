import React from 'react';

export default function BrandingSlide({ data }) {
  return (
    <div className="kiosk-hero" style={{ background: 'radial-gradient(ellipse at center, #0f172a 0%, #000 75%)' }}>
      <div style={{ fontSize: 'clamp(40px,7vw,128px)', fontWeight: 900, letterSpacing: '-.04em', background: 'linear-gradient(90deg,#67e8f9,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        {data.title || 'Crispr Learning'}
      </div>
      {data.subtitle && <p className="kiosk-h2">{data.subtitle}</p>}
      {data.cta && <div className="kiosk-cta">{data.cta}</div>}
    </div>
  );
}
