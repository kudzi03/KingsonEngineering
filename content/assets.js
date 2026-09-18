/* ═══════════════════════════════════════════════════════════════════════════
   content/assets.js — the photographs, described
   ═══════════════════════════════════════════════════════════════════════════

   Thirteen photographs. Every one was supplied by Kingson and shows Kingson's
   own workshop, plant or site work. `focal` is a normalised source coordinate: the
   point a `cover` crop keeps in frame when the container's ratio does not
   match the photograph's.

   `alt` describes what is visible and nothing else. It never names a client,
   a project, a capability or a capacity — a photograph is evidence of itself,
   not of a claim. Where a machine's own badge is legible in the frame, the alt
   text says so, because that is what the picture shows.

   Two files in the repository are deliberately absent from this map:
   `structure.jpeg` and `crane.jpeg` are stock-style collages, not Kingson's
   work, and publishing them as Kingson's would be the exact thing
   SOURCE_OF_TRUTH.md §H rules out.
   ═══════════════════════════════════════════════════════════════════════════ */

const V = (slug, widths) => widths.map((w) => `assets/img/${slug}-${w}.webp ${w}w`).join(', ');

export const ASSETS = {
  portalFrame: {
    slug: 'portal-frame', w: 1320, h: 888, widths: [440, 720, 900, 1100, 1320],
    wide: { w: 1319, h: 742, widths: [900, 1319] },
    focal: [0.54, 0.47],
    alt: 'A steel portal frame under erection on open ground: columns, rafters and purlins in place, a mobile crane working inside the frame and cladding already fixed to the far bays.',
    status: 'observed_photo'
  },
  roofTrusses: {
    slug: 'roof-trusses', w: 1320, h: 792, widths: [440, 720, 900, 1100, 1320],
    wide: { w: 1319, h: 742, widths: [900, 1319] },
    focal: [0.54, 0.42],
    alt: 'The underside of a long-span roof: red-oxide steel trusses and purlins carrying sheeting, photographed looking up along the building.',
    status: 'observed_photo'
  },
  roofFrame: {
    slug: 'roof-frame', w: 1320, h: 714, widths: [440, 720, 900, 1100, 1320],
    wide: { w: 1269, h: 714, widths: [900, 1269] },
    focal: [0.50, 0.35],
    alt: 'A white-painted roof structure seen from inside: trusses, purlins and corrugated sheeting with rooflights between the bays.',
    status: 'observed_photo'
  },
  cuttingHead: {
    slug: 'cutting-head', w: 1350, h: 1800, widths: [440, 720, 900, 1100, 1350],
    /* A wide crop centred lower than this loses the head itself and shows
       only bare plate and slats. Measured against the 16:9 service card. */
    focal: [0.60, 0.45],
    alt: 'The cutting head of a fiber laser positioned over steel plate on a slatted bed, with the machine casing and workshop wall behind it.',
    status: 'observed_photo'
  },
  laserMachine: {
    slug: 'laser-machine', w: 1536, h: 2048, widths: [440, 720, 900, 1100, 1536],
    focal: [0.50, 0.53],
    alt: 'A fiber laser cutting machine in a workshop, with a brick pier, yellow sheeting and a control screen beside the bed.',
    status: 'observed_photo'
  },
  laserFloor: {
    slug: 'laser-floor', w: 1350, h: 1800, widths: [440, 720, 900, 1100, 1350],
    wide: { w: 1349, h: 759, widths: [900, 1320] },
    focal: [0.45, 0.52],
    alt: 'The whole fiber laser on the workshop floor, badged DXTECH LASER: enclosed bed with cutting slats, cable chain along the side, swing-arm control screen and an extraction duct, with a brick pier and timber pallets beside it.',
    status: 'observed_photo'
  },
  nestingStation: {
    slug: 'nesting-station', w: 1350, h: 1800, widths: [440, 720, 900, 1100, 1350],
    focal: [0.45, 0.48],
    alt: 'The laser control station: an upright monitor showing a nested cutting path on screen, keyboard, mouse and emergency stop on the machine shelf, with the slatted bed and the DXTECH cutting head behind it.',
    status: 'observed_photo'
  },
  gantry: {
    slug: 'gantry', w: 1350, h: 1794, widths: [440, 720, 900, 1100, 1350],
    wide: { w: 1349, h: 759, widths: [900, 1320] },
    focal: [0.46, 0.55],
    alt: 'The laser gantry carriage seen side-on, cable chain arching over it, travelling above a slatted bed loaded with steel plate, with a brick wall and workshop sheeting behind.',
    status: 'observed_photo'
  },
  laserCutting: {
    slug: 'laser-cutting', w: 1440, h: 2560, widths: [440, 720, 900, 1100, 1440],
    wide: { w: 1440, h: 810, widths: [900, 1320] },
    /* The spark burst, not the skylight. The brightest pixels in this frame are
       the window behind the gantry; anchoring on those would centre the crop on
       an empty wall and cut the one thing the photograph is here for. */
    focal: [0.46, 0.44],
    alt: 'A DXTECH fiber laser cutting steel sheet, sparks thrown from the nozzle across the plate, with the slatted bed below and gas cylinders against the workshop wall behind.',
    status: 'observed_photo'
  },
  laserSparks: {
    slug: 'laser-sparks', w: 1440, h: 2560, widths: [440, 720, 900, 1100, 1440],
    focal: [0.38, 0.43],
    alt: 'The cutting head of the DXTECH fiber laser close up, sparks off the nozzle and the cut line running out across the sheet.',
    status: 'observed_photo'
  },
  weldingBay: {
    slug: 'welding-bay', w: 1920, h: 2560, widths: [440, 720, 900, 1100, 1920],
    wide: { w: 1920, h: 1080, widths: [900, 1320] },
    /* Low on the frame, because the two men and the arc are in the bottom
       third and the top third is roof. A wide cut anchored at the middle is a
       photograph of sheeting. */
    focal: [0.68, 0.62],
    alt: 'Two Kingson Engineering workers welding a steel grating panel on the floor of the Harare workshop, seen from low down with the workshop roof trusses and sheeting above them.',
    status: 'observed_photo'
  },
  weldingHands: {
    slug: 'welding-hands', w: 1920, h: 2560, widths: [440, 720, 900, 1100, 1920],
    /* Held high: the lettering on the overalls is near the top of the frame and
       the arc is at the middle, and this frame is only in the page because both
       are in it. */
    focal: [0.52, 0.30],
    alt: 'Two workers crouched over a steel grating panel, one holding a welding shield and striking an arc, the other steadying the panel; the overalls are lettered KINGSON ENGINEERING.',
    status: 'observed_photo'
  },
  crane: {
    slug: 'crane', w: 1320, h: 1757, widths: [440, 720, 900, 1100, 1320],
    wide: { w: 1319, h: 742, widths: [900, 1319] },
    focal: [0.50, 0.60],
    alt: 'A yellow telescopic mobile crane standing in a yard, boom raised, with lettering reading KINGSON and a phone number on the counterweight body.',
    status: 'observed_photo'
  }
};

