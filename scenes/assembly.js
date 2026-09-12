/* ═══════════════════════════════════════════════════════════════════════════
   scenes/assembly.js — a portal frame assembling itself, once
   ═══════════════════════════════════════════════════════════════════════════

   The hero's signature moment. Base plates land, columns rise, rafters swing
   down onto the eaves, purlins and rails run the length of the building, and
   sheeting sweeps across — and that same sweep carries on to reveal the real
   photograph underneath. Cladding going on, and the model becoming the thing.

   WHAT THIS DELIBERATELY IS NOT

   · It does not touch the scroll. It plays on load, for ~2.6s, inside the
     hero's own height, and then it is finished and the loop stops. The last
     cinematic hero in this repository pinned a 620vh stage and scrubbed six
     scenes against scroll position; a visitor travelled seven screens before
     reaching a single fact. Scrolling scrolls.

   · The website is not hidden inside it. The wordmark, the navigation, the
     h1, the supporting line and the primary CTA are static DOM above this
     canvas, readable at frame one, whether or not a single pixel is drawn.

   · It is not a wireframe and not sci-fi. Members are real I-sections — two
     flanges and a web — drawn as solids and flat-shaded against one light
     direction, in the red-oxide primer visible on Kingson's own steel in
     roofTrusses. Mass, not glow.

   · It is representative, not evidence. Generic portal-frame geometry with no
     dimension shown or stated anywhere. It is never captioned, labelled or
     implied to be a completed Kingson project.

   WHY NOT THREE.JS

   Straight prismatic members under a fixed camera. That needs a 3x4 projection,
   a depth sort and a dot product — about 8KB here, against ~170KB gzipped for
   a scene graph, material system, light rig and loaders that would all go
   unused. Real 3D where justified; this is not that case.

   PROGRESSIVE ENHANCEMENT

   The photograph is the static state and is already painted before this runs.
   Nothing here is required for the hero to work. Under prefers-reduced-motion,
   or with no 2D context, mount() returns immediately and the canvas is never
   even inserted.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── the building, in metres ──────────────────────────────────────────────────
   Representative. A 20m span on 6m bays is an ordinary industrial portal; no
   figure here is published, claimed or attributed to Kingson.               */

const SPAN = 20, EAVES = 6.2, APEX = 8.4, BAY = 6, BAYS = 6;
const LEN = BAY * BAYS;

/* Section sizes, also representative, chosen so the I reads at hero scale. */
const COL = { d: 0.53, bf: 0.24, tf: 0.032, tw: 0.019 };
const RAF = { d: 0.46, bf: 0.21, tf: 0.028, tw: 0.017 };
const PURLIN = 0.18, PLATE = 0.62;

/* ── vector helpers ───────────────────────────────────────────────────────── */

const v3 = (x, y, z) => ({ x, y, z });
const add = (a, b) => v3(a.x + b.x, a.y + b.y, a.z + b.z);
const sub = (a, b) => v3(a.x - b.x, a.y - b.y, a.z - b.z);
const mul = (a, s) => v3(a.x * s, a.y * s, a.z * s);
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a, b) => v3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
const norm = (a) => { const l = Math.hypot(a.x, a.y, a.z) || 1; return mul(a, 1 / l); };

/* ── a prism from a centre line and two half-extent vectors ───────────────── */

function prism(a, b, u, w) {
  const c = [
    sub(sub(a, u), w), add(sub(a, u), w), add(add(a, u), w), sub(add(a, u), w),
    sub(sub(b, u), w), add(sub(b, u), w), add(add(b, u), w), sub(add(b, u), w)
  ];
  /* Wound so every face normal points out of the solid. */
  return {
    verts: c,
    faces: [[0, 1, 2, 3], [7, 6, 5, 4], [0, 4, 5, 1], [2, 6, 7, 3], [1, 5, 6, 2], [3, 7, 4, 0]]
  };
}

/* An I-section member: two flanges either side of a web, `n` being the
   section-depth direction and `x` the flange-width direction. */
function iSection(a, b, s, n, x) {
  const half = s.d / 2;
  const web = prism(a, b, mul(x, s.tw / 2), mul(n, half - s.tf));
  const f1 = prism(add(a, mul(n, half - s.tf / 2)), add(b, mul(n, half - s.tf / 2)),
    mul(x, s.bf / 2), mul(n, s.tf / 2));
  const f2 = prism(sub(a, mul(n, half - s.tf / 2)), sub(b, mul(n, half - s.tf / 2)),
    mul(x, s.bf / 2), mul(n, s.tf / 2));
  return [web, f1, f2];
}

