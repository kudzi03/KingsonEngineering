/* ═══════════════════════════════════════════════════════════════════════════
   main.js — wiring
   ═══════════════════════════════════════════════════════════════════════════

   ONE native scroll state source. ONE shared scene-state sampler. No scene
   owns a listener; the WebGL canvas never owns progress; the DOM never
   estimates where the model is. Everything reads the same sampled state.

   Layout is measured on initialisation, on font readiness and on meaningful
   resize — never per frame inside the scroll pass.

   `?still=s3-c` renders one named state and stops. That is the static
   composition gate from V2 §18 step 2: the same code that animates draws the
   still, so what is inspected is what ships.
   ═══════════════════════════════════════════════════════════════════════════ */

import { sampleStage, stageProgressVh, scrollTargetFor } from './experience/state.js';
import { NAMED_STATES, globalVhFor, STAGE_TRAVEL_VH } from './experience/scene-map.js';
import { createStage } from './experience/stage.js';
import { createLoader } from './experience/loading.js';
import { mountNavigation } from './interface/navigation.js';
import { mountViewer } from './interface/image-viewer.js';
import { mountEnquiry } from './interface/enquiry.js';
import { mountMobileViews } from './interface/mobile-views.js';
import { mountMobileStory } from './interface/mobile-story.js';

const root = document.documentElement;
root.classList.add('js');

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── viewport profile ───────────────────────────────────────────────────── */

function profileOf(w) {
  if (w >= 1200) return 'desktop';
  if (w >= 900) return 'compact';
  return 'mobile';
}

const vp = { w: 0, h: 0, profile: 'desktop', flat: false };

function measureViewport() {
  vp.w = window.innerWidth;
  vp.h = window.innerHeight;
  vp.profile = profileOf(vp.w);
  /* §13: parallax is disabled below 1200px, and the opening mask is flat. */
  vp.flat = vp.profile !== 'desktop' || reduced;
  /* A stable small-viewport unit so an address bar resize does not
     recompute every scene measurement on mobile. */
  if (!root.style.getPropertyValue('--svh') || vp.profile === 'desktop') {
    root.style.setProperty('--svh', (vp.h / 100) + 'px');
  }
}

/* ── the stage ──────────────────────────────────────────────────────────── */

const stageEl = document.querySelector('[data-stage]');
const pinEl = document.querySelector('[data-stage-pin]');
/* The corner never runs below 900px or under reduced motion, and its module
   is 16 KB that a phone would download for nothing. It is fetched only where
   it is used. */
let geometry = { write() {}, setStill() {}, dispose() {} };

const loaderRef = { isReady: () => true };
const stage = createStage(pinEl, { ready: (k) => loaderRef.isReady(k) });
/* A photograph becoming ready is a state change: the frame it was held out of
   has to be drawn again, or the hold would never resolve. */
const loader = createLoader(() => request());
loaderRef.isReady = loader.isReady;

let stageTop = 0;
let lastState = null;
let suspended = false;
/* When a still is pinned, every re-render (resize, font readiness, load) must
   redraw THAT state — otherwise the first `load` event silently replaces the
   composition under inspection with the top of the page. */
let frozenVh = null;

function measure() {
  measureViewport();
  stageTop = stageEl.getBoundingClientRect().top + window.pageYOffset;
}

/* ── the single scroll pass ─────────────────────────────────────────────── */

let ticking = false;

function frame() {
  ticking = false;
  if (suspended) return;
  const y = window.pageYOffset || root.scrollTop;
  /* Mobile reads the SAME scroll value the desktop stage does. There is one
     source of scroll state in this build and this is it. */
  if (story) { story.write(y, vp.h); return; }
  if (frozenVh !== null) { render(frozenVh); return; }
  render(stageProgressVh(y, stageTop, vp));
}

function request() {
  if (!ticking) { ticking = true; requestAnimationFrame(frame); }
}

/* Debug only: ?notype=1 draws the photography without any type, so the
   luminance a title will sit on can be measured rather than guessed at. */
const NO_TYPE = new URLSearchParams(location.search).has('notype');

function render(globalVh) {
  const state = sampleStage(globalVh, vp);
  if (NO_TYPE) { state.title = null; state.label = null; state.dock = null; state.briefTitle = null; }
  lastState = state;
  stage.write(state, vp);
  geometry.write(state, vp, stage);
  loader.want(state);
  ui.subject(state.subject);
  ui.dock(state.dock);
  ui.navTheme(state.navTheme);
}

/* Mobile and reduced motion do not run the stage at all — they have their own
   authored compositions in the document. */
/* Save-Data is a request, not a hint to ignore: the stage decodes several
   large photographs and the authored compositions do not, so a visitor who
   has asked for less gets the compositions. */
const saveData = !!(navigator.connection && navigator.connection.saveData);

const stageActive = !reduced && !saveData && profileOf(window.innerWidth) !== 'mobile';
let story = null;

/* ── interface ──────────────────────────────────────────────────────────── */

const ui = {
  subject: () => {}, dock: () => {}, navTheme: () => {}
};

const viewer = mountViewer({
  onOpen: () => { suspended = true; },
  onClose: () => { suspended = false; request(); }
});

