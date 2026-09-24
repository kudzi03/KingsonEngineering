/* ═══════════════════════════════════════════════════════════════════════════
   scenes/cinema.js — the first screen's photographs
   ═══════════════════════════════════════════════════════════════════════════

   Cross-fades the hero through Kingson's photographs every seven seconds.
   The drift on each one is CSS (see .cin-slide in site.css); this only says
   which photograph is on, loads the next one just before it is needed, and
   keeps the index at the foot in step.

   · Only the first photograph is fetched with the page. Each later one is
     loaded when the one before it starts, so a visitor who never waits for
     the second photograph never downloads it.
   · Stoppable: the pause control, and the index buttons to go to any
     photograph (WCAG 2.2.2). Reduce Motion starts paused.
   · Stops by itself when the hero is off screen or the tab is hidden.
   ═══════════════════════════════════════════════════════════════════════════ */

const DUR = 7000;
const FADE = 1600;

export function mountCinema(root = document.querySelector('[data-cin]')) {
  if (!root) return null;
  const slides = [...root.querySelectorAll('.cin-slide')];
  if (slides.length < 2) return null;
  const dots = [...root.querySelectorAll('[data-go]')];
  const pauseBtn = root.querySelector('[data-pause]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  let i = 0, timer = 0, visible = true;
  let paused = reduce.matches;
  root.style.setProperty('--cin-dur', DUR + 'ms');

  const load = (s) => {
    if (!s) return;
    for (const e of s.querySelectorAll('[data-srcset]')) { e.srcset = e.dataset.srcset; e.removeAttribute('data-srcset'); }
    const im = s.querySelector('img[data-src]');
    if (im) { im.src = im.dataset.src; im.removeAttribute('data-src'); }
  };

  const run = () => {
    clearTimeout(timer);
    dots.forEach((d) => d.classList.remove('run'));
    if (paused || !visible || document.hidden) return;
    void root.offsetWidth;                     // restart the progress rule
    dots[i]?.classList.add('run');
    timer = setTimeout(() => show((i + 1) % slides.length), DUR);
  };

  function show(n) {
    if (n === i) return run();
    const prev = slides[i];
    load(slides[n]);
    prev.classList.remove('is-on');
    prev.classList.add('was');
    slides[n].classList.add('is-on');
    setTimeout(() => prev.classList.remove('was'), FADE);
    dots[i]?.removeAttribute('aria-current');
    dots[n]?.setAttribute('aria-current', 'true');
    i = n;
    load(slides[(n + 1) % slides.length]);
    run();
  }

  const setPaused = (p) => {
    paused = p;
    root.classList.toggle('is-paused', p);
    if (pauseBtn) {
      pauseBtn.setAttribute('aria-pressed', String(p));
      pauseBtn.setAttribute('aria-label', p ? 'Play the photographs' : 'Pause the photographs');
    }
    run();
  };

  dots.forEach((d) => d.addEventListener('click', () => show(+d.dataset.go)));
  pauseBtn?.addEventListener('click', () => setPaused(!paused));
  reduce.addEventListener?.('change', () => setPaused(reduce.matches || paused));
  document.addEventListener('visibilitychange', run);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; run(); }, { threshold: 0.15 }).observe(root);
  }

  /* The second photograph after the page has loaded, never before. */
  const start = () => { load(slides[1]); setPaused(paused); };
  if (document.readyState === 'complete') start(); else addEventListener('load', start, { once: true });

  return { show, pause: () => setPaused(true) };
}
