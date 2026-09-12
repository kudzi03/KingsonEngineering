# Kingson Engineering — creative elevation

Not a redesign. The current build works: navigation is clear, the six services
are right, the 29 specification figures are confirmed, the enquiry converts,
the FAQ is useful, the photography is real. None of that gets discarded.

What it lacks is an experience. This is the plan to give it one.

---

## 1. The audit, measured

Run against the live site at 1440×900. Not an impression — numbers.

| Measurement | Result |
|---|---|
| Page height | 9 829px = **10.9 screens** |
| Screens where photography fills ≥60% of the viewport | **1 of 11** |
| Screens where photography fills **under 20%** | **7 of 11** |
| Discrete card rectangles drawn | **42** |
| Section transitions using the identical centred eyebrow + h2 + lede | **11 of 11** |

Photography per screen, top to bottom:

```
78%  17%  26%  41%   0%  54%   2%   0%   0%   0%   1%
 ▲                    ▲                   ▲
hero              specifications      enquiry / FAQ / contact
```

After screen 5 the site is a white text document. That is the whole problem in
one line.

## 2. The five weakest moments

**① The hero is the most conventional pattern on the web.** Full-bleed
photograph, dark scrim, left-aligned text block. 78% photography and zero
authorship. Nothing is entered; a background is observed.

**② The 29 confirmed figures — the strongest proof Kingson has — are 13.5px
table rows inside collapsed accordions on white.** ±0.1 mm, 25 tonnes,
3 000 × 1 500 mm, 12 m. The most valuable content is the least visible.

**③ The evidence is thumbnailed.** Eight photographs at 232px tall in a
3-column grid. The laser — which has *five* photographs available — gets one
tile. So does the crane.

**④ 1.23 screens of process and 3.3 screens of enquiry/FAQ/contact carry no
photograph at all.** The arc dies at screen 5 and the page ends as a form and
a list.

**⑤ Every section is the same object.** Padding, centred eyebrow, centred h2,
centred lede, grid of cards. Eleven times. There is no sequence, so there is
no memory of it.

## 3. The constraint that shapes the art direction

Six of the nine photographs are **3:4 portrait**. Three are landscape.

| Photograph | Ratio | Full-bleed at 1440×780 shows |
|---|---|---|
| roofFrame | 1.85 | 100% of height |
| roofTrusses | 1.67 | 90% |
| portalFrame | 1.49 | 81% |
| crane, laserFloor, cuttingHead, nestingStation, gantry, laserMachine | 0.75 | **41% of height** |

This is a phone-camera library, not a commissioned wide shoot. Schuff and
Walters have commissioned photography; Kingson does not, and faking it is not
available.

**So the direction makes a virtue of portrait: vertical plates.** Industrial
language is already vertical — columns, stanchions, sheet stacks, the travel of
a laser bed. A composition built from tall vertical plates reads as
*structural*. A 0.75 source hard-cropped to a 16:9 band reads as a mistake.

- The three landscape photographs carry the **full-bleed** moments.
- The six portrait photographs carry **full-height vertical plates** in split
  compositions, where their whole frame is used.
- On a phone, portrait is the native format: full-bleed there.

## 4. The signature experience — structural assembly

**STEELWORK. BUILT HERE.**

A portal frame assembles itself once on load, in about 2.6 seconds, inside the
hero's own height. Base plates → columns → rafters → purlins → sheeting. Then
the geometry's sheeting planes hand over to the real portal-frame photograph:
model becomes the actual building.

Rules it obeys, because the last attempt at a cinematic hero was rejected for
breaking all of them:

- **It does not touch the scroll.** No pin, no scrub, no 620vh stage. It plays
  on load and it is done. Scrolling scrolls.
- **The website is not hidden inside it.** The wordmark, the navigation, the
  h1, the supporting line and the primary CTA are static DOM, present and
  readable at frame one. The geometry builds *behind* them.
- **It is not sci-fi.** Members are I-sections with flanges and a web, flat-shaded
  against one light direction — solid steel with mass, not a glowing wireframe.
- **It is representative, not a claim.** Procedural geometry of a generic portal
  frame. It is never captioned as a completed Kingson project.