/* ── the frame, as a flat list of parts with a build order ────────────────────
   `group` decides when a part arrives and how it moves; `t0`/`t1` are its own
   window inside the timeline, staggered along the length of the building so
   the erection reads from one end to the other.                             */

function build() {
  const parts = [];
  const X = v3(1, 0, 0);
  const push = (solids, group, t0, t1, pivot, extra) => {
    for (const s of solids) parts.push({ ...s, group, t0, t1, pivot, ...extra });
  };

  for (let i = 0; i <= BAYS; i++) {
    const x = -LEN / 2 + i * BAY;
    const f = i / BAYS;                       // 0 at the near end, 1 at the far
    for (const side of [-1, 1]) {
      const z = side * SPAN / 2;
      const foot = v3(x, 0, z), top = v3(x, EAVES, z);

      /* base plate — lands first */
      push([prism(v3(x, 0.012, z), v3(x, 0.048, z), v3(PLATE / 2, 0, 0), v3(0, 0, PLATE / 2))],
        'plate', 0.00 + f * 0.10, 0.13 + f * 0.10);

      /* column — web in the frame plane, so its depth runs across the span */
      push(iSection(foot, top, COL, v3(0, 0, 1), X), 'column',
        0.09 + f * 0.13, 0.34 + f * 0.13, foot);

      /* rafter — eaves to apex, swinging down about the eaves */
      const apex = v3(x, APEX, 0);
      const dir = norm(sub(apex, top));
      const n = norm(cross(dir, X));
      push(iSection(top, apex, RAF, n, X), 'rafter',
        0.38 + f * 0.14, 0.66 + f * 0.14, top,
        { axis: X, swing: -side * 1.05 });
    }
  }

  /* Purlins run the whole length, sitting on the roof plane. */
  const slope = norm(sub(v3(0, APEX, 0), v3(0, EAVES, SPAN / 2)));
  const rn = norm(cross(slope, X));
  for (const side of [-1, 1]) {
    for (let k = 1; k <= 5; k++) {
      const t = k / 6;
      const z = side * (SPAN / 2) * (1 - t);
      const y = EAVES + (APEX - EAVES) * t;
      const c = add(v3(0, y, z), mul(rn, side * PURLIN * 0.7));
      push([prism(add(c, v3(-LEN / 2, 0, 0)), add(c, v3(LEN / 2, 0, 0)),
        v3(0, PURLIN / 2, 0), mul(norm(cross(X, v3(0, 1, 0))), PURLIN / 2))],
        'purlin', 0.62 + k * 0.018, 0.80 + k * 0.018);
    }
  }

  /* Ridge. Without it the two rafter lines meet at nothing and the top of the
     silhouette reads as ambiguous. */
  push([prism(v3(-LEN / 2, APEX + 0.14, 0), v3(LEN / 2, APEX + 0.14, 0),
    v3(0, 0.09, 0), v3(0, 0, 0.22))], 'purlin', 0.70, 0.86);

  /* Sheeting. Thin slabs rather than single faces, so an edge is visible where
     a plane turns — sheeting has a cut edge and it catches light. Laid on in
     strips down the length, which is the order it actually goes on and the
     sweep that hands over to the photograph. */
  const STRIPS = 6;
  for (let k = 0; k < STRIPS; k++) {
    const x0 = -LEN / 2 + k * (LEN / STRIPS), x1 = x0 + LEN / STRIPS;
    /* k = 0 is the near end, which is on the LEFT of the screen. Reversing the
       order means the far end is clad first and the sweep runs right to left,
       the same direction as the reveal that follows it. */
    const t0 = 0.74 + (STRIPS - 1 - k) * 0.028;
    for (const side of [-1, 1]) {
      const eave = v3(0, EAVES, side * SPAN / 2), apex = v3(0, APEX, 0);
      const mid = mul(add(eave, apex), 0.5);
      const along = norm(sub(apex, eave));
      const half = Math.hypot(SPAN / 2, APEX - EAVES) / 2;
      const nrm = norm(cross(along, X));
      const c0 = add(v3(x0 + 0.02, mid.y, mid.z), mul(nrm, side * 0.16));
      const c1 = add(v3(x1 - 0.02, mid.y, mid.z), mul(nrm, side * 0.16));
      push([prism(c0, c1, mul(along, half), mul(nrm, 0.022))],
        'sheet', t0, t0 + 0.11);
    }
  }
  return parts;
}

/* ── camera ───────────────────────────────────────────────────────────────── */

