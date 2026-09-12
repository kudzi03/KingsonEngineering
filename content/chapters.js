/* ═══════════════════════════════════════════════════════════════════════════
   content/chapters.js — the six confirmed services, staged as five chapters
   ═══════════════════════════════════════════════════════════════════════════

   The previous build presented six equal cards in a grid. Everything was
   there and nothing was memorable. These are the same six services — nothing
   is dropped, no figure is lost — sequenced so a visitor is taken through
   scale, then capability, then precision, then material, then lifting.

   Every figure below is on the returned document. `SPECS` in copy.js remains
   the full transcript of all 29; these are the handful a buyer of that
   particular work asks about first.

   `hero` is a single large figure. It exists only where the capability earns
   one — a tolerance, a lifting capacity, a fold length, a sheet length — and
   never because large numbers look good. There is no invented statistic here
   and there is no round-number flourish.

   `photos` is what real Kingson photography can carry. FABRICATE has none,
   because Kingson supplied no photograph of a balustrade, a gate or a
   stainless job, and the two stock collages in this repository are not
   Kingson's work. That chapter is carried by drawn fold geometry instead —
   which is honest, and for a folder arguably more useful than a photograph.
   ═══════════════════════════════════════════════════════════════════════════ */

export const CHAPTERS = [
  {
    n: '01', id: 'structure', name: 'Structure', ground: 'dark',
    covers: ['Structural steelwork'],
    title: 'Frames that carry the building.',
    body: 'Portal frames, columns, rafters and purlins — set out, fabricated in the workshop, and erected on site with our own crane.',
    ask: 'Send drawings, or the span, height and bay spacing.',
    figures: [['Portal frame programme', 'six to ten weeks'],
              ['Erection', 'Harare and nationally']],
    media: { kind: 'bleed', photos: ['roofFrame'] }
  },

  {
    n: '02', id: 'form', name: 'Form', ground: 'light',
    covers: ['Roof steelwork and trusses'],
    title: 'Two profiles, cut to your roof.',
    body: 'Trusses, purlins and sheeting for long-span roofs, new build or re-roof. IBR and corrugated, galvanised or pre-painted, cut to length before it leaves the workshop.',
    ask: 'Send the floor area, the pitch you want, and whether the walls are up.',
    hero: { value: '12 M', label: 'maximum sheet length' },
    /* Rib and crest heights are here as well as on the drawing, because below
       900px the drawn annotations are hidden — see styles/site.css. Every
       figure the section draws is also stated in type. */
    figures: [['IBR cover', '686 mm, five ribs'],
              ['IBR rib height', '36 mm'],
              ['Corrugated cover', '762 mm, 10.5 corrugations'],
              ['Corrugated crest', '17.5 mm at 76 mm pitch'],
              ['Minimum pitch, IBR', '5°; 7° with side laps'],
              ['Minimum pitch, corrugated', '10°; 12° exposed']],
    /* The two sections are drawn to scale from these same figures by
       scenes/profiles.js, at one shared scale so the comparison is honest. */
    media: { kind: 'sections', photos: ['roofTrusses'] }
  },

  {
    n: '03', id: 'cut', name: 'Cut', ground: 'dark',
    covers: ['Fiber laser cutting'],
    title: 'Straight from your file.',
    body: 'Plate and sheet cut on a DXTECH fiber laser — nested from the drawing you send and cut on a 3 000 × 1 500 mm bed. Mild steel, stainless, aluminium and galvanised sheet.',
    ask: 'Send a DXF, DWG, STEP or PDF with the material and thickness.',
    hero: { value: '±0.1 MM', label: 'cutting tolerance, repeating to ± 0.03 mm' },
    figures: [['Mild steel', '20 mm on oxygen'],
              ['Stainless steel', '10 mm on nitrogen'],
              ['Aluminium', '8 mm on nitrogen'],
              ['Galvanised sheet', '4 mm on nitrogen'],
              ['Files accepted', 'DXF · DWG · STEP · PDF']],
    media: { kind: 'strip', photos: ['laserFloor', 'gantry', 'cuttingHead', 'nestingStation'] }
  },

  {
    n: '04', id: 'fabricate', name: 'Fabricate', ground: 'light',
    covers: ['Balustrades and gates', 'Stainless fabrication'],
    title: 'Folded, welded, finished.',
    body: 'Balustrading, handrails, gates and stainless work, fabricated to your opening and finish. Sheet is folded in-house, and flashings are made to match the roof they go on.',
    ask: 'Send the opening dimensions and a photograph of the site, or a sketch.',
    hero: { value: '3 000 MM', label: 'maximum fold length' },
    figures: [['Material range', '0.4 – 3.0 mm'],
              ['In', 'mild steel · galvanised · stainless · aluminium'],
              ['Standard flashings', 'ridge · barge · valley'],
              ['Flashing lead time', '3 – 5 days on a stock gauge']],
    media: { kind: 'folds', photos: [] }
  },

  {
    n: '05', id: 'lift', name: 'Lift', ground: 'dark',
    covers: ['Mobile cranage'],
    title: 'Lifted and set with our own crane.',
    body: 'One telescopic mobile crane, worked on our own erection contracts and hired out for other jobs. Delivery outside Harare is national, with transport priced per load.',
    ask: 'Tell us the load, the site access and the date.',
    hero: { value: '25 TONNES', label: 'lifting capacity' },
    figures: [['Crane type', 'telescopic mobile'],
              ['Cranes', 'one'],
              ['Erection area', 'Harare and nationally']],
    media: { kind: 'plate', photos: ['crane'] }
  }
];

/* The chapters must between them cover every confirmed service, or a service
   has silently vanished from the site. render.js asserts this. */
export function coverage() {
  return CHAPTERS.flatMap((c) => c.covers);
}

/* ── the workshop ────────────────────────────────────────────────────────────
   Place, not an About Us. The address is confirmed; everything else here is
   what the photograph shows.                                                */

export const WORKSHOP = {
  eyebrow: 'The workshop',
  place: 'Tynwald Industries',
  city: 'Harare',
  title: 'This is where the work happens.',
  body: 'One workshop at No. 1262 Tynwald Industries. The laser, the folder and the fabrication bays are under one roof, and the crane goes out from the same yard.',
  figures: [['Open', 'Monday to Saturday, 07:30 – 17:00'],
            ['Ask for', 'Mr Murandu']],
  photo: 'laserMachine'
};
