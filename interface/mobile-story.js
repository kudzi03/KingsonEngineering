/* ═══════════════════════════════════════════════════════════════════════════
   interface/mobile-story.js — the authored mobile compositions
   ═══════════════════════════════════════════════════════════════════════════

   V2 §13. Mobile is NOT the desktop stage scaled down, and it is not a list of
   pictures either. It is its own state map: edge-to-edge compositions in
   natural flow, plus exactly TWO short sticky events — the opening, and the
   transfer from the roof to the machine. Everything else is a page you scroll.

   No WebGL, no parallax, no camera, no per-scene scroll listener. The two
   events are driven by the SAME single scroll pass that drives the desktop
   stage: main.js samples once and calls write(). There is no second source of
   progress anywhere in the build.

   Under reduced motion the two events are built flat — the same photographs
   and the same words, each held at one authored state, with nothing to scrub.
   ═══════════════════════════════════════════════════════════════════════════ */

import { OPENING, SCENE_TITLES, SCENE_LABELS } from '../content/copy.js';
import { ASSETS, src, srcset } from '../content/assets.js';

const PIN_TRAVEL = 1.1;      // screens of scroll each sticky event consumes

export function mountMobileStory(root, opts = {}) {
  const flat = !!opts.flat;                  // reduced motion: no scrub
  const host = document.createElement('div');
  host.className = 'm-story';

  /* ── event 1 · the opening ────────────────────────────────────────────
     The portal photograph holds the screen while the proposition clears and
     the subject of the picture takes its place. One photograph, two states,
     no movement of the image itself. */
  const open = pin('open', 'portalFrame', [
    heading('h1', OPENING.title, 'a'),
    label(OPENING.context, 'a'),
    heading('h2', SCENE_TITLES.frame, 'b')
  ]);

  /* ── event 2 · under the roof, into the machine ───────────────────────
     The second roof holds; the machine passes in from the right behind a
     loaded edge — the same material boundary the desktop uses, at mobile
     thickness. The held state carries no heading: the roof has already been
     named by the composition before it, and §6 does not repeat a heading to
     fill a frame. */
  const cut = pin('cut', 'roofFrame', [
    heading('h2', SCENE_TITLES.cut, 'b')
  ], 'cuttingHead');

  host.append(
    open.node,
    scene('roofTrusses', SCENE_TITLES.roof),
    cut.node,
    /* The whole machine in its workshop, after the macro. Named above, so it
       carries the descriptive label rather than the title again. */
    scene('laserMachine', null, SCENE_LABELS.cut, 'Laser cutting, the machine'),
    scene('crane', SCENE_TITLES.yard, SCENE_LABELS.yard)
  );

  root.insertBefore(host, root.firstChild);

  /* §13 reduced motion: Scene 1 holds the real portal and its proposition;
     Scene 2 is omitted as a duplicate of the same photograph, and the word it
     carried is kept as the structural label. The transfer holds its settled
     state — the machine arrived, named. Nothing scrubs. */
  if (flat) {
    open.setFlat('a');
    cut.setFlat('b');
    /* Nothing scrubs, but the photographs still arrive as they are needed. */
    return { write(scrollY, vh) { promote(host, scrollY, vh); } };
  }

  return {
    /** Called from the one scroll pass in main.js. Never binds its own. */
    write(scrollY, vh) {
      promote(host, scrollY, vh);
      open.write(scrollY, vh);
      cut.write(scrollY, vh);
    }
  };
}

/* ── a sticky event ────────────────────────────────────────────────────── */

