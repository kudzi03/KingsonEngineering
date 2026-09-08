/* ═══════════════════════════════════════════════════════════════════════════
   experience/interp.js — scrubbing maths
   ═══════════════════════════════════════════════════════════════════════════
   Carried forward from the previous build's engine helpers, which V2 §17 asks
   to preserve. §8: scrubbed position interpolates linearly so a scrubbed edge
   reads as mechanical; only camera settle and aperture arrival use smoothstep,
   and they say so at the call site.
   ═══════════════════════════════════════════════════════════════════════════ */

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const range = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

/** Interpolate two boxes. */
export function mixBox(a, b, t) {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t),
           w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) };
}

/** Interpolate two polygons of equal point count. */
export function mixPoly(a, b, t) {
  if (!a) return b; if (!b) return a;
  return a.map((pt, i) => [lerp(pt[0], b[i][0], t), lerp(pt[1], b[i][1], t)]);
}

/** Interpolate two cover-fit option objects. */
export function mixFit(a, b, t) {
  const f = {};
  f.zoom = lerp(a.zoom == null ? 1 : a.zoom, b.zoom == null ? 1 : b.zoom, t);
  if (a.focal || b.focal) {
    const fa = a.focal || b.focal, fb = b.focal || a.focal;
    f.focal = [lerp(fa[0], fb[0], t), lerp(fa[1], fb[1], t)];
  }
  if (a.window || b.window) {
    const wa = a.window || [0, 0, 1, 1], wb = b.window || [0, 0, 1, 1];
    f.window = wa.map((v, i) => lerp(v, wb[i], t));
  }
  return f;
}

/** Interpolate two title descriptors, keeping the later scene's copy. */
export function mixTitle(a, b, t) {
  if (!a && !b) return null;
  if (!a) return { ...b, opacity: (b.opacity == null ? 1 : b.opacity) * t };
  if (!b) return { ...a, opacity: (a.opacity == null ? 1 : a.opacity) * (1 - t) };
  const same = a.lines.join('|') === b.lines.join('|');
  if (!same) {
    /* Different words never cross-fade into each other — one clears, the next
       arrives (§8: no per-letter motion, no scramble). */
    return t < 0.5
      ? { ...a, opacity: (a.opacity == null ? 1 : a.opacity) * (1 - t * 2) }
      : { ...b, opacity: (b.opacity == null ? 1 : b.opacity) * (t - 0.5) * 2 };
  }
  return {
    ...b,
    xVw: lerp(a.xVw, b.xVw, t), yVh: lerp(a.yVh, b.yVh, t),
    sizeVw: lerp(a.sizeVw, b.sizeVw, t),
    opacity: lerp(a.opacity == null ? 1 : a.opacity, b.opacity == null ? 1 : b.opacity, t)
  };
}
