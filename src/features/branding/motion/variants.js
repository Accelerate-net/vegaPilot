// Declarative motion variants used by scene components.
//
// Today they're consumed by scenes that build inline `animation` strings.
// When framer-motion is wired in, each variant becomes a `variants={…}`
// object on `motion.div` with `initial="from"` `animate="to"` `exit="exit"`.
// Keeping the shape stable means scenes don't need to change.

import { EASING, DURATION } from '../themes/tokens';

export const sceneVariants = {
  // The orchestrator drives crossfades; scenes themselves animate IN their
  // own contents from these states.
  enter:  { opacity: 1, y: 0,   scale: 1,   transition: { duration: DURATION.settle / 1000, ease: cubic(EASING.smooth) } },
  exit:   { opacity: 0, y: -8,  scale: 1.01, transition: { duration: DURATION.short  / 1000, ease: cubic(EASING.smooth) } },
  hidden: { opacity: 0, y: 18,  scale: 0.985 },
};

export const settleVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  enter:  { opacity: 1, y: 0,  scale: 1,    transition: { duration: DURATION.settle / 1000, ease: cubic(EASING.out) } },
};

export const wordRevealVariants = {
  hidden: { y: '110%' },
  enter:  (i = 0) => ({ y: '0%', transition: { delay: 0.12 + i * 0.09, duration: 1.1, ease: cubic(EASING.emph) } }),
};

// Parse `cubic-bezier(a,b,c,d)` strings into the 4-number array some libs want.
function cubic(s) {
  const m = /cubic-bezier\(([-0-9.\s,]+)\)/.exec(s);
  return m ? m[1].split(',').map((x) => Number(x.trim())) : [0.22, 1, 0.36, 1];
}
