import { useEffect, useRef, useState } from 'react';

// A single rAF loop measures frame intervals over a rolling window. When the
// average FPS drops below `downgradeAt`, quality steps DOWN one tier (high
// → medium → low). When it recovers above `upgradeAt`, quality steps UP.
// A 2-second cooldown between changes prevents thrash.
//
// Designed for 24h+ runtime: one rAF subscription, one ref-backed buffer,
// no re-subscription on quality changes.

const TIERS = ['low', 'medium', 'high'];

export function useFpsMonitor({
  sampleWindow = 60,
  downgradeAt  = 38,   // <38 fps for `sampleWindow` frames → tier down
  upgradeAt    = 56,   // >56 fps consistently → tier up
  cooldownMs   = 2000,
} = {}) {
  const [quality, setQuality] = useState('high');

  const lastTRef       = useRef(0);
  const bufRef         = useRef([]);
  const lastChangeRef  = useRef(0);
  const stoppedRef     = useRef(false);

  useEffect(() => {
    let rafId = 0;
    function tick(t) {
      if (stoppedRef.current) return;
      const last = lastTRef.current;
      lastTRef.current = t;
      if (last) {
        const dt = t - last;
        const buf = bufRef.current;
        buf.push(dt);
        if (buf.length > sampleWindow) buf.shift();
        if (buf.length === sampleWindow && t - lastChangeRef.current > cooldownMs) {
          let sum = 0;
          for (let i = 0; i < buf.length; i++) sum += buf[i];
          const fps = 1000 / (sum / buf.length);
          if (fps < downgradeAt) {
            setQuality((q) => {
              const i = TIERS.indexOf(q);
              if (i > 0) { lastChangeRef.current = t; return TIERS[i - 1]; }
              return q;
            });
          } else if (fps > upgradeAt) {
            setQuality((q) => {
              const i = TIERS.indexOf(q);
              if (i < TIERS.length - 1) { lastChangeRef.current = t; return TIERS[i + 1]; }
              return q;
            });
          }
        }
      }
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => {
      stoppedRef.current = true;
      cancelAnimationFrame(rafId);
    };
  }, [sampleWindow, downgradeAt, upgradeAt, cooldownMs]);

  return quality;
}
