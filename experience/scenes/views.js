/* ═══ Scene 6 · Selected views ══════════════════════════════════════════════
   V2 §10 Scene 6. Three contiguous 100vw photographic planes — crane, portal,
   roof-frame — traversed one field at a time. Not cards, not thumbnails, not
   masonry, and no invented project titles: the caption says what the picture
   is and nothing else.

   Traverse .00–.34 · hold .34–.50 · traverse .50–.70 · hold .70–.82 ·
   return to the portal .82–.90 · release into the brief .90–1.
   ═══════════════════════════════════════════════════════════════════════════ */
import { units, yardToViews, viewsToBrief } from '../scene-map.js';
import { range, lerp, smooth, mixBox, mixFit } from '../interp.js';
import { VIEWS } from '../../content/copy.js';

export function views(p, vp) {
  const u = units(vp);
  const entry = yardToViews(vp);
  const exit = viewsToBrief(vp);

  /* Two traversals with stable stops between them. */
  const step = p < 0.50
    ? smooth(range(p, 0, 0.34))
    : 1 + smooth(range(p, 0.50, 0.70));
  const trackX = -u.vw(100) * Math.min(step, 2);

  /* Which panel owns the frame — the caption changes at the half-way crossing
     of the incoming panel, not when the scroll stops. */
  const index = Math.min(2, Math.round(step));
  const panel = VIEWS.panels[index];

  const planes = [];

  /* The three fields, each a full viewport wide, laid end to end. */
  VIEWS.panels.forEach((pane, i) => {
    const isFirst = i === 0;
    planes.push({
      key: pane.asset + '#view' + i,
      asset: pane.asset,
      box: { x: trackX + u.vw(100 * i), y: 0, w: vp.w, h: vp.h },
      /* Panel 0 IS the crane the previous scene ended on — same identity, same
         crop — so the boundary carries no duplicate-image flash. */
      fit: isFirst ? entry.planes[0].fit : { zoom: 1 },
      z: 20 + i
    });
  });

  /* ── the return: the portal closes in from the left over the roof ──
     This is the handoff to Scene 7, not a fourth selectable view. Same portal
     source and crop as Scene 2. */
  const returnT = smooth(range(p, 0.82, 0.90));
  if (returnT > 0) {
    const coverW = u.vw(100) * returnT;
    planes.push({
      key: 'portalFrame', box: u.full(), fit: { zoom: 1 }, z: 40,
      clip: [[0, 0], [coverW, 0], [coverW, vp.h], [0, vp.h]]
    });
  }

  /* ── the release: the portal narrows to the 35vw wall, near-black follows ── */
  const rel = smooth(range(p, 0.90, 1));
  if (rel > 0) {
    const wall = mixBox(u.full(), exit.planes[0].box, rel);
    const wallFit = mixFit({ zoom: 1 }, exit.planes[0].fit, rel);
    planes[planes.length - 1] = { key: 'portalFrame', box: wall, fit: wallFit, z: 40 };
  }

  const chrome = 1 - range(p, 0.82, 0.90);

  return {
    planes,
    edge: null,
    foreground: null,
    geometry: { visible: false, opacity: 0, p: 1 },
    /* Near-black over the light sky, per the board — not chalk. */
    title: {
      lines: [VIEWS.title], xVw: 4, yVh: 13, sizeVw: 5, maxVw: 60,
      opacity: chrome, tone: 'dark'
    },
    dock: chrome > 0
      ? { caption: panel.caption, index, count: VIEWS.panels.length,
          xVw: 4, yVh: 87, opacity: chrome }
      : null,
    curtain: rel > 0 ? { fromVw: lerp(100, 35, rel) } : null,
    /* The stage no longer previews the arriving heading. Scenes 7-8 are inside
       the same pinned section now, so the real heading scrolls in over the
       released field — drawing a copy of it here would put the same words on
       screen twice for a screen and a half. */
    briefTitle: null,
    label: null,
    /* The clusters stay ink on every ground — that is what all ten boards
       show, including the ones over bright sky. Only the display title
       inverts, because it is the thing that would otherwise disappear. */
    navTheme: 'light',
    subject: 'Selected views',
    release: rel
  };
}
