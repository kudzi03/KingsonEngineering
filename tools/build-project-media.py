#!/usr/bin/env python3
"""Build faithful, silent web derivatives. Originals stay in the handoff ZIPs.

python tools/build-project-media.py --input <extracted-handoff> --ffmpeg <binary>
Requires Pillow. FFmpeg 7.1 was used for the reviewed exports; no AI restoration.
"""
import argparse, hashlib, json, pathlib, subprocess
from PIL import Image, ImageOps

p = argparse.ArgumentParser()
p.add_argument('--input', required=True, type=pathlib.Path)
p.add_argument('--ffmpeg', default='ffmpeg')
p.add_argument('--skip-films', action='store_true', help='Reuse existing long films while rebuilding hero edits and posters')
args = p.parse_args()
root = pathlib.Path(__file__).resolve().parent.parent
video = root / 'assets/video'
img = root / 'assets/img'
video.mkdir(exist_ok=True)
manifest = json.loads((img/'manifest.json').read_text())
cleanup = 'hqdn3d=0.6:0.4:1.0:0.6,eq=contrast=1.025:saturation=0.97:brightness=0.003,unsharp=5:5:0.22:3:3:0'
ledger = []

def run(*options):
    subprocess.run([args.ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', *map(str, options)], check=True)

def derivatives(slug, source, frame, cropped=False):
    photo = ImageOps.exif_transpose(Image.open(frame)).convert('RGB')
    w, h = photo.size
    widths = sorted(set([x for x in [440,720,1100] if x < w]+[w]))
    for width in widths:
        photo.resize((width, round(h*width/w)), Image.Resampling.LANCZOS).save(img/f'{slug}-{width}.webp', quality=84, method=6)
    manifest[slug] = {'source':source, 'w':w, 'h':h, 'sizes':widths, 'cropped':cropped}
    return widths

films = [
    ('roof-a','roof-structure-project-a.mp4',0,25.4,'null',20),
    ('roof-b','roof-structure-project-b.mp4',0.3,15.0,'crop=512:860:0:140',3),
    ('roof-c','roof-structure-project-c-ORIGINAL.mp4',0,28.267,'null',17.5),
    ('workshop','workshop-walkthrough.mp4',0,12,'null',1.8)
]
for slug, filename, start, duration, crop, poster_time in films:
    original = args.input/'assets'/filename
    digest = hashlib.sha256(original.read_bytes()).hexdigest()
    if slug == 'roof-c' and digest != 'c3d883175019a688e8912c67991e10127f8f6f361c47b59fcfee9d4513a17a53':
        raise ValueError('Project C original checksum differs from the supplied handoff')
    output = video/f'{slug}.mp4'
    if not args.skip_films or not output.exists():
        run('-ss',start,'-i',original,'-t',duration,'-an','-map_metadata','-1','-vf',f'{crop},{cleanup},setsar=1',
            '-c:v','libx264','-preset','slow','-crf','22','-pix_fmt','yuv420p','-profile:v','main','-g','60','-movflags','+faststart',output)
    poster = video/f'{slug}-poster.png'
    run('-ss',poster_time,'-i',original,'-frames:v','1','-vf',f'{crop},{cleanup}',poster)
    widths = derivatives(slug+'-poster','handoff/assets/'+filename,poster,cropped=crop!='null')
    poster.unlink()
    ledger.append({'source':filename,'source_sha256':digest,'output':str(output.relative_to(root)).replace('\\','/'),
                   'start':start,'duration':duration,'crop':crop,'bytes':output.stat().st_size,'poster_widths':widths})

# Two actual roof scenes, crossfaded cyclically. Start and end meet on the same
# point in shot A. Native pixel dimensions are retained; scaling adds no detail.
for shape in ['wide','portrait']:
    size = '512:288' if shape == 'wide' else '512:808'
    ay = 180 if shape == 'wide' else 0
    cy = 300 if shape == 'wide' else 52
    chain = (f'[0:v]crop={size}:0:{ay},{cleanup},setpts=PTS-STARTPTS,setsar=1,fps=24[a];'
             f'[1:v]crop={size}:0:{cy},{cleanup},setpts=PTS-STARTPTS,setsar=1,fps=24[c];'
             f'[2:v]crop={size}:0:{ay},{cleanup},setpts=PTS-STARTPTS,setsar=1,fps=24[b];'
             '[a][c]xfade=transition=fade:duration=0.6:offset=3.4,fps=24[ac];'
             '[ac][b]xfade=transition=fade:duration=0.6:offset=6.8,trim=start=0.6,setpts=PTS-STARTPTS[out]')
    inputs = ['-ss',19.4,'-t',4,'-i',args.input/'assets/roof-structure-project-a.mp4',
              '-ss',16,'-t',4,'-i',args.input/'assets/roof-structure-project-c-ORIGINAL.mp4',
              '-ss',19.4,'-t',0.6,'-i',args.input/'assets/roof-structure-project-a.mp4']
    output = video/f'roof-hero-{shape}.mp4'
    duration = 6.8
    if shape == 'wide':
        # C's larger members survive a wide desktop crop better than A's fine
        # truss lattice. Slow the camera pan slightly; do not interpolate detail.
        source = args.input/'assets/roof-structure-project-c-ORIGINAL.mp4'
        inputs = ['-ss',16,'-t',4,'-i',source,'-ss',16,'-t',0.5,'-i',source]
        chain = (f'[0:v]crop=512:288:0:300,{cleanup},setpts=1.4*(PTS-STARTPTS),setsar=1,fps=24[a];'
                 f'[1:v]crop=512:288:0:300,{cleanup},setpts=1.4*(PTS-STARTPTS),setsar=1,fps=24[b];'
                 '[a][b]xfade=transition=fade:duration=0.7:offset=4.9,trim=start=0.7,setpts=PTS-STARTPTS[out]')
        duration = 4.9
    run(*inputs,'-filter_complex',chain,'-map','[out]','-an','-map_metadata','-1','-c:v','libx264',
        '-preset','slow','-crf','21','-pix_fmt','yuv420p','-profile:v','main','-g','48','-movflags','+faststart',output)
    run('-i',output,'-an','-c:v','libvpx-vp9','-b:v','0','-crf','31','-row-mt','1','-g','48',video/f'roof-hero-{shape}.webm')
    ledger.append({'output':str(output.relative_to(root)).replace('\\','/'),'native_size':size,'bytes':output.stat().st_size,'duration':duration})

for slug in ['architectural-glass-exterior','architectural-atrium-interior']:
    original = args.input/'assets'/f'{slug}.jpeg'
    derivatives(slug,'handoff/assets/'+original.name,original)
    ledger.append({'source':original.name,'source_sha256':hashlib.sha256(original.read_bytes()).hexdigest()})
(img/'manifest.json').write_text(json.dumps(manifest,indent=1)+'\n')
(root/'tools/project-media-build.json').write_text(json.dumps({'cleanup':cleanup,'exports':ledger},indent=2)+'\n')
print(json.dumps(ledger,indent=2))
