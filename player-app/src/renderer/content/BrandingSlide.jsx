import React, { useMemo } from 'react';
import { BrandingScreen } from '../../branding';

// BrandingSlide — the player's BRANDING content-type renderer.
//
// The player API hydrates the saved loop item payload onto `data` (see the
// signage contract §6.1 — for GLOBAL types `data` IS the verbatim payload
// plus any media_url). The admin's BrandingScreen reads from `item.payload`,
// so we synthesise an item-shape from `(item, data)` and let the same
// adapters (themeFromPayload / brandFromPayload / startSceneFromPayload)
// produce the runtime theme + kit + starting scene.
//
// This keeps a single source of truth for the engine — the admin's
// "Preview In Action" and the kiosk player render identically.
export default function BrandingSlide({ item, data }) {
  const synthetic = useMemo(
    () => ({ payload: data || item?.payload || {}, title: item?.title }),
    [item, data],
  );
  return (
    <div className="kiosk-hero" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <BrandingScreen item={synthetic} />
    </div>
  );
}
