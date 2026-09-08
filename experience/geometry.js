/* ═══════════════════════════════════════════════════════════════════════════
   experience/geometry.js — the opening corner
   ═══════════════════════════════════════════════════════════════════════════

   V2 §10 Scene 1 and §12. One raw-WebGL canvas carrying one object: a steel
   corner — an I-section column with the rafter it connects to — lying across
   the right of the opening as a near member the viewer is standing behind.

   WHAT IT IS NOT: not a replica of the building, not a hero product render,
   not an orbiting showpiece. It has no idle animation, no environment map, no
   post-processing, no shadow catcher and no reflections. It exists for one
   reason: to make the photograph read as a space you are inside rather than a
   picture you are looking at, and then to withdraw into the real column.

   REGISTRATION (§12). The column's axis is mapped to the two landmarks of the
   traced column in MASKS.portalColumn — points measured off the photograph,
   projected through the SAME cover transform the photograph itself uses. So
   the model lands on the real steel at every viewport ratio, not just at the
   one it was authored at. Between p=0 and p=.55 the member travels from the
   near field to that registration; from .55 to .75 it dissolves and the real
   column is what remains; past .75 nothing renders at all.

   BUDGET (§16): one canvas, one object, one draw call, 336 triangles, no
   render loop — a frame is drawn only when the sampled state changes — and a
   device-pixel-ratio cap of 1.5. Below 900px the canvas is never created.

   FAILURE: if the context is missing or lost the canvas is removed from the
   compositing path entirely. There is never a black rectangle over the
   photograph; the photograph alone is a complete composition.
   ═══════════════════════════════════════════════════════════════════════════ */

import { MASKS } from './masks.js';
import { project } from './crops.js';

const DPR_CAP = 1.5;
const MIN_WIDTH = 900;

/* ── the model ────────────────────────────────────────────────────────────
   Built once, in a local space tied to the column itself:

     y  0 at the column base, 1 at the column top (the two landmarks)
     x  across the section, in half-widths: -1 outer flange, +1 inner
     z  depth, in half-widths, positive toward the viewer

   Nothing in the model is expressed in pixels, so the same buffer registers
   at any viewport. The rafter continues from the column head up and away
   along the direction the photographed rafter takes.                        */

function buildCorner() {
  const path = [], sec = [], nrm = [], idx = [];

  /* An I-section, in section coordinates (across, depth) as fractions of the
     section half-width: outer flange, web, inner flange. */
  const FLANGE = 1.0, WEB = 0.30, TF = 0.22;
  const SECTION = [
    [-1, -FLANGE], [-1, FLANGE], [-1 + TF, FLANGE], [-1 + TF, WEB],
    [1 - TF, WEB], [1 - TF, FLANGE], [1, FLANGE], [1, -FLANGE],
    [1 - TF, -FLANGE], [1 - TF, -WEB], [-1 + TF, -WEB], [-1 + TF, -FLANGE]
  ];

  /* The centreline, in COLUMN units — t runs 0 at the base landmark to 1 at
     the head, and `lat` is measured in the same length, so the rafter keeps
     its proportion to the column at every scale instead of collapsing into a
     vertical stick when the member registers. `raf` marks the nodes that
     belong to the rafter: they fold back into the head as the corner
     withdraws, leaving exactly the photographed column behind. */
  const PATH = [
    { t: -0.10, lat: 0.000, s: 1.00, raf: 0 },   // cut by the bottom of the field
    { t: 0.50, lat: 0.000, s: 1.00, raf: 0 },
    { t: 1.00, lat: 0.000, s: 1.00, raf: 0 },    // the head
    { t: 1.24, lat: -0.17, s: 0.88, raf: 1 },
    { t: 1.62, lat: -0.52, s: 0.70, raf: 1 }
  ];

  let base = 0;
  for (let i = 0; i < PATH.length; i++) {
    const node = PATH[i];
    const prev = PATH[Math.max(0, i - 1)], next = PATH[Math.min(PATH.length - 1, i + 1)];
    /* The sweep frame in the path plane: the section stays square to the
       member, so a rafter reads as steel turning a corner and not as a
       stretched column. */
    const dt = next.t - prev.t, dl = next.lat - prev.lat;
    const L = Math.hypot(dt, dl) || 1;
    const ax = [dl / L, -dt / L];              // "across", in path coordinates

    for (const [a, d] of SECTION) {
      path.push(node.t + ax[0] * 0, node.lat + ax[1] * 0);
      sec.push(a * node.s, d * node.s, node.raf);
      const n = normalise2(ax[0] * a, ax[1] * a, d);
      nrm.push(n[0], n[1], n[2]);
    }
    if (i > 0) {
      const A = base - SECTION.length, B = base;
      for (let k = 0; k < SECTION.length; k++) {
        const k2 = (k + 1) % SECTION.length;
        idx.push(A + k, B + k, A + k2, A + k2, B + k, B + k2);
      }
    }
    base += SECTION.length;
  }

  /* Cap the rafter end: cut steel, not an open tube. */
  const last = base - SECTION.length;
  for (let k = 1; k < SECTION.length - 1; k++) idx.push(last, last + k, last + k + 1);

  return { path: new Float32Array(path), sec: new Float32Array(sec),
           nrm: new Float32Array(nrm), idx: new Uint16Array(idx) };
}

