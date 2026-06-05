// Adapters between the existing data model (loop item payload + Branding Kit)
// and the runtime shapes the branding screen wants.
//
// Loop item payload (set by ItemModal):
//   payload.branding_kit_id
//   payload.branding         = { display_name, logo_url, taglines, keywords }
//   payload.branding_theme   = { id, name, from, to, accent }
//   payload.branding_animation = { id, name }  // starting-scene hint, optional
//
// Standalone stage (the /branding-stage route):
//   pass a kit directly + optional themeId.
//
// Both paths converge on `{ theme, brand, startSceneId }`.

import { resolveTheme } from './catalog';

// ── Animation-preset id → starting scene id ────────────────────────────
// Mapping the legacy "pick one of six animations" UI to the new
// "rotate through all scenes, starting here" engine. Optional — when
// absent, the orchestrator just starts at the first registered scene.
const PRESET_TO_SCENE = {
  logo_reveal:    'hero',
  kinetic_type:   'tagline',
  word_cloud:     'keywords',
  marquee_band:   'split',
  wave_pulse:     'ambient',
  particle_drift: 'ambient',
};

export function themeFromPayload(item, kit) {
  const t = item?.payload?.branding_theme || kit?.theme;
  return resolveTheme(t);
}

export function brandFromPayload(item, kit) {
  const fromPayload = item?.payload?.branding || {};
  const src = kit || fromPayload;
  return {
    name:     src.display_name || fromPayload.display_name || item?.title || 'Brand',
    logo:     src.logo_url     || fromPayload.logo_url     || null,
    taglines: arrayOr(src.taglines, fromPayload.taglines),
    keywords: arrayOr(src.keywords, fromPayload.keywords),
    eyebrow:  src.eyebrow      || fromPayload.eyebrow      || null,
  };
}

export function startSceneFromPayload(item) {
  const id = item?.payload?.branding_animation?.id || item?.payload?.animation_preset;
  return id ? (PRESET_TO_SCENE[id] || null) : null;
}

function arrayOr(a, b) {
  if (Array.isArray(a) && a.length) return a;
  if (Array.isArray(b) && b.length) return b;
  return [];
}
