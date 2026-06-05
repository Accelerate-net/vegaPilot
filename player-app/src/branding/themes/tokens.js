// Design tokens for the Animated Branding Screen.
//
// One source of truth for the motion vocabulary: easings, durations,
// type scale, spacing, depth layers, scene/transition timings. Every
// scene and effect imports from this file so the language stays consistent.
//
// Motion philosophy:
//   • Restraint over spectacle. Slow, confident easings (custom cubic-beziers).
//   • One focal point at a time; ambient motion always slower than primary motion.
//   • Cohesive easing: out for entrances, io for ambient oscillation.
//   • Depth via blur/opacity/scale tiers, never via animated drop-shadow.
//   • GPU-only properties: transform, opacity, clip-path.

export const EASING = {
  // Confident, decelerating settle. Use for entrances ("the thing arrives").
  out:    'cubic-bezier(0.22, 1, 0.36, 1)',
  // Symmetric, sine-like. Use for breathing/floating/wave ambient loops.
  io:     'cubic-bezier(0.65, 0, 0.35, 1)',
  // Strong but smooth (Material emphasised) — for headline reveals.
  emph:   'cubic-bezier(0.16, 1, 0.30, 1)',
  // Apple-flavoured smooth — for scene crossfades and camera moves.
  smooth: 'cubic-bezier(0.32, 0.72, 0, 1)',
  // Sharp accelerate-out — for the rare "snap" moment (rare).
  in:     'cubic-bezier(0.50, 0, 0.75, 0)',
};

// Time scale (ms). Anything ambient lives at the long end so the eye relaxes.
export const DURATION = {
  micro:   220,
  short:   480,
  base:    800,
  settle: 1400,
  slow:   2400,
  ambient:6400,
};

// Fluid responsive type ramp. Sized so 1080p reads comfortably from a couch.
export const TYPE = {
  display:  'clamp(64px, 9vw, 168px)',
  headline: 'clamp(40px, 6vw, 96px)',
  title:    'clamp(28px, 3.4vw, 56px)',
  tagline:  'clamp(18px, 1.8vw, 28px)',
  small:    'clamp(12px, 0.9vw, 16px)',
};

export const SPACE = { xs: 8, sm: 14, md: 24, lg: 40, xl: 64, xxl: 112 };

// Stacking order from background to foreground.
export const DEPTH = { sceneFar: 0, sceneMid: 1, sceneNear: 2, ui: 8, top: 12 };

// Per-scene total play time before the orchestrator advances.
export const SCENE_TIME = { fast: 8000, base: 11000, slow: 14000 };

// Crossfade between scenes. Long enough to feel filmic, short enough to not drag.
export const TRANSITION = { duration: 1400, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' };

// System font stack — elegant sans, no webfont dependency.
export const FONT_STACK = '"Inter","SF Pro Display","Helvetica Neue",-apple-system,BlinkMacSystemFont,system-ui,sans-serif';