function normalise2(x, y, z) {
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l];
}

/* ── shaders ──────────────────────────────────────────────────────────────
   The whole "camera" is the affine map from the model's local frame to the
   two registered landmark points on screen, plus a small depth shear that
   gives the section its thickness. There is no view or projection matrix to
   drift out of agreement with the photograph, because there is no second
   description of where the column is.                                       */

const VERT = `
attribute vec2 aPath;    // t along the column, lateral offset — both in column lengths
attribute vec3 aSec;     // section offset (across, depth) in half-widths, and rafter flag
attribute vec3 aNrm;
uniform vec2 uBase;      // screen px: the column base landmark
uniform vec2 uAxis;      // screen px: base -> top
uniform vec2 uSide;      // screen px: one column length, square to the axis
uniform vec2 uAcross;    // screen px: one half-width across the section
uniform vec2 uDepth;     // screen px: one half-width of depth (the shear)
uniform float uTaper;    // section widening toward the head, for the near view
uniform float uRafter;   // 1 near, 0 registered — the rafter folds into the head
uniform float uReg;      // 0 near, 1 registered
uniform vec2 uViewport;
varying vec3 vNrm;
void main() {
  float raf = aSec.z;
  /* Rafter nodes fold back into the column head, so what finally dissolves
     into the photograph is the column and nothing else. */
  float t = mix(aPath.x, min(aPath.x, 1.0), raf * (1.0 - uRafter));
  /* The near member runs past the bottom of the field; the registered one
     stops exactly on the photographed column's base, or the dissolve leaves a
     stub of steel standing in the dirt. */
  t = mix(t, max(t, 0.0), uReg);
  float lat = aPath.y * mix(1.0, uRafter, raf);

  /* A near member is wider at the end closest to the camera. The taper is a
     property of the view, not of the steel, so it runs out to zero as the
     member registers onto the photographed column. */
  float w = 1.0 + uTaper * clamp(t, 0.0, 1.6);
  vec2 px = uBase + uAxis * t + uSide * lat
          + (uAcross * aSec.x + uDepth * aSec.y) * w;
  vNrm = aNrm;
  gl_Position = vec4((px.x / uViewport.x) * 2.0 - 1.0,
                     1.0 - (px.y / uViewport.y) * 2.0,
                     /* depth only orders the object against itself */
                     -aSec.y * 0.06, 1.0);
}`;

const FRAG = `
precision mediump float;
varying vec3 vNrm;
uniform float uOpacity;
void main() {
  /* One key light, upper left, as in the photograph. Matte graphite: no
     specular lobe, no environment, no rim glow. */
  vec3 L = normalize(vec3(-0.55, 0.72, 0.42));
  float d = max(dot(normalize(vNrm), L), 0.0);
  vec3 base = vec3(0.10, 0.12, 0.11);
  vec3 col = base * (0.55 + 0.95 * d);
  gl_FragColor = vec4(col * uOpacity, uOpacity);
}`;

/* ── the bridge ──────────────────────────────────────────────────────────── */

