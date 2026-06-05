import React, { useMemo } from 'react';
import { useQuality } from '../engine/QualityContext';

// Grain — a barely-visible filmic noise overlay, generated as an inline SVG
// `<feTurbulence>` so we don't ship a binary. Skipped entirely in
// low-quality mode (FPS pressure or reduced-motion) to save GPU compositing
// cost on slow devices.
export default function Grain({ opacity = 0.06 }) {
  const q = useQuality();
  // Build the data URL once. The tile is 200x200 — small enough to repeat
  // without visible seams when the host is at TV viewing distance.
  const noiseUrl = useMemo(
    () => `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
         <filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter>
         <rect width='100%' height='100%' filter='url(#n)' opacity='1'/>
       </svg>`
    )}`,
    []
  );
  if (q === 'low') return null;
  return (
    <div
      data-bs-fx
      aria-hidden
      style={{
        position: 'absolute', inset: -20, pointerEvents: 'none',
        opacity, mixBlendMode: 'overlay',
        backgroundImage: `url("${noiseUrl}")`,
      }}
    />
  );
}
