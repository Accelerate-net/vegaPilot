import React from 'react';
import { EASING } from '../themes/tokens';

// AmbientGradient — two layered radial gradients shifting slowly with the
// theme accent. Sits behind every scene to create a "lit space" rather than
// a flat colour fill. Pure CSS — no rAF.
export default function AmbientGradient({ theme }) {
  const a = theme.accent;
  const f = theme.from;
  const t = theme.to;
  return (
    <>
      {/* Primary key-light: warm accent in the top-left, cool theme in the bottom-right. */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(60% 60% at 30% 25%, ${a}22, transparent 62%),
                       radial-gradient(50% 50% at 75% 80%, ${t}aa, transparent 62%)`,
          animation: `bs-camera 24s ${EASING.io} infinite`,
          willChange: 'transform',
        }}
      />
      {/* Secondary fill-light: subtle, offscreen-edged, blurred for depth. */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: -60, pointerEvents: 'none', opacity: 0.55,
          background: `radial-gradient(40% 40% at 68% 32%, ${f}bb, transparent 60%)`,
          animation: `bs-floatXY 18s ${EASING.io} infinite`,
          filter: 'blur(8px)',
          willChange: 'transform',
        }}
      />
    </>
  );
}
