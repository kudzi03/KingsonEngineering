/* ═══════════════════════════════════════════════════════════════════════════
   scenes/profiles.js — the confirmed sheeting figures, drawn
   ═══════════════════════════════════════════════════════════════════════════

   A specification table asks a buyer to imagine 686mm over five ribs. A
   section drawn to scale just shows them, and shows the thing a table cannot:
   that an IBR rib is twice the height of a corrugated crest and nearly twice
   as far apart. The numbers become the drawing.

   Everything here is a pure function returning SVG markup, so tools/render.js
   emits it into index.html at author time. The geometry is therefore in the
   document — crawlable, readable with JavaScript off — and the `draw` reveal
   in scenes/reveal.js only animates what is already there.

   ── ON DRAWING ONLY WHAT IS CONSISTENT ────────────────────────────────────

   Corrugated is internally consistent and is drawn exactly: 76mm pitch,
   17.5mm crest, 10.5 corrugations over a 762mm cover.

   IBR is NOT. The returned document gives "Cover width 686 mm, five ribs" and
   "Rib height / pitch 36 mm / 200 mm", and 686 / 5 = 137.2, not 200. Both
   figures cannot describe the same sheet.

   So the IBR section is drawn from the set that IS consistent — 686mm cover,
   five ribs, 36mm rib height — and the drawing is annotated with those only.
   The 200mm figure is not drawn and is not annotated here. It stays in the
   specification table, which is a faithful transcript of what Kingson wrote,
   and it is logged as a verification item in SOURCE_OF_TRUTH.md §G. Guessing
   which of the two the office meant is exactly the thing this project does
   not do.
   ═══════════════════════════════════════════════════════════════════════════ */

/* All coordinates are millimetres. The viewBox is millimetres too, so both
   sections share one scale and the comparison between them is honest. */
const W = 968;          // drawing width, mm — room for a right-hand dimension
                        // and its label; corrugated draws to 798mm, so the
                        // 17.5mm callout needs ~150mm of clear space after it
const BASE = 92;        // the datum line, mm from the top of the viewBox
const H = 196;          // tall enough for two stacked dimension lines below

