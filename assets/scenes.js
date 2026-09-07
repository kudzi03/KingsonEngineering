/* ═══════════════════════════════════════════════════════════════════════════
   scenes.js — the choreography
   ═══════════════════════════════════════════════════════════════════════════

   One named function per scene, each written against the three primitives in
   engine.js. Nothing here reads layout during a scroll pass: every
   measurement is cached in a KE.onMeasure callback and every scroll frame
   only writes.

   The sequence:

     01  gateway   WebGL frame -> camera onto the axis -> the photograph is
                   revealed through the projected portal -> pinned, staged
     02  ledger    the capability list, sheared by scroll
     03  bands     the structural photo splits into slices that slide apart
                   and the roof beneath is what was there all along
     04  strip     a narrow vertical strip widens over a headline until it
                   owns the frame, copy changing underneath
     05  laser     four depth planes at four speeds, then a cutting line
                   crosses and becomes the mask that reveals the machine
     06  crane     a slot in black grows to the full viewport, headline behind
     07  reel      vertical scroll drives horizontal travel, each frame
                   panning inside its own crop
     08  process   numerals lighting as they arrive
     hud           the scene counter, bottom left
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var KE = window.KE;
  if (!KE) return;

  var $ = KE.$, $$ = KE.$$, range = KE.range, lerp = KE.lerp, ease = KE.ease,
      clamp = KE.clamp, xform = KE.xform;
  var root = document.documentElement;
  var REDUCED = KE.reduced;

  root.classList.add('js');

  function narrow() { return window.matchMedia('(max-width: 860px)').matches; }

  /* fade + travel, the one shared helper — used only for copy, never for
     the scene moves themselves */
  function stage(el, t, dy) {
    if (!el) return;
    el.style.opacity = t;
    xform(el, 'translate3d(0,' + ((1 - t) * (dy === undefined ? 26 : dy)).toFixed(1) + 'px,0)');
  }


  /* ═══ 01 — GATEWAY ═══════════════════════════════════════════════════════

     The one scene that has to work: the 3D structure and the photograph are
     the same object seen twice, and the cut between them is a camera move
     rather than a transition.

     steel.js turns the camera onto the building's axis and pushes into the
     near gable. portalPath() gives the gable's clear opening in screen space
     each frame. That polygon is the photograph's clip-path — so the picture
     genuinely appears inside the projected steel, then the polygon is
     interpolated out to the corners of the viewport and the photograph takes
     over. The geometry is held over it for a beat as drawing lines before it
     goes.
     ═════════════════════════════════════════════════════════════════════════ */

  function gateway() {
    var rail = $('#gateway');
    if (!rail) return;

    var canvas = $('#steel'),
        photo  = $('[data-gate-photo]'),
        pimg   = $('.gate-photo-img'),
        lines  = $('[data-gate-lines]'),
        poly   = $('[data-gate-poly]'),
        hero   = $('[data-gate-hero]'),
        beat1  = $('[data-gate-beat="1"]'),
        beat2  = $('[data-gate-beat="2"]'),
        hint   = $('.scroll-hint', rail);

    var scene = null;
    try { scene = (window.SteelFrame && canvas) ? window.SteelFrame(canvas) : null; }
    catch (e) { scene = null; }

    /* No WebGL, a failed compile, or a driver that refuses the context: the
       photograph is already unclipped and is simply the hero. Everything else
       in the scene still plays. */
    if (scene) {
      root.classList.add('webgl');
      if (!REDUCED) photo.style.clipPath = 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%)';
    } else if (canvas) {
      canvas.style.display = 'none';
    }

    /* The viewport expressed as the same five-point shape the portal has, so
       the two can be interpolated point for point. Slightly outside the frame
       so no hairline of background survives at the edges. */
    var FULL = [[0, 100], [0, -2], [50, -6], [100, -2], [100, 100]];

    function polyString(pts, sep) {
      var s = [];
      for (var i = 0; i < pts.length; i++) {
        s.push(pts[i][0].toFixed(2) + (sep === ',' ? ',' : '% ') + pts[i][1].toFixed(2) + (sep === ',' ? '' : '%'));
      }
      return s.join(sep === ',' ? ' ' : ', ');
    }

    /* Painted from inside the render loop, not from the scroll handler.
       steel.js eases the camera toward the scrolled value over about a
       second, so a mask cut on the scroll event would sit off the geometry it
       is supposed to be cut from. onFrame runs after each draw with the
       matrix that was actually used. */
    var lastP = 0;

    function paintMask(p) {
      /* Two stages, and they must not overlap.

         arrive  the photograph grows from nothing to fill the gable opening,
                 while the camera holds dead still on it
         open    the gable polygon is then interpolated out to the corners of
                 the viewport and the photograph takes the screen

         Without the first stage the picture is faintly visible through the
         projected opening from the very top of the page — a bright patch
         drifting around the hero long before it means anything. */
      var arrive = ease(range(p, 0.56, 0.69));
      var open   = ease(range(p, 0.69, 0.83));

      if (!scene || REDUCED) {
        if (photo) photo.style.clipPath = 'none';
        return;
      }

      var portal = scene.portalPath();
      var pts = [], i;

      // the opening's own centre, so it grows from the middle of the gable
      var cx = 50, cy = 50;
      if (portal) {
        cx = 0; cy = 0;
        for (i = 0; i < portal.length; i++) { cx += portal[i][0] * 100; cy += portal[i][1] * 100; }
        cx /= portal.length; cy /= portal.length;
      }

      for (i = 0; i < FULL.length; i++) {
        var px, py;
        if (portal && portal[i]) {
          // portalPath is 0..1 with y downwards; clip-path wants percentages
          px = lerp(cx, portal[i][0] * 100, arrive);
          py = lerp(cy, portal[i][1] * 100, arrive);
        } else {
          // behind the camera, or before the first frame — stay collapsed
          px = 50; py = 50;
        }
        pts.push([lerp(px, FULL[i][0], open), lerp(py, FULL[i][1], open)]);
      }

      photo.style.clipPath = open > 0.998 ? 'none' : 'polygon(' + polyString(pts) + ')';

      /* the projected steel, held over the photograph and then released */
      if (poly && lines) {
        var lineOn = range(p, 0.60, 0.70) * (1 - range(p, 0.83, 0.93));
        lines.style.opacity = lineOn;
        if (lineOn > 0.004) poly.setAttribute('points', polyString(pts, ','));
      }
    }

    if (scene) scene.onFrame = function () { paintMask(lastP); };

    KE.rail(rail, function (p) {
      lastP = p;

      if (scene) scene.setProgress(range(p, 0, 0.88));
      else paintMask(p);

      /* the photograph, panning slowly inside its own frame */
      if (pimg) {
        var pz = range(p, 0.66, 1);
        xform(pimg, 'scale(' + lerp(1.16, 1.0, ease(pz)).toFixed(4) + ') ' +
                    'translate3d(0,' + lerp(-2.5, 1.5, pz).toFixed(2) + '%,0)');
      }

      /* copy */
      var out = ease(range(p, 0.05, 0.32));
      if (hero) {
        hero.style.opacity = 1 - out;
        xform(hero, 'translate3d(0,' + (-out * 60).toFixed(1) + 'px,0)');
        hero.style.pointerEvents = out > 0.6 ? 'none' : '';
      }
      if (hint) hint.style.opacity = 1 - ease(range(p, 0.02, 0.14));

      stage(beat1, range(p, 0.74, 0.83) * (1 - range(p, 0.87, 0.93)), 30);
      stage(beat2, range(p, 0.89, 0.96), 34);
    });

    /* run the loop only while the scene is on screen */
    if (scene) {
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
          es.forEach(function (e) { e.isIntersecting ? scene.start() : scene.stop(); });
        }, { rootMargin: '140px' }).observe(rail);
      } else { scene.start(); }

      if (!scene.reducedMotion && window.matchMedia('(hover: hover)').matches) {
        window.addEventListener('pointermove', function (e) {
          scene.setPointer((e.clientX / window.innerWidth) * 2 - 1,
                           (e.clientY / window.innerHeight) * 2 - 1);
        }, { passive: true });
      }
      document.addEventListener('visibilitychange', function () {
        document.hidden ? scene.stop() : scene.start();
      });
    }
  }


  /* ═══ 02 — LEDGER ════════════════════════════════════════════════════════
     The staircase shears as it passes: each row drifts horizontally by an
     amount proportional to its step, so the list is never at rest and never
     arrives with a fade.
     ═════════════════════════════════════════════════════════════════════════ */

  function ledger() {
    var rows = $$('.ledger-row');
    if (!rows.length || REDUCED) return;

    rows.forEach(function (row, i) {
      var link = $('a', row);
      KE.span(row, function (p) {
        xform(link, 'translate3d(' + ((p - 0.5) * (14 + i * 9)).toFixed(1) + 'px,0,0)');
      });
    });
  }


  /* ═══ 03 — BANDS ═════════════════════════════════════════════════════════
     The structural photograph is cloned into horizontal slices which slide
     apart in alternate directions. What is underneath is the roof — the
     image-to-image transition is a mask, not a crossfade.
     ═════════════════════════════════════════════════════════════════════════ */

  function bands() {
    var rail = $('#bands');
    if (!rail) return;

    var host = $('[data-bands]', rail),
        src  = $('.bands-src', rail),
        under = $('.bands-under img', rail),
        copy = $('[data-bands-copy]', rail);
    if (!host || !src) return;

    var N = narrow() ? 4 : 6;
    var slices = [];

    if (!REDUCED) {
      for (var i = 0; i < N; i++) {
        var band = document.createElement('div');
        band.className = 'band';
        band.style.clipPath = 'inset(' + (i / N * 100).toFixed(3) + '% 0 ' +
                                        ((N - 1 - i) / N * 100).toFixed(3) + '% 0)';
        var clone = src.cloneNode(true);
        clone.className = '';
        clone.removeAttribute('loading');
        band.appendChild(clone);
        host.appendChild(band);
        slices.push(band);
      }
      host.classList.add('built');
    }

    KE.rail(rail, function (p) {
      /* Each slice crosses its whole distance inside its own window rather
         than all of them creeping together — otherwise the mid-scroll state
         is a smear of misaligned fragments instead of a peel. */
      var n = slices.length;
      var span = 0.30, step = (0.86 - span) / Math.max(1, n - 1);
      for (var i = 0; i < n; i++) {
        var a = 0.06 + i * step;
        var t = ease(range(p, a, a + span));
        var dir = i % 2 ? 1 : -1;
        xform(slices[i], 'translate3d(' + (dir * t * 116).toFixed(2) + '%,0,0)');
      }
      // the roof beneath settles as it is uncovered
      if (under) xform(under, 'scale(' + lerp(1.14, 1.0, ease(p)).toFixed(4) + ')');
      stage(copy, range(p, 0.34, 0.52) * (1 - range(p, 0.92, 1)), 30);
    });
  }


  /* ═══ 04 — ROOF STRIP ════════════════════════════════════════════════════
     Image B enters as a narrow vertical strip, pauses there long enough to
     read as a deliberate slot, then widens until it owns the frame. The word
     between the two images is progressively covered by photography.
     ═════════════════════════════════════════════════════════════════════════ */

  function strip() {
    var rail = $('#roofing');
    if (!rail) return;

    var a = $('[data-strip-a]', rail),
        b = $('[data-strip-b]', rail),
        crop = $('.strip-crop', rail),
        ghost = $('[data-strip-ghost]', rail),
        b1 = $('[data-strip-beat="1"]', rail),
        b2 = $('[data-strip-beat="2"]', rail),
        note = $('.spec-note', rail);

    KE.rail(rail, function (p) {
      /* the slot: 100% closed -> 78% (a narrow strip) -> holds -> 0% (full) */
      var left;
      if (p < 0.22)      left = lerp(100, 78, ease(range(p, 0.06, 0.22)));
      else if (p < 0.36) left = 78;
      else               left = lerp(78, 0, ease(range(p, 0.36, 0.80)));
      if (b) b.style.clipPath = 'inset(0 0 0 ' + left.toFixed(2) + '%)';

      /* the revealed image pans as the slot opens, so widening the crop is
         not the same as sliding a panel */
      if (crop) xform(crop, 'translate3d(' + lerp(14, 0, ease(range(p, 0.06, 0.80))).toFixed(2) + '%,0,0)');

      if (a) xform(a, 'scale(' + lerp(1.14, 1.02, ease(p)).toFixed(4) + ') ' +
                      'translate3d(' + (-ease(p) * 5).toFixed(2) + '%,0,0)');

      /* the ghost word drifts against the images — slower, so it reads as
         further away */
      if (ghost) xform(ghost, 'translate(-50%,-50%) translate3d(' +
                              ((0.5 - p) * 130).toFixed(1) + 'px,0,0)');

      stage(b1, range(p, 0.16, 0.28) * (1 - range(p, 0.42, 0.52)), 26);
      stage(b2, range(p, 0.56, 0.68) * (1 - range(p, 0.94, 1)), 26);
      if (note) note.style.opacity = range(p, 0.70, 0.84) * (1 - range(p, 0.95, 1));
    });
  }


  /* ═══ 05 — LASER ═════════════════════════════════════════════════════════
     Three panels on three depth planes travelling at three speeds, then a
     cutting line crosses the screen and everything below it is the machine.
     The nest draws over the top once the reveal has landed.
     ═════════════════════════════════════════════════════════════════════════ */

  function laser() {
    var rail = $('#laser');
    if (!rail) return;

    var back  = $('[data-lz="back"]', rail),
        mid   = $('[data-lz="mid"]', rail),
        front = $('[data-lz="front"]', rail),
        reveal = $('[data-lz-reveal]', rail),
        beam  = $('[data-lz-beam]', rail),
        nest  = $('[data-lz-nest]', rail),
        cut   = $('[data-lz-cut]', rail),
        copy  = $('[data-lz-copy]', rail),
        note  = $('.spec-note', rail);

    var pinH = 0;
    KE.onMeasure(function () {
      var pin = $('.rail-pin', rail);
      pinH = pin ? pin.offsetHeight : window.innerHeight;
    });

    KE.rail(rail, function (p) {
      var c = p - 0.5;

      /* depth: the nearer the plane, the further it travels */
      if (back)  xform(back,  'translate3d(0,' + (c * -150).toFixed(1) + 'px,0) scale(' + (1 + p * 0.06).toFixed(4) + ')');
      if (mid)   xform(mid,   'translate3d(' + (c * 40).toFixed(1) + 'px,' + (c * -300).toFixed(1) + 'px,0)');
      if (front) xform(front, 'translate3d(' + (c * -70).toFixed(1) + 'px,' + (c * -470).toFixed(1) + 'px,0)');

      /* the cut: a line crosses and the machine is behind it */
      var wipe = ease(range(p, 0.40, 0.70));
      if (reveal) reveal.style.clipPath = 'inset(0 0 ' + ((1 - wipe) * 100).toFixed(2) + '% 0)';
      if (beam) {
        beam.style.opacity = range(p, 0.37, 0.42) * (1 - range(p, 0.70, 0.76));
        xform(beam, 'translate3d(0,' + (wipe * pinH).toFixed(1) + 'px,0)');
      }

      /* the nest programme draws once the machine is on screen */
      if (nest) nest.style.opacity = (range(p, 0.62, 0.74) * (1 - range(p, 0.93, 1))) * 0.9;
      if (cut) cut.style.strokeDashoffset = (1000 * (1 - ease(range(p, 0.64, 0.96)))).toFixed(1);

      if (copy) {
        copy.style.opacity = range(p, 0.06, 0.18) * (1 - range(p, 0.90, 1));
        xform(copy, 'translate3d(0,' + (c * -70).toFixed(1) + 'px,0)');
      }
      if (note) note.style.opacity = range(p, 0.72, 0.84) * (1 - range(p, 0.94, 1));
    });
  }


  /* ═══ 06 — CRANE ═════════════════════════════════════════════════════════
     Opens as a slot and grows to the whole viewport. Clip-path rather than
     width, so the growth is composited and the photograph inside never
     stretches. The headline is behind it and gets covered.
     ═════════════════════════════════════════════════════════════════════════ */

  function crane() {
    var rail = $('#cranage');
    if (!rail) return;

    var frame = $('[data-crane-frame]', rail),
        img   = $('.crane-crop img', rail),
        type  = $('[data-crane-type]', rail),
        copy  = $('[data-crane-copy]', rail);

    var SLOT = narrow() ? 29 : 39;      // % inset each side at the start

    KE.rail(rail, function (p) {
      var grow = ease(range(p, 0.08, 0.74));
      if (frame) frame.style.clipPath = 'inset(0 ' + lerp(SLOT, 0, grow).toFixed(2) + '% 0 ' +
                                                     lerp(SLOT, 0, grow).toFixed(2) + '%)';

      /* the focal point shifts as it opens — the boom drops into frame */
      if (img) xform(img, 'scale(' + lerp(1.22, 1.0, grow).toFixed(4) + ') ' +
                          'translate3d(0,' + lerp(4, -2, grow).toFixed(2) + '%,0)');

      /* the headline is behind the photograph and travels the other way */
      if (type) xform(type, 'translate(-50%,-50%) translate3d(0,' +
                            ((0.5 - p) * 150).toFixed(1) + 'px,0) scale(' + (1 + p * 0.09).toFixed(4) + ')');

      if (copy) {
        copy.style.opacity = range(p, 0.30, 0.46) * (1 - range(p, 0.92, 1));
        xform(copy, 'translate3d(' + lerp(70, -30, ease(p)).toFixed(1) + 'px,0,0)');
      }
    });
  }


  /* ═══ 07 — REEL ══════════════════════════════════════════════════════════
     Vertical scroll drives horizontal travel. The rail is made exactly as
     tall as the track is wide, so the scrub is one-to-one with the pixels and
     the reel never feels geared.

     Each frame also pans inside its own crop according to where it is on
     screen, so nine images passing never read as one strip sliding.
     ═════════════════════════════════════════════════════════════════════════ */

  function reel() {
    var rail = $('#work');
    if (!rail) return;

    var track = $('[data-reel-track]', rail),
        items = $$('.reel-item', rail),
        bar   = $('[data-reel-bar]', rail);
    if (!track) return;

    var travel = 0, offsets = [], widths = [], vw = 0;

    KE.onMeasure(function () {
      vw = window.innerWidth;
      travel = Math.max(0, track.scrollWidth - vw);
      offsets = items.map(function (it) { return it.offsetLeft; });
      widths  = items.map(function (it) { return it.offsetWidth; });
      /* one viewport of run-in, then the horizontal distance, then a little
         to land on */
      if (!REDUCED) rail.style.height = (travel + window.innerHeight * 1.05) + 'px';
    });

    if (REDUCED) return;

    KE.rail(rail, function (p) {
      var x = -travel * p;
      xform(track, 'translate3d(' + x.toFixed(1) + 'px,0,0)');
      if (bar) xform(bar, 'scaleX(' + p.toFixed(4) + ')');

      for (var i = 0; i < items.length; i++) {
        var img = items[i].firstElementChild && items[i].firstElementChild.firstElementChild;
        var cap = items[i].lastElementChild;
        // where this frame sits across the viewport: 1 entering, -1 leaving
        var q = (offsets[i] + widths[i] / 2 + x) / vw;
        if (q < -0.6 || q > 1.6) continue;              // off screen, skip
        if (img) xform(img, 'translate3d(0,' + lerp(-2, -15, clamp(1 - q, 0, 1)).toFixed(2) + '%,0)');
        if (cap) xform(cap, 'translate3d(' + ((q - 0.5) * -26).toFixed(1) + 'px,0,0)');
      }
    });
  }


  /* ═══ 08 — PROCESS ═══════════════════════════════════════════════════════
     The numerals are outlines until the row arrives, then they take the
     ember. Rows shear on scroll like the ledger, so the two chapter cards
     share a language.
     ═════════════════════════════════════════════════════════════════════════ */

  function processScene() {
    var rows = $$('.proc-row');
    rows.forEach(function (row, i) {
      KE.once(row, function () { row.classList.add('lit'); });
      if (REDUCED) return;
      var n = $('.proc-n', row);
      KE.span(row, function (p) {
        xform(n, 'translate3d(' + ((p - 0.5) * (20 + i * 7)).toFixed(1) + 'px,0,0)');
      });
    });
  }


  /* ═══ the scene counter ══════════════════════════════════════════════════ */

  function hud() {
    var el = $('.hud');
    if (!el) return;
    var nEl = $('[data-hud-n]'), lEl = $('[data-hud-label]'), bar = $('[data-hud-bar]');

    var SCENES = [
      ['gateway',      '01', 'Steel assembly'],
      ['capabilities', '02', 'Capabilities'],
      ['bands',        '03', 'Roof steelworks'],
      ['roofing',      '04', 'Span'],
      ['laser',        '05', 'Precision'],
      ['cranage',      '06', 'Scale'],
      ['work',         '07', 'Selected work'],
      ['process',      '08', 'How we work'],
      ['start',        '09', 'Start a project']
    ];

    var marks = [];
    KE.onMeasure(function () {
      marks = SCENES.map(function (s) {
        var node = document.getElementById(s[0]);
        if (!node) return null;
        var r = node.getBoundingClientRect();
        return { top: r.top + (window.pageYOffset || 0), h: node.offsetHeight, n: s[1], label: s[2] };
      }).filter(Boolean);
    });

    var current = -1;
    KE.onScroll(function (y, vh) {
      var mid = y + vh * 0.45;
      var idx = 0, local = 0;
      for (var i = 0; i < marks.length; i++) {
        if (mid >= marks[i].top) { idx = i; local = clamp((mid - marks[i].top) / marks[i].h, 0, 1); }
      }
      el.classList.toggle('on', y > vh * 0.5);
      if (bar) xform(bar, 'scaleX(' + local.toFixed(3) + ')');
      if (idx !== current) {
        current = idx;
        if (nEl) nEl.textContent = marks[idx].n;
        if (lEl) lEl.textContent = marks[idx].label;
      }
    });
  }


  /* ═══ secondary detail ═══════════════════════════════════════════════════
     The few blocks that are genuinely static get a small entrance so they do
     not arrive dead. This is the only fade-up on the page and it is applied
     to nothing that a scene already owns.
     ═════════════════════════════════════════════════════════════════════════ */

  function details() {
    var targets = $$('.start-head > *, .start-side, .start-form, .qa .eyebrow, .qa .faq, .matref, .proc-lead, .proc-note, .ledger-lead');
    targets.forEach(function (el) {
      if (REDUCED) return;
      el.classList.add('lift');
      KE.once(el, function () { el.classList.add('in'); });
    });
  }


  gateway();
  ledger();
  bands();
  strip();
  laser();
  crane();
  reel();
  processScene();
  hud();
  details();

  KE.refresh();
})();
