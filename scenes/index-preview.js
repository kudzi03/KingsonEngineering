/* ═══════════════════════════════════════════════════════════════════════════
   scenes/index-preview.js — the photograph beside the cursor
   ═══════════════════════════════════════════════════════════════════════════

   On a wide screen with a mouse, the capability index shows a photograph of
   the work under the pointer, riding just beside it. The follow is a spring,
   and the frame leans a few degrees into fast horizontal movement — the
   technique of the "Hover Image List" pattern on 21st.dev (educalvolpz),
   with its constants: stiffness 260 / damping 26 for position, 220 / 18 for
   the lean, at most 8°, 0.12° per px/ms of pointer speed. Rebuilt here
   without React or an animation library: one fixed element, one rAF loop
   that runs only while something is still moving.

   WHAT KEEPS THIS HONEST

   · It is a picture of what the row already says. The preview is
     aria-hidden and pointer-transparent, and every row carries the same
     photograph inline on touch and narrow screens (see .cx-media), so
     nothing here is only visible to a mouse.

   · Keyboard focus gets the preview too, anchored to the focused row rather
     than following anything. So does Reduce Motion: no follow, no lean,
     no spring — the photograph simply appears beside the row.

   · Nothing listens to scroll except to put the preview away.
   ═══════════════════════════════════════════════════════════════════════════ */

const FINE = '(hover: hover) and (pointer: fine) and (min-width: 901px)';
const POS = { k: 260, c: 26 };
const LEAN = { k: 220, c: 18, max: 8, factor: 0.12 };
const GAP = 28;            // px between the cursor and the frame

export function mountIndexPreview(root = document) {
  const list = root.querySelector('[data-cx]');
  if (!list) return null;
  const fine = matchMedia(FINE);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  const pv = document.createElement('div');
  pv.className = 'cx-pv';
  pv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(pv);

  let row = null;                          // the active row's <a>
  let on = false, raf = 0, last = null, t0 = 0, anchored = false;
  let x = 0, y = 0, vx = 0, vy = 0, tx = 0, ty = 0;
  let lean = 0, vl = 0, leanT = 0;

  const size = () => [pv.offsetWidth, pv.offsetHeight];

  function show(a) {
    if (row !== a) {
      row = a;
      const m = a.querySelector('.cx-media');
      if (m) {
        const c = m.classList.contains('cx-plate') ? m.cloneNode(true) : m.firstElementChild.cloneNode(true);
        c.classList.remove('cx-media');
        c.removeAttribute('loading');
        pv.replaceChildren(c);
      } else pv.replaceChildren();
    }
    if (!on) { on = true; pv.classList.add('is-on'); }
  }

  function hide() {
    on = false; row = null; last = null; anchored = false;
    pv.classList.remove('is-on');
  }

  function render() {
    pv.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) skewX(${lean.toFixed(2)}deg)`;
  }

  function frame(t) {
    raf = 0;
    const dt = t0 ? Math.min(0.032, (t - t0) / 1000) : 0.016;
    t0 = t;
    vx += (POS.k * (tx - x) - POS.c * vx) * dt; x += vx * dt;
    vy += (POS.k * (ty - y) - POS.c * vy) * dt; y += vy * dt;
    vl += (LEAN.k * (leanT - lean) - LEAN.c * vl) * dt; lean += vl * dt;
    leanT *= 0.86;                          // the lean eases off when the pointer stops
    render();
    const moving = Math.abs(tx - x) + Math.abs(ty - y) + Math.abs(vx) + Math.abs(vy) +
                   Math.abs(lean) + Math.abs(vl) > 0.15;
    if (on && moving) raf = requestAnimationFrame(frame);
    else t0 = 0;
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

  /* Beside the cursor, flipped to its left near the right edge, and never
     under the sticky header. */
  function aim(cx, cy) {
    const [w, h] = size();
    const top = (document.querySelector('.hd')?.getBoundingClientRect().bottom || 0) + 8;
    tx = cx + GAP + w > innerWidth - 8 ? cx - GAP - w : cx + GAP;
    ty = Math.max(top, Math.min(innerHeight - h - 8, cy - h / 2));
  }

  /* Beside the row, left of its arrow: for focus, and for Reduce Motion. */
  function anchor(a) {
    const [w, h] = size();
    const r = a.getBoundingClientRect();
    x = tx = Math.min(innerWidth - w - 8, r.right - w - 96);
    y = ty = r.top + r.height / 2 - h / 2;
    vx = vy = lean = vl = leanT = 0;
    anchored = true;
    render();
  }

  list.addEventListener('pointerover', (e) => {
    if (!fine.matches || e.pointerType !== 'mouse') return;
    const a = e.target.closest('.cx-hit');
    if (!a || a === row) return;
    const first = !on;
    show(a);
    if (reduce.matches) { anchor(a); return; }
    anchored = false;
    aim(e.clientX, e.clientY);
    if (first) { x = tx; y = ty; vx = vy = 0; render(); }
    kick();
  });

  list.addEventListener('pointermove', (e) => {
    if (!on || reduce.matches || e.pointerType !== 'mouse') return;
    const now = e.timeStamp;
    if (last) {
      const dt = Math.min(50, now - last.t);
      if (dt > 0) leanT = Math.max(-LEAN.max, Math.min(LEAN.max, ((e.clientX - last.x) / dt) * LEAN.factor));
    }
    last = { t: now, x: e.clientX };
    aim(e.clientX, e.clientY);
    kick();
  });

  list.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hide(); });

  list.addEventListener('focusin', (e) => {
    const a = e.target.closest('.cx-hit');
    if (!a || !fine.matches || !a.matches(':focus-visible')) return;
    show(a);
    anchor(a);
  });
  list.addEventListener('focusout', (e) => {
    if (!list.contains(e.relatedTarget)) hide();
  });

  /* An anchored preview moves with its row: focusing a row scrolls it into
     view AFTER the focus event, and a keyboard user scrolls the list too. */
  addEventListener('scroll', () => { if (on && anchored && row) anchor(row); }, { passive: true });
  fine.addEventListener('change', () => { if (!fine.matches) hide(); });

  /* Warm the photographs before the first hover, so the frame never opens on
     an empty panel. Same srcset and sizes as the clone, so the browser picks
     the same file. */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || !fine.matches) return;
      io.disconnect();
      for (const img of list.querySelectorAll('.cx-media img')) {
        const i = new Image();
        i.sizes = img.sizes; i.srcset = img.srcset; i.src = img.src;
      }
    }, { rootMargin: '600px 0px' });
    io.observe(list);
  }

  return { hide };
}
