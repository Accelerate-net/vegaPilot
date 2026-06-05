import React from 'react';
import { EASING, FONT_STACK, TYPE } from '../themes/tokens';

// CinematicText — word-by-word mask reveal. Each word lives inside an
// overflow-hidden box so the inner span can slide up from below behind a
// mask. The choreography (delay per word) is what makes this read as
// "typographic", not "fade in text".
export default function CinematicText({
  text = '', delay = 0, perWord = 90, size = TYPE.headline, weight = 600,
  align = 'center', color = '#fff',
}) {
  const words = String(text).split(/\s+/).filter(Boolean);
  return (
    <div
      style={{
        display: 'flex', flexWrap: 'wrap',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        gap: '0.32em', maxWidth: '92%', fontFamily: FONT_STACK,
      }}
    >
      {words.map((w, i) => (
        <span
          key={`${w}-${i}`}
          style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', lineHeight: 1.08 }}
        >
          <span
            style={{
              display: 'inline-block',
              fontSize: size, fontWeight: weight, color,
              letterSpacing: '-0.018em',
              animation: `bs-maskRevealUp 1100ms ${EASING.emph} ${delay + i * perWord}ms both`,
              willChange: 'transform, clip-path',
            }}
          >
            {w}
          </span>
        </span>
      ))}
    </div>
  );
}
