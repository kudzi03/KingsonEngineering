/* ═══════════════════════════════════════════════════════════════════════════
   engine.js — the scroll engine
   ═══════════════════════════════════════════════════════════════════════════

   Three primitives and some maths. Every scene in scenes.js is written
   against these, so there is one scroll pass per frame for the whole page and
   no scene owns a listener of its own.

     KE.rail(el, fn)    el is a tall section containing a .rail-pin that is
                        position:sticky. fn(p) runs with p from 0 when the
                        pin locks to 1 when it releases. This is the pinned,
                        scrubbed timeline every big scene uses.

     KE.span(el, fn)    fn(p) with p from 0 when el's top enters the bottom of
                        the viewport to 1 when its bottom leaves the top. For
                        parallax and anything that plays as it passes through.

     KE.once(el, fn)    fires fn once when el first becomes visible. For the
                        few details that genuinely are one-shot.

   WHY NOT GSAP + SCROLLTRIGGER

   ScrollTrigger is the right tool for a site with a build step and a team.
   Here it is ~55 KB gzipped over the wire to do what `position: sticky` plus
   the twelve lines of rail() below already do natively, on a site whose whole
   payload is currently under half that. The choreography is the work; the
   scrubbing is not. Everything scenes.js does — pinning, scrubbed timelines,
   clip-path masks, horizontal sequences, multi-depth parallax — is written
   directly against these three primitives and stays readable.

   WHY NO SMOOTH-SCROLL LAYER

   Lenis and friends move the page with a transform, which breaks
   position:sticky — and every pinned scene here is sticky. Native scrolling
   with scrubbed transforms gets the same feel without trading the thing it is
   decorating.
   ═══════════════════════════════════════════════════════════════════════════ */

window.KE = (function () {
  'use strict';

  var readers = [];      // fn(scrollY, viewportH)
  var measurers = [];    // fn() — recompute cached geometry
  var ticking = false;
  var vh = window.innerHeight;

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ── maths ──────────────────────────────────────────────────────────── */

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* Normalise p into [a,b] and clamp — the workhorse for staging one
     timeline into overlapping beats. */
  function range(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }

  function lerp(a, b, t) { return a + (b - a) * t; }

  /* smoothstep: the default for anything spatial. Linear scrubbing reads as
     mechanical on a big move. */
  function ease(t) { return t * t * (3 - 2 * t); }
  function easeIn(t) { return t * t; }
  function easeOut(t) { return 1 - (1 - t) * (1 - t); }

  function px(n) { return n.toFixed(2) + 'px'; }
  function pc(n) { return n.toFixed(3) + '%'; }


  /* ── the single scroll pass ─────────────────────────────────────────── */

  function frame() {
    ticking = false;
    var y = window.pageYOffset || document.documentElement.scrollTop;
    for (var i = 0; i < readers.length; i++) readers[i](y, vh);
  }

  function request() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }

  function measure() {
    vh = window.innerHeight;
    for (var i = 0; i < measurers.length; i++) measurers[i]();
    request();
  }

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('orientationchange', measure, { passive: true });
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);


  /* ── primitives ─────────────────────────────────────────────────────── */

  /* A pinned, scrubbed timeline.

     The section is tall; the .rail-pin inside it is sticky and one viewport
     high. Progress is how far the section has travelled through the part of
     its own height that exceeds the viewport — which is exactly the distance
     the pin stays stuck. */
  function rail(el, fn) {
    if (!el) return;
    var top = 0, travel = 1;

    function remeasure() {
      var r = el.getBoundingClientRect();
      top = r.top + (window.pageYOffset || 0);
      travel = Math.max(1, el.offsetHeight - vh);
    }

    measurers.push(remeasure);
    remeasure();

    /* Reduced motion collapses every rail to a single screen, so scrubbing it
       would snap between 0 and 1 as the section passes. Instead each scene is
       resolved once to a resting progress — far enough through that the move
       has happened and the copy has arrived, short of the end where scenes
       deliberately clear themselves out for the next one. The page becomes a
       sequence of composed stills. */
    if (REDUCED) {
      measurers.push(function () { fn(0.86); });
      fn(0.86);
      return;
    }

    readers.push(function (y) {
      fn(clamp((y - top) / travel, 0, 1));
    });
  }

  /* Progress as an element passes through the viewport. 0 at the moment its
     top edge reaches the bottom of the screen, 1 as its bottom edge leaves
     the top. Skips the work entirely when the element is nowhere near. */
  function span(el, fn) {
    if (!el) return;
    var top = 0, h = 0;

    function remeasure() {
      var r = el.getBoundingClientRect();
      top = r.top + (window.pageYOffset || 0);
      h = r.height;
    }

    measurers.push(remeasure);
    remeasure();

    var wasVisible = false;
    readers.push(function (y, vhNow) {
      var visible = (top < y + vhNow + 120) && (top + h > y - 120);
      if (!visible) {
        // run the end state once so nothing is left mid-transform off screen
        if (wasVisible) { fn(top > y ? 0 : 1); wasVisible = false; }
        return;
      }
      wasVisible = true;
      fn(clamp((y + vhNow - top) / (vhNow + h), 0, 1));
    });
  }

  /* One-shot on first sight. Falls back to firing immediately where
     IntersectionObserver is missing — a detail that never plays is better
     than content that never appears. */
  function once(el, fn) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.disconnect();
        fn();
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    io.observe(el);
  }


  /* ── dom helpers ────────────────────────────────────────────────────── */

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  /* Write a transform without reading anything back. Scenes never read
     layout during the scroll pass — every measurement is cached by
     remeasure() — so the whole page stays on one write phase per frame. */
  function xform(el, s) { if (el) el.style.transform = s; }


  return {
    rail: rail, span: span, once: once,
    onScroll: function (fn) { readers.push(fn); request(); },
    onMeasure: function (fn) { measurers.push(fn); fn(); },
    refresh: measure,
    clamp: clamp, range: range, lerp: lerp,
    ease: ease, easeIn: easeIn, easeOut: easeOut,
    px: px, pc: pc,
    $: $, $$: $$, xform: xform,
    reduced: REDUCED,
    get vh() { return vh; }
  };
})();
