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
   ═══════════════════════════════════════════════════════════════════════════ */

import { mountViewer } from './interface/image-viewer.js';
import { mountEnquiry } from './interface/enquiry.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* A stable small-viewport unit, so a phone's address bar collapsing mid-scroll
   does not resize the hero under the reader. */
const setSvh = () => document.documentElement.style
  .setProperty('--svh', (window.innerHeight / 100) + 'px');
setSvh();
window.addEventListener('orientationchange', setSvh);

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
