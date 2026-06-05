import { createContext, useContext } from 'react';

// `'high' | 'medium' | 'low'` — driven by useFpsMonitor and overridden to
// 'low' when prefers-reduced-motion is set. Effects and scenes read this to
// scale particle/cell counts and disable expensive overlays.
export const QualityContext = createContext('high');

export function useQuality() {
  return useContext(QualityContext);
}