export function createGeometry(canvas) {
  let gl = null, prog = null, buf = null, model = null, ready = false;
  let dead = false, still = false;
  let lastKey = '';

  function kill() {
    dead = true; ready = false;
    if (canvas) { canvas.style.display = 'none'; canvas.width = canvas.height = 1; }
  }

  function init() {
    if (dead || ready || !canvas) return ready;
    if (window.innerWidth < MIN_WIDTH) { kill(); return false; }
    try {
      gl = canvas.getContext('webgl', {
        alpha: true, premultipliedAlpha: true, antialias: true,
        depth: true, preserveDrawingBuffer: false, powerPreference: 'low-power'
      });
    } catch { gl = null; }
    if (!gl) { kill(); return false; }

    canvas.addEventListener('webglcontextlost', (e) => {
      /* §16: a lost context is a state, not a crash. The photograph is
         already a complete composition, so the canvas simply leaves. */
      e.preventDefault(); kill();
    });

    const vs = shader(gl.VERTEX_SHADER, VERT);
    const fs = shader(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { kill(); return false; }
    prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { kill(); return false; }

    model = buildCorner();
    buf = {
      path: arrayBuffer(model.path), sec: arrayBuffer(model.sec),
      nrm: arrayBuffer(model.nrm),
      idx: elementBuffer(model.idx), count: model.idx.length
    };
    gl.useProgram(prog);
    bind('aPath', buf.path, 2); bind('aSec', buf.sec, 3); bind('aNrm', buf.nrm, 3);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);   // premultiplied
    ready = true;
    return true;
  }

  function shader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }
  function arrayBuffer(data) {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return b;
  }
  function elementBuffer(data) {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return b;
  }
  function bind(name, b, size) {
    const loc = gl.getAttribLocation(prog, name);
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  }

  function hide() { if (canvas && !dead) canvas.style.visibility = 'hidden'; }

  /**
   * @param state  the sampled stage state
   * @param vp     the measured viewport
   * @param stage  the stage writer, for the live fit of the portal plane
   */
  function write(state, vp, stage) {
    const g = state.geometry;
    if (dead) return;
    if (!g || !g.visible || g.opacity <= 0.004 || vp.w < MIN_WIDTH) { hide(); return; }
    if (!init()) return;

    /* Where the member has to end up: the traced column, projected through
       the same cover transform the photograph is drawn with. */
    const fit = stage.fitOf('portalFrame');
    const box = stage.boxOf('portalFrame');
    if (!fit || !box) { hide(); return; }

    const M = MASKS.portalColumn;
    const [bx, by] = project(fit, M.landmarks.base[0], M.landmarks.base[1]);
    const [tx, ty] = project(fit, M.landmarks.top[0], M.landmarks.top[1]);
    const regBase = [box.x + bx, box.y + by];
    const regTop = [box.x + tx, box.y + ty];
    const regHalf = M.halfWidth * fit.imgW;

    /* Where it starts: a near member crossing the right of the field, cut by
       the top and bottom edges — the framing obstruction of §10. It leaves a
       margin of real photograph past its outer flange, so the frame's far
       bays are never sealed off by it. */
    const nearBase = [vp.w * 0.9275, vp.h * 1.05];
    const nearTop = [vp.w * 0.8875, vp.h * -0.05];
    const nearHalf = vp.w * 0.0225;
    const nearTaper = 1.30;

    const t = g.registered != null ? g.registered : 1;
    const e = t * t * (3 - 2 * t);
    const baseP = mix2(nearBase, regBase, e);
    const topP = mix2(nearTop, regTop, e);
    const half = nearHalf + (regHalf - nearHalf) * e;
    const taper = nearTaper * (1 - e);

    const axis = [topP[0] - baseP[0], topP[1] - baseP[1]];
    const len = Math.hypot(axis[0], axis[1]) || 1;
    /* One column length, square to the axis — the unit the rafter is drawn in. */
    const side = [axis[1], -axis[0]];
    /* Across the section: perpendicular to the axis, one half-width long. */
    const across = [(axis[1] / len) * half, (-axis[0] / len) * half];
    /* Depth: the section is seen slightly from the left and above, so a unit
       of z moves a little right and a little down on screen. The shear closes
       as the member registers — a column that far away is seen nearly
       edge-on, and any residual shear is width the real steel does not have. */
    const dz = 0.62 * (1 - 0.80 * e);
    const depth = [half * dz, half * 0.48 * dz];

    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const cw = Math.round(vp.w * dpr), ch = Math.round(vp.h * dpr);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw; canvas.height = ch;
    }
    canvas.style.visibility = 'visible';

    /* No render loop: one frame per changed state, and nothing at all when
       the sampled state has not moved. */
    const key = [baseP[0], baseP[1], topP[0], topP[1], half, taper, e, g.opacity, cw].
      map((n) => n.toFixed(2)).join(',');
    if (key === lastKey && !still) return;
    lastKey = key;

    gl.viewport(0, 0, cw, ch);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(prog);
    u2('uBase', baseP); u2('uAxis', axis); u2('uSide', side); u2('uAcross', across);
    u2('uDepth', depth); u2('uViewport', [vp.w, vp.h]);
    gl.uniform1f(gl.getUniformLocation(prog, 'uTaper'), taper);
    gl.uniform1f(gl.getUniformLocation(prog, 'uRafter'), 1 - e);
    gl.uniform1f(gl.getUniformLocation(prog, 'uReg'), e);
    gl.uniform1f(gl.getUniformLocation(prog, 'uOpacity'), g.opacity);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf.idx);
    gl.drawElements(gl.TRIANGLES, buf.count, gl.UNSIGNED_SHORT, 0);
  }

  function u2(name, v) { gl.uniform2f(gl.getUniformLocation(prog, name), v[0], v[1]); }

  return {
    write,
    /** A pinned still redraws unconditionally; scrolling redraws on change. */
    setStill(v) { still = !!v; },
    dispose: kill,
    /** For the registration check in the QA pass. */
    debug(vp, stage) {
      const fit = stage.fitOf('portalFrame'), box = stage.boxOf('portalFrame');
      if (!fit) return null;
      const M = MASKS.portalColumn;
      const b = project(fit, M.landmarks.base[0], M.landmarks.base[1]);
      const t = project(fit, M.landmarks.top[0], M.landmarks.top[1]);
      return { base: [box.x + b[0], box.y + b[1]], top: [box.x + t[0], box.y + t[1]],
               half: M.halfWidth * fit.imgW };
    }
  };
}

function mix2(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