**No Three.js.** A portal frame is straight prismatic members under a fixed
camera. That is a hand-written 3×4 projection, painter's-algorithm depth sort
and flat shading — about 8KB of canvas 2D against ~170KB gzipped for a library
whose scene graph, materials, lights and loaders would all go unused. The
brief asks for real 3D *where justified*. Here it is not.

Progressive enhancement: the photograph is the static state and is already
painted. The canvas layers over it, and is never created at all under
`prefers-reduced-motion` or when 2D context is unavailable.

## 5. Capability chapters

The six confirmed services become five chapters. Nothing is deleted — the
specification figures move to where a buyer meets them, and the full reference
table stays.

| | Chapter | Carries | The moment |
|---|---|---|---|
| 01 | **STRUCTURE** | portalFrame, roofFrame (landscape → full bleed) | Scale first, information second |
| 02 | **FORM** | roofTrusses + **drawn cross-sections** | IBR at 686mm over five ribs and corrugated at 762mm over 10.5 are *drawn to scale*. The confirmed numbers become the diagram |
| 03 | **CUT** | laserFloor, gantry, cuttingHead, nestingStation, laserMachine | **±0.1 MM** as major typography. Dark, precise, fast motion. Five photographs is enough for a real scene |
| 04 | **FABRICATE** | no photographs exist | **3 000 MM** fold length as type, and the 0.4–3.0mm material range drawn as a gauge scale. Honest about the absence |
| 05 | **LIFT** | crane | **25 TONNES** against the crane at full height. Slow, powerful motion |

Large type appears only where the capability earns it: ±0.1 MM, 25 TONNES,
12 M, 3 000 MM. Every one is on the returned document. No invented statistic
gets set large because large numbers are fashionable.

## 6. Motion vocabulary

One module, five reveals, each keyed to the physical nature of what it moves.
Replaces `opacity 0 → 1` + `translateY(40px)` everywhere.

| Reveal | Physics | Used for |
|---|---|---|
| `plate` | clip-path wipe from an edge, heavy ease | panels sliding into place |
| `rise` | type emerging from behind a datum line (mask, not fade) | headings, big figures |
| `settle` | enters at 1.06 scale and settles to 1.0 | photography — a camera settling |
| `draw` | stroke-dashoffset, fast and exact | cut lines, profile geometry |
| `swing` | rotation about a pivot, slow and powerful | the crane, rafters |

Visible by default. The hidden-then-revealed state exists only once the script
has the observer in hand, so JavaScript off or broken leaves a readable page.
`prefers-reduced-motion` disables all of it.

## 7. What is protected, without exception

Navigation. The Get a price / Send the brief CTA. The phone link. The WhatsApp
link. All six services and their confirmed figures. All 29 specification rows.
The ten FAQ answers. The enquiry form, its validation, and its WhatsApp/mail
handoff. Both email addresses. The named contact. Mobile usability. The
publication gate in `tools/check-truth.js`.

The result must be more impressive **and at least as usable**.

## 8. Architecture

Extends what exists; no framework, no rebuild.

```
content/          unchanged role — copy, assets, gated company values
  chapters.js     NEW: the five chapters, composed from existing confirmed data
scenes/           NEW, modular, each independently removable
  assembly.js       the hero's structural geometry
  reveal.js         the motion vocabulary
  profiles.js       IBR / corrugated cross-sections, drawn from the figures
tools/render.js   extended with the chapter regions
```

The enquiry stays behind its own module boundary and keeps composing a message
rather than posting anywhere, so the Milestone 3 pipeline
(`website → API → Supabase → CRM → n8n`) plugs in at one seam without the UI
ever knowing about a database.

## 9. Order of work

1. This plan.
2. The assembly hero. Run it, look at it, refine until it is genuinely good.
3. The motion vocabulary.
4. The five capability chapters.
5. Work as proof, and the workshop moment.
6. Transitions and micro-motion.
7. Mobile composition.
8. Performance and accessibility hardening.

The test at every pass: **if all the copy disappeared, would this still read as
a serious steel fabricator?** If not, the direction is not strong enough yet.

---

# Results, measured

Same instruments as §1, run against the finished build.

