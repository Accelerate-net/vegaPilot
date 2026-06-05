// Public surface of the branding feature. Anything outside this folder
// should import from here, not reach into subfolders, so internals can
// move freely.
export { default as BrandingScreen }      from './BrandingScreen';
export { default as BrandingStagePage }   from './BrandingStagePage';
export { SCENES, SCENE_MAP }              from './scenes';
export { THEMES, THEME_MAP, DEFAULT_THEME, resolveTheme } from './themes/catalog';
export {
  brandFromPayload, themeFromPayload, startSceneFromPayload,
} from './themes/themeFromKit';