export function srcset(key) {
  const a = ASSETS[key];
  return V(a.slug, a.widths);
}

/* ── the wide cut ───────────────────────────────────────────────────────────
   Seven of these photographs came off a phone in portrait. A full-bleed scene
   is a wide band, so `object-fit: cover` throws away most of a portrait file
   after downloading all of it. `tools/build-images.py` writes a 16:9 cut of
   each bleed photograph around the same band the page was already showing,
   and the bleed frames serve it from 900px up through <picture>. Below 900px
   the frame really is portrait and the uncut file is the right one.

   This is art direction, not a second photograph: same frame, same moment,
   composed for the shape it is shown in. The viewer still opens the full
   uncut picture, which is the one that has to stay honest.                 */

export const hasWide = (key) => Boolean(ASSETS[key].wide);

export function wideSrcset(key) {
  const a = ASSETS[key];
  return a.wide ? a.wide.widths.map((w) =>
    `assets/img/${a.slug}-wide-${w}.webp ${w}w`).join(', ') : '';
}

export function wideSrc(key, width) {
  const a = ASSETS[key];
  if (!a.wide) return '';
  const ws = a.wide.widths;
  const w = ws.reduce((best, x) => (x >= width && x < best ? x : best), ws[ws.length - 1]);
  return `assets/img/${a.slug}-wide-${w}.webp`;
}

/** The variant at or just above `width`; the largest when no width is given. */
export function src(key, width) {
  const a = ASSETS[key];
  const w = width
    ? a.widths.reduce((best, x) => (x >= width && x < best ? x : best), a.widths[a.widths.length - 1])
    : a.widths[a.widths.length - 1];
  return `assets/img/${a.slug}-${w}.webp`;
}

export function ratio(key) {
  const a = ASSETS[key];
  return a.w / a.h;
}

/** `object-position` for a cover crop, from the focal anchor. */
export function position(key) {
  const [x, y] = ASSETS[key].focal;
  return `${(x * 100).toFixed(1)}% ${(y * 100).toFixed(1)}%`;
}

/* ── what the home page actually shows ──────────────────────────────────────
   This list is what `sitemap.xml` declares as the page's images, and it has
   exactly one job: match reality.

   It used to be called GALLERY and to describe a grid of eight tiles — a
   layout the page stopped having when the work section became full-width
   project bands. Nothing noticed, because nothing checked. The list then
   survived a round of photography changes still naming `cuttingHead` and
   `laserMachine`, which by then appeared on no page at all, while the two new
   welding frames that did appear were absent from it. A sitemap that declares
   images the page does not carry, and omits ones it does, is worse than no
   sitemap images at all.

   `tools/check-truth.js` now asserts both directions, so the next time this
   drifts the publication gate fails instead of the sitemap lying.

   In the order the page reads, after BAND_IMAGE which opens chapter 01.     */
export const PAGE_IMAGES = [
  'roofTrusses',
  'laserCutting', 'nestingStation', 'laserFloor', 'gantry', 'laserSparks',
  'crane',
  'weldingBay',
  'portalFrame'
];

export const BAND_IMAGE = 'roofFrame';
