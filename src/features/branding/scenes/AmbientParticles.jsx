import React from 'react';
import Logo from '../components/Logo';
import { Headline, Tagline } from '../components/Typography';
import ParticleField from '../effects/ParticleField';
import { EASING } from '../themes/tokens';

// AmbientParticles — calm-mode flagship. A depth-tiered particle field
// drifts behind a haloed, lightly floating logo. The headline and tagline
// are deliberately understated so the motion does the talking.
export default function AmbientParticles({ theme, brand }) {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <ParticleField accent={theme.accent} base={48} />
      <div
        style={{
          position: 'absolute', inset: 0, display: 'grid',
          placeItems: 'center', padding: '6%', textAlign: 'center',
        }}
      >
        <div style={{ display: 'grid', placeItems: 'center', gap: 26 }}>
          <Logo
            src={brand.logo}
            name={brand.name}
            size={144}
            halo
            accent={theme.accent}
            animation={`bs-floatY 6000ms ${EASING.io} infinite, bs-breathe 8400ms ${EASING.io} 1500ms infinite`}
          />
          <Headline delay={500}>{brand.name}</Headline>
          {brand.taglines[0] && <Tagline delay={1000}>{brand.taglines[0]}</Tagline>}
        </div>
      </div>
    </div>
  );
}
