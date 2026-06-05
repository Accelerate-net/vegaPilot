import React from 'react';

// "Simple Text" — a title plus a block of body text. The body can arrive as
// `data.body` (GLOBAL payload rendered verbatim) or on the item's payload.
export default function SimpleText({ item = {}, data = {} }) {
  const title = data.title || item.title;
  const body = data.body ?? item.payload?.body ?? item.body ?? '';
  return (
    <div className="kiosk-hero" style={{ background: 'linear-gradient(135deg,#0f172a,#134e4a)', padding: '6vw', textAlign: 'center' }}>
      {title && <h1 className="kiosk-h1">{title}</h1>}
      {body && (
        <p className="kiosk-h2" style={{ whiteSpace: 'pre-wrap', maxWidth: '80%', lineHeight: 1.5, opacity: 0.92 }}>
          {body}
        </p>
      )}
    </div>
  );
}
