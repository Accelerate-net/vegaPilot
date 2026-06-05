import React, { useMemo } from 'react';
import BrandStyle        from './engine/BrandStyle';
import SceneOrchestrator from './engine/SceneOrchestrator';
import {
  AmbientGradient, Grain, LightRays, Vignette,
} from './effects';
import {
  brandFromPayload, startSceneFromPayload, themeFromPayload,
} from './themes/themeFromKit';
import { resolveTheme } from './themes/catalog';
import { FONT_STACK } from './themes/tokens';

// BrandingScreen — the public entry. Accepts either:
//
//   <BrandingScreen item={loopItem} />   // loop-item preview path
//   <BrandingScreen kit={kit} themeId={"midnight"} />  // standalone stage
//   <BrandingScreen kit={kit} theme={{ from, to, accent }} />
//   <BrandingScreen brand={…} theme={…} scenes={…} />   // fully custom
//
// Renders three layers stacked back-to-front:
//   1. Base gradient + ambient radial lights + slow conic rays
//   2. SceneOrchestrator (crossfading scenes)
//   3. Vignette + filmic grain
//
// Everything below the orchestrator is intentionally ambient and slow.
export default function BrandingScreen({
  item, kit, brand: brandOverride, theme: themeOverride, themeId,
  scenes, startSceneId,
}) {
  const theme = useMemo(() => {
    if (themeOverride) return resolveTheme(themeOverride);
    if (themeId) return resolveTheme(themeId);
    return themeFromPayload(item, kit);
  }, [item, kit, themeOverride, themeId]);

  const brand = useMemo(
    () => brandOverride || brandFromPayload(item, kit),
    [item, kit, brandOverride],
  );

  const startId = startSceneId || startSceneFromPayload(item);

  const baseGradient = `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`;

  return (
    <div
      data-bs
      style={{
        position: 'absolute', inset: 0, overflow: 'hidden',
        background: baseGradient, color: '#fff',
        fontFamily: FONT_STACK,
      }}
    >
      <BrandStyle />

      {/* Background depth layers. */}
      <AmbientGradient theme={theme} />
      <LightRays accent={theme.accent} />

      {/* Scene layer. */}
      <SceneOrchestrator
        theme={theme}
        brand={brand}
        scenes={scenes}
        startSceneId={startId}
      />

      {/* Foreground polish. */}
      <Vignette />
      <Grain />
    </div>
  );
}
