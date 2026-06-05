import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import BrandingScreen from './BrandingScreen';
import { useBrandingKits } from '../../lib/digitalSignageStore';
import { FONT_STACK } from './themes/tokens';

// /branding-stage — standalone full-screen TV mode. Accepts:
//   ?kit=<id>       Which Branding Kit to play (defaults to first active).
//   ?theme=<id>     Override theme (one of THEMES.id).
//   ?scene=<id>     Start with this scene first (then rotate as usual).
//
// Designed to live behind the existing auth (so the kit list loads), and
// to be opened on a kiosk player full-screen. No chrome, no Layout wrapper.
export default function BrandingStagePage() {
  const [sp]      = useSearchParams();
  const kitId     = sp.get('kit')   || '';
  const themeId   = sp.get('theme') || '';
  const sceneId   = sp.get('scene') || '';

  const kits = useBrandingKits();

  const kit = useMemo(() => {
    if (!kits.length) return null;
    if (kitId) {
      const exact = kits.find((k) => String(k.id) === String(kitId));
      if (exact) return exact;
    }
    return kits.find((k) => k.is_active) || kits[0];
  }, [kits, kitId]);

  if (!kit) {
    return (
      <div
        style={{
          position: 'fixed', inset: 0, background: '#04060d', color: '#fff',
          display: 'grid', placeItems: 'center', fontFamily: FONT_STACK,
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 520, padding: 32 }}>
          <div style={{ fontSize: 12, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 12 }}>
            Branding Stage
          </div>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.018em' }}>
            No Branding Kit available
          </h2>
          <p style={{ marginTop: 14, opacity: 0.7, fontSize: 15, lineHeight: 1.6 }}>
            Create a Branding Kit in <strong>Digital Signage → Branding Kit</strong>,
            then open this URL with <code style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 4 }}>?kit=&lt;id&gt;</code> on the display.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <BrandingScreen kit={kit} themeId={themeId || undefined} startSceneId={sceneId || undefined} />
    </div>
  );
}
