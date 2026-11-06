#!/usr/bin/env python3
"""
Re-encode Kingson's Topaz-upscaled films for the web and rebuild what is cut
from them: the film posters and the two architectural photographs.

    python tools/build-hd-media.py --input <dir of Topaz outputs> --ffmpeg <binary>

WHAT THE INPUTS ARE

  Every film on the site was supplied at 512 px wide. Each shipped file in
  assets/video (already trimmed and cropped by build-project-media.py) was sent
  through Topaz Video (Higgsfield `topaz_video`, model prob-4): the portrait
  films to 1080 px wide, the wide hero to 3840 x 2160. Topaz restores detail
  the compression lost; it does not add objects, so the films still show only
  Kingson's own work. The input directory holds those outputs named after the
  file they came from: roof-a.mp4, roof-b.mp4, ..., roof-hero-wide.mp4.

  Missing inputs are skipped, so the shipped 512 px file stays in place.

  The architectural photographs' Topaz masters live in source-hd/ beside the
  root photographs (see build-images.py).
"""
import argparse
import json
import subprocess
from pathlib import Path

from PIL import Image, ImageOps

p = argparse.ArgumentParser()
p.add_argument('--input', type=Path, required=True)
p.add_argument('--ffmpeg', default='ffmpeg')
args = p.parse_args()

root = Path(__file__).resolve().parents[1]
video, img = root / 'assets/video', root / 'assets/img'
manifest_path = img / 'manifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))


def run(*o):
    subprocess.run([args.ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', *map(str, o)], check=True)


def derivatives(slug, source, photo, widths):
    photo = ImageOps.exif_transpose(photo).convert('RGB')
    w, h = photo.size
    if w > 2560:
        photo = photo.resize((2560, round(h * 2560 / w)), Image.LANCZOS)
        w, h = photo.size
    sizes = sorted({x for x in widths if x < w} | {w})
    for x in sizes:
        photo.resize((x, round(h * x / w)), Image.LANCZOS).save(img / f'{slug}-{x}.webp', quality=82, method=6)
    manifest[slug] = {'source': source, 'w': w, 'h': h, 'sizes': sizes, 'cropped': False}
    print(f'  {slug:34} {w} x {h} -> {sizes}')


# film, output width, poster second (on the trimmed film, as shipped), and the
# shipped 512 px film's own shape. Topaz pads portrait output to 9:16 with
# black bars; cropping back to the original shape removes them.
FILMS = [('roof-a', 1080, 20, (512, 808)), ('roof-b', 1080, 2.7, (512, 860)),
         ('roof-c', 1080, 17.5, (512, 910)), ('workshop', 1080, 1.8, (512, 910)),
         ('roof-hero-portrait', 1080, None, (512, 808)), ('roof-hero-wide', 1920, None, (16, 9))]

for slug, width, poster, (sw, sh) in FILMS:
    src = args.input / f'{slug}.mp4'
    if not src.exists():
        print(f'  SKIP  {slug} (no upscale)')
        continue
    out = video / f'{slug}.mp4'
    # Hero loops are short and full-bleed: spend more on them. The project films
    # run 12-28 s on phones too; Topaz output is clean, so CRF 26 holds up.
    crf = 24 if slug.startswith('roof-hero') else 26
    run('-i', src, '-an', '-map_metadata', '-1', '-vf', f"crop=iw:'min(ih,2*trunc(iw*{sh}/{sw}/2))',scale={width}:-2:flags=lanczos,setsar=1",
        '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-pix_fmt', 'yuv420p', '-profile:v', 'high',
        '-g', '48', '-movflags', '+faststart', tmp := video / f'{slug}.build.mp4')
    # Written beside, then swapped in: Windows refuses to truncate a file a
    # preview server or sync client has open.
    tmp.replace(out)
    if slug.startswith('roof-hero'):
        run('-i', out, '-an', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '33', '-row-mt', '1', '-g', '48',
            video / f'{slug}.webm')
    if poster is not None:
        frame = video / f'{slug}-poster.png'
        run('-ss', poster, '-i', out, '-frames:v', '1', frame)
        derivatives(f'{slug}-poster', f'topaz/{slug}.mp4', Image.open(frame), [440, 720, 1080])
        frame.unlink()
    print(f'  {slug:34} {out.stat().st_size / 1048576:.1f} MB')

for slug in ['architectural-glass-exterior', 'architectural-atrium-interior']:
    hd = root / 'source-hd' / f'{slug}.jpg'
    if hd.exists():
        derivatives(slug, f'source-hd/{slug}.jpg', Image.open(hd), [440, 720, 1100, 1600, 2200])

manifest_path.write_text(json.dumps(manifest, indent=1) + '\n', encoding='utf-8')
