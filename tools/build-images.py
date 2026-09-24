#!/usr/bin/env python3
"""
Build the WebP derivatives the page loads, from the original photographs at the
repository root.

Run from the repository root:   python3 tools/build-images.py
Requires:                       pip install pillow

WHAT IT DOES

  · Crops the screenshot letterbox off the photographs that were saved out of a
    phone gallery. warehouse.jpeg and trusses.jpeg carry a large black band and
    a "Kingson Engineering" caption across the bottom half; portalframe,
    craneyard and gantry carry a few black rows at one or both edges. The CROP
    boxes below remove them, and they are what the shipped derivatives were
    built from — changing one changes the declared height in
    content/assets.js too. Nothing else is retouched.

  · Writes each photograph at 440, 720, 900 and 1100 px wide plus its native
    width, as WebP quality 78. 900 is there because several frames land at
    about 750 CSS px on a laptop — 52vw of 1440 — and without it those frames
    jumped to the 1100 file and paid 90 KB for pixels nobody sees. Those are the widths the srcset attributes in
    index.html expect: <slug>-<width>.webp.

  · Writes a WIDE derivative for the photographs that carry a full-bleed scene
    or a full-width band: <slug>-wide-<width>.webp, cropped to 16:9 around the
    same band the page was already showing. Seven of the nine photographs came off a phone in portrait, and a
    portrait photograph dropped into a 1440 x 765 frame is two thirds wasted
    bytes — the browser downloads 2.4 megapixels and paints 1.0. The crop is
    art direction, not retouching: the same frame, composed for the shape it
    is actually shown in, and only served at 900px and up. Below that the frame
    really is portrait and the original is the right file. Measured: the laser
    workshop hero fell from 405 KB to 144 KB.

  · Writes assets/img/manifest.json with each source's dimensions, so the
    width/height attributes in the HTML can be checked against reality.

ADDING A PHOTOGRAPH

  Put the .jpeg at the repository root, add a line to JOBS, run the script,
  then add the <img> to index.html using the printed widths. Give it a slug
  that says what it shows, not what it was called on the phone.

A NOTE ON WHAT IS REAL

  material-tube and material-sheet are stock collages, not Kingson's own work.
  They are built here because the material range is genuine, but they are
  labelled as reference on the page and excluded from sitemap.xml. Do not move
  them into the project grid. See PHOTOGRAPHY in content.js.
"""
import json
import os
import re

try:
    from PIL import Image, ImageOps
except ImportError:
    raise SystemExit('This script needs Pillow:  pip install pillow')

OUT_DIR = 'assets/img'
WIDTHS = [440, 720, 900, 1100]
QUALITY = 78

# The photographs that carry a full-bleed scene or a full-width band. Nothing
# else gets a wide cut: a 52vw frame is not a band, and a 16:9 file squeezed
# into it would lose its sides.
WIDE_AR = 16 / 9
WIDE_WIDTHS = [900, 1320]
WIDE_SLUGS = ['portal-frame', 'roof-trusses', 'roof-frame', 'laser-floor',
              'gantry', 'crane', 'welding-bay', 'laser-cutting', 'laser-sparks']
# Where a wide cut is composed differently from the photograph's own focal
# point. laser-sparks is framed on the head in the portrait uses, but the
# home page's first screen needs the sparks, which are in the lower third.
WIDE_ANCHOR_Y = {'laser-sparks': 0.70}

# The frame a wide cut is composed for: 1440 x 765, which is what a laptop
# actually shows. Used only to place the crop vertically — see wide_anchor().
WIDE_FRAME_AR = 1440 / 765


def focal_anchors():
    """The `focal` coordinates out of content/assets.js.

    Read rather than repeated. The anchors were chosen against the rendered
    photographs and are already the single source of truth for `object-position`
    everywhere on the site; a second copy here would drift the moment one of
    them is nudged, and the drift would be invisible — a slightly worse crop,
    not an error."""
    text = open('content/assets.js').read()
    out = {}
    for block in re.finditer(r"slug:\s*'([a-z-]+)'.*?focal:\s*\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\]",
                             text, re.S):
        slug, fx, fy = block.group(1), float(block.group(2)), float(block.group(3))
        out.setdefault(slug, (fx, fy))
    return out


def wide_anchor(fy, w0, h0):
    """Where to centre the 16:9 cut so it frames what the page already framed.

    A bleed frame shows the photograph with `object-fit: cover`, which reveals
    a band of height w0 / frame_ratio placed by `object-position: _ fy`. Crop
    around the CENTRE of that band and the wide file is the same picture the
    visitor was already being shown, at 40% of the bytes — rather than a new,
    unreviewed composition that happens to lose the crane's own badge."""
    visible = min(h0, w0 / WIDE_FRAME_AR)
    f = visible / h0
    return max(0.0, min(1.0, fy * (1 - f) + f / 2))


