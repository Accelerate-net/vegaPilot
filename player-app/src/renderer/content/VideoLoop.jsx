import React from 'react';

export default function VideoLoop({ data }) {
  const src = data.url || data.video_url;
  if (!src) {
    return (
      <div className="kiosk-hero" style={{ background: '#020617' }}>
        <h2 className="kiosk-h2" style={{ opacity: 0.6 }}>Video placeholder</h2>
        <h1 className="kiosk-h1">{data.title || 'Silent Video'}</h1>
      </div>
    );
  }
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000' }}>
      <video src={src} poster={data.poster} autoPlay muted loop playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      {data.title && (
        <div style={{ position: 'absolute', left: 40, bottom: 40, background: 'rgba(0,0,0,0.5)', padding: '10px 18px', borderRadius: 999, fontSize: 'clamp(14px,1.4vw,22px)' }}>
          {data.title}
        </div>
      )}
    </div>
  );
}
