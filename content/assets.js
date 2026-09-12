/* ═══════════════════════════════════════════════════════════════════════════
   content/assets.js — the photographs, described
   ═══════════════════════════════════════════════════════════════════════════

   Nine photographs. Every one was supplied by Kingson and shows Kingson's own
   workshop, plant or site work. `focal` is a normalised source coordinate: the
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
    slug: 'portal-frame', w: 1320, h: 888, widths: [440, 720, 1100, 1320],
    focal: [0.54, 0.47],
    alt: 'A steel portal frame under erection on open ground: columns, rafters and purlins in place, a mobile crane working inside the frame and cladding already fixed to the far bays.',
    status: 'observed_photo'
  },
  roofTrusses: {
    slug: 'roof-trusses', w: 1320, h: 792, widths: [440, 720, 1100, 1320],
    focal: [0.54, 0.42],
    alt: 'The underside of a long-span roof: red-oxide steel trusses and purlins carrying sheeting, photographed looking up along the building.',
    status: 'observed_photo'
  },
  roofFrame: {
    slug: 'roof-frame', w: 1320, h: 714, widths: [440, 720, 1100, 1320],
    focal: [0.50, 0.35],
    alt: 'A white-painted roof structure seen from inside: trusses, purlins and corrugated sheeting with rooflights between the bays.',
    status: 'observed_photo'
  },
  cuttingHead: {
    slug: 'cutting-head', w: 1350, h: 1800, widths: [440, 720, 1100, 1350],
    /* A wide crop centred lower than this loses the head itself and shows
       only bare plate and slats. Measured against the 16:9 service card. */
    focal: [0.60, 0.45],
    alt: 'The cutting head of a fiber laser positioned over steel plate on a slatted bed, with the machine casing and workshop wall behind it.',
    status: 'observed_photo'
  },
  laserMachine: {
    slug: 'laser-machine', w: 1536, h: 2048, widths: [440, 720, 1100, 1536],
    focal: [0.50, 0.53],
    alt: 'A fiber laser cutting machine in a workshop, with a brick pier, yellow sheeting and a control screen beside the bed.',
    status: 'observed_photo'
  },
  laserFloor: {
    slug: 'laser-floor', w: 1350, h: 1800, widths: [440, 720, 1100, 1350],
    focal: [0.45, 0.52],
    alt: 'The whole fiber laser on the workshop floor, badged DXTECH LASER: enclosed bed with cutting slats, cable chain along the side, swing-arm control screen and an extraction duct, with a brick pier and timber pallets beside it.',
    status: 'observed_photo'
  },
  nestingStation: {
    slug: 'nesting-station', w: 1350, h: 1800, widths: [440, 720, 1100, 1350],
    focal: [0.45, 0.48],
    alt: 'The laser control station: an upright monitor showing a nested cutting path on screen, keyboard, mouse and emergency stop on the machine shelf, with the slatted bed and the DXTECH cutting head behind it.',
    status: 'observed_photo'
  },
  gantry: {
    slug: 'gantry', w: 1350, h: 1794, widths: [440, 720, 1100, 1350],
    focal: [0.46, 0.55],
    alt: 'The laser gantry carriage seen side-on, cable chain arching over it, travelling above a slatted bed loaded with steel plate, with a brick wall and workshop sheeting behind.',
    status: 'observed_photo'
  },
  crane: {
    slug: 'crane', w: 1320, h: 1757, widths: [440, 720, 1100, 1320],
    focal: [0.50, 0.60],
    alt: 'A yellow telescopic mobile crane standing in a yard, boom raised, with lettering reading KINGSON and a phone number on the counterweight body.',
    status: 'observed_photo'
  }
};

export function srcset(key) {
  const a = ASSETS[key];
  return V(a.slug, a.widths);
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

/* The gallery, in the order it reads: site work, then the workshop, then the
   crane. The first tile spans two columns — it is the strongest photograph and
   a uniform grid of eight equal squares reads like a template.

   `roofFrame` is absent on purpose: it is the wide photograph carrying the
   full-width band above the specifications, so every photograph Kingson
   supplied appears exactly once on the page. */
export const GALLERY = [
  'portalFrame', 'roofTrusses',
  'laserFloor', 'cuttingHead', 'nestingStation',
  'gantry', 'laserMachine', 'crane'
];

/** The one wide photograph, used full-bleed rather than as a tile. */
export const BAND_IMAGE = 'roofFrame';
