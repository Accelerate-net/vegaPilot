import React, { useEffect, useMemo, useState } from 'react';
import Logo from '../components/Logo';
import { Display, Eyebrow, Title } from '../components/Typography';
import { EASING } from '../themes/tokens';

// SplitPanel — Apple keynote "two columns + accent divider" layout.
// Left: logo + brand name. Right: rotating tagline/keyword in large title
// type. The vertical divider draws in via scaleY and uses a soft accent
// gradient that fades out at both ends (no hard edges).
export default function SplitPanel({ theme, brand }) {
  const items = useMemo(
    () => [...(brand.taglines || []), ...(brand.keywords || [])].filter(Boolean),
    [brand.taglines, brand.keywords],
  );
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return undefined;
    const t = setTimeout(() => setIdx((i) => (i + 1) % items.length), 3600);
    return () => clearTimeout(t);
  }, [idx, items.length]);

  const current = items[idx] || brand.name;

  return (
    <div
      style={{
        position: 'absolute', inset: 0, display: 'grid',
        gridTemplateColumns: '1fr 2px 1fr', alignItems: 'center', padding: '7%',
      }}
    >
      <div style={{ display: 'grid', justifyItems: 'start', gap: 30 }}>
        <Logo
          src={brand.logo}
          name={brand.name}
          size={148}
          halo
          accent={theme.accent}
          animation={`bs-floatY 6500ms ${EASING.io} infinite, bs-breathe 8000ms ${EASING.io} 1500ms infinite`}
        />
        <Display delay={600} weight={600}>{brand.name}</Display>
      </div>

      {/* Divider */}
      <div
        aria-hidden
        style={{
          width: 2, height: '64%', justifySelf: 'center',
          background: `linear-gradient(180deg, transparent, ${theme.accent}, transparent)`,
          transformOrigin: 'center',
          animation: `bs-divider 1400ms ${EASING.out} 700ms both`,
        }}
      />

      <div style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
        <Eyebrow color={theme.accent}>Our values</Eyebrow>
        {/* key={idx} forces a settle each rotation. minHeight stops layout shift. */}
        <div key={idx} style={{ minHeight: '5.6em', display: 'grid', alignContent: 'start' }}>
          <Title weight={600}>{current}</Title>
        </div>
      </div>
    </div>
  );
}
