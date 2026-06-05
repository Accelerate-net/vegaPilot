import { useEffect, useState } from 'react';

// Reactive hook for the user's reduced-motion preference. Returns a boolean
// that flips live when the OS setting changes (some users toggle this from
// the OS Accessibility menu while the display is running).
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => setReduced(e.matches);
    // addEventListener is the modern API; Safari <14 used addListener.
    if (m.addEventListener) {
      m.addEventListener('change', onChange);
      return () => m.removeEventListener('change', onChange);
    }
    m.addListener(onChange);
    return () => m.removeListener(onChange);
  }, []);

  return reduced;
}
