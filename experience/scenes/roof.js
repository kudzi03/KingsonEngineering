/* ═══ Scene 3 · Under the roof ══════════════════════════════════════════════
   V2 §10 Scene 3. The narrow strip becomes the whole environment; a second
   roof substitutes across a hard diagonal; then structural scale compresses
   into the edge of a machine.

   Mask 0–.32 · still .32–.48 · second roof .48–.65 · machine transfer .72–1.
   ═══════════════════════════════════════════════════════════════════════════ */
import { units, frameToRoof, roofToCut, PORTAL_BLEED_VW } from '../scene-map.js';
import { range, lerp, smooth, mixPoly } from '../interp.js';
import { SCENE_TITLES } from '../../content/copy.js';

export function roof(p, vp, opts = {}) {
  const u = units(vp);
  const entry = frameToRoof(vp);
  const exit = roofToCut(vp);

  /* ── the aperture takeover ── */
  const grow = smooth(range(p, 0, 0.32));
  const full4 = u.poly([[0, 0], [100, 0], [100, 100], [0, 100]]);
  const clip = grow >= 1 ? null : mixPoly(entry.planes[0].clip, full4, grow);

  /* Roof photograph settles to 1.00 by .58 (state C). */
  const roofZoom = lerp(1.08, 1.00, smooth(range(p, 0.10, 0.58)));

  const planes = [];

  /* ── the machine, arriving from the right ──
     .72 off-screen · .78 left edge at 76vw · .90 at 58vw · 1 at -2vw. Three
     segments, because those are the four positions the treatment names — a
     single eased span would not pass through them. */
  let machineLeft = null, edgeTilt = 0, edgeThick = 0;
  if (p >= 0.70) {
    machineLeft =
      p < 0.78 ? lerp(100, 76, smooth(range(p, 0.72, 0.78))) :
      p < 0.90 ? lerp(76, 58, smooth(range(p, 0.78, 0.90)))
               : lerp(58, -2, range(p, 0.90, 1));   // linear: a mechanical pass

    /* The edge is a loaded member with thickness and direction (§8), never a
       rule. It carries the aperture, so the aperture leans with it: the clip
       and the member describe one boundary, not two that nearly agree. */
    const pass = range(p, 0.90, 1);
    edgeThick = lerp(3.2, 14, Math.sin(pass * Math.PI));
    edgeTilt = edgeThick > 8 ? lerp(12, 0, range(edgeThick, 8, 14)) : 12;
    const lean = (Math.tan(edgeTilt * Math.PI / 180) * (vp.h / 2) / vp.w) * 100;

    planes.push({
      key: 'cuttingHead', box: u.full(), fit: { zoom: 1 }, z: 40,
      clip: [[u.vw(machineLeft + lean), 0], [vpw(vp), 0],
             [vpw(vp), vp.h], [u.vw(machineLeft - lean), vp.h]]
    });
  }

  /* ── the second roof, substituting across a leaning diagonal ──
     .48 off right · .58 occupies right 42vw · .78 fills the screen. */
  if (p >= 0.46 && p < 0.96) {
    const x = p < 0.58
      ? lerp(104, 58, smooth(range(p, 0.48, 0.58)))
      : lerp(58, -6, smooth(range(p, 0.58, 0.78)));
    const lean = 4;                                 // the roof-aligned tilt
    planes.push({
      key: 'roofFrame', box: u.full(), fit: { zoom: 1 }, z: 30,
      clip: [[u.vw(x + lean), 0], [vpw(vp), 0], [vpw(vp), vp.h], [u.vw(x - lean), vp.h]]
    });
  }

  planes.push({ key: 'roofTrusses', box: u.full(), fit: { zoom: roofZoom }, z: 20, clip });

  if (grow < 1) planes.push({ key: 'portalFrame', box: u.full(),
                              fit: { zoom: 1, bleed: u.vw(PORTAL_BLEED_VW) }, z: 10 });

  /* ── the loaded edge ──
     A real material boundary, not a rule. It thickens for the close pass and
     only straightens from the roof-aligned diagonal to vertical while it is
     thicker than 8vw, so the orientation change happens behind material. */
  let edge = null;
  if (machineLeft !== null) {
    edge = { xVw: machineLeft, thickVw: edgeThick, tiltDeg: edgeTilt };
  } else if (p >= 0.46 && p < 0.96) {
    edge = { xVw: null };   // the second-roof seam is a clean cut, no member
  }

  const titleIn = range(p, 0.18, 0.30);
  const titleOut = range(p, 0.62, 0.70);

  return {
    planes,
    edge,
    foreground: null,
    geometry: { visible: false, opacity: 0, p: 1 },
    title: {
      lines: SCENE_TITLES.roof, xVw: 4, yVh: 68, sizeVw: 7.5, maxVw: 57,
      opacity: titleIn * (1 - titleOut)
    },
    label: null,
    navTheme: 'light',
    subject: p < 0.7 ? 'Roof steel' : 'Laser cutting'
  };
}

const vpw = (vp) => vp.w;
