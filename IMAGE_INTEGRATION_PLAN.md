# Integrating the new Kingson photography

Five photographs arrived: three of two workers welding, two of the DXTECH laser
cutting. This is what each one is for, where it goes, and what it proves.

The site currently has nine photographs and **not one person in any of them.**
It has five pictures of the laser and not one of it cutting. That is the gap
these five close, and it is the reason they are not going into the gallery.

---

## What the current page is missing

Measured against the deployed build (`index.html` byte-identical to
`https://kingson-engineering.vercel.app/` at `c552fed`), two sections are doing
visibly less than the rest.

### 1. Chapter 03 — CUT

The section is 1 211 px tall at 1440. The upper-left half of it — roughly
620 × 380 px — is flat black with nothing in it. `±0.1 MM` sits on that black
with no object anywhere near it. The four photographs are 24vw thumbnails
pushed to the bottom of the band, and all four show the machine **switched
off**: a bed, a carriage, a head parked over plate, a monitor.

So the chapter that claims a cutting tolerance shows no cutting.

### 2. The workshop

The headline reads **"This is where the work happens."** The photograph beside
it is an empty machine in an empty room. Nobody is in it. It is the one section
on the page whose picture contradicts its own sentence.

Everything else — the hero, the portal frame bleed, the roof sections, the fold
drawings, the crane plate, the project bands — is carrying its weight and is
not being touched.

---

## The four that ship, and the one that does not

| Source | Slug | What it proves | Where |
|---|---|---|---|
| low-angle, two welders, workshop roof above them, arc burning | `welding-bay` | Kingson fabricates in-house, with its own people | **Workshop** — the dominant frame |
| the same pair over a grating panel, `KINGSON ENGINEERING` legible on the overalls | `welding-hands` | those are Kingson's own staff, not a stock crew | **Workshop** — the second, tighter frame |
| the laser wide, spark burst on the sheet, DXTECH badge and bed geometry | `laser-cutting` | the machine is real and it is running | **Chapter 03** — the establishing frame, carrying `±0.1 MM` |
| the cutting head close, sparks off the nozzle | `laser-sparks` | precision is physically happening | **Chapter 03** — the last frame in the strip |
| third welding frame, same pair, similar angle to `welding-hands` | — | nothing the second one does not already prove | **held back** |

Two welding, two laser. The third welding shot is a near-duplicate of the one
chosen; publishing both would be padding, and the brief's own test — *what does
this image prove?* — gives it no answer.

---

## Chapter 03 — the laser scene

**The dead black half becomes the machine.** `laser-cutting` opens the chapter
as a full-width establishing band, and `±0.1 MM` is set across it — low left,
on the sheet, clear of the cutting head. The copy and the specification table
follow underneath on solid black.

The first attempt put the photograph behind the copy and the table as well. It
was dropped: a five-row data table over a photograph is a readability problem
invented for no gain, and the figure was the only thing that needed to be on
the machine. The tolerance belongs to that machine, so it is written on it; the
specifications are reference, so they sit where reference reads best.

Band geometry is the other thing measured rather than assumed. A 620 px band at
1440 is 2.32:1, which re-crops the 16:9 file by 23% of its height — and takes
exactly the DXTECH badge off the top and the sparks off the bottom. The band
now takes the file's own 16:9, so the frame arrives whole.

**The strip becomes a sequence rather than four parked objects.** The chapter is
titled *Straight from your file*, so the row reads in that order:

```
nesting-station  →  laser-floor  →  gantry  →  laser-sparks
the file            the machine     the carriage   the cut
```

`cutting-head` — the head parked over plate, not cutting — leaves the strip.
`laser-sparks` is the same subject doing the work.

This was written on the assumption that `cutting-head` would still be visible
in the gallery. It would not have been, and the assumption was wrong in a way
worth recording — see **What the build turned up** below.

Contrast has to be measured after this, not assumed: white type over a
photograph is where readability goes wrong. The scrim gets tuned until every
pair on the band clears 4.5:1 against the pixels actually behind the text.

## The workshop — two frames

`welding-bay` replaces `laser-machine` as the dominant frame. It is the brief's
own hero candidate and it is the right one: it has the workshop's roof steel in
it, two people in it, and an arc burning in it. The headline stops being a
claim and becomes a caption.

`welding-hands` sits as a second, smaller frame overlapping the first. It is
there for one reason: the overalls say `KINGSON ENGINEERING`, which is the
difference between *a* workshop and *this* workshop.

`laser-machine` is displaced from here, and — same mistake as above — does not
land anywhere else.

The copy does not change. "One workshop at No. 1262 Tynwald Industries. The
laser, the folder and the fabrication bays are under one roof" is confirmed and
is now supported rather than contradicted. No About Us prose is being added.