/* ── camera ───────────────────────────────────────────────────────────────────
   Composition, not a default orbit. Three things it has to do:

   · Sit LOW and CLOSE. A distant camera turns a 0.5m column into a 4px line
     and the whole thing reads as a wireframe sketch. From 24m at eye height
     3.5m the near column is ~40px of shaded steel and the frame is monumental.

   · Look along the LENGTH, not at the gable. Near gable-on, a column presents
     its 0.24m flange width; from along the building it presents its 0.53m web
     depth and the bays recede in strong perspective. Repetition in perspective
     is what communicates scale.

   · Leave the left of the frame to the copy. The hero text block occupies
     roughly the left half, so the building mass is pushed right and allowed to
     bleed off the right and top edges — a foreground structural silhouette
     rather than a diagram centred in a box.                                 */

const CAM = {
  az: -1.06,      // radians; more negative swings toward the side elevation
  r: 25.5,        // distance from the target
  y: 3.4,         // eye height, metres — below the eaves, looking up into it
  target: v3(7.5, 5.4, 0),
  lift: 1.4,      // how far the eye rises across the whole shot
  swing: 0.055,   // how far the azimuth drifts across the whole shot
  f: 1.30,
  /* A pan in SCREEN space, as a fraction of the viewport. Composition is a
     framing decision, not a 3D one: nudging the target in world space also
     changes which end of the building we look down. This just slides the
     frame right, clearing the left half for the copy. */
  shiftX: 0.26,
  shiftY: 0.03
};

function camera(aspect, drift) {
  const a = CAM.az + drift * CAM.swing;
  const eye = v3(Math.sin(a) * CAM.r, CAM.y + drift * CAM.lift, Math.cos(a) * CAM.r);
  const fwd = norm(sub(CAM.target, eye));
  const right = norm(cross(fwd, v3(0, 1, 0)));
  const up = cross(right, fwd);
  /* Narrow viewports get a shorter lens so the frame still fits the height. */
  const f = CAM.f * Math.min(1, aspect / 1.55);
  return { eye, right, up, fwd, f };
}

function project(p, cam, w, h) {
  const d = sub(p, cam.eye);
  const z = dot(d, cam.fwd);
  if (z <= 0.25) return null;
  const s = (cam.f * h) / z;
  return {
    x: w * (0.5 + CAM.shiftX) + dot(d, cam.right) * s,
    y: h * (0.5 + CAM.shiftY) - dot(d, cam.up) * s,
    z
  };
}

/* ── easing — heavy, mechanical, no overshoot ─────────────────────────────── */

const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const easeHeavy = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeSettle = (t) => 1 - Math.pow(1 - t, 4);

/* ── colour ───────────────────────────────────────────────────────────────── */

/* Red-oxide primer, the colour on Kingson's own steel in roofTrusses. */
const OXIDE = [126, 58, 44];
const LIGHT = norm(v3(-0.45, 0.82, 0.36));

/* A narrow shading range is what makes flat-shaded solids read as plastic. The
   shadow side has to go genuinely dark against the near-black ground, and the
   faces square to the light need a hard specular step — that is what says
   "rolled steel with primer on it" rather than "brown polygon". */
