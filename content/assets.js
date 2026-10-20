/* ═══════════════════════════════════════════════════════════════════════════
   content/assets.js — the photographs, described
   ═══════════════════════════════════════════════════════════════════════════

   Nineteen photographs and film posters. All were supplied by Kingson or
   extracted from its supplied films, and show Kingson's
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
  roofFilmA: {
    slug: 'roof-a-poster', w: 512, h: 808, widths: [440, 512],
    focal: [0.5, 0.42], status: 'observed_photo',
    alt: 'Kingson roof steelwork with trusses and purlins supporting pale sheeting, viewed from inside the structure.'
  },
  roofFilmB: {
    slug: 'roof-b-poster', w: 512, h: 860, widths: [440, 512],
    focal: [0.5, 0.4], status: 'observed_photo',
    alt: 'Kingson roof trusses and sheeting viewed upwards towards the open edge of the structure.'
  },
  roofFilmC: {
    slug: 'roof-c-poster', w: 512, h: 910, widths: [440, 512],
    focal: [0.5, 0.4], status: 'observed_photo',
    alt: 'Blue-painted Kingson roof members and purlins receding beneath partial sheeting, with open bays against the sky.'
  },
  workshopFilm: {
    slug: 'workshop-poster', w: 512, h: 910, widths: [440, 512],
    focal: [0.5, 0.5], status: 'observed_photo',
    alt: 'The Kingson workshop seen through its open roller door, with equipment and stacked steel beneath the roof.'
  },
  architecturalGlass: {
    slug: 'architectural-glass-exterior', w: 1536, h: 1152, widths: [440, 720, 1100, 1536],
    focal: [0.65, 0.55], status: 'observed_photo',
    alt: 'Glass balustrade on a tiled staircase with dark metal clamps, in Kingson Engineering’s supplied project photograph.'
  },
  architecturalAtrium: {
    slug: 'architectural-atrium-interior', w: 1536, h: 1152, widths: [440, 720, 1100, 1536],
    focal: [0.6, 0.55], status: 'observed_photo',
    alt: 'Glass balustrade with dark metal fixings overlooking a tiled atrium and tall windows, in Kingson Engineering’s supplied project photograph.'
  },
  portalFrame: {
    slug: 'portal-frame', w: 1320, h: 888, widths: [440, 720, 900, 1100, 1320],
    wide: { w: 1319, h: 742, widths: [900, 1319] },
    focal: [0.54, 0.47],
    alt: 'Kingson Engineering steel portal frame under erection, with columns, rafters and purlins in place and a mobile crane inside the structure.',
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
    alt: 'Fibre laser cutting head positioned over steel plate on the slatted bed in Kingson Engineering’s Tynwald workshop, Harare.',
    status: 'observed_photo'
  },
  laserMachine: {
    slug: 'laser-machine', w: 1536, h: 2048, widths: [440, 720, 900, 1100, 1536],
    focal: [0.50, 0.53],
    alt: 'Fibre laser cutting machine and control screen in Kingson Engineering’s Tynwald workshop, Harare.',
    status: 'observed_photo'
  },
  laserFloor: {
    slug: 'laser-floor', w: 1350, h: 1800, widths: [440, 720, 900, 1100, 1350],
    wide: { w: 1349, h: 759, widths: [900, 1320] },
    focal: [0.45, 0.52],
    alt: 'DXTECH fibre laser at Kingson Engineering’s Tynwald workshop, with the cutting bed, cable chain, control screen and extraction duct visible.',
    status: 'observed_photo'
  },
  nestingStation: {
    slug: 'nesting-station', w: 1350, h: 1800, widths: [440, 720, 900, 1100, 1350],
    focal: [0.45, 0.48],
    alt: 'DXTECH laser control station showing nested cutting paths at Kingson Engineering’s Tynwald workshop, with the cutting head behind the monitor.',
    status: 'observed_photo'
  },
  gantry: {
    slug: 'gantry', w: 1350, h: 1794, widths: [440, 720, 900, 1100, 1350],
    wide: { w: 1349, h: 759, widths: [900, 1320] },
    focal: [0.46, 0.55],
    alt: 'Fibre laser gantry and cable chain travelling above steel plate on the slatted cutting bed at Kingson Engineering’s Tynwald workshop.',
    status: 'observed_photo'
  },
  laserCutting: {
    slug: 'laser-cutting', w: 1440, h: 2560, widths: [440, 720, 900, 1100, 1440],
    wide: { w: 1440, h: 810, widths: [900, 1320] },
    /* The spark burst, not the skylight. The brightest pixels in this frame are
       the window behind the gantry; anchoring on those would centre the crop on
       an empty wall and cut the one thing the photograph is here for. */
    focal: [0.46, 0.44],
    alt: 'DXTECH fibre laser cutting steel sheet at Kingson Engineering’s Tynwald workshop in Harare, with sparks visible beneath the nozzle.',
    status: 'observed_photo'
  },
  laserSparks: {
    slug: 'laser-sparks', w: 1440, h: 2560, widths: [440, 720, 900, 1100, 1440],
    /* The wide cut is anchored low (0.70, see WIDE_ANCHOR_Y in
       tools/build-images.py): on the first screen it is the sparks that
       matter, not the head. */
    wide: { w: 1440, h: 810, widths: [900, 1320] },
    focal: [0.38, 0.43],
    alt: 'Close view of the DXTECH fibre laser cutting head and sparks along the cut line at Kingson Engineering’s Tynwald workshop.',
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
    alt: 'Kingson Engineering’s yellow telescopic mobile crane in a yard, with its boom raised and KINGSON lettering on the counterweight.',
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
  'roofFilmA', 'roofFilmB', 'roofFilmC', 'workshopFilm', 'architecturalGlass', 'architecturalAtrium',
  'portalFrame', 'laserSparks', 'crane', 'weldingBay', 'roofTrusses',
  'weldingHands',
  'laserCutting', 'nestingStation', 'laserFloor', 'gantry'
];

/* There is no band image any more. It was `roofFrame`, the full-width frame
   under the structure chapter, and that chapter is gone — its subject now
   lives on the roofing and structural pages, where it is not competing with
   four other photographs of the same building. */
export const BAND_IMAGE = null;
