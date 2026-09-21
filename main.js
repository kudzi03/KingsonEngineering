/* ═══════════════════════════════════════════════════════════════════════════
   main.js — interaction only
   ═══════════════════════════════════════════════════════════════════════════

   The page's text, photographs and contact details are already in index.html:
   tools/render.js writes them there from content/, so the site reads correctly
   with JavaScript off, in a search index, and in an answer engine that does not
   run scripts. Nothing below re-renders any of it.

   There is no scroll listener in this file. The version this replaced pinned a
   620vh stage and scrubbed six scenes against the scroll position; a visitor
   scrolled seven screens before reaching a single fact about the company.
   Scrolling now scrolls.

   The hero's structural assembly is the one piece of choreography on the page,
   and it is a ONE-SHOT on load — not scroll-linked. See scenes/assembly.js.
   ═══════════════════════════════════════════════════════════════════════════ */

import { mountViewer } from './interface/image-viewer.js';
import { mountEnquiry } from './interface/enquiry.js';
import { mount as mountAssembly } from './scenes/assembly.js';
import { mountReveals } from './scenes/reveal.js';
import { mountParallax } from './scenes/parallax.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* A stable small-viewport unit, so a phone's address bar collapsing mid-scroll
   does not resize the hero under the reader. The FIRST value is set by an
   inline script in the head, before layout — doing it from here cost a
   measured 0.021 CLS on mobile. This only keeps it right after a rotation. */
const setSvh = () => document.documentElement.style
  .setProperty('--svh', (window.innerHeight / 100) + 'px');
window.addEventListener('orientationchange', setSvh);

/* ── the hero's structural assembly ─────────────────────────────────────────
   A one-shot on load. The hero photograph and every word of the hero are
   already painted before this runs, so if it never starts — reduced motion, no
   2D context, a decode that fails — the hero is simply the photograph, which
   is what it was before.

   `hero-erecting` dims the scrim while the canvas paints its own dark ground,
   and is removed when the steel hands over. The class is only ever ADDED by a
   canvas that really mounted, so with JavaScript off the scrim stays at full
   strength and the copy keeps its contrast.                                 */

const hero = $('.hero');
/* Not if the visitor arrived at an anchor further down the page — erecting a
   frame nobody is looking at is pure waste, and it would pull the scrim down
   on a hero that is already off screen. */
if (hero && window.scrollY < hero.offsetHeight * 0.5) {
  const img = $('.hero-img', hero);
  const go = () => {
    const handle = mountAssembly(hero, {
      onDone: () => hero.classList.remove('hero-erecting')
    });
    if (handle) hero.classList.add('hero-erecting');
  };
  /* Wait for the photograph so the sheeting sweep always reveals something,
     but never wait long: 1.2s and the assembly starts regardless. */
  if (img && !img.complete) {
    let fired = false;
    const once = () => { if (!fired) { fired = true; go(); } };
    img.addEventListener('load', once, { once: true });
    img.addEventListener('error', once, { once: true });
    setTimeout(once, 1200);
  } else {
    go();
  }
}

/* ── the header over the hero ───────────────────────────────────────────────
   The bar is dark and part of the scene while the hero is under it, and solid
   from there down. The class is only ever ADDED by an observer that ran, so
   with JavaScript off — or without IntersectionObserver — the header is the
   solid bar it is on every other page, which is the readable default.

   Still no scroll listener in this file. The root is the viewport inset by the
   bar's own height, so the hero stops intersecting at exactly the moment its
   last pixel passes under the bar.                                          */

if (hero && 'IntersectionObserver' in window) {
  const bar = $('.hd');
  const over = (on) => document.documentElement.classList.toggle('hd-over', on);
  const watch = () => {
    const h = bar ? Math.round(bar.getBoundingClientRect().height) : 77;
    const io = new IntersectionObserver(
      ([e]) => over(e.isIntersecting),
      { rootMargin: `-${h}px 0px 0px 0px`, threshold: 0 }
    );
    io.observe(hero);
    return io;
  };
  let io = watch();
  /* The bar is shorter on a phone. A rotation or a resize across that
     breakpoint needs the margin rebuilt; nothing else does. */
  let barH = bar ? bar.offsetHeight : 0;
  addEventListener('resize', () => {
    if (!bar || bar.offsetHeight === barH) return;
    barH = bar.offsetHeight;
    io.disconnect();
    io = watch();
  }, { passive: true });
}

/* ── the phone action bar, out of the way of the hero ───────────────────────
   The bar carries Call, WhatsApp and Get a price at every scroll depth. The
   hero carries the same three. On a phone that means six buttons and three
   actions stacked on the first screen of the site, which is the single most
   seen view there is.

   So while the hero's own buttons are on screen, the bar steps down out of
   the frame. It comes back the moment they leave, which is the moment it
   starts being the only way to reach us.

   As with the header above: the class is only ever ADDED by an observer that
   ran. With JavaScript off, or without IntersectionObserver, the bar is
   simply there — the safe default, because a missing bar costs an enquiry
   and a duplicated one costs nothing.                                       */

/* `.hero-act` on the home page, `.sp-act` on a service page and the 404 —
   the same three buttons under the same hero, named differently only because
   the two heroes have different type scales. */
const heroAct = $('.hero-act, .sp-act');
if (heroAct && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    ([e]) => document.documentElement.classList.toggle('cta-near', e.isIntersecting),
    { threshold: 0 }
  );
  io.observe(heroAct);
}

/* ── the motion vocabulary ──────────────────────────────────────────────────
   Physical reveals keyed to what each element is. Adds html.reveal-ready
   itself, so with this module absent the page is simply visible. */

mountReveals();

/* Depth on the scenes that fill a viewport. Reads scrollY, writes transform,
   and stops its own loop when nothing is in view. See scenes/parallax.js. */
mountParallax();

/* ── the photograph viewer ──────────────────────────────────────────────── */

const viewer = mountViewer();
$$('[data-open]').forEach((b) =>
  b.addEventListener('click', () => viewer.open(b.dataset.open)));

/* ── the enquiry composer ───────────────────────────────────────────────── */

mountEnquiry();

/* ── the small-screen menu ──────────────────────────────────────────────── */

const menu = $('[data-menu]');
const openBtn = $('[data-menu-open]');
const closeBtn = $('[data-menu-close]');
let lastFocus = null;

function setMenu(open) {
  menu.dataset.open = String(open);
  menu.inert = !open;
  openBtn.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) { lastFocus = document.activeElement; closeBtn.focus(); }
  else if (lastFocus) { lastFocus.focus(); lastFocus = null; }
}

openBtn.addEventListener('click', () => setMenu(true));
closeBtn.addEventListener('click', () => setMenu(false));
$$('.menu-list a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menu.dataset.open === 'true') setMenu(false);
});

/* Focus stays inside the menu while it is open. */
menu.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab' || menu.dataset.open !== 'true') return;
  const items = $$('a, button', menu).filter((n) => n.offsetParent !== null);
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
