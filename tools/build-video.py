#!/usr/bin/env python3
"""
Build the website derivatives of a piece of project footage.

  python3 tools/build-video.py steel-roof-structure=/path/to/ScreenRecording.mp4

Requires ffmpeg (with libsvtav1 and libx264) and Pillow.

The source is NOT kept in the repository. The footage Kingson sends arrives
as phone screen recordings of WhatsApp Statuses: the frame carries the phone's
status bar, the WhatsApp header (a contact's name and photograph), the reply
bar, and at the end the phone's Control Center. None of that may be published,
and a 30 MB recording with a private contact's name in it does not belong in
a public repository. What ships is what this script cuts out of it.

WHAT IT WRITES, PER JOB

  assets/video/<slug>.webm      AV1, the first <source>. Measured on the roof
                                footage at equal size (~1.55 MB): SSIM 0.984
                                against H.264's 0.974 — cleaner on a source
                                that is already heavily compressed.
  assets/video/<slug>.mp4       H.264 High, the fallback for browsers without
                                AV1 decode (older iPhones). faststart.

  RATE. The job page plays the footage as soon as it is on screen, so its
  size is paid on page load, on Zimbabwean mobile data. Measured on the roof
  footage against the lossless crop:
      AV1  CRF 40  1568 KB  SSIM 0.984      H.264  CRF 27  1703 KB  0.975
      AV1  CRF 47  1026 KB  SSIM 0.980      H.264  CRF 29  1383 KB  0.971
      AV1  CRF 50   860 KB  SSIM 0.978      H.264  CRF 31  1098 KB  0.965
  At 2x magnification CRF 40 and 47 are indistinguishable — the WhatsApp
  source's own softness is the limit, and the extra bytes bought nothing
  visible. CRF 47 / 29: a third less to download, no visible loss.
  assets/img/<slug>-<w>.webp    the poster, at 360 and the native width
  assets/img/<slug>-<still>-<w>.webp
                                frames from the same footage, for the page's
                                sequence and for visitors who never play it
  assets/img/og-<slug>.jpg      1200 x 630 link preview: the portrait frame,
                                sharp and centred, over a blurred, darkened
                                fill of itself. Never stretched to landscape.
  assets/img/manifest.json      the poster's and stills' entries, merged

HONEST RESOLUTION

  The recording is 1320 x 2868, but the picture inside it is the WhatsApp
  stream (~512 px wide) scaled up 2.6x by the phone. Encoding at 1320 would
  spend bytes on the phone's upscaling, not on detail. Output is 540 px wide:
  about the stream's real resolution. Nothing is sharpened or upscaled. The
  layout presents it at no more than ~460 CSS px.

  A light temporal denoise (hqdn3d) is applied. It removes WhatsApp's block
  noise, which is compression damage, not detail; it adds nothing.

  Audio is always stripped. It is a screen recording: whatever the phone was
  playing is not Kingson's, and a site video never plays sound.
"""
import json
import os
import shutil
import subprocess
import sys

try:
    from PIL import Image, ImageFilter, ImageEnhance
except ImportError:
    raise SystemExit('This script needs Pillow:  pip install pillow')

# One entry per piece of footage. Every number here was measured on the
# source, not guessed — see the notes against each.
JOBS = {
    'steel-roof-structure': {
        # The WhatsApp content occupies y = 250..2610 of the recording; the
        # contact name and photograph sit over y = 250..355 and the reply bar
        # starts at y = 2613. 1320 x 2200 from y = 390 is clear of both, and
        # is exactly 3:5.
        'crop': (1320, 2200, 0, 390),
        # 0.0 - 1.2 s is a fast whip-pan; Control Center begins to blur in at
        # 15.75 s. 1.2 - 15.7 s is clean and steady enough to watch.
        'trim': (1.2, 15.7),
        # Into the trimmed clip: the full span, ridge centred, floor and gable
        # end, no identifiable person. The sharpest frame of the six measured
        # between 2.9 and 3.15 s by edge variance.
        'poster': 3.15,
        # Three further frames for the project page, each a different view
        # of the same structure, each the sharpest of the frames measured in
        # its stretch of the pan: the lattice straight overhead, the trusses
        # meeting the columns at the open side, the truss edge against sky.
        'stills': {'trusses': 5.75, 'columns': 7.75, 'edge': 11.75},
        'width': 540,
    },
}

POSTER_WIDTHS = [360]
FPS = 30
DENOISE = 'hqdn3d=1.5:1.5:4:4'


