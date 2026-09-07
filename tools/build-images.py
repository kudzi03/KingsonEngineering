#!/usr/bin/env python3
"""
Build the WebP derivatives the page loads, from the original photographs at the
repository root.

Run from the repository root:   python3 tools/build-images.py
Requires:                       pip install pillow

WHAT IT DOES

  · Crops the screenshot letterbox off the two photographs that were saved out
    of a phone gallery — warehouse.jpeg and trusses.jpeg both carry a large
    black band and a "Kingson Engineering" caption across the bottom half. The
    CROP boxes below remove it. Nothing else is retouched.

  · Writes each photograph at 440, 720 and 1100 px wide plus its native width,
    as WebP quality 78. Those are the widths the srcset attributes in
    index.html expect: <slug>-<width>.webp.

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

try:
    from PIL import Image, ImageOps
except ImportError:
    raise SystemExit('This script needs Pillow:  pip install pillow')

OUT_DIR = 'assets/img'
WIDTHS = [440, 720, 1100]
QUALITY = 78

# (source file, slug, crop box or None)
JOBS = [
    ('portalframe.jpeg', 'portal-frame',    None),
    ('craneyard.jpeg',   'crane',           (0, 26, 1320, 1794)),   # thin black bar at the top
    ('laser.jpeg',       'laser-machine',   None),
    ('workshop.jpeg',    'laser-floor',     None),
    ('nesting.jpeg',     'nesting-station', None),
    ('gantry.jpeg',      'gantry',          None),
    ('cuttinghead.jpeg', 'cutting-head',    None),
    ('warehouse.jpeg',   'roof-frame',      (0, 0, 1320, 714)),     # drops the black band + caption
    ('trusses.jpeg',     'roof-trusses',    (0, 0, 1320, 792)),     # drops the black band + caption
    ('structure.jpeg',   'material-tube',   None),                  # stock collage — reference only
    ('crane.jpeg',       'material-sheet',  None),                  # stock collage — reference only
]


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
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

        manifest[slug] = {'source': src, 'w': w0, 'h': h0, 'sizes': widths,
                          'cropped': bool(box)}
        print('  %-16s %4d x %-4d  ->  %s' % (slug, w0, h0, widths))

    with open('%s/manifest.json' % OUT_DIR, 'w') as f:
        json.dump(manifest, f, indent=1)

    print('\n%d files, %.1f MB total (a single page load pulls a fraction of this)'
          % (sum(len(v['sizes']) for v in manifest.values()), total / 1048576))
    print('srcset entries are  assets/img/<slug>-<width>.webp')


if __name__ == '__main__':
    main()
