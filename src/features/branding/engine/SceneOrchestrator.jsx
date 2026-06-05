import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SCENES } from '../scenes';
import { TRANSITION } from '../themes/tokens';
import { QualityContext } from './QualityContext';
import { useFpsMonitor } from './useFpsMonitor';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

// SceneOrchestrator — the heart of the engine.
//
// Responsibilities:
//   • Hold an ordered scene list (defaults to the registry).
//   • Auto-advance on each scene's own `duration`, wrapping forever.
//   • Crossfade between scenes — the previous scene stays mounted just long
//     enough to fade out, then unmounts to free resources.
//   • Publish a Quality tier via context so scenes/effects can scale costs.
//
// Memory/CPU shape:
//   • One setTimeout per scene change (cleared on unmount).
//   • One rAF loop in useFpsMonitor (cleared on unmount).
//   • Previous-scene unmount on transition end → no scene leaks across hours.
//   • No scene-internal setInterval in the registry: each scene either uses
//     CSS keyframes (no JS timers) or owns its own one-shot timer cleanup.

export default function SceneOrchestrator({
  theme,
  brand,
  scenes,
  startSceneId,
  onSceneChange,
}) {
  const list = useMemo(() => {
    const base = scenes || SCENES;
    if (!startSceneId) return base;
    const i = base.findIndex((s) => s.id === startSceneId);
    if (i <= 0) return base;
    // Rotate the array so the chosen scene plays first, then continues
    // through the rest. Avoids mutating the source registry.
    return [...base.slice(i), ...base.slice(0, i)];
  }, [scenes, startSceneId]);

  const [idx, setIdx]         = useState(0);
  const [prevIdx, setPrevIdx] = useState(null);

  const reducedMotion = usePrefersReducedMotion();
  const measured      = useFpsMonitor();
  // Reduced motion forces low-quality (smaller particle counts, no grain).
  const quality       = reducedMotion ? 'low' : measured;

  // Auto-advance. Two nested timers: one for the scene duration, one to
  // tear down the previous scene after the crossfade settles.
  useEffect(() => {
    const current = list[idx];
    const sceneDur = current?.duration ?? 11000;
    const advance = setTimeout(() => {
      setPrevIdx(idx);
      setIdx((i) => (i + 1) % list.length);
    }, sceneDur);
    return () => clearTimeout(advance);
  }, [idx, list]);

  useEffect(() => {
    if (prevIdx == null) return undefined;
    const cleanup = setTimeout(() => setPrevIdx(null), TRANSITION.duration + 80);
    return () => clearTimeout(cleanup);
  }, [prevIdx]);

  // Notify external listeners when the active scene changes.
  const onSceneChangeRef = useRef(onSceneChange);
  onSceneChangeRef.current = onSceneChange;
  useEffect(() => {
    onSceneChangeRef.current?.(list[idx]);
  }, [idx, list]);

  const Current  = list[idx]?.Component;
  const Previous = prevIdx != null ? list[prevIdx]?.Component : null;
  const fade = `${TRANSITION.duration}ms ${TRANSITION.easing}`;

  return (
    <QualityContext.Provider value={quality}>
      <div style={{ position: 'absolute', inset: 0 }}>
        {Previous && (
          <div
            key={`prev-${prevIdx}`}
            style={{
              position: 'absolute', inset: 0, willChange: 'opacity',
              animation: `bs-fadeOut ${fade} forwards`,
            }}
          >
            <Previous theme={theme} brand={brand} quality={quality} />
          </div>
        )}
        {Current && (
          <div
            key={`cur-${idx}`}
            style={{
              position: 'absolute', inset: 0, willChange: 'opacity',
              animation: `bs-fadeIn ${fade} both`,
            }}
          >
            <Current theme={theme} brand={brand} quality={quality} />
          </div>
        )}
      </div>
    </QualityContext.Provider>
  );
}