def run(args):
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def build(slug, source, job):
    cw, ch, cx, cy = job['crop']
    t0, t1 = job['trim']
    w = job['width']
    h = round(ch * w / cw / 2) * 2
    os.makedirs('assets/video', exist_ok=True)
    tmp = 'assets/video/.%s-ref.mkv' % slug

    # One lossless intermediate, so both encodes and the poster see exactly
    # the same frames.
    run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t0), '-to', str(t1), '-i', source,
         '-vf', 'crop=%d:%d:%d:%d,scale=%d:%d:flags=lanczos:in_range=full:out_range=tv,fps=%d,format=yuv420p'
         % (cw, ch, cx, cy, w, h, FPS), '-an', '-c:v', 'ffv1', tmp])
    run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-vf', DENOISE, '-an',
             '-c:v', 'libsvtav1', '-crf', '47', '-preset', '4', '-g', '120',
             'assets/video/%s.webm' % slug])
    run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-vf', DENOISE, '-an',
             '-c:v', 'libx264', '-profile:v', 'high', '-level', '3.1', '-preset', 'veryslow',
             '-crf', '29', '-g', '120', '-movflags', '+faststart',
             'assets/video/%s.mp4' % slug])
    poster_png = 'assets/video/.%s-poster.png' % slug
    run(['ffmpeg', '-v', 'error', '-y', '-ss', str(job['poster']), '-i', tmp,
         '-frames:v', '1', poster_png])
    stills = {}
    for name, t in job.get('stills', {}).items():
        png = 'assets/video/.%s-%s.png' % (slug, name)
        run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', tmp, '-frames:v', '1', png])
        stills[name] = png

    im = Image.open(poster_png).convert('RGB')
    os.remove(poster_png)
    os.remove(tmp)
    widths = sorted(set(POSTER_WIDTHS + [w]))
    for pw in widths:
        im.resize((pw, round(h * pw / w)), Image.LANCZOS).save(
            'assets/img/%s-%d.webp' % (slug, pw), 'WEBP', quality=80, method=6)

    # The link preview. A share card is landscape and the footage is not, so
    # the frame stands upright in the middle, at 630 px tall — a downscale
    # from 900, so it stays sharp — over a blurred, darkened cover of itself.
    W, H = 1200, 630
    s = max(W / w, H / h)
    bg = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
    bg = bg.crop(((bg.width - W) // 2, (bg.height - H) // 2, (bg.width - W) // 2 + W, (bg.height - H) // 2 + H))
    bg = ImageEnhance.Brightness(bg.filter(ImageFilter.GaussianBlur(28))).enhance(0.38)
    fg = im.resize((round(w * H / h), H), Image.LANCZOS)
    bg.paste(fg, ((W - fg.width) // 2, 0))
    bg.save('assets/img/og-%s.jpg' % slug, 'JPEG', quality=84, optimize=True, progressive=True)

    manifest_path = 'assets/img/manifest.json'
    manifest = json.load(open(manifest_path)) if os.path.exists(manifest_path) else {}
    manifest[slug] = {'source': 'video:%s' % os.path.basename(source), 'kind': 'video-poster',
                      'w': w, 'h': h, 'sizes': widths, 'cropped': True,
                      'duration': round(t1 - t0, 2), 'fps': FPS}
    still_files = []
    for name, png in stills.items():
        sim = Image.open(png).convert('RGB')
        os.remove(png)
        for pw in widths:
            path = 'assets/img/%s-%s-%d.webp' % (slug, name, pw)
            sim.resize((pw, round(h * pw / w)), Image.LANCZOS).save(path, 'WEBP', quality=80, method=6)
            still_files.append(path)
        manifest['%s-%s' % (slug, name)] = {'source': 'video:%s@%ss' % (os.path.basename(source), job['stills'][name]),
                                            'kind': 'video-still', 'w': w, 'h': h, 'sizes': widths, 'cropped': True}
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=1)

    for f in ['assets/video/%s.webm' % slug, 'assets/video/%s.mp4' % slug,
              'assets/img/og-%s.jpg' % slug] + ['assets/img/%s-%d.webp' % (slug, pw) for pw in widths] + still_files:
        print('  %-44s %7.1f KB' % (f, os.path.getsize(f) / 1024))
    print('  %s: %d x %d, %.2f s at %d fps, no audio' % (slug, w, h, t1 - t0, FPS))


if __name__ == '__main__':
    if not shutil.which('ffmpeg'):
        raise SystemExit('ffmpeg is required')
    pairs = [a.split('=', 1) for a in sys.argv[1:] if '=' in a]
    if not pairs:
        raise SystemExit('usage: build-video.py <slug>=<path to source recording> …\n'
                         'known slugs: %s' % ', '.join(JOBS))
    for slug, source in pairs:
        if slug not in JOBS:
            raise SystemExit('no job for %s — add it to JOBS with measured crop, trim and poster' % slug)
        if not os.path.exists(source):
            raise SystemExit('no such file: %s' % source)
        build(slug, source, JOBS[slug])
