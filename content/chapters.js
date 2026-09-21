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

   `route` is the dedicated page for that chapter's service. A chapter is the
   short version; the route is where someone who has decided they need that one
   thing goes next, and the link between them is the site's main internal
   linking.

   `scene` is a single establishing photograph a chapter opens on, full width,
   with its large figure set across it. Only CUT has one, because only CUT had
   a dead half to fill and a machine worth showing at that size.

   `photos` is what real Kingson photography can carry. FABRICATE has none,
   because Kingson supplied no photograph of a balustrade, a gate or a
   stainless job, and the two stock collages in this repository are not
   Kingson's work. That chapter is carried by drawn fold geometry instead —
   which is honest, and for a folder arguably more useful than a photograph.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── the one chapter ─────────────────────────────────────────────────────────
   There were five, one per service, running 01 to 05. They came out, and this
   is why.

   The page carried TWO numbered 01–05 sequences: these chapters, and the five
   commitments under "What happens after you send it". One was six services
   dressed as a sequence; the other is a real sequence. A reader met `03` twice
   on one page meaning unrelated things.

   They were also redundant three times over. Every figure they stated is in
   the specification table below them — checked row by row before they were
   removed. Every service they described has its own page, which says more:
   the fabrication chapter's opening sentence was word for word the service
   page's. And between them they cost seven screens before a visitor could
   find out whether Kingson makes the thing they came about, which is now the
   chooser's job and takes one.

   The laser survives because it is not redundant. It is the machine nobody
   else in Harare has, it is the only chapter with photographs of the work
   actually happening, and ±0.1 mm is the number the whole site is built on.
   It has no number any more — there is nothing to be third of. */

export const CHAPTERS = [
  {
    id: 'cut', route: 'fiber-laser-cutting-harare', name: 'Cut', ground: 'dark',
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
    /* `scene` is the establishing frame: the machine actually cutting, carrying
       the tolerance across it. Before it existed this chapter opened on 380px
       of black and stated ±0.1 MM next to nothing.

       The strip then reads in the order the chapter's own title describes —
       the file, the machine, the carriage, the cut. `cuttingHead` leaves it:
       it is the head parked over plate, and `laserSparks` is the same subject
       doing the work. It keeps its place in the gallery. */
    media: {
      kind: 'strip', scene: 'laserCutting',
      photos: ['nestingStation', 'laserFloor', 'gantry', 'laserSparks']
    }
  }
];

/* What the chapters cover. It is no longer every service — that guarantee
   moved to the chooser, which lists all six by construction — but render.js
   still checks that anything a chapter claims is a real confirmed service, so
   a chapter cannot quietly describe something Kingson does not do. */
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
  /* This section's headline is "This is where the work happens." It used to
     be set beside `laserMachine` — an empty machine in an empty room — which
     is the one picture on the page that argued with its own sentence.

     One frame, not two. A second, closer frame was set into the corner of
     this one to show the lettering on the overalls; it read as a sticker on
     top of the photograph rather than as part of the section, and it cost the
     big frame the bottom third where the arc is. The wide frame already has
     two men, an arc and the workshop's roof steel in it, which is the whole
     claim. `weldingHands` stays in the repository. */
  photo: 'weldingHands'
};
