// Re-exports the easing tokens in the motion domain. Kept as a separate
// module so swapping the animation lib later (framer-motion) is a single
// import change for scene authors.
export { EASING as easings } from '../themes/tokens';
