/* ═══════════════════════════════════════════════════════════════════════════
   steel.js — the portal frame
   ═══════════════════════════════════════════════════════════════════════════

   A scroll-driven WebGL scene: a steel portal frame assembles out of its own
   members, holds, then breaks apart again as the page moves past it.

   Written against raw WebGL rather than a library. The whole scene is ~65
   members drawn in one call, so a framework would cost 170 KB gzipped to do
   less than this file does in 10 KB — and the members have to be real I-
   sections (flange, web, flange) or the thing reads as scaffolding instead of
   structural steel.

   Everything degrades:
     · no WebGL            → caller shows the photographic fallback
     · prefers-reduced-motion → one static assembled frame, no loop
     · off screen          → render loop stops
     · small screen        → fewer bays, capped pixel ratio

   Public API:
     var scene = SteelFrame(canvas);      // null if WebGL is unavailable
     scene.setProgress(0..1);             // scroll position through the scene
     scene.setPointer(x, y);              // -1..1, camera parallax
     scene.start(); scene.stop(); scene.destroy();
   ═══════════════════════════════════════════════════════════════════════════ */

window.SteelFrame = (function () {
  'use strict';

  /* ── tiny 4×4 matrix helpers ────────────────────────────────────────── */

  function perspective(fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return [f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) * nf, -1,
            0, 0, 2 * far * near * nf, 0];
  }

  function lookAt(eye, center, up) {
    var z0 = eye[0] - center[0], z1 = eye[1] - center[1], z2 = eye[2] - center[2];
    var l = 1 / Math.hypot(z0, z1, z2); z0 *= l; z1 *= l; z2 *= l;

    var x0 = up[1] * z2 - up[2] * z1,
        x1 = up[2] * z0 - up[0] * z2,
        x2 = up[0] * z1 - up[1] * z0;
    l = Math.hypot(x0, x1, x2);
    l = l ? 1 / l : 0; x0 *= l; x1 *= l; x2 *= l;

    var y0 = z1 * x2 - z2 * x1,
        y1 = z2 * x0 - z0 * x2,
        y2 = z0 * x1 - z1 * x0;

    return [x0, y0, z0, 0,
            x1, y1, z1, 0,
            x2, y2, z2, 0,
            -(x0 * eye[0] + x1 * eye[1] + x2 * eye[2]),
            -(y0 * eye[0] + y1 * eye[1] + y2 * eye[2]),
            -(z0 * eye[0] + z1 * eye[1] + z2 * eye[2]), 1];
  }

  /* smoothstep — the camera path needs it and steel.js deliberately has no
     dependency on engine.js */
  function ease(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }

  function mul(a, b) {
    var o = new Float32Array(16);
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 4; j++) {
        var s = 0;
        for (var k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k];
        o[i * 4 + j] = s;
      }
    }
    return o;
  }


  /* ── geometry ───────────────────────────────────────────────────────────
     Members are emitted straight into world space. There is no model matrix
     and no instancing, so vertex normals are already world normals and the
     fragment shader needs no normal matrix. */

  function Builder() {
    this.pos = [];      // final resting position
    this.from = [];     // position before assembly
    this.nrm = [];
    this.seed = [];     // 0..1, staggers each member's arrival
    this._member = 0;
  }

  /* One rectangular prism from a→b with the given cross-section, oriented so
     that `up` is the section's local +Y. This is the primitive everything
     else is built from — an I-section is three of these. */
  Builder.prototype.box = function (a, b, w, h, up, scatter, seed, offU, offV) {
    var dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    var len = Math.hypot(dx, dy, dz);
    if (len < 1e-6) return;
    var ax = dx / len, ay = dy / len, az = dz / len;              // length axis

    // v = up orthogonalised against the length axis
    var d = up[0] * ax + up[1] * ay + up[2] * az;
    var vx = up[0] - ax * d, vy = up[1] - ay * d, vz = up[2] - az * d;
    var vl = Math.hypot(vx, vy, vz);
    if (vl < 1e-6) { vx = 0; vy = 0; vz = 1; vl = 1; }
    vx /= vl; vy /= vl; vz /= vl;

    // u = v × axis, the section's local +X
    var ux = vy * az - vz * ay,
        uy = vz * ax - vx * az,
        uz = vx * ay - vy * ax;

    offU = offU || 0; offV = offV || 0;
    var hw = w / 2, hh = h / 2;

    // eight corners: c(sign along length, sign along u, sign along v)
    function corner(sl, su, sv) {
      var p = sl < 0 ? a : b;
      var cu = su * hw + offU, cv = sv * hh + offV;
      return [p[0] + ux * cu + vx * cv,
              p[1] + uy * cu + vy * cv,
              p[2] + uz * cu + vz * cv];
    }

    var c = [corner(-1,-1,-1), corner(-1,1,-1), corner(-1,1,1), corner(-1,-1,1),
             corner( 1,-1,-1), corner( 1,1,-1), corner( 1,1,1), corner( 1,-1,1)];

    var faces = [
      [0, 3, 2, 1, [-ax, -ay, -az]],   // start cap
      [4, 5, 6, 7, [ ax,  ay,  az]],   // end cap
      [0, 1, 5, 4, [-vx, -vy, -vz]],
      [3, 7, 6, 2, [ vx,  vy,  vz]],
      [1, 2, 6, 5, [ ux,  uy,  uz]],
      [0, 4, 7, 3, [-ux, -uy, -uz]]
    ];

    var self = this;
    function vert(p, n) {
      self.pos.push(p[0], p[1], p[2]);
      self.nrm.push(n[0], n[1], n[2]);
      self.from.push(p[0] + scatter[0], p[1] + scatter[1], p[2] + scatter[2]);
      self.seed.push(seed);
    }

    for (var f = 0; f < faces.length; f++) {
      var q = faces[f], n = q[4];
      vert(c[q[0]], n); vert(c[q[1]], n); vert(c[q[2]], n);
      vert(c[q[0]], n); vert(c[q[2]], n); vert(c[q[3]], n);
    }
  };

  /* A real I-section: bottom flange, web, top flange. Reads unmistakably as
     structural steel where a plain box reads as a stick. */
  Builder.prototype.ibeam = function (a, b, bw, bh, up, scatter, seed) {
    var tf = bh * 0.17, tw = bw * 0.16;
    this.box(a, b, bw, tf, up, scatter, seed, 0, -(bh - tf) / 2);   // bottom flange
    this.box(a, b, tw, bh - 2 * tf, up, scatter, seed, 0, 0);        // web
    this.box(a, b, bw, tf, up, scatter, seed, 0,  (bh - tf) / 2);    // top flange
  };


  /* Scatter a member outward from the structure's centre, so assembly reads
     as parts converging rather than parts sliding. */
  function scatterFor(cx, cy, cz, seed, amount) {
    var r = Math.hypot(cx, cz) + 0.001;
    var s = 1 + seed * 1.6;
    return [(cx / r) * amount * s * 0.9,
            (cy * 0.35 + 3.5) * amount * 0.28 * s,
            (cz / r) * amount * s * 0.55 + (seed - 0.5) * amount * 0.5];
  }

  function buildFrame(bays) {
    var b = new Builder();

    var SPAN = 13.0,      // portal span
        EAVE = 5.0,       // eave height
        APEX = 7.6,       // ridge height
        BAY  = 4.2;       // bay spacing

    var z0 = -(bays - 1) * BAY / 2;
    var zs = [];
    for (var i = 0; i < bays; i++) zs.push(z0 + i * BAY);

    var SC = 9.0;   // how far members start from home
    var n = 0;
    function seed() { return (n++ % 17) / 17; }   // deterministic stagger

    var hs = SPAN / 2;

    /* ── the frames themselves: columns and rafters ── */
    for (i = 0; i < bays; i++) {
      var z = zs[i];
      var fs = seed();

      // columns — web in the plane of the frame
      b.ibeam([-hs, 0, z], [-hs, EAVE, z], 0.52, 0.92, [0, 0, 1],
              scatterFor(-hs, EAVE / 2, z, fs, SC), fs);
      b.ibeam([ hs, 0, z], [ hs, EAVE, z], 0.52, 0.92, [0, 0, 1],
              scatterFor( hs, EAVE / 2, z, fs, SC), fs);

      // rafters up to the ridge
      var rs = seed();
      b.ibeam([-hs, EAVE, z], [0, APEX, z], 0.48, 0.82, [0, 0, 1],
              scatterFor(-hs / 2, (EAVE + APEX) / 2, z, rs, SC), rs);
      b.ibeam([ hs, EAVE, z], [0, APEX, z], 0.48, 0.82, [0, 0, 1],
              scatterFor( hs / 2, (EAVE + APEX) / 2, z, rs, SC), rs);
    }

    /* ── longitudinal steel: eave beams and the ridge ── */
    for (i = 0; i < bays - 1; i++) {
      var za = zs[i], zb = zs[i + 1], zc = (za + zb) / 2, ls = seed();
      b.ibeam([-hs, EAVE, za], [-hs, EAVE, zb], 0.34, 0.56, [0, 1, 0],
              scatterFor(-hs, EAVE, zc, ls, SC), ls);
      b.ibeam([ hs, EAVE, za], [ hs, EAVE, zb], 0.34, 0.56, [0, 1, 0],
              scatterFor( hs, EAVE, zc, ls, SC), ls);
      b.ibeam([0, APEX, za], [0, APEX, zb], 0.32, 0.52, [0, 1, 0],
              scatterFor(0.001, APEX, zc, ls, SC), ls);
    }

    /* ── purlins across the rafters, side rails down the columns ── */
    var ts = [0.30, 0.62];
    for (i = 0; i < bays - 1; i++) {
      for (var s = 0; s < 2; s++) {
        var sign = s ? 1 : -1;
        for (var t = 0; t < ts.length; t++) {
          var f = ts[t];
          var px = sign * hs * (1 - f), py = EAVE + (APEX - EAVE) * f;
          var ps = seed();
          b.box([px, py, zs[i]], [px, py, zs[i + 1]], 0.16, 0.34, [0, 1, 0],
                scatterFor(px, py, (zs[i] + zs[i + 1]) / 2, ps, SC), ps);
        }
        // side rail
        var ry = EAVE * 0.55, rs2 = seed();
        b.box([sign * hs, ry, zs[i]], [sign * hs, ry, zs[i + 1]], 0.16, 0.30, [0, 1, 0],
              scatterFor(sign * hs, ry, (zs[i] + zs[i + 1]) / 2, rs2, SC), rs2);
      }
    }

    /* ── bracing in the end bays: the diagonals that make it a structure ── */
    function brace(p, q) {
      var bs = seed();
      b.box(p, q, 0.11, 0.11, [0, 1, 0],
            scatterFor((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2, bs, SC), bs);
    }
    var zA = zs[0], zB = zs[1], zY = zs[bays - 2], zZ = zs[bays - 1];
    for (var sd = 0; sd < 2; sd++) {
      var sg = sd ? 1 : -1;
      brace([sg * hs, 0, zA], [sg * hs, EAVE, zB]);
      brace([sg * hs, EAVE, zA], [sg * hs, 0, zB]);
      brace([sg * hs, 0, zZ], [sg * hs, EAVE, zY]);
      brace([sg * hs, EAVE, zZ], [sg * hs, 0, zY]);
      // roof plane bracing
      brace([sg * hs, EAVE, zA], [0, APEX, zB]);
      brace([sg * hs, EAVE, zZ], [0, APEX, zY]);
    }

    /* The clear opening of the near gable, traced anticlockwise from the
       bottom-left. Scene 2 projects these five points to the screen and
       reveals the photograph through the resulting portal silhouette — the
       3D structure literally becomes the frame around the real building. */
    var cw = 0.30;              // half a column, so the mask sits inside steel
    var zg = zs[0];             // nearest gable once the camera is on -Z
    var portal = [
      [-hs + cw, 0.12,        zg],
      [-hs + cw, EAVE,        zg],
      [0,        APEX - 0.72, zg],
      [ hs - cw, EAVE,        zg],
      [ hs - cw, 0.12,        zg]
    ];

    return {
      pos:  new Float32Array(b.pos),
      from: new Float32Array(b.from),
      nrm:  new Float32Array(b.nrm),
      seed: new Float32Array(b.seed),
      count: b.pos.length / 3,
      apex: APEX,
      portal: portal
    };
  }


  /* ── shaders ────────────────────────────────────────────────────────── */

  var VERT = [
    'attribute vec3 aPos;',
    'attribute vec3 aFrom;',
    'attribute vec3 aNrm;',
    'attribute float aSeed;',
    'uniform mat4 uVP;',
    'uniform float uAssemble;',   // 0 = scattered, 1 = built
    'uniform float uBreak;',      // 0 = built, 1 = flying apart again
    'varying vec3 vN;',
    'varying vec3 vW;',
    'varying float vSettle;',
    'void main(){',
    // stagger: each member gets its own slice of the assemble window
    '  float t = clamp((uAssemble - aSeed * 0.5) / 0.5, 0.0, 1.0);',
    '  t = t * t * (3.0 - 2.0 * t);',              // smoothstep
    '  t = t * t * (3.0 - 2.0 * t);',              // twice — a firmer landing
    '  float d = clamp((uBreak - (1.0 - aSeed) * 0.35) / 0.65, 0.0, 1.0);',
    '  d = d * d;',
    '  vec3 p = mix(aFrom, aPos, t);',
    '  p = mix(p, aFrom * 1.35 + vec3(0.0, 2.0, 0.0), d);',
    '  vSettle = t * (1.0 - d);',
    '  vN = aNrm;',
    '  vW = p;',
    '  gl_Position = uVP * vec4(p, 1.0);',
    '}'
  ].join('\n');

  var FRAG = [
    'precision mediump float;',
    'varying vec3 vN;',
    'varying vec3 vW;',
    'varying float vSettle;',
    'uniform vec3 uEye;',
    'uniform float uSweep;',      // position of the travelling light band
    'uniform float uFade;',       // global opacity
    'uniform vec2  uFog;',        // near/far of the depth dissolve, tracks the camera
    'void main(){',
    '  vec3 N = normalize(vN);',
    '  vec3 V = normalize(uEye - vW);',
    '  if (dot(N, V) < 0.0) N = -N;',

    // key light, high and to the left, the way a workshop roof light falls
    '  vec3 L = normalize(vec3(-0.45, 0.86, 0.28));',
    '  float diff = max(dot(N, L), 0.0);',

    // graphite base. Rolled steel in a dark room is not black — it is a mid
    // grey that only reads dark because everything around it is darker.
    '  vec3 base = vec3(0.085, 0.095, 0.110);',
    '  vec3 col  = base + vec3(0.30, 0.325, 0.365) * diff;',

    // cool sky bounce on upward faces, faint warm bounce off the workshop floor
    '  float up = max(N.y, 0.0);',
    '  col += vec3(0.10, 0.135, 0.195) * up;',
    '  col += vec3(0.155, 0.078, 0.032) * max(-N.y, 0.0) * 0.55;',

    // rim: the edge every rolled section catches
    '  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);',
    '  col += vec3(0.42, 0.50, 0.62) * fres * 0.85;',

    // one specular band travelling the length of the building — the "light
    // moving across the material". Wide and soft, never a neon stripe.
    '  float band = exp(-pow((vW.z + vW.x * 0.35 - uSweep) * 0.30, 2.0));',
    '  vec3  H = normalize(L + V);',
    '  float spec = pow(max(dot(N, H), 0.0), 34.0);',
    '  col += vec3(1.0, 0.78, 0.56) * band * (0.20 + spec * 2.2);',
    '  col += vec3(0.60, 0.74, 0.95) * spec * 0.45;',

    // members far from camera dissolve into the page rather than ending
    '  float depth = clamp((length(uEye - vW) - uFog.x) / max(uFog.y - uFog.x, 1.0), 0.0, 1.0);',
    '  float a = uFade * vSettle * (1.0 - depth * 0.70);',
    '  if (a <= 0.004) discard;',
    '  gl_FragColor = vec4(col * (1.0 - depth * 0.45), a);',
    '}'
  ].join('\n');


  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      if (window.console) console.warn('steel.js shader:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }


  /* ── scene ──────────────────────────────────────────────────────────── */

  return function SteelFrame(canvas) {
    var gl = null;
    try {
      var opts = { alpha: true, antialias: true, depth: true, premultipliedAlpha: false,
                   powerPreference: 'high-performance', failIfMajorPerformanceCaveat: false };
      gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
    } catch (e) { gl = null; }
    if (!gl) return null;

    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;

    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      if (window.console) console.warn('steel.js link:', gl.getProgramInfoLog(prog));
      return null;
    }
    gl.useProgram(prog);

    var narrow = window.matchMedia('(max-width: 860px)').matches;
    var geo = buildFrame(narrow ? 4 : 6);

    function attrib(name, data, size) {
      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
      return buf;
    }
    var buffers = [
      attrib('aPos',  geo.pos,  3),
      attrib('aFrom', geo.from, 3),
      attrib('aNrm',  geo.nrm,  3),
      attrib('aSeed', geo.seed, 1)
    ];

    var uVP       = gl.getUniformLocation(prog, 'uVP'),
        uAssemble = gl.getUniformLocation(prog, 'uAssemble'),
        uBreak    = gl.getUniformLocation(prog, 'uBreak'),
        uEye      = gl.getUniformLocation(prog, 'uEye'),
        uSweep    = gl.getUniformLocation(prog, 'uSweep'),
        uFade     = gl.getUniformLocation(prog, 'uFade'),
        uFog      = gl.getUniformLocation(prog, 'uFog');

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    /* Alpha blending without sorting would let a near member erase a far one
       through its own transparent edge. Depth-write stays on and members are
       effectively opaque until the depth fade takes them, which keeps it
       honest without a per-frame sort. */

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var W = 0, H = 0, dpr = 1;
    var progress = 0, shownProgress = 0;
    var built = 0;                       // intro assembly, 0 -> 1 on load
    var ptx = 0, pty = 0, ptxS = 0, ptyS = 0;
    var running = false, raf = 0, t0 = performance.now();
    var tPrev = t0;
    var destroyed = false;
    var lastVP = null;              // last view-projection, for project()

    function resize() {
      var r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return false;
      // Cap the pixel ratio: a 3× phone screen gains nothing here and costs
      // 9× the fragments.
      dpr = Math.min(window.devicePixelRatio || 1, narrow ? 1.75 : 2);
      var w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
      if (w !== W || h !== H) {
        W = canvas.width = w; H = canvas.height = h;
        gl.viewport(0, 0, W, H);
      }
      return true;
    }

    function draw(now) {
      var time = (now - t0) / 1000;

      /* Smoothing is per SECOND, not per frame.

         A fixed per-frame coefficient means the camera settles in a quarter
         of a second at 60fps and in several seconds on a weak GPU — and this
         scene hands off to a photograph masked by the projected geometry, so
         a camera that lags the scroll puts the mask somewhere the steel is
         not. Deriving the coefficient from the elapsed time makes the
         response identical on every device. */
      var dt = Math.min((now - tPrev) / 1000, 0.1);   // cap after a stall
      tPrev = now;
      var kProg = reduced ? 1 : 1 - Math.exp(-dt / 0.075);
      var kPtr  = 1 - Math.exp(-dt / 0.28);

      shownProgress += (progress - shownProgress) * kProg;
      ptxS += (ptx - ptxS) * kPtr;
      ptyS += (pty - ptyS) * kPtr;

      var p = shownProgress;

      /* The frame builds itself on load — the hero can never open on an
         empty canvas — and the scroll then flies the camera round it and
         finally straight into it:

           on load    members converge and lock, about 2.6s
           0.00–0.45  a long oblique: length and depth both read
           0.45–0.75  swings to broadside — the monumental elevation
           0.75–1.00  swings onto the axis and pushes into the near gable,
                      until the portal opening is the shape of the viewport

         That last move is the whole point. The gable stops being a picture of
         a frame and becomes an aperture, and Scene 2 reveals the real
         photograph through it. Scrolling past before the intro finishes
         completes the build rather than catching it half-assembled. */
      built = reduced ? 1 : Math.min(1, time / 2.6);
      var intro = built * built * (3 - 2 * built);
      var assemble = Math.max(intro, Math.min(p / 0.22, 1));

      // the structure dissolves only after the mask has opened under it
      var fade = 1 - Math.max(0, (p - 0.88) / 0.12);

      /* The swing has to FINISH before the handoff starts, or the mask is
         cut from a gable the camera is still turning towards. Orbit reaches
         the axis at 0.66 and the push completes at 0.78, which leaves the
         last fifth of the scene as a held, static, dead-on view of the
         opening — the beat the photograph arrives in. */
      var swing = ease(Math.min(p / 0.66, 1));
      var orbit = -1.15 - swing * 1.99 + (reduced ? 0 : time * 0.018 * (1 - swing));

      var push = Math.max(0, Math.min((p - 0.50) / 0.28, 1));
      var pushE = 1 - (1 - push) * (1 - push);

      /* Stops at a distance that frames the gable at roughly three quarters
         of the viewport height. Closer than this and the opening overflows
         the screen, and there is nothing left for the mask to expand. */
      var dist = 34 - assemble * 2 - pushE * 6;

      var eyeY = 5.4 + p * 1.0 + ptyS * (1 - pushE) * 1.8;
      var eye = [Math.sin(orbit) * dist + ptxS * (1 - pushE) * 2.2,
                 eyeY,
                 Math.cos(orbit) * dist];

      // the aim slides from the whole building down to the gable opening
      var target = [0,
                    geo.apex * 0.52 - pushE * 0.42,
                    -pushE * 5.2];

      var aspect = W / H;
      var proj = perspective(0.62, aspect, 0.5, 90);
      var view = lookAt(eye, target, [0, 1, 0]);
      lastVP = mul(proj, view);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(uVP, false, lastVP);
      gl.uniform1f(uAssemble, assemble);
      gl.uniform1f(uBreak, 0);
      gl.uniform1f(uFade, Math.max(0, fade));
      gl.uniform3f(uEye, eye[0], eye[1], eye[2]);
      gl.uniform2f(uFog, dist - 14, dist + 34);
      // the light band runs the length of the building and returns
      gl.uniform1f(uSweep, reduced ? 2.0 : Math.sin(time * 0.26) * 15.0);
      gl.drawArrays(gl.TRIANGLES, 0, geo.count);

      /* Anything cut from the projected geometry has to be repainted here,
         with the matrix that was just used — not on the scroll event that
         set the target, which the camera is still easing towards. */
      if (api.onFrame) api.onFrame();
    }

    function loop(now) {
      if (!running || destroyed) return;
      if (resize()) draw(now);
      raf = requestAnimationFrame(loop);
    }

    /* Project a world point into 0..1 canvas space, y downwards, using the
       matrix from the last drawn frame. Returns null behind the camera.

       lastVP is column-major, so the element at column i row j is m[i*4+j]. */
    function project(pt) {
      var m = lastVP;
      if (!m) return null;
      var x = m[0] * pt[0] + m[4] * pt[1] + m[8]  * pt[2] + m[12];
      var y = m[1] * pt[0] + m[5] * pt[1] + m[9]  * pt[2] + m[13];
      var w = m[3] * pt[0] + m[7] * pt[1] + m[11] * pt[2] + m[15];
      if (w <= 0.0001) return null;
      return [(x / w) * 0.5 + 0.5, 0.5 - (y / w) * 0.5];
    }

    var api = {
      /* Reduced motion still gets the structure — assembled, lit and still,
         just never moving. It is the picture, not the animation, that says
         what the company does. */
      reducedMotion: reduced,

      /* The near gable's clear opening in 0..1 screen space, as five points.
         Scene 2 turns this into a clip-path polygon so the photograph is
         revealed through the actual projected geometry rather than through a
         rectangle that only approximately lines up with it.

         Returns null until the first frame has been drawn, or if any corner
         falls behind the camera — the caller falls back to a plain rect. */
      portalPath: function () {
        if (!lastVP || !geo.portal) return null;
        var out = [];
        for (var i = 0; i < geo.portal.length; i++) {
          var q = project(geo.portal[i]);
          if (!q) return null;
          out.push(q);
        }
        return out;
      },

      setProgress: function (p) {
        progress = Math.max(0, Math.min(1, p));
        if (reduced) { shownProgress = progress; if (!running) this.renderOnce(); }
      },

      setPointer: function (x, y) {
        if (reduced) return;
        ptx = Math.max(-1, Math.min(1, x));
        pty = Math.max(-1, Math.min(1, y));
      },

      renderOnce: function () {
        if (destroyed) return;
        if (resize()) draw(performance.now());
      },

      start: function () {
        if (running || destroyed) return;
        if (reduced) { this.renderOnce(); return; }
        running = true;
        tPrev = performance.now();
        if (!built) t0 = tPrev;               // let the intro build play out
        raf = requestAnimationFrame(loop);
      },

      stop: function () {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      },

      destroy: function () {
        this.stop();
        destroyed = true;
        buffers.forEach(function (b) { gl.deleteBuffer(b); });
        gl.deleteProgram(prog); gl.deleteShader(vs); gl.deleteShader(fs);
        var lose = gl.getExtension('WEBGL_lose_context');
        if (lose) lose.loseContext();
      },

      /* Assigned by the caller. Called once per drawn frame, after the draw,
         so portalPath() reflects exactly what is on screen. */
      onFrame: null
    };

    return api;
  };
})();
