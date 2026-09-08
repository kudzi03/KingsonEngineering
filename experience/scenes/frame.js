/* ═══ Scene 2 · Inside the frame ════════════════════════════════════════════
   V2 §10 Scene 2. A pinned full-screen still, then the photographed roof
   direction becomes the aperture that opens the next image.

   This is the ONLY scene with depth separation (§8): the traced near column
   travels 2.4vw against the background's 0.8vw, in opposite directions.
   Everything else on the page is flat photography.
   ═══════════════════════════════════════════════════════════════════════════ */
import { units, openingToFrame, frameToRoof, PORTAL_BLEED_VW } from '../scene-map.js';
import { range, lerp, smooth, mixPoly } from '../interp.js';

export function frame(p, vp, opts = {}) {
  const u = units(vp);
  const entry = openingToFrame(vp);
  const exit = frameToRoof(vp);

  const parallax = opts.flat ? 0 : smooth(range(p, 0.12, 0.40));
  const bgShift = -u.vw(0.8) * parallax;
  const fgShift =  u.vw(2.4) * parallax;
  const bleed = u.vw(PORTAL_BLEED_VW);

  /* The aperture is not drawn before .62 — it appears along the photographed
     upper structural direction and grows into the shared boundary polygon. */
  const openT = range(p, 0.62, 1);
  const narrow = u.poly([[9, 0], [14, 0], [100, 57], [100, 62]]);
  const wide = exit.planes[0].clip;
  const clip = openT > 0 ? mixPoly(narrow, wide, smooth(openT)) : null;

  const planes = [];
  if (openT > 0) {
    planes.push({ ...exit.planes[0], clip });
  }
  planes.push({ key: 'portalFrame', box: u.full(), fit: { zoom: 1, bleed }, z: 10, dx: bgShift });

  return {
    planes,
    /* The cutout merges back into the portal field by .85 so the wipe never
       runs over inconsistent parallax. */
    foreground: { asset: 'portalColumn', opacity: 1 - range(p, 0.72, 0.85), dx: fgShift },
    geometry: { visible: false, opacity: 0, p: 1 },
    title: { ...entry.title, opacity: 1 - range(p, 0.55, 0.65) },
    label: null,
    navTheme: 'light',
    subject: p < 0.6 ? 'Structural steel' : 'Roof steel'
  };
}
