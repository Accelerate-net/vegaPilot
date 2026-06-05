import React, { useMemo } from 'react';
import { EASING } from '../themes/tokens';
import { useQuality } from '../engine/QualityContext';

// ParticleField — depth-tiered particle layer used by AmbientParticles and
// the BrandingScreen ambient background. Three tiers (far/mid/near) with
// different sizes, blur, opacity, drift amplitude and durations. A few
// near-tier particles use the theme accent with a soft static glow.
//
// All animation is CSS keyframes; the count scales with the FPS quality
// tier. The particle array is computed once per (count, accent) pair and
// memoised so React doesn't re-allocate on parent renders.
export default function ParticleField({ accent, base = 36 }) {
  const q = useQuality();
  const factor = q === 'low' ? 0.35 : q === 'medium' ? 0.7 : 1;
  const N = Math.max(8, Math.round(base * factor));

  const parts = useMemo(() => {
    const out = new Array(N);
    for (let i = 0; i < N; i++) {
      const tier = i % 3; // 0 far · 1 mid · 2 near
      const baseSize = tier === 0 ? 2 : tier === 1 ? 3 : 5;
      out[i] = {
        top:  (i * 53) % 100,
        left: (i * 97) % 100,
        size: baseSize + (i % 3),
        op:   tier === 0 ? 0.28 : tier === 1 ? 0.55 : 0.85,
        blur: tier === 0 ? 1.4  : tier === 1 ? 0.5  : 0,
        dur:  tier === 0 ? 11 + (i % 4) : tier === 1 ? 8 + (i % 4) : 5 + (i % 3),
        name: ['bs-driftA', 'bs-driftB', 'bs-driftC'][i % 3],
        delay: -((i % 9) * 0.4),
        accent: tier === 2 && i % 4 === 0,
      };
    }
    return out;
  }, [N]);

  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {parts.map((p, i) => (
        <span
          key={i}
          style={{
            position: 'absolute', top: `${p.top}%`, left: `${p.left}%`,
            width: p.size, height: p.size, borderRadius: 999,
            background: p.accent ? accent : 'rgba(255,255,255,0.85)',
            opacity: p.op,
            filter: p.blur ? `blur(${p.blur}px)` : 'none',
            boxShadow: p.accent ? `0 0 ${p.size * 2.4}px ${accent}88` : 'none',
            animation: `${p.name} ${p.dur}s ${EASING.io} ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
