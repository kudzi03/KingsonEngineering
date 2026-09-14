/* ═══════════════════════════════════════════════════════════════════════════
   scenes/parallax.js — a restrained dolly on the big photographs
   ═══════════════════════════════════════════════════════════════════════════

   Depth, not decoration. Four or five photographs on the site fill a viewport;
   moving them a little slower than the page gives those scenes a foreground
   and a background instead of one flat plane. That is the whole effect.

   WHAT KEEPS THIS HONEST

   · It never touches the scroll. A passive listener READS scrollY; nothing is
     intercepted, preventDefault is never called, and the page scrolls at
     exactly the speed the operating system says it should.

   · It does no work when nothing is in view. An IntersectionObserver keeps the
     live set; when that set is empty the rAF loop stops entirely rather than
     spinning on every frame for the 90% of the page that has no parallax in it.

   · It only ever writes `transform`. No top, no margin, no height — nothing
     that can force a layout or a paint outside the compositor.

   · Travel is 4% of the element's own overflow, which is about 26px on a
     720px scene. Enough to read as depth, not enough to notice as an effect.

   · Off below 900px and off under prefers-reduced-motion. A phone gets the
     photograph, which is what a phone is good at.
   ═══════════════════════════════════════════════════════════════════════════ */

const TRAVEL = 0.04;      // fraction of viewport height, each way
const MIN_WIDTH = 900;

export function mountParallax(root = document) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches || window.innerWidth < MIN_WIDTH) return null;
  if (!('IntersectionObserver' in window)) return null;

  const nodes = [...root.querySelectorAll('[data-parallax]')];
  if (!nodes.length) return null;

  const live = new Set();
  let raf = 0, dirty = true;

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) live.add(e.target);
      else { live.delete(e.target); e.target.style.transform = ''; }
    }
    dirty = true;
    if (live.size && !raf) raf = requestAnimationFrame(tick);
  }, { rootMargin: '15% 0px 15% 0px' });

  nodes.forEach((el) => io.observe(el));

  function tick() {
    raf = 0;
    if (!live.size) return;                 // stop entirely; nothing to do
    if (dirty) {
      dirty = false;
      const vh = window.innerHeight;
      for (const el of live) {
        const r = el.getBoundingClientRect();
        /* -1 when the element's centre is a screen below the viewport centre,
           +1 when a screen above. Clamped, so a tall scene does not run away. */
        const centre = (r.top + r.height / 2 - vh / 2) / vh;
        const t = Math.max(-1, Math.min(1, centre)) * vh * TRAVEL;
        el.style.transform = `translate3d(0, ${t.toFixed(1)}px, 0)`;
      }
    }
    raf = requestAnimationFrame(tick);
  }

  const onScroll = () => {
    dirty = true;
    if (live.size && !raf) raf = requestAnimationFrame(tick);
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });

  /* Someone switching Reduce Motion on mid-visit gets it off immediately. */
  const bail = () => {
    if (!reduce.matches) return;
    io.disconnect();
    removeEventListener('scroll', onScroll);
    removeEventListener('resize', onScroll);
    cancelAnimationFrame(raf);
    nodes.forEach((el) => { el.style.transform = ''; });
  };
  reduce.addEventListener ? reduce.addEventListener('change', bail) : reduce.addListener(bail);

  return { stop: bail };
}
