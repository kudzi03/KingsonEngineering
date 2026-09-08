/* ═══════════════════════════════════════════════════════════════════════════
   experience/crops.js — the one source-to-viewport transform
   ═══════════════════════════════════════════════════════════════════════════

   V2 §18 requires a single cover transform shared by photographs, masks and
   the projected registration of the WebGL corner. This is that function, and
   nothing else in the build is allowed to compute a cover fit.

   Why it matters: Scene 1 has to land a modelled steel corner on the actual
   column in the photograph. If the image is placed by `object-fit: cover` and
   the geometry is registered by separate arithmetic, the two agree at one
   viewport ratio and drift at every other. So the photograph is NOT laid out
   by object-fit — `cover()` returns explicit pixel geometry, the plane is
   written from it, and `project()` reads the same numbers.

     cover(src, box, opts) -> { x, y, w, h, scale }
       x/y   top-left of the drawn image in box coordinates (usually negative)
       w/h   drawn size in CSS px
     project(fit, u, v)   -> [px, py]   normalised source point to box px
     unproject(fit, px, py) -> [u, v]

   `window` crops the source before fitting: [l, t, r, b] in normalised source
   coordinates. The crane needs it, because the top fifth of that portrait is
   empty sky and fitting the whole frame wastes the subject.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * @param {{w:number,h:number,focal:number[],window?:number[]}} source
 * @param {{w:number,h:number}} box    the field the image has to fill
 * @param {{zoom?:number, focal?:number[], window?:number[], bleed?:number}} [opts]
 */
export function cover(source, box, opts = {}) {
  const win = opts.window || source.window || [0, 0, 1, 1];
  const winW = source.w * (win[2] - win[0]);
  const winH = source.h * (win[3] - win[1]);

  const zoom = opts.zoom || 1;
  /* `bleed` is slack in CSS px on every side, for a scene that then translates
     the plane (Scene 2 is the only one that does). Without it a parallax of a
     few px slides the photograph off its own edge and opens a black gutter —
     which is exactly the "empty background" the static rejection test forbids.
     The slack is bought by scale here, once, rather than by each scene
     guessing at its own margin. */
  const bleed = Math.max(0, opts.bleed || 0);
  const scale = Math.max((box.w + bleed * 2) / winW, (box.h + bleed * 2) / winH) * zoom;

  /* The <img> renders the WHOLE photograph, so a window is realised by
     placing the full image and letting the plane clip it — not by pretending
     the element is only the window. Getting this wrong stretches any source
     that carries a window, which is exactly what the crane does. */
  const imgW = source.w * scale;
  const imgH = source.h * scale;

  const wx = win[0] * imgW, wy = win[1] * imgH;
  const ww = winW * scale,  wh = winH * scale;

  const f = opts.focal || source.focal || [0.5, 0.5];

  /* Put the focal point at the centre of the field, then clamp so the WINDOW
     still covers it. A focal anchor may bias the crop; it may never open a
     gap at an edge. */
  let imgX = box.w / 2 - f[0] * imgW;
  let imgY = box.h / 2 - f[1] * imgH;
  imgX = clamp(imgX, box.w + bleed - (wx + ww), -wx - bleed);
  imgY = clamp(imgY, box.h + bleed - (wy + wh), -wy - bleed);

  return { imgX, imgY, imgW, imgH, scale, win, bleed,
           /* the visible window, in box coordinates */
           x: imgX + wx, y: imgY + wy, w: ww, h: wh };
}

/** How far a fit may be translated before its window uncovers the box. */
export function slack(fit, box) {
  return { minX: box.w - (fit.x + fit.w), maxX: -fit.x,
           minY: box.h - (fit.y + fit.h), maxY: -fit.y };
}

/** Normalised SOURCE coordinate -> pixel position inside the box. */
export function project(fit, u, v) {
  return [fit.imgX + u * fit.imgW, fit.imgY + v * fit.imgH];
}

/** Pixel position inside the box -> normalised source coordinate. */
export function unproject(fit, px, py) {
  return [(px - fit.imgX) / fit.imgW, (py - fit.imgY) / fit.imgH];
}

/** The CSS a photographic plane needs to realise a fit. One write, no reads. */
export function planeStyle(fit) {
  return `width:${fit.imgW.toFixed(2)}px;height:${fit.imgH.toFixed(2)}px;` +
         `transform:translate3d(${fit.imgX.toFixed(2)}px,${fit.imgY.toFixed(2)}px,0)`;
}

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function clamp01(v) { return clamp(v, 0, 1); }
