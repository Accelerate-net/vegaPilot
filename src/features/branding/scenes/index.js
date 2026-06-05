import HeroLogo         from './HeroLogo';
import Keywords          from './Keywords';
import TaglineCinematic  from './TaglineCinematic';
import BrandGrid         from './BrandGrid';
import AmbientParticles  from './AmbientParticles';
import SplitPanel        from './SplitPanel';
import { SCENE_TIME }    from '../themes/tokens';

// Scene registry. The orchestrator walks this in order and loops. Future
// scenes are added by dropping a file into this folder and appending an
// entry here — no other code in the engine needs to change.
//
// Each entry:
//   id        — stable key (also used by ?scene=<id> on /branding-stage)
//   label     — human-readable name (used for debug overlays / pickers)
//   Component — React component receiving { theme, brand, quality }
//   duration  — how long this scene plays before the orchestrator advances
export const SCENES = [
  { id: 'hero',     label: 'Hero Logo',         Component: HeroLogo,         duration: SCENE_TIME.base },
  { id: 'keywords', label: 'Keywords',          Component: Keywords,         duration: SCENE_TIME.base },
  { id: 'tagline',  label: 'Tagline Cinematic', Component: TaglineCinematic, duration: SCENE_TIME.slow },
  { id: 'grid',     label: 'Brand Grid',        Component: BrandGrid,        duration: SCENE_TIME.base },
  { id: 'ambient',  label: 'Ambient Particles', Component: AmbientParticles, duration: SCENE_TIME.base },
  { id: 'split',    label: 'Split Panel',       Component: SplitPanel,       duration: SCENE_TIME.slow },
];

export const SCENE_MAP = Object.fromEntries(SCENES.map((s) => [s.id, s]));
