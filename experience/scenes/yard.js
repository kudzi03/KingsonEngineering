/* ═══ Scene 5 · In the yard ═════════════════════════════════════════════════
   V2 §10 Scene 5 and §12. The crane source is portrait, so a single full-width
   cover would amputate it and a single contained portrait would bring back the
   emptiness V2 exists to kill. The 58/42 dual-scale composition is therefore
   mandatory at both desktop sizes: one photograph, two crops, no gutter.

   No capacity, no ownership, no "we lift what we build" (§15).
   ═══════════════════════════════════════════════════════════════════════════ */
import { units, cutToYard, yardToViews, EDGE } from '../scene-map.js';
import { range, lerp, smooth, mixFit } from '../interp.js';
import { SCENE_TITLES, SCENE_LABELS } from '../../content/copy.js';
import { ASSETS } from '../../content/assets.js';

export function yard(p, vp) {
  const u = units(vp);
  const entry = cutToYard(vp);
  const exit = yardToViews(vp);

  /* ── expansion: the crane displaces both other planes in the first 30% ── */
  const grow = smooth(range(p, 0, 0.30));
  const mainRight = lerp(EDGE.d, EDGE.c, grow);        // 76vw -> 58vw
  const mainLeft = lerp(EDGE.d, 0, grow);              // 76vw -> 0

  /* ── the final expansion to a full field, re-cropping as it goes ── */
  const takeover = range(p, 0.86, 1);
  const rightEdge = lerp(mainRight, 100, smooth(takeover));

  const mainFit = mixFit(
    { zoom: 1, focal: ASSETS.crane.focal, window: ASSETS.crane.window },
    exit.planes[0].fit,
    smooth(takeover)
  );

  const planes = [];

  /* The companion field is a larger crop of the SAME source — never a second
     crane, never invented scenery. It is displaced by the takeover.

     At p=0 it is NOT yet the closer crop: it is the incoming 24vw strip that
     Scene 4 already has on screen, at Scene 4's own fit. The closer crop is
     reached as the strip widens, over the same 0–.30 the composition takes to
     become the dual-scale field. Starting it already at 1.85 was a break in
     the shared boundary — the same band drawn at two different scales on the
     two sides of one join. */
  const detailFit = mixFit(
    entry.planes[2].fit,
    { zoom: ASSETS.crane.detail.zoom, focal: ASSETS.crane.detail.focal },
    grow
  );
  if (takeover < 1) {
    planes.push({
      key: 'craneDetail', asset: 'crane',
      box: { x: u.vw(rightEdge), y: 0, w: Math.max(0, vp.w - u.vw(rightEdge)), h: vp.h },
      fit: detailFit,
      z: 21, opacity: 1 - range(p, 0.92, 1)
    });
  }

  planes.push({
    key: 'crane',
    box: { x: u.vw(mainLeft), y: 0, w: u.vw(rightEdge - mainLeft), h: vp.h },
    fit: mainFit, z: 22
  });

  /* Underneath, until the expansion has covered them. */
  if (grow < 1) {
    planes.push({ key: 'laserMachine', box: entry.planes[1].box, fit: { zoom: 1 }, z: 11 });
    planes.push({ key: 'cuttingHead', box: entry.planes[0].box, fit: entry.planes[0].fit, z: 10 });
  }

  const titleOn = range(p, 0.38, 0.50) * (1 - range(p, 0.86, 0.94));

  return {
    planes,
    edge: null,
    /* The traced body/boom sits above the word and conceals 10–18% of it, then
       reunites with the main image by .86. */
    foreground: { asset: 'craneBody', opacity: titleOn > 0 ? 1 - range(p, 0.80, 0.86) : 0 },
    geometry: { visible: false, opacity: 0, p: 1 },
    title: {
      lines: SCENE_TITLES.yard, xVw: 4, yVh: 63, sizeVw: 9, maxVw: 80, capPx: 172,
      opacity: titleOn, occludeBy: 'craneBody'
    },
    label: {
      text: SCENE_LABELS.yard, xVw: 4, yVh: 91,
      opacity: range(p, 0.74, 0.82) * (1 - range(p, 0.86, 0.92))
    },
    navTheme: 'light',
    subject: p < 0.8 ? 'Cranage' : 'Selected views'
  };
}
