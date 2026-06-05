import React from 'react';
import Logo from '../components/Logo';
import { Display, Eyebrow, Tagline } from '../components/Typography';
import { EASING } from '../themes/tokens';

// HeroLogo — the calm, definitive opener. A large breathing logo, a small
// "WELCOME" eyebrow, the brand display name with an accent underline that
// draws in left-to-right, and the first tagline. Choreography: the logo
// arrives first (0ms), then the eyebrow (400ms), the name (600ms with
// underline at 1200ms), and finally the tagline (1200ms).
export default function HeroLogo({ theme, brand }) {
  const eyebrow = brand.eyebrow || 'Welcome';
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', padding: '6%' }}>
      <div style={{ display: 'grid', placeItems: 'center', gap: 30 }}>
        <Logo
          src={brand.logo}
          name={brand.name}
          size={188}
          halo
          accent={theme.accent}
          animation={`bs-floatY 6200ms ${EASING.io} infinite, bs-breathe 8200ms ${EASING.io} 1500ms infinite`}
        />
        <Eyebrow delay={420} color={theme.accent}>{eyebrow}</Eyebrow>
        <Display delay={620} underlineAccent={theme.accent}>{brand.name}</Display>
        {brand.taglines[0] && <Tagline delay={1240}>{brand.taglines[0]}</Tagline>}
      </div>
    </div>
  );
}
