/* ═══════════════════════════════════════════════════════════════════════════
   scenes/reveal.js — the motion vocabulary
   ═══════════════════════════════════════════════════════════════════════════

   Five reveals, each chosen because it matches the physical nature of the
   thing it moves. The point is that a laser and a crane should not arrive on
   screen the same way.

     plate    a panel wiped in from an edge by clip-path, heavy ease.
              Steel sheet being slid into position. For photographic panels
              and the big chapter plates.

     rise     type emerging from behind a datum line — a mask and a
              translate, never a fade. Headings and the large figures.

     settle   photography entering at 1.04 and settling to 1.0, like a camera
              coming to rest on a subject. Never a slide.

     draw     stroke-dashoffset on an SVG path. Fast and exact: the laser,
              and the profile cross-sections whose dimensions it draws.

     swing    rotation about a pivot at one edge, slow and powerful, with the
              weight arriving before the rotation finishes. The crane.

   PROGRESSIVE ENHANCEMENT, THE RIGHT WAY ROUND

   Everything is VISIBLE in the stylesheet. The hidden-then-revealed state
   exists only under `html.reveal-ready`, a class this module adds after it
   has an IntersectionObserver in hand and is ready to fire. So JavaScript
   off, JavaScript broken, an old browser, or `prefers-reduced-motion` all
   leave a fully readable page — not a blank one waiting for a callback that
   never comes.

   Nothing here listens to scroll. An IntersectionObserver fires once per
   element and then stops watching it.
   ═══════════════════════════════════════════════════════════════════════════ */

const KINDS = ['plate', 'rise', 'settle', 'draw', 'swing'];

export function mountReveals(root = document) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches || !('IntersectionObserver' in window)) return null;

  const nodes = [...root.querySelectorAll('[data-reveal]')]
    .filter((el) => KINDS.includes(el.dataset.reveal));
  if (!nodes.length) return null;

  /* Paths need their own length before they can be drawn. Done here rather
     than in CSS because only the DOM knows how long a path is. */
  for (const el of nodes) {
    if (el.dataset.reveal !== 'draw') continue;
    for (const path of el.querySelectorAll('[data-draw-path]')) {
      const len = path.getTotalLength ? path.getTotalLength() : 0;
      if (!len) continue;
      path.style.setProperty('--len', len.toFixed(1));
    }
  }

  /* Only now does hiding become safe. */
  document.documentElement.classList.add('reveal-ready');

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target;
      /* A group staggers its own children rather than every child having to
         carry a hand-written delay. */
      const step = Number(el.dataset.revealStagger || 0);
      if (step) {
        const kids = [...el.children];
        kids.forEach((k, i) => { k.style.transitionDelay = (i * step) + 'ms'; });
      }
      el.classList.add('is-revealed');
      io.unobserve(el);
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

  nodes.forEach((el) => io.observe(el));

  /* Someone switching on Reduce Motion mid-visit gets everything immediately,
     and the observer stops. */
  const bail = () => {
    if (!reduce.matches) return;
    io.disconnect();
    document.documentElement.classList.remove('reveal-ready');
  };
  reduce.addEventListener ? reduce.addEventListener('change', bail) : reduce.addListener(bail);

  return { stop: () => io.disconnect() };
}
