import React from 'react';
import { BRAND_KEYFRAMES } from './keyframes';

// Injects the branding screen's keyframe stylesheet exactly once per
// BrandingScreen mount. React deduplicates identical <style> contents when
// React 19 hoists them to <head>; we add a stable key so the browser keeps
// only one copy across remounts.
export default function BrandStyle() {
  return <style data-bs-style="1" dangerouslySetInnerHTML={{ __html: BRAND_KEYFRAMES }} />;
}
