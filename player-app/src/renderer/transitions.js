// Single source of truth for transition IDs supported by the player.
// Keep in sync with the admin-side TRANSITIONS list.
export const TRANSITIONS = ['fade', 'slide', 'zoom', 'blur', 'wipe', 'cinematic'];
export const DEFAULT_TRANSITION = 'fade';
export function safeTransition(t) {
  return TRANSITIONS.includes(t) ? t : DEFAULT_TRANSITION;
}
