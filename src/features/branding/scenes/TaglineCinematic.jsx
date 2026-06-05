import React, { useEffect, useState } from 'react';
import CinematicText from '../components/CinematicText';
import { Eyebrow } from '../components/Typography';
import { TYPE, EASING } from '../themes/tokens';

// TaglineCinematic — kinetic typography centrepiece. Cycles through every
// tagline with a word-by-word mask reveal. Brand-name eyebrow above, accent
// hairline below, deliberately minimal background motion (the ambient
// gradient layer underneath does the rest).
//
// Owns one setTimeout for the line cycle, cleared on unmount.
export default function TaglineCinematic({ theme, brand }) {
  const lines = brand.taglines.length ? brand.taglines : [brand.name];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (lines.length <= 1) return undefined;
    // Each line gets enough time to read: words * 90ms reveal + 2.6s hold.
    const t = setTimeout(() => setIdx((i) => (i + 1) % lines.length), 4200);
    return () => clearTimeout(t);
  }, [idx, lines.length]);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: '6%', textAlign: 'center' }}>
      <div style={{ display: 'grid', justifyItems: 'center', gap: 30 }}>
        <Eyebrow color={theme.accent}>{brand.name}</Eyebrow>
        {/* `key={idx}` remounts the reveal each cycle so the mask animation re-runs. */}
        <div key={idx} style={{ display: 'flex', justifyContent: 'center' }}>
          <CinematicText text={lines[idx]} size={TYPE.headline} perWord={110} delay={120} />
        </div>
        <span
          aria-hidden
          style={{
            width: 36, height: 2, background: theme.accent, opacity: 0.85,
            animation: `bs-divider 900ms ${EASING.out} 700ms both`,
            transformOrigin: 'left',
          }}
        />
      </div>
    </div>
  );
}
