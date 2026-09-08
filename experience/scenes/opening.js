/* ═══ Scene 1 · The opening ═════════════════════════════════════════════════
   V2 §10 Scene 1. The real portal photograph fills the viewport from the first
   usable paint; a near-black modelled I-section lies across the right as a
   framing member and withdraws into the photographed column.

   The 3D is an obstruction the viewer is standing behind, not a replica of the
   building. It exists to make the photograph feel entered rather than shown.
   ═══════════════════════════════════════════════════════════════════════════ */
import { units, openingToFrame, PORTAL_BLEED_VW } from '../scene-map.js';
import { range, lerp, smooth, mixTitle } from '../interp.js';
import { OPENING, SCENE_TITLES } from '../../content/copy.js';

export function opening(p, vp) {
  const u = units(vp);
  const exit = openingToFrame(vp);

  /* The photograph finishes scaling to 1.00 at .55 (state C). */
  const zoom = lerp(1.08, 1.00, smooth(range(p, 0, 0.55)));

  /* Camera withdrawal: the member narrows and moves back, it never spins.
     12vw wide at 87vw centre -> 7vw at 84vw, then registers onto the
     photographed column between .25 and .55. */
  const widthVw  = lerp(12, 7, smooth(range(p, 0, 0.25)));
  const centreVw = lerp(87, 84, smooth(range(p, 0, 0.25)));

  /* The hero clears before state C, not across it: at p=.55 the member has
     just registered and the composition is the photograph and the steel. A
     headline held at a third of its opacity there reads as a fault, not as a
     transition. */
  const heroOut = range(p, 0.40, 0.54);
  const hero = {
    lines: OPENING.title, xVw: 4, yVh: 58, sizeVw: 9.2, maxVw: 72,
    opacity: 1 - heroOut, role: 'hero'
  };

  /* The next scene's title arrives at .75, already in its Scene 2 position, so
     the boundary needs no move. It starts coming up at .56, right after the
     hero clears, because a named state with the photograph and no type at all
     loses its hierarchy at thumbnail size. */
  const sceneTitle = { ...exit.title, opacity: range(p, 0.56, 0.75) };

  return {
    planes: [{ key: 'portalFrame', box: u.full(),
               fit: { zoom, bleed: u.vw(PORTAL_BLEED_VW) }, z: 10 }],

    /* The traced real column takes over from the model between .55 and .75.
       §11: at model opacity below .15 the cutout is already fully present. */
    foreground: { asset: 'portalColumn', opacity: range(p, 0.52, 0.72) },

    geometry: {
      visible: p < 0.78,
      p: range(p, 0, 0.55),
      opacity: 1 - range(p, 0.55, 0.75),
      widthVw, centreVw,
      registered: range(p, 0.25, 0.55)
    },

    title: p < 0.56 ? hero : mixTitle(null, sceneTitle, 1),
    /* The caption outlasts the hero: it is what holds state C together while
       the scene title is still arriving. */
    label: { text: OPENING.context, xVw: 4, yVh: 88, opacity: 1 - range(p, 0.60, 0.72) },
    navTheme: 'light',
    subject: null            // §14: no subject label until Scene 1 is behind us
  };
}
