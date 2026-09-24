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

   There is no load choreography: the hero photograph is the first paint.
   ═══════════════════════════════════════════════════════════════════════════ */

import { mountViewer } from './interface/image-viewer.js';
import { mountEnquiry } from './interface/enquiry.js';
import { mountReveals } from './scenes/reveal.js';
import { mountParallax } from './scenes/parallax.js';
import { mountCinema } from './scenes/cinema.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* A stable small-viewport unit, so a phone's address bar collapsing mid-scroll
   does not resize the hero under the reader. The FIRST value is set by an
   inline script in the head, before layout — doing it from here cost a
   measured 0.021 CLS on mobile. This only keeps it right after a rotation. */
const setSvh = () => document.documentElement.style
  .setProperty('--svh', (window.innerHeight / 100) + 'px');
window.addEventListener('orientationchange', setSvh);

/* ── the hero ───────────────────────────────────────────────────────────────
   The photograph is the hero from the first frame. It used to be covered for
   several seconds by a drawn steel "assembly"; a visitor on a slow phone saw
   red bars instead of Kingson's own work, so the photograph now leads and the
   only motion is a slow settle done in CSS (and none at all under reduced
   motion). */

const hero = $('.hero');

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

/* The first screen's photographs. See scenes/cinema.js. */
mountCinema();


/* ── the sheet index ────────────────────────────────────────────────────────
   Which sheet is under a line across the middle of the screen. One observer,
   a zero-height root, no scroll listener. The ruler stays away while the
   first sheet (the hero) is on that line, and takes the ground of the sheet
   it is over so it reads on steel as well as on paper. */
const si = $('.si');
if (si && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('si-ready');
  const links = new Map($$('a[data-sheet]', si).map((a) => [a.dataset.sheet, a]));
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const a = links.get(e.target.id);
      links.forEach((l) => l.removeAttribute('aria-current'));
      si.classList.toggle('is-on', !!a);
      if (!a) continue;
      a.setAttribute('aria-current', 'location');
      si.dataset.ground = e.target.matches('.on-dark, .sec-dark') ? 'dark' : 'light';
    }
  }, { rootMargin: '-50% 0px -50% 0px' });
  /* The footer is not a sheet, and the ruler would sit on its logo. */
  [hero, $('.ft'), ...[...links.keys()].map((id) => document.getElementById(id))]
    .filter(Boolean).forEach((s) => io.observe(s));
}

/* ── the photograph viewer ──────────────────────────────────────────────── */

const viewer = mountViewer();
$$('[data-open]').forEach((b) =>
  b.addEventListener('click', () => viewer.open(b.dataset.open)));

/* ── the enquiry composer ───────────────────────────────────────────────── */

mountEnquiry();

/* ── the phone bar steps aside while the keyboard is up ─────────────────────
   With the keyboard open the bar sits right against the field being filled
   in. Keyed to the keyboard itself (the visual viewport shrinking), not to
   focus alone: Android can close the keyboard and leave the field focused,
   and the bar must come back then. Without visualViewport it never hides. */
const form = $('[data-form]');
const vv = window.visualViewport;
if (form && vv) {
  const typing = () => document.documentElement.classList.toggle('form-active',
    form.contains(document.activeElement) && vv.height < window.innerHeight * 0.75);
  vv.addEventListener('resize', typing);
  form.addEventListener('focusin', typing);
  form.addEventListener('focusout', () => setTimeout(typing, 0));
}

/* ── the specification sheet on a phone ─────────────────────────────────────
   The HTML ships every group open — a data sheet on a wide screen, and the
   honest default with JavaScript off. On a narrow screen that is a very long
   wall, so all but the first fold away; a linked group (#spec-…) stays open.
   Crossing the breakpoint (a tablet rotating) folds or reopens them. Folding
   removes height above later sections, so a deep link is put back on its
   target — Safari has no scroll anchoring to do it. */
const narrow = matchMedia('(max-width: 1023.98px)');
const fold = () => {
  $$('.spec-list .spec-group').forEach((d, i) => {
    d.open = !narrow.matches || i === 0 || location.hash === '#' + d.id;
  });
};
fold();
if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
narrow.addEventListener('change', fold);

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
