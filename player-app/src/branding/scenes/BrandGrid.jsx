import React, { useMemo } from 'react';
import { EASING } from '../themes/tokens';
import { useQuality } from '../engine/QualityContext';

// BrandGrid — a luxury-fashion-style repeating wall of brand marks. Each
// cell pulses gently in opacity/scale at staggered delays, with a few
// "accent" cells tinted with the theme accent (every ~11th cell + the
// centre). Grid density scales with the FPS quality tier.
export default function BrandGrid({ theme, brand }) {
  const q = useQuality();
  const cols = q === 'low' ? 5 : q === 'medium' ? 7 : 9;
  const rows = q === 'low' ? 3 : q === 'medium' ? 4 : 5;
  const total = cols * rows;
  const cells = useMemo(() => Array.from({ length: total }, (_, i) => i), [total]);

  const mark = brand.logo ? (
    <img
      src={brand.logo}
      alt=""
      draggable={false}
      style={{
        width: '58%', height: '58%', objectFit: 'contain',
        filter: 'grayscale(1) brightness(1.9) contrast(0.9)',
        opacity: 0.9,
      }}
    />
  ) : (
    <span style={{ fontSize: '1.8vw', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
      {String(brand.name).slice(0, 2).toUpperCase()}
    </span>
  );

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: '4%' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          width: '92%', height: '78%', gap: 'clamp(8px, 0.7vw, 14px)',
        }}
      >
        {cells.map((i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const enter = col * 70 + row * 130;                       // diagonal sweep
          const pulseDur = 6 + ((col + row) % 4) * 0.5;
          const isAccent = i === Math.floor(total / 2) || (i + 1) % 11 === 0;
          return (
            <div
              key={i}
              style={{
                position: 'relative', display: 'grid', placeItems: 'center',
                border: isAccent ? `1px solid ${theme.accent}77` : '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12,
                background: isAccent ? `${theme.accent}1a` : 'rgba(255,255,255,0.03)',
                animation:
                  `bs-settle 1000ms ${EASING.out} ${enter}ms both,` +
                  `bs-gridPulse ${pulseDur}s ${EASING.io} ${enter + 1200}ms infinite`,
                willChange: 'transform, opacity',
              }}
            >
              {mark}
            </div>
          );
        })}
      </div>
    </div>
  );
}
