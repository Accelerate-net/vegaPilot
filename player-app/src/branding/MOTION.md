# Animated Branding — Motion Philosophy

> "Quiet, confident, inevitable." — what every cycle of the screen
> should feel like.

## North-star

This screen lives on a reception TV. It's seen at a distance for hours.
The bar is **calm motion** — not "look at this animation!" but
"this place feels intentional."

## Hard rules

- **GPU only.** Animate `transform`, `opacity`, and `clip-path`. Nothing else.
- **No JS rAF per scene.** Scenes use CSS keyframes. The engine owns the
  one rAF loop (`useFpsMonitor`) and the per-scene `setTimeout` for
  advance. `setInterval` is banned.
- **No animated `box-shadow`, `filter`, `width`, `height`.** Static is fine.
- **Always seamless.** Marquee loops at `-50%` over a duplicated track.
  Cross-scene transitions are `fadeOut` over `fadeIn` with no snap.
- **One focal point at a time.** Ambient motion is always slower than
  primary motion (≥ 5×).
- **Use the accent sparingly.** Bullets, halo, underline. Never as default
  text colour.

## Easing & timing

- `EASING.out` — confident decelerating entrances.
- `EASING.io` — symmetric ambient oscillation (breath, float, drift).
- `EASING.emph` — emphasised word reveals.
- `EASING.smooth` — Apple-flavoured crossfade ease.

| Where | Duration |
| --- | --- |
| Settle entrance | 1.4 s |
| Word reveal stagger | 90–110 ms per word |
| Ambient loops | 5–11 s per cycle |
| Scene duration | 11–14 s |
| Scene crossfade | 1.4 s |

## Quality tiers

`QualityContext` carries `'high' \| 'medium' \| 'low'`. Driven by:

- `prefers-reduced-motion` → forces `'low'`
- `useFpsMonitor` rolling 60-frame average:
  - downgrade when sustained FPS < 38
  - upgrade when sustained FPS > 56
  - 2 s cooldown between changes

In `'low'`:
- `Grain` & `LightRays` unmount entirely
- `ParticleField` count is multiplied by 0.35
- `BrandGrid` collapses to 5×3
- `Keywords` caps at 8 words

## How to add a scene

1. Create `scenes/MyScene.jsx`. Accept `{ theme, brand, quality }`.
2. Use the primitives in `components/` (Logo, Typography, CinematicText).
3. Reach for the `effects/` library before writing new ones.
4. Add an entry to `scenes/index.js`:
   ```js
   { id: 'myscene', label: 'My Scene', Component: MyScene, duration: SCENE_TIME.base }
   ```

That's the entire integration. The orchestrator picks it up automatically.

## Future framer-motion swap

The motion lib choice is isolated to `motion/`. To switch:

1. `npm install framer-motion`
2. Replace inline `animation:` strings in scenes with `motion.div`
   variants — the variant shapes in `motion/variants.js` are already
   framer-motion-shaped.
3. The orchestrator stays as-is, or you wrap with `<AnimatePresence>` for
   layout-aware crossfades.