| | Before | After |
|---|---|---|
| Screens where photography fills ≥60% | **1 of 11** | **5 of 16** |
| Discrete card rectangles | **42** | **28** |
| Distinct section compositions | 1 (centred head + grid, ×11) | **8** |
| Text strings over photography below AA | not measured | **0 of 25**, desktop and phone |
| Contrast pairs below AA | 1 | **0 of 44**, desktop and phone |
| Pointer targets under the 24px AA minimum | 0 | **0** |
| LCP | 144ms | **116ms** desktop / **96ms** phone |
| CLS | 0.0003 / 0.0213 | **0.0000 / 0.0000** |
| Initial transfer | 610 KB | **611 KB** desktop / **501 KB** phone |

Photography per screen, top to bottom:

```
before  78  17  26  41   0  54   2   0   0   0   1
after   79  91  17  16  36  11  36  30   0  69 100  17  53  84   0   1
```

The page is longer — 15.8 screens against 10.9 — because five chapters, three
proof bands and a workshop scene were added. Length was not the complaint;
the complaint was that it read as a catalogue.

## What was built

- **`scenes/assembly.js`** — a portal frame erecting itself once on load,
  ~2.7s, inside the hero's own height. Hand-written solid geometry in canvas
  2D: an I-section is three prisms, depth-sorted by centroid and flat-shaded
  against one light direction, in the red-oxide primer on Kingson's own steel.
  The sheeting sweep becomes a wipe that erases the canvas and uncovers the
  real photograph beneath. No library — a fixed camera over straight prismatic
  members needs a 3×4 projection and a dot product, not a scene graph.
- **`scenes/reveal.js`** — five reveals keyed to physics: `plate`, `rise`,
  `settle`, `draw`, `swing`. No element fades up.
- **`scenes/profiles.js`** — the IBR and corrugated sections drawn to scale
  from the confirmed cover widths and rib heights, at one shared scale, so the
  comparison between them is visible rather than tabulated.
- **`content/chapters.js`** — the five chapters. A build-time assertion fails
  the render if they stop covering all six confirmed services.
- **`content/projects.js`** — the case-study architecture, honestly empty.

## Judgement calls worth recording

**Three re-encodes of the photography were reverted.** Re-compressing the
WebP derivatives at quality 76 saved 11% and dropped one file to 36.2 dB PSNR
— below the ~38 dB where a photograph stops being indistinguishable. A
measurable quality loss for a marginal saving is not an optimisation. The
originals are unchanged.

**The assembly does not run below 900px.** On a 390×675 hero the copy fills
the frame, the receding bays have no horizontal room, and the steel reads as
sticks behind text — worse than no animation. A phone gets the photograph at
full strength immediately, which is the stronger mobile hero and costs no
battery. This is the brief's own instruction, not a shortcut.

**Chapter 01's copy sits in a masthead field, not on a scrim.** Two passes of
scrim-strengthening both failed the pixel probe, because that photograph is a
white-painted roof with rooflights and runs to rgb(255,255,253). A scrim heavy
enough to carry white type over it is heavy enough to destroy it.

**The IBR drawing omits one confirmed figure.** §2 gives both "686 mm cover,
five ribs" and "rib pitch 200 mm", and 686 / 5 = 137.2. Both cannot describe
one sheet. The specification table keeps both, because it is a transcript; the
drawing is built only from the consistent set, and the discrepancy is logged
in SOURCE_OF_TRUTH.md §G for the office to settle.

## Bugs found by measuring rather than looking

- `clip-path: inset(0 0 0 100%)` zeroes an element's intersection area, so the
  IntersectionObserver meant to reveal it can never fire. Four laser
  photographs and a chapter aside were permanently invisible. The `plate`
  reveal now retracts a cover instead.
- A section modifier named `ch-strip` collided with the `<ul class="ch-strip">`
  inside it, so `.ch-strip span` absolutely positioned the chapter's own
  headings out of the composition.
- `.zoom > img { height: 100% }` out-specified every container's own height
  rule on equal specificity and collapsed each photograph to intrinsic size —
  the crane band rendered 1917px tall.
- The whole measured CLS was the body font arriving after first paint. Only
  the display face was preloaded.
