#!/usr/bin/env python3
"""Re-encode public image derivatives from originals, never from another WebP.

Uses free Pillow/libwebp and NumPy. Supply the extracted handoff with --input
and FFmpeg with --ffmpeg. --apply writes only smaller candidates that retain
at least 0.98 block SSIM against the previous served image. Originals, crops,
dimensions, responsive widths and video exports remain unchanged.
"""
import argparse
import importlib.util
import io
import json
import pathlib
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('image_builder', ROOT/'tools/build-images.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


def block_ssim(a, b):
    # Luminance, non-overlapping 8px blocks; a guard against extra degradation,
    # not a substitute for inspecting the final rendered photographs.
    x, y = (np.asarray(im.convert('L'), dtype=np.float64) for im in [a, b])
    h, w = x.shape
    h, w = h//8*8, w//8*8
    x, y = (v[:h, :w].reshape(h//8, 8, w//8, 8).transpose(0, 2, 1, 3).reshape(-1, 64) for v in [x, y])
    mx, my = x.mean(1), y.mean(1)
    vx, vy = x.var(1), y.var(1)
    cov = ((x-mx[:, None])*(y-my[:, None])).mean(1)
    return float((((2*mx*my+6.5025)*(2*cov+58.5225))/((mx*mx+my*my+6.5025)*(vx+vy+58.5225))).mean())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', required=True, type=pathlib.Path)
    parser.add_argument('--ffmpeg', default='ffmpeg')
    parser.add_argument('--report', required=True, type=pathlib.Path)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    manifest = json.loads((ROOT/'assets/img/manifest.json').read_text())
    ledger = json.loads((ROOT/'tools/project-media-build.json').read_text())
    anchors = builder.focal_anchors()
    crops = {slug: box for _, slug, box in builder.JOBS}
    poster_times = {'roof-a': 20, 'roof-b': 3, 'roof-c': 17.5, 'workshop': 1.8}
    results = []
    with tempfile.TemporaryDirectory(prefix='kingson-image-sources-') as scratch:
        for slug, entry in manifest.items():
            # These stock reference collages are excluded by .vercelignore
            # and never form part of the public website or its savings.
            if slug.startswith('material-'):
                continue
            source = entry['source']
            if source.endswith('.mp4'):
                film = slug.removesuffix('-poster')
                record = next(v for v in ledger['exports'] if v.get('output') == f'assets/video/{film}.mp4')
                path = pathlib.Path(scratch)/(slug+'.png')
                subprocess.run([args.ffmpeg, '-hide_banner', '-loglevel', 'error', '-y',
                                '-ss', str(poster_times[film]), '-i', str(args.input/source.removeprefix('handoff/')),
                                '-frames:v', '1', '-vf', record['crop']+','+ledger['cleanup'], str(path)], check=True)
            else:
                path = args.input/source.removeprefix('handoff/') if source.startswith('handoff/') else ROOT/source
            original = ImageOps.exif_transpose(Image.open(path)).convert('RGB')
            if not source.startswith('handoff/') and crops.get(slug):
                original = original.crop(crops[slug])
            assert original.size == (entry['w'], entry['h']), (slug, original.size)
            families = [(original, '', entry['sizes'])]
            if entry.get('wide'):
                wide = builder.wide_crop(original, builder.WIDE_ANCHOR_Y.get(slug, anchors[slug][1]))
                families.append((wide, '-wide', entry['wide']['sizes']))
            for image, suffix, widths in families:
                for width in widths:
                    path = ROOT/f'assets/img/{slug}{suffix}-{width}.webp'
                    old_bytes = path.read_bytes()
                    old = Image.open(io.BytesIO(old_bytes)).convert('RGB')
                    resized = image.resize(old.size, Image.Resampling.LANCZOS)
                    chosen, score, quality = old_bytes, 1., None
                    for q in [72, 75, 78, 81]:
                        output = io.BytesIO()
                        resized.save(output, 'WEBP', quality=q, method=6)
                        candidate = output.getvalue()
                        if len(candidate) >= len(old_bytes):
                            continue
                        similarity = block_ssim(old, Image.open(io.BytesIO(candidate)))
                        if similarity >= .98:
                            chosen, score, quality = candidate, similarity, q
                            break
                    if args.apply and quality:
                        path.write_bytes(chosen)
                    results.append({'file': str(path.relative_to(ROOT)).replace('\\', '/'),
                                    'before': len(old_bytes), 'after': len(chosen),
                                    'quality': quality, 'block_ssim': round(score, 6)})
        # Brand artwork is optimised losslessly; no change to colour or alpha.
        for path in (ROOT/'assets/brand').glob('*.png'):
            old_bytes = path.read_bytes()
            output = io.BytesIO()
            image = Image.open(io.BytesIO(old_bytes))
            image.save(output, 'PNG', optimize=True)
            candidate = output.getvalue()
            changed = len(candidate) < len(old_bytes)
            if args.apply and changed:
                path.write_bytes(candidate)
            results.append({'file': str(path.relative_to(ROOT)).replace('\\', '/'),
                            'before': len(old_bytes), 'after': min(len(old_bytes), len(candidate)),
                            'lossless': True})
    before, after = (sum(v[key] for v in results) for key in ['before', 'after'])
    report = {'applied': args.apply, 'files_audited': len(results),
              'files_smaller': sum(v['after'] < v['before'] for v in results),
              'before': before, 'after': after, 'saved_bytes': before-after,
              'saved_percent': round((before-after)/before*100, 2), 'images': results}
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps({k: v for k, v in report.items() if k != 'images'}, indent=2))


if __name__ == '__main__':
    main()
