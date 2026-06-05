// Public surface of the branding feature (player-app copy).
// Keep in sync with src/features/branding/index.js in the admin bundle —
// the player intentionally has no BrandingStagePage (admin-only route).
export { default as BrandingScreen } from './BrandingScreen';
export { SCENES, SCENE_MAP }         from './scenes';
export { THEMES, THEME_MAP, DEFAULT_THEME, resolveTheme } from './themes/catalog';
export {
  brandFromPayload, themeFromPayload, startSceneFromPayload,
} from './themes/themeFromKit';
