"""Responsive, lossless WebP logo derivatives. Original PNG artwork is kept.
Run only when the logo changes: python tools/build-brand.py (requires Pillow).
"""
from pathlib import Path
from PIL import Image

brand = Path(__file__).resolve().parents[1] / 'assets' / 'brand'
for name in ('kingson-logo', 'kingson-logo-reverse'):
    for width in (160, 240, 320, 560):
        source = Image.open(brand / f'{name}-{320 if width <= 320 else 560}.png')
        if source.width != width:
            source = source.resize((width, round(source.height * width / source.width)), Image.Resampling.LANCZOS)
        target = brand / f'{name}-{width}.webp'
        source.save(target, lossless=True, method=6)
        print(target.name, target.stat().st_size)
