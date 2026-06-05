// Theme catalog — six brand colour palettes shared between the loop-editor
// picker and the standalone branding stage. Keep in sync with the
// BRANDING_THEMES constant in src/pages/DigitalSignagePage.jsx until the
// editor migrates to import from here.
//
// A theme is intentionally small: { from, to } drives the base gradient,
// `accent` is reserved for *deliberate* highlights (halos, bullets, the
// occasional underline) and is never used as default text colour.

export const THEMES = [
  { id: 'aurora',   name: 'Aurora',   from: '#7c3aed', to: '#ec4899', accent: '#fde68a' },
  { id: 'midnight', name: 'Midnight', from: '#0f172a', to: '#1e40af', accent: '#60a5fa' },
  { id: 'sunset',   name: 'Sunset',   from: '#f97316', to: '#dc2626', accent: '#fde047' },
  { id: 'forest',   name: 'Forest',   from: '#059669', to: '#0d9488', accent: '#a7f3d0' },
  { id: 'ocean',    name: 'Ocean',    from: '#0ea5e9', to: '#6366f1', accent: '#e0f2fe' },
  { id: 'mono',     name: 'Mono',     from: '#1f2937', to: '#6b7280', accent: '#f8fafc' },
];

export const DEFAULT_THEME = THEMES[1]; // Midnight — safest hero default.

export const THEME_MAP = Object.fromEntries(THEMES.map((t) => [t.id, t]));

export function resolveTheme(idOrObject) {
  if (!idOrObject) return DEFAULT_THEME;
  if (typeof idOrObject === 'string') return THEME_MAP[idOrObject] || DEFAULT_THEME;
  // Object: trust the explicit fields but fall back to the default for any gap.
  return {
    id:     idOrObject.id     || 'custom',
    name:   idOrObject.name   || 'Custom',
    from:   idOrObject.from   || DEFAULT_THEME.from,
    to:     idOrObject.to     || DEFAULT_THEME.to,
    accent: idOrObject.accent || DEFAULT_THEME.accent,
  };
}