function shade(nrm) {
  const ndl = Math.max(0, dot(nrm, LIGHT));
  const k = 0.34 + 1.22 * (0.08 + 0.92 * ndl);
  /* The specular is capped deliberately. Unbounded, the faces square to the
     light reached rgb(225,115,92), and white copy over that is 2.95:1 — below
     even the large-text threshold. Steel that blows out behind the h1 is not a
     look, it is a bug. */
  const spec = ndl > 0.88 ? (ndl - 0.88) * 70 : 0;
  const c = (i) => Math.max(0, Math.min(255, OXIDE[i] * k + spec)) | 0;
  return `rgb(${c(0)},${c(1)},${c(2)})`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   mount
   ═══════════════════════════════════════════════════════════════════════════ */

/* The narrowest viewport the composition survives. Below this the hero's copy
   block fills the frame, the receding bays have no horizontal room, and the
   steel reads as a few sticks behind text — measured at 390x675, where it was
   worse than no animation at all.

   So a phone does not get a reduced version of this; it gets the photograph at
   full strength, immediately, which is the stronger mobile hero and costs no
   battery. The narrative is unchanged — the chapters carry it either way. */
const MIN_WIDTH = 900;

export function mount(host, { onDone } = {}) {
  if (!host) return null;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { onDone && onDone(); return null; }
  if (window.innerWidth < MIN_WIDTH) { onDone && onDone(); return null; }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) { onDone && onDone(); return null; }

  canvas.className = 'hero-assembly';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);

  const parts = build();
  /* A low-end phone gets fewer pixels rather than fewer frames. */
  const dpr = Math.min(window.devicePixelRatio || 1,
    (navigator.hardwareConcurrency || 4) <= 4 ? 1.25 : 2);
  let w = 0, h = 0, raf = 0, start = 0, stopped = false;

  function size() {
    const r = host.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const DUR = 2600;

  function frame(now) {
    if (stopped) return;
    if (!start) start = now;
    const t = clamp01((now - start) / DUR);

    ctx.clearRect(0, 0, w, h);

    /* The ground the steel is erected against: the hero's own dark, fading out
       as the sheeting sweep hands over to the photograph. */
    const groundAlpha = 1 - easeSettle(clamp01((t - 0.74) / 0.26));
    if (groundAlpha > 0.002) {
      ctx.globalAlpha = groundAlpha;
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#0a0c0b'); g.addColorStop(1, '#121615');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
    }

    const cam = camera(w / h, easeSettle(t));
    const quads = [];

    for (const p of parts) {
      const local = clamp01((t - p.t0) / (p.t1 - p.t0));
      if (local <= 0) continue;
      const e = p.group === 'rafter' ? easeSettle(local) : easeHeavy(local);

      /* Every group moves the way its real counterpart does. */
      let tf = null;
      if (p.group === 'plate') tf = (q) => v3(q.x, q.y + (1 - e) * 1.1, q.z);
      else if (p.group === 'column') {
        tf = (q) => v3(q.x, p.pivot.y + (q.y - p.pivot.y) * e, q.z);
      } else if (p.group === 'rafter') {
        /* swung down about the eaves, the way a crane sets one */
        const ang = p.swing * (1 - e);
        const ca = Math.cos(ang), sa = Math.sin(ang);
        tf = (q) => {
          const d = sub(q, p.pivot);
          return add(p.pivot, v3(d.x, d.y * ca - d.z * sa, d.y * sa + d.z * ca));
        };
      } else if (p.group === 'sheet') {
        /* laid on from above, the last thing to happen */
        const drop = (1 - e) * 2.6;
        tf = (q) => v3(q.x, q.y + drop, q.z);
      } else {
        /* purlins run in along the length of the building */
        const slide = (1 - e) * LEN * 0.9;
        tf = (q) => v3(q.x - slide, q.y, q.z);
      }

      const pv = p.verts.map(tf);
      const scr = pv.map((q) => project(q, cam, w, h));

      for (const f of p.faces) {
        const a = scr[f[0]], b = scr[f[1]], c = scr[f[2]], d2 = scr[f[3]];
        if (!a || !b || !c || !d2) continue;
        /* Back-face cull on screen winding — cheaper than a world normal. */
        const area = (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y);
        if (area >= 0) continue;
        const n = norm(cross(sub(pv[f[1]], pv[f[0]]), sub(pv[f[3]], pv[f[0]])));
        quads.push({
          pts: [a, b, c, d2], fill: shade(n),
          depth: (a.z + b.z + c.z + d2.z) * 0.25,
          alpha: p.group === 'purlin' || p.group === 'sheet' ? Math.min(1, e * 1.8) : 1
        });
      }
    }

    /* Painter's algorithm: far to near. */
    quads.sort((a, b) => b.depth - a.depth);

    for (const q of quads) {
      ctx.globalAlpha = q.alpha;
      ctx.fillStyle = q.fill;
      ctx.beginPath();
      ctx.moveTo(q.pts[0].x, q.pts[0].y);
      for (let i = 1; i < 4; i++) ctx.lineTo(q.pts[i].x, q.pts[i].y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* ── the handover ──────────────────────────────────────────────────────
       Not a crossfade. A soft-edged wipe travels along the building in the
       same direction the sheeting just went on — right to left, far end to
       near — ERASING this canvas, its steel and its dark ground together, so
       the real photograph underneath is uncovered behind the moving edge.
       Cladding going on, and the model becoming the thing it was modelling.
       One composite operation.

       Right to left also means the copy, which sits lower left, keeps its own
       dark ground until the very end of the shot. */
    const wipe = easeSettle(clamp01((t - 0.78) / 0.22));
    if (wipe > 0) {
      const soft = w * 0.30;
      const edge = w + soft - wipe * (w + soft * 2);
      const g = ctx.createLinearGradient(edge + soft, 0, edge, 0);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = g;
      ctx.fillRect(Math.min(w, edge), 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
    }

    if (t >= 1) { stop(); onDone && onDone(); return; }
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    stopped = true;
    cancelAnimationFrame(raf);
    canvas.remove();          /* one-shot: the canvas does not linger */
    window.removeEventListener('resize', size);
  }

  size();
  window.addEventListener('resize', size, { passive: true });
  raf = requestAnimationFrame(frame);
  return { stop };
}