function pin(name, assetKey, layers, passKey) {
  const node = el('section', `m-pin m-pin--${name}`);
  const view = el('div', 'm-pin-view');
  node.appendChild(view);

  view.appendChild(photo(assetKey, 'm-photo'));

  let pass = null, edge = null;
  if (passKey) {
    pass = el('div', 'm-pass');
    pass.appendChild(photo(passKey, ''));
    edge = el('span', 'm-edge');
    view.append(pass, edge);
  }
  layers.forEach((l) => view.appendChild(l));

  const a = view.querySelectorAll('[data-at="a"]');
  const b = view.querySelectorAll('[data-at="b"]');

  function set(p) {
    /* Two authored states with one crossing between them. Words never
       cross-fade into other words: the first clears, then the second
       arrives (§6). */
    const outA = clamp((p - 0.34) / 0.16);
    const inB = clamp((p - 0.56) / 0.18);
    a.forEach((n) => { n.style.opacity = String(1 - outA); });
    b.forEach((n) => { n.style.opacity = String(inB); });
    if (pass) {
      /* The machine arrives from the right and stops on the edge. */
      const x = 100 - 100 * clamp((p - 0.46) / 0.44);
      pass.style.transform = `translate3d(${x.toFixed(2)}%,0,0)`;
      edge.style.opacity = x < 99.5 && x > 0.5 ? '1' : '0';
      edge.style.transform = `translate3d(${x.toFixed(2)}%,0,0)`;
    }
  }

  set(0);

  return {
    node,
    setFlat(hold) {
      node.classList.add('is-flat');
      set(hold === 'a' ? 0 : 1);
      /* The state that is not held would otherwise be a heading nobody can
         read at opacity 0, so it leaves the document entirely — except for
         its words, which move into the label beside the composition. */
      const gone = hold === 'a' ? b : a;
      const kept = view.querySelector('.m-label');
      gone.forEach((n) => {
        if (kept && n.tagName !== 'P') {
          const extra = document.createElement('b');
          extra.textContent = [...n.querySelectorAll('span')].map((x) => x.textContent).join(' ');
          kept.prepend(extra, document.createTextNode(' · '));
        }
        n.remove();
      });
    },
    write(scrollY, vh) {
      const top = node.offsetTop;
      const travel = node.offsetHeight - vh;
      if (travel <= 0) return;
      const p = clamp((scrollY - top) / travel);
      set(p);
    }
  };
}

/* ── a plain full-bleed composition ────────────────────────────────────── */

function scene(assetKey, lines, note, srLabel) {
  const node = el('section', 'm-scene');
  node.appendChild(photo(assetKey, 'm-photo'));
  if (lines) node.appendChild(heading('h2', lines));
  if (note) node.appendChild(label(note));
  if (srLabel) node.setAttribute('aria-label', srLabel);
  return node;
}

/* ── parts ─────────────────────────────────────────────────────────────── */

/* `loading="lazy"` is a hint, and on a fast connection Chromium reads it
   generously enough to fetch every photograph in this sequence at once — a
   megabyte before the first screen is read. So the source is withheld until
   the composition is close, and promoted from the SAME scroll pass that
   drives everything else. No observer, no second listener, no progress
   computed anywhere but in one place. */
function photo(assetKey, cls) {
  const a = ASSETS[assetKey];
  const img = document.createElement('img');
  img.className = cls;
  img.width = a.w; img.height = a.h;
  img.decoding = 'async';
  img.alt = a.alt || '';
  img.sizes = '100vw';
  if (assetKey === 'portalFrame') {
    img.src = src(assetKey, 1100);
    img.srcset = srcset(assetKey);
    img.fetchPriority = 'high';
  } else {
    img.dataset.src = src(assetKey, 1100);
    img.dataset.srcset = srcset(assetKey);
  }
  return img;
}

/** Promote every withheld photograph within `lead` screens of the viewport. */
function promote(host, scrollY, vh, lead = 1.5) {
  host.querySelectorAll('img[data-src]').forEach((img) => {
    const s = img.closest('section');
    const top = s.getBoundingClientRect().top + window.pageYOffset;
    if (top - (scrollY + vh) > lead * vh) return;
    img.srcset = img.dataset.srcset;
    img.src = img.dataset.src;
    delete img.dataset.src; delete img.dataset.srcset;
  });
}

function heading(tag, lines, at) {
  const n = el(tag, 'display m-title');
  n.innerHTML = lines.map((l) => `<span>${l}</span>`).join('');
  if (at) { n.dataset.at = at; if (at === 'b') n.style.opacity = '0'; }
  return n;
}

function label(text, at) {
  const n = el('p', 'm-label');
  n.textContent = text;
  if (at) n.dataset.at = at;
  return n;
}

function el(tag, cls) { const n = document.createElement(tag); n.className = cls; return n; }
function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

export { PIN_TRAVEL };
