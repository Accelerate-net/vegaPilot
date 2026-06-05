// Spring presets. Today the scenes use CSS keyframes (no spring solver),
// but the field stays here so when framer-motion is added the call sites
// only change `transition={springs.silk}`. The numbers are tuned against
// critically-damped-ish settles at TV viewing distance.

export const springs = {
  // Entrance: confident, slight overshoot for life.
  silk:  { type: 'spring', stiffness: 160, damping: 24, mass: 1.0 },
  // Taut, immediate — good for headline reveals.
  taut:  { type: 'spring', stiffness: 240, damping: 28, mass: 0.9 },
  // Ambient drift — heavy and slow.
  drift: { type: 'spring', stiffness: 50,  damping: 16, mass: 1.4 },
  // UI controls (would be used for hover/focus).
  ui:    { type: 'spring', stiffness: 320, damping: 30, mass: 0.7 },
};

// Plain tween presets for when a spring would over-emote.
export const tweens = {
  settle:  { duration: 1.4, ease: [0.22, 1, 0.36, 1] },
  reveal:  { duration: 1.1, ease: [0.16, 1, 0.30, 1] },
  cross:   { duration: 1.4, ease: [0.32, 0.72, 0, 1] },
  ambient: { duration: 6.4, ease: [0.65, 0, 0.35, 1], repeat: Infinity, repeatType: 'mirror' },
};
