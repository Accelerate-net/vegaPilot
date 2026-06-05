import React from 'react';
import { useQuality } from '../engine/QualityContext';

// LightRays — a slow-rotating conic-gradient sliver pattern that suggests
// volumetric light. Hidden in low-quality mode (the conic-gradient + blur
// is the most expensive thing in the layer stack).
export default function LightRays({ accent, opacity = 0.18 }) {
  const q = useQuality();
  if (q === 'low') return null;
  return (
    <div
      data-bs-fx
      aria-hidden
      style={{
        position: 'absolute', inset: '-25%', pointerEvents: 'none', opacity,
        background: `conic-gradient(from 0deg at 50% 50%,
                       transparent 0deg,    ${accent}66 8deg,   transparent 18deg,
                       transparent 90deg,   ${accent}33 96deg,  transparent 110deg,
                       transparent 200deg,  ${accent}55 210deg, transparent 220deg,
                       transparent 320deg,  ${accent}44 328deg, transparent 340deg)`,
        filter: q === 'medium' ? 'blur(8px)' : 'blur(14px)',
        animation: 'bs-rays 110s linear infinite',
        willChange: 'transform',
      }}
    />
  );
}
