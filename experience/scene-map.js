/* ═══════════════════════════════════════════════════════════════════════════
   experience/scene-map.js — ranges, and the boundaries both sides share
   ═══════════════════════════════════════════════════════════════════════════

   V2 §9. One sticky stage carries Scenes 1–6 over 620vh of travel. Every
   coordinate in this file is taken literally from §10.

   THE BOUNDARY CONTRACT

   §9: "A boundary has one shared state, not two approximations." So a
   boundary is written once, here, as a function of the viewport — and the
   scene before it returns exactly that object at p=1 while the scene after it
   returns exactly that object at p=0. Neither scene re-derives the other's
   coordinates, which is why forward and reverse scrolling cannot disagree and
   why nothing resets at a chapter change.

   Polygons are lists of [vw, vh] pairs, resolved to pixels by `poly()`.
   ═══════════════════════════════════════════════════════════════════════════ */

export const SCENES = [
  { id: 'opening', start: 0,   duration: 100 },
  { id: 'frame',   start: 100, duration: 90  },
  { id: 'roof',    start: 190, duration: 120 },
  { id: 'cut',     start: 310, duration: 110 },
  { id: 'yard',    start: 420, duration: 100 },
  { id: 'views',   start: 520, duration: 100 }
];

export const STAGE_TRAVEL_VH = 620;

/* Image edges live on these columns (§7). Nothing sits between them. */
export const EDGE = { a: 0, b: 42, c: 58, d: 76, e: 100 };

/* ── viewport helpers ───────────────────────────────────────────────────── */

export function units(vp) {
  const vw = (n) => (n / 100) * vp.w;
  const vh = (n) => (n / 100) * vp.h;
  return {
    vw, vh,
    /** [vw,vh] pairs -> pixel polygon */
    poly: (pts) => pts.map(([x, y]) => [vw(x), vh(y)]),
    /** a full-viewport field */
    full: () => ({ x: 0, y: 0, w: vp.w, h: vp.h }),
    /** a vertical field between two vw columns */
    band: (fromVw, toVw) => ({ x: vw(fromVw), y: 0, w: vw(toVw - fromVw), h: vp.h })
  };
}

/* Scene 2 translates the portal photograph, so its fit is bought slack to
   move within. The slack changes the scale, so it belongs to EVERY state that
   draws that photograph full-field — Scene 1 included — or the two sides of
   the Scene 1/2 boundary would be drawn at different scales and the join
   would pop. It is a property of the shared portal field, not of Scene 2. */
export const PORTAL_BLEED_VW = 1.0;

/* ── the six boundaries ─────────────────────────────────────────────────────
   Each returns the complete visual state at that instant. Scene samplers
   import these; they never write a neighbour's numbers themselves.          */

/** Scene 1 p=1 === Scene 2 p=0. Portal owns the frame; no model remains. */
export function openingToFrame(vp) {
  const u = units(vp);
  return {
    planes: [
      { key: 'portalFrame', box: u.full(), fit: { zoom: 1, bleed: u.vw(PORTAL_BLEED_VW) }, z: 10 }
    ],
    foreground: { asset: 'portalColumn', opacity: 1 },
    geometry: { visible: false, opacity: 0, p: 1 },
    title: { lines: ['Structural', 'steel'], xVw: 4, yVh: 62, sizeVw: 7.5, opacity: 1, maxVw: 57 },
    label: null,
    navTheme: 'light',
    subject: 'Structural steel'
  };
}

/** Scene 2 p=1 === Scene 3 p=0. The diagonal aperture belongs to both. */
export function frameToRoof(vp) {
  const u = units(vp);
  return {
    planes: [
      /* The incoming roof is already cover-scaled against the FULL viewport,
         not against the narrow band — that is what stops it zooming as the
         mask grows (§10 Scene 3 A). */
      /* Board 03: the aperture is a CORNER, not a band. The roof takes the
         whole upper right of the field across one diagonal that follows the
         direction the photographed roof already runs in. A band would read as
         a tear across the picture; a corner reads as an opening. */
      { key: 'roofTrusses', box: u.full(), fit: { zoom: 1.08 },
        clip: u.poly([[11, 0], [100, 0], [100, 62], [100, 62]]), z: 20 },
      { key: 'portalFrame', box: u.full(), fit: { zoom: 1, bleed: u.vw(PORTAL_BLEED_VW) }, z: 10 }
    ],
    foreground: { asset: 'portalColumn', opacity: 0 },   // merged back by .85
    geometry: { visible: false, opacity: 0, p: 1 },
    title: null,
    label: null,
    navTheme: 'light',
    subject: 'Roof steel'
  };
}

