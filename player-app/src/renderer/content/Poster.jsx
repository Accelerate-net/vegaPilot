import React from 'react';

// Fullscreen image (a.k.a. "Simple Image"). The image source can arrive as the
// item's top-level `media_url` (linked Bunny asset), or inside `data`
// (`media_url` / `image_url`). A CENTER `NOT_HYDRATED` flag is ignored when we
// already have a usable image URL.
export default function Poster({ item = {}, data = {} }) {
  const imageUrl = item.media_url || data.media_url || data.image_url || null;
  const title = data.title || item.title;

  if (imageUrl) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img
          src={imageUrl}
          alt={title || ''}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
        {(data.title || data.cta || data.subtitle) && (
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
      {title         && <h1 className="kiosk-h1">{title}</h1>}
      {data.subtitle && <p className="kiosk-h2">{data.subtitle}</p>}
      {data.cta      && <div className="kiosk-cta">{data.cta}</div>}
    </div>
  );
}
