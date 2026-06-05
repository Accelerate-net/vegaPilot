import React from 'react';

// Vignette — radial darkening at the corners. Pulls the viewer's eye to the
// stage centre and adds filmic depth without animating anything.
export default function Vignette({ strength = 0.55 }) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,${strength}) 100%)`,
      }}
    />
  );
}