---

## What is deliberately not happening

**Chapter 04 does not get a welding photograph.** It is titled *Folded, welded,
finished* and it would be the obvious drop. But chapter 04 covers balustrades,
gates and stainless work, and these photographs show two men welding a **steel
grating panel**. Put one under that heading and the page implies Kingson
supplied a balustrade it did not supply — the exact substitution
`content/assets.js` was written to prevent. The chapter keeps its drawn fold
geometry until Kingson sends a photograph of a balustrade.

**The work section is not restructured.** Its full-width project bands are
project proof already and they are carrying their weight. Nothing there needed
this photography.

**Nothing new is preloaded.** The hero is the only eager asset on the page and
stays that way. All four new frames are below the fold and load lazily.

**No retouching.** Crop to remove nothing but letterbox rows, resize, WebP at
the same quality 78 the other nine use. No LUT, no grain, no glow, no
background work, no sharpening beyond the resample. The DXTECH badge, the
workwear lettering and the spark paths are evidence and are left exactly as
photographed.

---

## What the build turned up

Two claims above were wrong, and finding out how was the most useful part of
this job.

**There is no gallery.** `GALLERY` in `content/assets.js` described "eight
tiles, the first spanning two columns". No such grid is on the page — the work
section became full-width project bands at some point and the constant was
never updated. Its only remaining consumer is `sitemap.xml`, which declares an
`<image:image>` per entry.

So "it stays in the gallery" was not a smaller placement. It was no placement.
Moving `cutting-head` and `laser-machine` out of the strip and the workshop
took them off the site entirely — while `sitemap.xml` went on telling search
engines the home page showed them, and said nothing about the two welding
frames that were now on it. Wrong in both directions, and invisible in a
browser: only a crawler ever sees that list.

Fixed rather than worked around:

- `GALLERY` is now `PAGE_IMAGES`, and its comment says what it is for.
- Its contents are the eleven photographs the home page actually carries.
- `tools/check-truth.js` asserts both directions — every listed photograph is
  on the page, every photograph on the page is listed. Both halves were tested
  by breaking them: the gate fails with the offending key named.

`cutting-head` and `laser-machine` are now genuinely not published. That is the
right answer for both — one is the idle version of `laser-sparks`, the other
the idle version of `laser-cutting` — but it is a decision, not a side effect,
and it should read as one.

**The dedicated laser route had the same defect as the chapter.** `hero:
'laserFloor'` and a strip of three parked machines: the page someone reaches by
searching for laser cutting in Harare opened on a switched-off bed. It now
opens on `laser-cutting` and its strip is the machine, the head mid-cut and the
nested file. Same substitution as the home page, for the same reason.

---

## Build

The existing pipeline takes them unchanged:

1. the four `.jpeg` files at the repository root,
2. a line each in `JOBS` in `tools/build-images.py`,
3. a `focal` anchor and an `alt` in `content/assets.js`,
4. `welding-bay` and `laser-cutting` added to `WIDE_SLUGS` — both are shown as
   wide bands above 900 px, and a 3:4 portrait dropped into a 1440 × 765 frame
   downloads 2.4 megapixels to paint 1.0,
5. `python3 tools/build-images.py`, then `node tools/render.js`,
6. `node tools/check-truth.js` — which will fail if the declared dimensions and
   the built files disagree.

`focal` is set per photograph so the mobile crop keeps the thing that matters:
the arc on `welding-bay`, the overalls lettering on `welding-hands`, the nozzle
and the spark burst on the two laser frames. Not one of them is left to
`object-fit: cover` with default centring.

## Alt text

Written to the standard the other nine hold — what is visible, and nothing
about clients, capabilities or capacities:

- **welding-bay** — Two Kingson Engineering workers welding a steel grating
  panel on the floor of the Harare workshop, seen from low down with the
  workshop's roof trusses and sheeting above them.
- **welding-hands** — Two workers crouched over a steel grating panel, one
  holding a welding shield and striking an arc, the other steadying the panel;
  the overalls are lettered KINGSON ENGINEERING.
- **laser-cutting** — A DXTECH fiber laser cutting steel sheet, sparks thrown
  from the nozzle across the plate, with the slatted bed below and gas
  cylinders against the workshop wall behind.
- **laser-sparks** — The cutting head of the DXTECH fiber laser close up,
  sparks off the nozzle and the cut line running out across the sheet.

## Verification

Desktop and phone screenshots of both changed sections before and after;
contrast measured from rendered pixels behind every piece of text on the new
laser band; the truth gate; and page weight compared against the current build
so the new photography is not paid for twice.