const f = (n) => (Math.round(n * 100) / 100).toString();
const poly = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)} ${f(y)}`).join(' ');

/* ── IBR ──────────────────────────────────────────────────────────────────────
   Cover 686mm over five ribs → 137.2mm rib spacing. Rib 36mm high, drawn as
   the trapezoid an inverted box rib actually is.                            */

export function ibr() {
  const cover = 686, ribs = 5, hgt = 36;
  const pitch = cover / ribs;              // 137.2
  const top = 30, flank = 13;              // rib crown width and slope run
  const pan = pitch - top - flank * 2;     // the flat between ribs

  const pts = [[0, BASE]];
  let x = 0;
  for (let i = 0; i < ribs; i++) {
    x += pan;              pts.push([x, BASE]);
    x += flank;            pts.push([x, BASE - hgt]);
    x += top;              pts.push([x, BASE - hgt]);
    x += flank;            pts.push([x, BASE]);
  }
  return { d: poly(pts), cover, ribs, hgt, pitch, end: x };
}

/* ── corrugated ───────────────────────────────────────────────────────────────
   76mm pitch, 17.5mm crest, 10.5 corrugations. Sampled, not approximated with
   arcs, so the wave is the wave.                                           */

export function corrugated() {
  const pitch = 76, hgt = 17.5, n = 10.5, cover = 762;
  const pts = [];
  const span = pitch * n;
  for (let x = 0; x <= span + 0.01; x += 2) {
    const y = BASE - (hgt / 2) * (1 - Math.cos((2 * Math.PI * x) / pitch));
    pts.push([x, y]);
  }
  return { d: poly(pts), cover, pitch, hgt, n, end: span };
}

/* ── the three confirmed flashings ───────────────────────────────────────────
   §4 confirms ridge, barge and valley as standard items and a 3 000mm maximum
   fold length. These are the folds themselves, in section — line geometry,
   the way they would be given to the folder. Proportions are indicative of
   each type; no leg length is stated anywhere, because none was confirmed. */

export const FLASHINGS = [
  { name: 'Ridge',  d: poly([[8, 74], [58, 20], [108, 74]]) },
  { name: 'Barge',  d: poly([[10, 18], [10, 60], [66, 60], [66, 76], [104, 76]]) },
  { name: 'Valley', d: poly([[8, 22], [40, 72], [76, 72], [108, 22]]) }
];

/* ── markup ─────────────────────────────────────────────────────────────────── */

const dim = (x1, x2, y, label) => `
      <g class="pf-dim" data-draw-fade>
        <path d="M${f(x1)} ${f(y - 8)}L${f(x1)} ${f(y + 8)}"/>
        <path d="M${f(x2)} ${f(y - 8)}L${f(x2)} ${f(y + 8)}"/>
        <path d="M${f(x1)} ${f(y)}L${f(x2)} ${f(y)}"/>
        <text x="${f((x1 + x2) / 2)}" y="${f(y - 14)}">${label}</text>
      </g>`;

/** One sheeting section, drawn to scale with its confirmed dimensions. */
export function section(kind) {
  const p = kind === 'ibr' ? ibr() : corrugated();
  const scale = W / 840;
  /* Heights are dimensioned clear of the sheet, to the right of where it ends,
     the way they would be on a drawing. Widths stack below the datum. */
  const vdim = (x, top, label) => `
      <g class="pf-dim" data-draw-fade>
        <path d="M${f(x - 7)} ${f(BASE)}L${f(x + 7)} ${f(BASE)}"/>
        <path d="M${f(x - 7)} ${f(top)}L${f(x + 7)} ${f(top)}"/>
        <path d="M${f(x)} ${f(BASE)}L${f(x)} ${f(top)}"/>
        <text x="${f(x + 12)}" y="${f((BASE + top) / 2 + 7)}" text-anchor="start">${label}</text>
      </g>`;

  const dims = kind === 'ibr'
    ? dim(0, p.cover, BASE + 38, '686 mm cover')
      + dim(p.pitch * 2, p.pitch * 3, BASE + 88, '5 ribs')
      + vdim(p.end + 30, BASE - p.hgt, '36 mm')
    : dim(0, p.cover, BASE + 38, '762 mm cover')
      + dim(0, p.pitch, BASE + 88, '76 mm pitch')
      + vdim(p.end + 30, BASE - p.hgt, '17.5 mm');

  return `<svg class="pf" viewBox="0 0 ${W} ${H}" role="img"
     aria-label="${kind === 'ibr'
       ? 'Section through IBR sheeting: five ribs 36 mm high across a 686 mm cover width.'
       : 'Section through corrugated sheeting: 10.5 corrugations at 76 mm pitch and 17.5 mm crest height across a 762 mm cover width.'}"
     preserveAspectRatio="xMidYMid meet">
      <path class="pf-datum" data-draw-fade d="M0 ${BASE}L${W} ${BASE}"/>
      <path class="pf-line" data-draw-path d="${p.d}"/>${dims}
    </svg>`;
}

/** The three confirmed flashing folds, in section. */
export function flashings() {
  return FLASHINGS.map((fl) => `<figure class="pf-fold">
        <svg viewBox="0 0 116 92" role="img" aria-label="${fl.name} flashing, shown in section as a folded profile.">
          <path class="pf-line" data-draw-path d="${fl.d}"/>
        </svg>
        <figcaption>${fl.name}</figcaption>
      </figure>`).join('\n      ');
}

/* ── the laser bed, to scale ──────────────────────────────────────────────────
   The confirmed bed is 3 000 × 1 500 mm. A sentence says so; a rectangle drawn
   at that ratio with parts nested inside it shows what it means — which is the
   question a buyer is actually asking ("will my part fit?").

   THE PARTS ARE INDICATIVE AND THE DRAWING SAYS SO. They are ordinary
   fabrication shapes — a gusset, a flange plate, a bracket — not a Kingson job,
   not a customer's part, and not presented as either. Faking a nesting from a
   real order would be inventing a project, and there is no photograph of a
   nest to trace. What IS confirmed is the bed size, and that is what the
   drawing dimensions.                                                       */

const BED_W = 3000, BED_H = 1500;
const BED_PAD = 190;   // room for the dimension lines outside the bed

/** A rounded-corner rectangle path, in mm. */
const rect = (x, y, w, h, r = 0) => r
  ? `M${f(x + r)} ${f(y)}H${f(x + w - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(y + r)}` +
    `V${f(y + h - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w - r)} ${f(y + h)}` +
    `H${f(x + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x)} ${f(y + h - r)}` +
    `V${f(y + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + r)} ${f(y)}Z`
  : `M${f(x)} ${f(y)}H${f(x + w)}V${f(y + h)}H${f(x)}Z`;

const circle = (cx, cy, r) =>
  `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(r * 2)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-r * 2)} 0`;

/* Ordinary fabrication shapes, laid out inside the bed. */
const PARTS = [
  /* a gusset: right triangle with the corner taken off */
  `M340 250L1040 250L1040 700L640 950L340 950Z`,
  /* a flange plate with a bolt pattern */
  rect(1180, 250, 700, 430, 26),
  circle(1290, 360, 46), circle(1770, 360, 46),
  circle(1290, 570, 46), circle(1770, 570, 46),
  /* a long bracket */
  rect(2020, 250, 640, 190, 18),
  rect(2020, 500, 640, 180, 18),
  /* two small plates */
  rect(1180, 790, 330, 330, 20),
  rect(1610, 790, 270, 330, 20),
  /* a slotted strap */
  rect(2020, 790, 640, 160, 22),
  circle(2140, 870, 44), circle(2540, 870, 44)
];

/** The bed at 3 000 × 1 500 mm, with indicative parts nested in it. */
export function bed() {
  const W = BED_W + BED_PAD * 2;
  const H = BED_H + BED_PAD * 2;
  const x0 = BED_PAD, y0 = BED_PAD;

  const parts = PARTS.map((d, i) =>
    `      <path class="bed-part" data-draw-path style="--d:${i * 70}ms" d="${d.replace(/^M(\d)/, (m, g) => 'M' + g)}"/>`
  ).join('\n');

  return `<svg class="bed" viewBox="0 0 ${W} ${H}" role="img"
     aria-label="The fiber laser bed drawn to scale at 3 000 by 1 500 millimetres, with indicative fabrication parts nested inside it."
     preserveAspectRatio="xMidYMid meet">
      <path class="bed-plate" d="${rect(x0, y0, BED_W, BED_H)}"/>
      <g transform="translate(${x0} ${y0})">
${parts}
      </g>
      <g class="pf-dim" data-draw-fade>
        <path d="M${x0} ${y0 + BED_H + 70}L${x0 + BED_W} ${y0 + BED_H + 70}"/>
        <path d="M${x0} ${y0 + BED_H + 54}L${x0} ${y0 + BED_H + 86}"/>
        <path d="M${x0 + BED_W} ${y0 + BED_H + 54}L${x0 + BED_W} ${y0 + BED_H + 86}"/>
        <text x="${x0 + BED_W / 2}" y="${y0 + BED_H + 148}">3 000 mm</text>
      </g>
      <g class="pf-dim" data-draw-fade>
        <path d="M${x0 + BED_W + 70} ${y0}L${x0 + BED_W + 70} ${y0 + BED_H}"/>
        <path d="M${x0 + BED_W + 54} ${y0}L${x0 + BED_W + 86} ${y0}"/>
        <path d="M${x0 + BED_W + 54} ${y0 + BED_H}L${x0 + BED_W + 86} ${y0 + BED_H}"/>
        <text x="${x0 + BED_W + 106}" y="${y0 + BED_H / 2 + 30}" text-anchor="start">1 500 mm</text>
      </g>
    </svg>`;
}