def wide_crop(im, fy):
    """A 16:9 window of the largest size the frame allows, centred on the
    anchor above and clamped inside the picture."""
    w0, h0 = im.size
    ch = min(h0, round(w0 / WIDE_AR))
    cw = min(w0, round(ch * WIDE_AR))
    left = max(0, min(w0 - cw, round(w0 / 2 - cw / 2)))
    top = max(0, min(h0 - ch, round(wide_anchor(fy, w0, h0) * h0 - ch / 2)))
    return im.crop((left, top, left + cw, top + ch))


# (source file, slug, crop box or None)
JOBS = [
    ('portalframe.jpeg', 'portal-frame',    (0, 1, 1320, 889)),    # one black row top, two bottom
    ('craneyard.jpeg',   'crane',           (0, 26, 1320, 1783)),   # black bars top and bottom
    ('laser.jpeg',       'laser-machine',   None),
    ('workshop.jpeg',    'laser-floor',     None),
    ('nesting.jpeg',     'nesting-station', None),
    ('gantry.jpeg',      'gantry',          (0, 0, 1350, 1794)),    # six black rows at the bottom
    ('cuttinghead.jpeg', 'cutting-head',    None),
    ('warehouse.jpeg',   'roof-frame',      (0, 0, 1320, 714)),     # drops the black band + caption
    ('trusses.jpeg',     'roof-trusses',    (0, 0, 1320, 792)),     # drops the black band + caption
    ('weldingbay.jpeg',  'welding-bay',     None),
    ('weldinghands.jpeg', 'welding-hands',  None),
    ('lasercutting.jpeg', 'laser-cutting',  None),
    ('lasersparks.jpeg',  'laser-sparks',   None),
    ('structure.jpeg',   'material-tube',   None),                  # stock collage — reference only
    ('crane.jpeg',       'material-sheet',  None),                  # stock collage — reference only
]


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    anchors = focal_anchors()
    missing = [s for s in WIDE_SLUGS if s not in anchors]
    if missing:
        raise SystemExit('no focal anchor in content/assets.js for: %s' % ', '.join(missing))
    manifest, total = {}, 0

    for src, slug, box in JOBS:
        if not os.path.exists(src):
            print('  SKIP  %s (not found)' % src)
            continue

        im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
        if box:
            im = im.crop(box)
        w0, h0 = im.size

        # never upscale, and always include the native width
        widths = sorted({min(w, w0) for w in WIDTHS} | {w0})

        for w in widths:
            h = round(h0 * w / w0)
            path = '%s/%s-%d.webp' % (OUT_DIR, slug, w)
            im.resize((w, h), Image.LANCZOS).save(path, 'WEBP', quality=QUALITY, method=6)
            total += os.path.getsize(path)

        entry = {'source': src, 'w': w0, 'h': h0, 'sizes': widths,
                 'cropped': bool(box)}

        if slug in WIDE_SLUGS:
            c = wide_crop(im, WIDE_ANCHOR_Y.get(slug, anchors[slug][1]))
            cw0, ch0 = c.size
            wides = sorted({min(w, cw0) for w in WIDE_WIDTHS})
            for w in wides:
                h = round(ch0 * w / cw0)
                path = '%s/%s-wide-%d.webp' % (OUT_DIR, slug, w)
                c.resize((w, h), Image.LANCZOS).save(path, 'WEBP', quality=QUALITY, method=6)
                total += os.path.getsize(path)
            entry['wide'] = {'w': cw0, 'h': ch0, 'sizes': wides}
            print('  %-16s %4d x %-4d  ->  %s   wide %d x %d -> %s'
                  % (slug, w0, h0, widths, cw0, ch0, wides))
        else:
            print('  %-16s %4d x %-4d  ->  %s' % (slug, w0, h0, widths))

        manifest[slug] = entry

    with open('%s/manifest.json' % OUT_DIR, 'w') as f:
        json.dump(manifest, f, indent=1)

    n = sum(len(v['sizes']) + len(v.get('wide', {}).get('sizes', [])) for v in manifest.values())
    print('\n%d files, %.1f MB total (a single page load pulls a fraction of this)'
          % (n, total / 1048576))
    print('srcset entries are  assets/img/<slug>-<width>.webp')
    print('full-bleed scenes also get  assets/img/<slug>-wide-<width>.webp')


if __name__ == '__main__':
    main()
