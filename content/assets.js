/* ═══════════════════════════════════════════════════════════════════════════
   content/assets.js — source identities, crop anchors, alt text, status
   ═══════════════════════════════════════════════════════════════════════════

   The V2 asset map (§5) expressed as data. Focal anchors are normalised source
   coordinates: the point the cover transform keeps in frame when the viewport
   ratio does not match the photograph's.

   `alt` describes what is visible. It never asserts ownership, a client, a
   project or a capability — §15 forbids turning a photograph into a claim.

   Two photographs in the repository are deliberately absent from the homepage:
   `structure.jpeg` and `crane.jpeg` are stock-style collages, and the second
   has a filename that invites confusion with `craneyard.jpeg`. `nesting.jpeg`
   is absent because a monitor does not evidence a customer approval process.
   ═══════════════════════════════════════════════════════════════════════════ */

const V = (slug, widths) => widths.map((w) => `assets/img/${slug}-${w}.webp ${w}w`).join(', ');

export const ASSETS = {
  portalFrame: {
    slug: 'portal-frame', w: 1320, h: 888, widths: [440, 720, 1100, 1320],
    focal: [0.54, 0.4705],
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
    focal: [0.64, 0.63],
    alt: 'The cutting head of a fiber laser positioned over steel plate on a slatted bed, with the machine casing and workshop wall behind it.',
    status: 'observed_photo'
  },
  laserMachine: {
    slug: 'laser-machine', w: 1536, h: 2048, widths: [440, 720, 1100, 1536],
    focal: [0.50, 0.53],
    alt: 'A fiber laser cutting machine in a workshop, with a brick pier, yellow sheeting and a control screen beside the bed.',
    status: 'observed_photo'
  },
  crane: {
    slug: 'crane', w: 1320, h: 1757, widths: [440, 720, 1100, 1320],
    /* The portrait source is the reason Scene 5 is a dual-scale composition.
       `window` trims the empty upper sky so the body and boom carry the frame;
       `detail` is the larger crop of the SAME photograph used on the right. */
    focal: [0.50, 0.6038],
    window: [0, 0.2214, 1, 1],
    detail: { focal: [0.62, 0.5233], zoom: 1.85 },
    alt: 'A yellow telescopic mobile crane standing in a yard, boom raised, with lettering reading KINGSON and a phone number on the counterweight body.',
    status: 'observed_photo'
  },

  /* Archive only: reachable from the image viewer, never a scene of its own. */
  gantry: {
    slug: 'gantry', w: 1350, h: 1794, widths: [440, 720, 1100, 1350],
    focal: [0.50, 0.50],
    alt: 'The gantry and cable chain of a fiber laser travelling over the machine bed, with a brick workshop wall behind.',
    status: 'observed_photo', archiveOnly: true
  }
};

export function srcset(key) {
  const a = ASSETS[key];
  return V(a.slug, a.widths);
}

/** Largest variant — the default `src` and the image-viewer original. */
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

/* Which photographs the page needs at all, in the order the scroll reaches
   them. loading.js walks this to decode one scene ahead. */
export const SEQUENCE = [
  'portalFrame', 'roofTrusses', 'roofFrame', 'cuttingHead', 'laserMachine', 'crane'
];
