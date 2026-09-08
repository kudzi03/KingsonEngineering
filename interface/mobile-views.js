/* ═══════════════════════════════════════════════════════════════════════════
   interface/mobile-views.js — the mobile image sequence
   ═══════════════════════════════════════════════════════════════════════════
   V2 §10 Scene 6 mobile: native horizontal scroll-snap, one 89vw image with
   the next 11vw edge visible, three explicit pagination buttons, no
   auto-advance, and no interception of vertical scroll.
   ═══════════════════════════════════════════════════════════════════════════ */

import { VIEWS } from '../content/copy.js';
import { ASSETS, src, srcset } from '../content/assets.js';

export function mountMobileViews(viewer) {
  const host = document.querySelector('[data-after]');
  if (!host) return;

  const section = document.createElement('section');
  section.className = 'm-views';
  section.id = 'views-mobile';
  section.innerHTML = `<h2>${VIEWS.title}</h2>`;

  const reel = document.createElement('div');
  reel.className = 'm-reel';
  VIEWS.panels.forEach((panel) => {
    const a = ASSETS[panel.asset];
    const fig = document.createElement('figure');
    fig.innerHTML =
      `<img src="${src(panel.asset, 1100)}" srcset="${srcset(panel.asset)}" sizes="89vw" ` +
      `width="${a.w}" height="${a.h}" loading="lazy" decoding="async" alt="${a.alt}">` +
      `<figcaption>${panel.caption}</figcaption>`;
    fig.querySelector('img').addEventListener('click', () => viewer.open(panel.asset));
    reel.appendChild(fig);
  });
  section.appendChild(reel);

  const pager = document.createElement('div');
  pager.className = 'm-pager';
  VIEWS.panels.forEach((panel, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = String(i + 1);
    b.setAttribute('aria-label', panel.caption);
    b.addEventListener('click', () => {
      reel.scrollTo({ left: reel.children[i].offsetLeft, behavior: 'smooth' });
      pager.querySelectorAll('button').forEach((x) => x.removeAttribute('aria-current'));
      b.setAttribute('aria-current', 'true');
    });
    if (i === 0) b.setAttribute('aria-current', 'true');
    pager.appendChild(b);
  });
  section.appendChild(pager);

  host.insertBefore(section, host.querySelector('.after-body'));
}