const nav = mountNavigation({
  seek(target) {
    if (!stageActive) {
      const el = document.getElementById(target === 'views' ? 'brief' : target);
      if (el) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      return;
    }
    const REST = {
      frame: ['frame', 0.30], roof: ['roof', 0.42], cut: ['cut', 0.20],
      yard: ['yard', 0.60], views: ['views', 0.42]
    };
    if (target === 'enquiry') {
      document.getElementById('enquiry').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      return;
    }
    const r = REST[target];
    if (!r) return;
    window.scrollTo({ top: scrollTargetFor(r[0], r[1], stageTop, vp),
                      behavior: reduced ? 'auto' : 'smooth' });
  },
  onMenuOpen: () => { suspended = true; },
  onMenuClose: () => { suspended = false; request(); }
});
ui.subject = nav.setSubject;
ui.navTheme = nav.setTheme;

ui.dock = mountDock();
mountEnquiry();
mountMobileViews(viewer);

/* The selected-views dock lives on the stage but behaves like interface, so
   it is built here and handed to the renderer as a writer. */
function mountDock() {
  const node = document.createElement('div');
  node.className = 'dock';
  node.hidden = true;
  node.innerHTML =
    '<span class="dock-caption"></span>' +
    '<span class="dock-controls">' +
      '<button type="button" data-prev aria-label="Previous photograph">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>' +
      '<button type="button" data-next aria-label="Next photograph">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>' +
      '<button type="button" data-view>View photograph</button>' +
    '</span>';
  stage.dockHost.appendChild(node);

  const caption = node.querySelector('.dock-caption');
  const prev = node.querySelector('[data-prev]');
  const next = node.querySelector('[data-next]');
  const view = node.querySelector('[data-view]');
  let current = 0;

  /* Controls scroll to the relevant global offset — the sequence stays a
     scrubbed position, so forward and back always reproduce the same state. */
  const STOPS = [0.10, 0.42, 0.78];
  const go = (i) => {
    const t = Math.max(0, Math.min(2, i));
    window.scrollTo({ top: scrollTargetFor('views', STOPS[t], stageTop, vp),
                      behavior: reduced ? 'auto' : 'smooth' });
  };
  prev.addEventListener('click', () => go(current - 1));
  next.addEventListener('click', () => go(current + 1));
  view.addEventListener('click', () => viewer.open(VIEW_ASSETS[current]));

  return (dock) => {
    if (!dock) { node.hidden = true; return; }
    node.hidden = false;
    current = dock.index;
    if (caption.textContent !== dock.caption) caption.textContent = dock.caption;
    prev.disabled = dock.index === 0;
    next.disabled = dock.index === dock.count - 1;
    /* The dock sizes to what it carries. A fixed width either clips the
       caption or lets the controls hang outside the dark bar, and §10 wants
       one attached object, not a bar with something sticking out of it. */
    node.style.cssText =
      `left:${((dock.xVw / 100) * vp.w).toFixed(0)}px;` +
      `top:${((dock.yVh / 100) * vp.h).toFixed(0)}px;` +
      `max-width:${(vp.w * 0.68).toFixed(0)}px;opacity:${dock.opacity}`;
  };
}

const VIEW_ASSETS = ['crane', 'portalFrame', 'roofFrame'];

/* ── boot ───────────────────────────────────────────────────────────────── */

measure();

if (stageActive) {
  import('./experience/geometry.js').then(({ createGeometry }) => {
    geometry = createGeometry(document.querySelector('[data-corner]'));
    if (frozenVh !== null) geometry.setStill(true);
    request();
  });

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', () => { measure(); request(); }, { passive: true });
  window.addEventListener('orientationchange', () => { measure(); request(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); request(); });
  window.addEventListener('load', () => { measure(); request(); });

  /* The static composition gate. ?still=s3-c freezes one named state; ?p=0.42
     with ?scene=roof does the same by coordinate. */
  const q = new URLSearchParams(location.search);
  const still = q.get('still');
  if (still && NAMED_STATES[still]) {
    const [scene, p] = NAMED_STATES[still];
    document.body.dataset.still = still;
    frozenVh = globalVhFor(scene, p);
  } else if (q.has('scene')) {
    frozenVh = globalVhFor(q.get('scene'), parseFloat(q.get('p') || '0'));
  }
  render(frozenVh !== null ? frozenVh : 0);
  if (frozenVh === null) loader.prime();
  else SEQUENCE_PRIME();
} else {
  /* Mobile and reduced motion: the stage never renders, and the document
     carries its own authored compositions (§13). The linear record leaves the
     accessibility tree so no heading is announced twice. */
  /* Scenes 7-8 live inside the stage section so the desktop pin can carry the
     wall through them. Here the stage does not run, so they are lifted out
     before it goes. */
  const afterEl = document.querySelector('[data-after]');
  if (afterEl) document.getElementById('main').appendChild(afterEl);
  stageEl.remove();
  document.querySelector('[data-fallback]')?.remove();

  story = mountMobileStory(document.getElementById('main'), { flat: reduced });
  /* One scroll listener here too. Under reduced motion nothing scrubs — the
     pass only lets the next photograph start loading. */
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', () => { measureViewport(); request(); }, { passive: true });
  window.addEventListener('orientationchange', () => { measureViewport(); request(); });
  window.addEventListener('load', () => { measureViewport(); request(); });
  request();
}

/* A pinned still needs every photograph it draws, immediately — there is no
   scroll to arrive one scene ahead of. */
function SEQUENCE_PRIME() {
  if (!lastState) return;
  loader.want(lastState);
}

export { vp };
