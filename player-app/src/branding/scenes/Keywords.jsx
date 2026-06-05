import React, { useMemo } from 'react';
import { EASING } from '../themes/tokens';
import { useQuality } from '../engine/QualityContext';

// Keywords — three depth tiers (far/mid/near) inside one cinematic field.
// Tier 0: small, blurred, dim → reads as background atmosphere.
// Tier 1: mid-size, sharp-ish → reads as supporting copy.
// Tier 2: largest, sharp, occasional accent colour → the words you actually
// catch from across the room.
//
// Composed entrance: each word settles in with a 90ms stagger; once in,
// they take on long, low-amplitude float to keep the field alive.
export default function Keywords({ theme, brand }) {
  const q = useQuality();
  const cap = q === 'low' ? 8 : q === 'medium' ? 12 : 16;

  const source = useMemo(() => {
    if (brand.keywords?.length) return brand.keywords;
    return brand.taglines.flatMap((t) => String(t).split(/\s+/)).filter(Boolean);
  }, [brand.keywords, brand.taglines]);
  const words = source.slice(0, cap);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: '5%' }}>
      <div
        style={{
          width: '88%', maxWidth: 1400, display: 'flex', flexWrap: 'wrap',
          justifyContent: 'center', alignContent: 'center', gap: 20,
        }}
      >
        {words.map((w, i) => {
          const tier = i % 3;
          const size  = tier === 0 ? 'clamp(20px, 2vw,   34px)'
                      : tier === 1 ? 'clamp(30px, 2.8vw, 50px)'
                      :              'clamp(42px, 4.2vw, 76px)';
          const op    = tier === 0 ? 0.42 : tier === 1 ? 0.78 : 1;
          const blur  = tier === 0 ? 'blur(1.4px)' : tier === 1 ? 'blur(0.4px)' : 'none';
          const enter = 420 + i * 95;
          const floatDur = 6 + (i % 5) * 0.45;
          const useAccent = tier === 2 && i % 4 === 0;
          return (
            <span
              key={`${w}-${i}`}
              style={{
                fontSize: size, fontWeight: tier === 2 ? 700 : 500,
                letterSpacing: '-0.014em',
                color: useAccent ? theme.accent : '#fff',
                opacity: op, filter: blur,
                animation:
                  `bs-settle 1200ms ${EASING.out} ${enter}ms both,` +
                  `bs-floatXY ${floatDur}s ${EASING.io} ${enter + 1200}ms infinite`,
                willChange: 'transform, opacity',
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
}
