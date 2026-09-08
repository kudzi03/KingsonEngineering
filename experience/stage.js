/* ═══════════════════════════════════════════════════════════════════════════
   experience/stage.js — the only thing that writes the stage
   ═══════════════════════════════════════════════════════════════════════════

   Takes a state object from state.js and writes it. It never samples scroll,
   never reads layout during a write, and never decides anything: if a value is
   wrong it is wrong in the sampler, not here.

   IMAGE INSTANCES SURVIVE BOUNDARIES (V2 §18). Planes are pooled by identity,
   so the crane that ends Scene 5 is the same DOM node and the same decoded
   bitmap that begins Scene 6. Nothing is torn down and rebuilt at a chapter
   change, which is what would otherwise produce the duplicate-image flash the
   treatment calls out.

   A plane carrying a `clip` is always a full-viewport box, so its clip polygon
   is in viewport coordinates and needs no rebasing.
   ═══════════════════════════════════════════════════════════════════════════ */

import { ASSETS, srcset, src } from '../content/assets.js';
import { cover, project, slack } from './crops.js';
import { MASKS } from './masks.js';

export function createStage(root, opts = {}) {
  /* §16 THE HOLD RULE. A photograph that is not decoded yet is not drawn, and
     because the planes underneath it are still in the state, what stays on
     screen is the outgoing composition. The transition resolves when the
     bitmap is ready. A blank field is never shown. */
  const ready = opts.ready || (() => true);
  const layers = {
    planes: el('div', 'stage-planes'),
    edge: el('div', 'stage-edge'),
    fg: el('div', 'stage-fg'),
    curtain: el('div', 'stage-curtain'),
    type: el('div', 'stage-type')
  };
  Object.values(layers).forEach((l) => root.appendChild(l));

  const pool = new Map();        // key -> { node, img, asset }
  const fgPool = new Map();      // mask id -> { node, img }
  let titleNode = null, labelNode = null, dockNode = null, briefNode = null;

  /* ── plane pool ─────────────────────────────────────────────────────── */

  function planeFor(key, assetKey) {
    let entry = pool.get(key);
    if (entry) return entry;
    const node = el('div', 'plane');
    const img = document.createElement('img');
    const a = ASSETS[assetKey];
    img.src = src(assetKey);
    img.srcset = srcset(assetKey);
    img.alt = '';                          // decorative here; the semantic
    img.decoding = 'async';                // description lives in the fallback
    img.setAttribute('aria-hidden', 'true');
    node.appendChild(img);
    layers.planes.appendChild(node);
    entry = { node, img, asset: assetKey };
    pool.set(key, entry);
    return entry;
  }

  function write(state, vp) {
    const seen = new Set();

    (state.planes || []).forEach((pl) => {
      const assetKey = pl.asset || stripInstance(pl.key);
      const a = ASSETS[assetKey];
      if (!a) return;
      seen.add(pl.key);
      if (!ready(assetKey)) {
        /* Start the fetch by creating the node, but leave the field to
           whatever is already on it. */
        planeFor(pl.key, assetKey);
        return;
      }
      const entry = planeFor(pl.key, assetKey);

      const box = pl.box;
      const fit = cover(a, { w: box.w, h: box.h }, pl.fit || {});

      /* A scene may translate a plane, but never off its own field: the
         translation is clamped into the slack the fit actually has. */
      const sl = slack(fit, box);
      const dx = clampN(pl.dx || 0, sl.minX, sl.maxX);
      entry.node.style.cssText =
        `left:${box.x.toFixed(2)}px;top:${box.y.toFixed(2)}px;` +
        `width:${box.w.toFixed(2)}px;height:${box.h.toFixed(2)}px;` +
        `z-index:${pl.z};opacity:${pl.opacity == null ? 1 : pl.opacity};` +
        (pl.clip ? `clip-path:polygon(${clipStr(pl.clip, box)});` : '');

      entry.img.style.cssText =
        `width:${fit.imgW.toFixed(2)}px;height:${fit.imgH.toFixed(2)}px;` +
        `transform:translate3d(${(fit.imgX + dx).toFixed(2)}px,${fit.imgY.toFixed(2)}px,0)`;

      entry.fit = fit;
      entry.box = box;
    });

    /* Nodes not in this state are hidden, never removed — the decoded bitmap
       and the element identity both survive for the return journey. */
    pool.forEach((entry, key) => {
      if (!seen.has(key)) entry.node.style.display = 'none';
      else entry.node.style.display = '';
    });

    writeForeground(state, vp);
    writeEdge(state, vp);
    writeCurtain(state, vp);
    writeType(state, vp);
  }

  /* ── the two traced foregrounds ──────────────────────────────────────────
     A mask is a polygon traced from edges that are actually visible in the
     photograph, applied to that same photograph. The pixels are therefore
     real: nothing is filled in, extended or invented (V2 §5).              */

  function writeForeground(state, vp) {
    const fg = state.foreground;
    fgPool.forEach((e) => { e.node.style.opacity = '0'; });
    if (!fg || !fg.opacity || fg.opacity <= 0.002) return;

    const mask = MASKS[fg.asset];
    if (!mask) return;

    /* The mask rides the plane it was traced from, so it stays registered at
       every viewport ratio rather than at the one it was authored at. */
    const host = pool.get(mask.plane);
    if (!host || !host.fit) return;

    let entry = fgPool.get(fg.asset);
    if (!entry) {
      const node = el('div', 'fg');
      const img = document.createElement('img');
      img.src = src(mask.source);
      img.srcset = srcset(mask.source);
      img.alt = ''; img.decoding = 'async';
      img.setAttribute('aria-hidden', 'true');
      node.appendChild(img);
      layers.fg.appendChild(node);
      entry = { node, img };
      fgPool.set(fg.asset, entry);
    }

    const box = host.box;
    const pts = mask.points
      .map(([u, v]) => project(host.fit, u, v))
      .map(([x, y]) => `${(box.x + x).toFixed(1)}px ${(box.y + y).toFixed(1)}px`)
      .join(',');

    entry.node.style.cssText =
      `left:0;top:0;width:${vp.w}px;height:${vp.h}px;opacity:${fg.opacity};` +
      `clip-path:polygon(${pts})`;
    const fsl = slack(host.fit, box);
    const fdx = clampN(fg.dx || 0, fsl.minX, fsl.maxX);
    entry.img.style.cssText =
      `width:${host.fit.imgW.toFixed(2)}px;height:${host.fit.imgH.toFixed(2)}px;` +
      `transform:translate3d(${(box.x + host.fit.imgX + fdx).toFixed(2)}px,` +
      `${(box.y + host.fit.imgY).toFixed(2)}px,0)`;
  }

  /* ── the loaded edge ─────────────────────────────────────────────────────
     A substantial dark member with thickness and direction, bounding the
     aperture it belongs to. Never a decorative rule (V2 §8).               */

  function writeEdge(state, vp) {
    const e = state.edge;
    if (!e || e.xVw == null) { layers.edge.style.opacity = '0'; return; }
    const w = (e.thickVw / 100) * vp.w;
    const x = (e.xVw / 100) * vp.w;
    layers.edge.style.opacity = '1';
    layers.edge.style.cssText +=
      `;opacity:1;width:${w.toFixed(1)}px;height:${(vp.h * 1.6).toFixed(0)}px;` +
      `transform:translate3d(${(x - w / 2).toFixed(1)}px,${(-vp.h * 0.3).toFixed(0)}px,0) ` +
      `rotate(${e.tiltDeg.toFixed(2)}deg)`;
  }

  function writeCurtain(state, vp) {
    const c = state.curtain;
    if (!c) { layers.curtain.style.opacity = '0'; return; }
    const x = (c.fromVw / 100) * vp.w;
    layers.curtain.style.cssText =
      `opacity:1;left:${x.toFixed(1)}px;width:${(vp.w - x).toFixed(1)}px`;
  }

  /* ── type ────────────────────────────────────────────────────────────── */

  function writeType(state, vp) {
    titleNode = titleNode || mk('h2', 'stage-title', layers.type);
    labelNode = labelNode || mk('p', 'stage-label', layers.type);

    const t = state.title;
    if (t && t.opacity > 0.002) {
      const size = t.capPx
        ? Math.min((t.sizeVw / 100) * vp.w, t.capPx)
        : (t.sizeVw / 100) * vp.w;
      if (titleNode.dataset.lines !== t.lines.join('|')) {
        titleNode.dataset.lines = t.lines.join('|');
        titleNode.innerHTML = t.lines.map((l) => `<span>${l}</span>`).join('');
      }
      titleNode.style.cssText =
        `left:${((t.xVw / 100) * vp.w).toFixed(1)}px;top:${((t.yVh / 100) * vp.h).toFixed(1)}px;` +
        `font-size:${size.toFixed(1)}px;max-width:${((t.maxVw / 100) * vp.w).toFixed(0)}px;` +
        `opacity:${t.opacity};` +
        (t.tone === 'dark' ? 'color:var(--ink);' : '');
      titleNode.hidden = false;
    } else { titleNode.hidden = true; }

    const l = state.label;
    if (l && l.opacity > 0.002) {
      if (labelNode.textContent !== l.text) labelNode.textContent = l.text;
      labelNode.style.cssText =
        `left:${((l.xVw / 100) * vp.w).toFixed(1)}px;top:${((l.yVh / 100) * vp.h).toFixed(1)}px;` +
        `opacity:${l.opacity}`;
      labelNode.hidden = false;
    } else { labelNode.hidden = true; }

    if (state.briefTitle) {
      briefNode = briefNode || mk('p', 'stage-brief', layers.type);
      const b = state.briefTitle;
      if (briefNode.dataset.lines !== b.lines.join('|')) {
        briefNode.dataset.lines = b.lines.join('|');
        briefNode.innerHTML = b.lines.map((x) => `<span>${x}</span>`).join('');
      }
      briefNode.style.cssText =
        `left:${((b.xVw / 100) * vp.w).toFixed(1)}px;top:${((b.yVh / 100) * vp.h).toFixed(1)}px;` +
        `font-size:${((b.sizeVw / 100) * vp.w).toFixed(1)}px;opacity:${b.opacity}`;
      briefNode.hidden = false;
    } else if (briefNode) { briefNode.hidden = true; }
  }

  return {
    write,
    layers,
    /** The live fit of a plane, for the image viewer and the geometry bridge. */
    fitOf: (key) => { const e = pool.get(key); return e ? e.fit : null; },
    boxOf: (key) => { const e = pool.get(key); return e ? e.box : null; },
    dockHost: layers.type
  };
}

/* ── helpers ──────────────────────────────────────────────────────────── */

function clampN(v, a, b) { return a > b ? 0 : v < a ? a : v > b ? b : v; }
function el(tag, cls) { const n = document.createElement(tag); n.className = cls; return n; }
function mk(tag, cls, parent) { const n = el(tag, cls); parent.appendChild(n); return n; }
function stripInstance(k) { const i = k.indexOf('#'); return i === -1 ? k : k.slice(0, i); }

function clipStr(pts, box) {
  return pts.map(([x, y]) => `${(x - box.x).toFixed(1)}px ${(y - box.y).toFixed(1)}px`).join(',');
}
