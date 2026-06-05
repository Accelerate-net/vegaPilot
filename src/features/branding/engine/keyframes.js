// Central keyframe stylesheet for the branding screen. Injected ONCE per
// BrandingScreen instance via <BrandStyle/>.
//
// Naming convention: `bs-<verb>` so we never clash with other CSS animations
// on the page. Every keyframe animates only `transform`, `opacity`, or
// `clip-path` (the three properties the compositor can promote off the main
// thread). No animated width/height/filter — those force layout.
//
// `prefers-reduced-motion`: a single media block disables every `bs-*`
// animation, removes clip-path masks, and dims the decorative
// `[data-bs-fx]` overlays so the screen still looks intentional but static.

export const BRAND_KEYFRAMES = `
@keyframes bs-fadeIn      { from { opacity: 0; } to { opacity: 1; } }
@keyframes bs-fadeOut     { from { opacity: 1; } to { opacity: 0; } }
@keyframes bs-settle      { from { opacity: 0; transform: translate3d(0,18px,0) scale(0.985); }
                            to   { opacity: 1; transform: translate3d(0,0,0)    scale(1);     } }
@keyframes bs-breathe     { 0%,100% { transform: scale(1); } 50% { transform: scale(1.016); } }
@keyframes bs-camera      { 0%,100% { transform: translate3d(0,0,0) scale(1); }
                            50%    { transform: translate3d(8px,-6px,0) scale(1.025); } }
@keyframes bs-floatY      { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(0,-6px,0); } }
@keyframes bs-floatXY     { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(8px,-10px,0); } }
@keyframes bs-driftA      { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(20px,-16px,0); } }
@keyframes bs-driftB      { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(-24px,14px,0); } }
@keyframes bs-driftC      { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(14px,22px,0); } }
@keyframes bs-shine       { 0%   { transform: translate3d(-160%,0,0) skewX(-18deg); opacity: 0; }
                            7%   { opacity: 0.85; }
                            22%  { transform: translate3d(220%,0,0)  skewX(-18deg); opacity: 0; }
                            100% { transform: translate3d(220%,0,0)  skewX(-18deg); opacity: 0; } }
@keyframes bs-rays        { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes bs-haloPulse   { 0%,100% { opacity: 0.42; transform: scale(1); } 50% { opacity: 0.62; transform: scale(1.06); } }
@keyframes bs-maskRevealUp { from { clip-path: inset(105% 0 0 0); transform: translate3d(0,16%,0); }
                             to   { clip-path: inset(0 0 0 0);     transform: translate3d(0,0,0);    } }
@keyframes bs-gridPulse   { 0%,100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 0.95; transform: scale(1.03); } }
@keyframes bs-divider     { from { transform: scaleY(0); opacity: 0; } to { transform: scaleY(1); opacity: 1; } }
@keyframes bs-marquee     { 0% { transform: translate3d(0,0,0); } 100% { transform: translate3d(-50%,0,0); } }
@keyframes bs-tagCycle    { 0%      { clip-path: inset(110% 0 0 0); transform: translate3d(0,12%,0); opacity: 0; }
                            10%,68% { clip-path: inset(0 0 0 0);    transform: translate3d(0,0,0);   opacity: 1; }
                            82%,100%{ clip-path: inset(0 0 110% 0); transform: translate3d(0,-12%,0); opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  [data-bs] *, [data-bs] { animation: none !important; transition: none !important; clip-path: none !important; }
  [data-bs-fx] { opacity: 0.25 !important; }
}
`;
