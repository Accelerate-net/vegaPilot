import React from 'react';
import { EASING, DURATION } from '../themes/tokens';

// Logo — the brand's visual anchor. Composes:
//   • a one-shot entrance (`bs-settle`)
//   • any caller-supplied ambient animation (float / breathe / etc.)
//   • an optional accent halo behind the mark
//
// Falls back to an initials tile when no logo URL is provided so every
// scene still has something centred to look at.
export default function Logo({
  src, name = 'Brand', size = 120,
  halo = false, accent, animation,
}) {
  const entrance = `bs-settle ${DURATION.settle}ms ${EASING.out} both`;
  const composed = animation ? `${entrance}, ${animation}` : entrance;

  const inner = src
    ? (
      <img
        src={src}
        alt={name}
        draggable={false}
        style={{
          width: size, height: size, objectFit: 'contain', userSelect: 'none',
          filter: 'drop-shadow(0 14px 36px rgba(0,0,0,0.32))',
          animation: composed, willChange: 'transform, opacity',
        }}
      />
    ) : (
      <div
        style={{
          width: size, height: size, borderRadius: size * 0.18,
          background: 'rgba(255,255,255,0.10)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.4, fontWeight: 700, color: '#fff',
          letterSpacing: '-0.02em',
          animation: composed, willChange: 'transform, opacity',
        }}
      >
        {String(name).slice(0, 2).toUpperCase()}
      </div>
    );

  if (!halo) return inner;
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <span
        data-bs-fx
        aria-hidden
        style={{
          position: 'absolute', inset: -size * 0.4, borderRadius: '50%',
          pointerEvents: 'none',
          background: `radial-gradient(circle, ${accent}55 0%, ${accent}1f 38%, transparent 65%)`,
          animation: `bs-haloPulse 7s ${EASING.io} 600ms infinite`,
          filter: 'blur(10px)', willChange: 'transform, opacity',
        }}
      />
      {inner}
    </div>
  );
}