/** Scene 3 p=1 === Scene 4 p=0. The machine owns the frame. */
export function roofToCut(vp) {
  const u = units(vp);
  return {
    planes: [
      { key: 'cuttingHead', box: u.full(), fit: { zoom: 1 }, z: 20 }
    ],
    edge: null,
    geometry: { visible: false, opacity: 0, p: 1 },
    title: { lines: ['Laser', 'cutting'], xVw: 4, yVh: 62, sizeVw: 7.5, opacity: 1, maxVw: 52 },
    label: null,
    navTheme: 'light',
    subject: 'Laser cutting'
  };
}

/** Scene 4 p=1 === Scene 5 p=0. Three planes touching, no gutters. */
export function cutToYard(vp) {
  const u = units(vp);
  return {
    planes: [
      { key: 'cuttingHead',  box: u.band(EDGE.a, EDGE.c), fit: { zoom: 1, focal: [0.60, 0.63] }, z: 20 },
      { key: 'laserMachine', box: u.band(EDGE.c, EDGE.d), fit: { zoom: 1 }, z: 21 },
      { key: 'crane',        box: u.band(EDGE.d, EDGE.e), fit: { zoom: 1 }, z: 22 }
    ],
    title: null,
    label: null,
    navTheme: 'light',
    subject: 'Cranage'
  };
}

/** Scene 5 p=1 === Scene 6 p=0. One crane field, the reel's first panel. */
export function yardToViews(vp) {
  const u = units(vp);
  return {
    planes: [
      /* Continuously re-cropped to a boom/body landscape detail as it grew to
         full width — the portrait is never stretched. */
      { key: 'crane', box: u.full(), fit: { zoom: 1, focal: [0.52, 0.52], window: [0, 0.2415, 1, 0.9258] }, z: 20 }
    ],
    title: null,
    label: null,
    navTheme: 'light',
    subject: 'Selected views'
  };
}

/** Scene 6 p=1 === Scene 7's first frame. The stage releases here. */
export function viewsToBrief(vp) {
  const u = units(vp);
  return {
    planes: [
      { key: 'portalFrame', box: u.band(0, 35), fit: { zoom: 1, focal: [0.42, 0.5] }, z: 20 }
    ],
    curtain: { fromVw: 35 },        // near-black fills 35 -> 100vw
    title: { lines: ['Bring the', 'brief.'], xVw: 42, yVh: 22, sizeVw: 5.4, opacity: 1, maxVw: 50 },
    label: null,
    navTheme: 'light',
    subject: 'Enquiry',
    release: 1
  };
}

/* ── named still states, for the static composition gate ────────────────────
   V2 §18 step 2 requires every named state to be inspected as a still before
   any motion is trusted. `?still=` renders one directly.                    */

export const NAMED_STATES = {
  's1-a': ['opening', 0],    's1-b': ['opening', 0.25], 's1-c': ['opening', 0.55],
  's1-d': ['opening', 0.75], 's1-e': ['opening', 1],
  's2-a': ['frame', 0],      's2-b': ['frame', 0.40],   's2-c': ['frame', 0.70],
  's2-d': ['frame', 1],
  's3-a': ['roof', 0],       's3-b': ['roof', 0.32],    's3-c': ['roof', 0.58],
  's3-d': ['roof', 0.78],    's3-e': ['roof', 1],
  's4-a': ['cut', 0],        's4-b': ['cut', 0.35],     's4-c': ['cut', 0.65],
  's4-d': ['cut', 0.82],     's4-e': ['cut', 1],
  's5-a': ['yard', 0],       's5-b': ['yard', 0.30],    's5-c': ['yard', 0.52],
  's5-d': ['yard', 0.82],    's5-e': ['yard', 1],
  's6-a': ['views', 0],      's6-b': ['views', 0.42],   's6-c': ['views', 0.78],
  's6-d': ['views', 0.90],   's6-e': ['views', 1]
};

export function globalVhFor(sceneId, p) {
  const s = SCENES.find((x) => x.id === sceneId);
  return s.start + s.duration * p;
}

export function sceneAt(globalVh) {
  for (let i = SCENES.length - 1; i >= 0; i--) {
    if (globalVh >= SCENES[i].start) {
      const s = SCENES[i];
      return { id: s.id, index: i, p: clamp((globalVh - s.start) / s.duration, 0, 1) };
    }
  }
  return { id: SCENES[0].id, index: 0, p: 0 };
}

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
