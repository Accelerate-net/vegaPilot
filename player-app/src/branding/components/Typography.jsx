import React from 'react';
import { EASING, DURATION, FONT_STACK, TYPE } from '../themes/tokens';

// Typography primitives — Display / Headline / Title / Tagline / Eyebrow.
// All share the same entrance choreography (`bs-settle` with EASING.out)
// so every scene reads in a consistent rhythm. Tracking and weights are
// tuned for large-screen viewing distance.

const base = {
  fontFamily: FONT_STACK, color: '#fff', margin: 0,
};

function settle(delay) {
  return `bs-settle ${DURATION.settle}ms ${EASING.out} ${delay}ms both`;
}

export function Display({ children, delay = 0, weight = 600, underlineAccent }) {
  return (
    <div
      style={{
        ...base,
        fontSize: TYPE.display, fontWeight: weight,
        letterSpacing: '-0.03em', lineHeight: 1.02,
        textShadow: '0 4px 30px rgba(0,0,0,0.22)',
        animation: settle(delay),
      }}
    >
      {children}
      {underlineAccent && (
        <span
          aria-hidden
          style={{
            display: 'block', width: 72, height: 2,
            background: underlineAccent, marginTop: 24,
            transformOrigin: 'left',
            animation: `bs-divider ${DURATION.base}ms ${EASING.out} ${delay + 600}ms both`,
          }}
        />
      )}
    </div>
  );
}

export function Headline({ children, delay = 0, weight = 600 }) {
  return (
    <div
      style={{
        ...base,
        fontSize: TYPE.headline, fontWeight: weight,
        letterSpacing: '-0.022em', lineHeight: 1.05,
        animation: settle(delay),
      }}
    >
      {children}
    </div>
  );
}

export function Title({ children, delay = 0, weight = 600 }) {
  return (
    <div
      style={{
        ...base,
        fontSize: TYPE.title, fontWeight: weight,
        letterSpacing: '-0.015em', lineHeight: 1.1,
        animation: settle(delay),
      }}
    >
      {children}
    </div>
  );
}

export function Tagline({ children, delay = 0, color }) {
  return (
    <div
      style={{
        ...base,
        fontSize: TYPE.tagline, fontWeight: 400,
        letterSpacing: '0.005em', lineHeight: 1.4,
        color: color || 'rgba(255,255,255,0.78)',
        animation: settle(delay),
      }}
    >
      {children}
    </div>
  );
}

export function Eyebrow({ children, delay = 0, color }) {
  return (
    <div
      style={{
        ...base,
        fontSize: TYPE.small, fontWeight: 600,
        letterSpacing: '0.28em', textTransform: 'uppercase',
        color: color || 'rgba(255,255,255,0.7)',
        animation: settle(delay),
      }}
    >
      {children}
    </div>
  );
}
