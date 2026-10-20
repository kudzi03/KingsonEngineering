/* ═══════════════════════════════════════════════════════════════════════════
   tools/layout.js — the parts every page shares
   ═══════════════════════════════════════════════════════════════════════════

   The site has more than one URL now, and the moment that happened the header,
   the menu, the footer, the photograph viewer, the phone action bar and the
   whole of <head> stopped being homepage furniture and became site furniture.

   They are generated here, once, for every page — the homepage included. The
   homepage keeps its hand-authored body because its composition is bespoke,
   but its chrome and its <head> come through these functions like everything
   else, so a change to the navigation cannot reach five pages and miss one.

   Nothing in this file states a fact. Every business value arrives through
   publish() and is null when it is not cleared, so a page that should not
   carry a phone number simply has no phone number in it.
   ═══════════════════════════════════════════════════════════════════════════ */

import { NAV, ENQUIRY, CONTACT, CAPABILITIES, PROCESS, processFor } from '../content/copy.js';
import { hasProjects } from '../content/projects.js';
import { SERVICES } from '../content/services.js';
import { SEO } from '../content/seo.js';
import { ANALYTICS } from '../content/analytics.js';
import { publish } from '../content/company.js';
import { ASSETS, src, srcset, position, hasWide, wideSrc, wideSrcset } from '../content/assets.js';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/* ── the build stamp ─────────────────────────────────────────────────────────
   A short hash of every stylesheet and script the pages load, appended to
   their URLs as ?v=. The headers already say "revalidate every time", but a
   phone network's proxy, a data-saver or a tab restored from memory does not
   always listen. A new URL cannot be served from an old cache, so the moment
   a design change ships every visitor gets it. The hash only changes when the
   files do, so an unchanged deploy keeps its cache.                          */
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const STAMPED = ['assets/fonts.css', 'styles/tokens.css', 'styles/site.css', 'styles/editorial.css', 'styles/cinematic.css', 'assets/site.min.css', 'assets/site.min.js', 'main.js',
  ...['interface', 'scenes'].flatMap((d) =>
    readdirSync(ROOT + d).filter((f) => f.endsWith('.js')).sort().map((f) => `${d}/${f}`))];
export const BUILD = createHash('sha256')
  .update(STAMPED.map((f) => readFileSync(ROOT + f)).join('\u0000'))
  .digest('hex').slice(0, 10);

/* The one place the production origin is written. Canonicals, Open Graph,
   structured data, the sitemap, robots.txt and the truth gate all derive
   from it. For the .co.zw move, change it here and re-render — a constant in
   a committed file rather than an environment variable, because the rendered
   HTML is committed and Vercel never runs the renderer. See
   DOMAIN_MIGRATION.md. */
export const SITE = 'https://www.kingsonengineering.co.zw';

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Digit groups in visible text are joined with a no-break space, so
   "3 000 × 1 500 mm" and "+263 772 262 869" never wrap mid-number. Applied to
   each finished page, text nodes only — attributes, scripts and styles are
   left exactly as written. */
export const bindFigures = (html) => html.replace(
  /(<(script|style)\b[\s\S]*?<\/\2>)|>[^<]*(?=<)/g,
  (m, block) => (block ? m : m.replace(/(\d) (?=\d{3}\b)/g, '$1 ')));
export const tel = (v) => 'tel:' + v.replace(/[^\d+]/g, '');
export const wa = () => (publish('whatsapp') ? `https://wa.me/${publish('whatsapp')}` : null);

/* ── the full-bleed photograph ───────────────────────────────────────────────
   One helper, used by the home page's bleed chapter and by all five service
   heroes, so the art direction cannot drift between them.

   Above 900px the frame is a wide band and the photograph is served from the
   16:9 cut `tools/build-images.py` writes around its focal anchor. Below that
   the frame is genuinely portrait and the uncut file is the right one — the
   wide cut squeezed into a 390 x 700 frame would show a third of its width.

   Measured on /fibre-laser-cutting-harare at 1440: the hero went from 405 KB
   to 144 KB, and the whole route from 1103 KB to 842 KB.                    */

export function bleedPhoto(key, { eager = false, abs = false, cls = '',
                                  decorative = false, attrs = '', sizes = '100vw' } = {}) {
  const a = ASSETS[key];
  const u = (path) => (abs ? '/' + path : path);
  const set = (v) => v.split(', ').map((x) => u(x)).join(', ');
  const load = eager ? 'fetchpriority="high" decoding="async"'
                     : 'loading="lazy" decoding="async"';
  const alt = decorative ? '' : esc(a.alt);
  const style = decorative ? '' : ` style="object-position:${position(key)}"`;
  const img = `<img${cls ? ` class="${cls}"` : ''}${attrs ? ' ' + attrs : ''} src="${u(src(key, 1320))}" srcset="${set(srcset(key))}"
             sizes="${sizes}" width="${a.w}" height="${a.h}" ${load}${style} alt="${alt}">`;
  if (!hasWide(key)) return img;
  return `<picture><source media="(min-width: 900px)" sizes="${sizes}"
              srcset="${set(wideSrcset(key))}">${img}</picture>`;
}

/* ── the cinema hero ─────────────────────────────────────────────────────────
   The first screen is Kingson's own photography, full bleed, drifting slowly
   (a Ken Burns move) and cross-fading through the work — frame, laser, crane,
   workshop — with the title set over it. One builder for the home page, the
   five service pages and the 404, so they cannot drift apart.

   Only the first photograph is in the page's initial download. The others
   carry their sources in data- attributes and are switched on by
   scenes/cinema.js after load, so the slideshow never competes with the first
   paint; with JavaScript off the first photograph simply stays. */
const GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const defer = (html) => html
  .replace(/ srcset="/g, ' data-srcset="')
  .replace(/<img([^>]*?) src="([^"]+)"/, `<img$1 src="${GIF}" data-src="$2"`);

export function cinemaHero({ id, eyebrow, meta = '', titleHtml, lede, slides,
                             captions, markup = '', abs = false, cls = '', quoteTo = '#enquiry' }) {
  const figs = slides.map((k, i) => {
    const img = bleedPhoto(k, { eager: i === 0, abs, sizes: '(max-width: 760px) calc(100vw - 44px), 90.6vw' });
    return `    <figure class="cin-slide${i === 0 ? ' is-on' : ''}" data-i="${i}">${i === 0 ? img + markup : defer(img)}</figure>`;
  }).join('\n');
  const many = slides.length > 1;
  const ctl = many
    ? `  <div class="wrap cin-ctl">
    <ol class="cin-dots">
${slides.map((k, i) => `      <li><button type="button" data-go="${i}"${i === 0 ? ' aria-current="true"' : ''} aria-label="${String(i + 1).padStart(2, '0')} ${esc(captions[k])}. Photograph ${i + 1} of ${slides.length}"><span class="cin-n num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span> <span class="cin-t" aria-hidden="true">${esc(captions[k])}</span><i aria-hidden="true"></i></button></li>`).join('\n')}
    </ol>
    <button type="button" class="cin-pause" data-pause aria-pressed="false" aria-label="Pause the photographs"><span aria-hidden="true"></span></button>
  </div>`
    : `  <div class="wrap cin-ctl"><p class="cin-cap"><span class="cin-n num">01</span><span class="cin-t">${esc(captions[slides[0]])}</span></p></div>`;
  return `
  <div class="wrap cin-in">
    <p class="hero-eyebrow">${esc(eyebrow)}</p>
    <h1 class="display hero-title${cls}" id="${id}">${titleHtml}</h1>
    <div class="hero-foot">
      <p class="hero-lede">${esc(lede)}</p>
      <div class="hero-act">${quoteBtn(false, quoteTo)}${callBtn(NAV.call, true)}${waBtn(true)}${emailBtn(true)}</div>
      ${quoteBrief({slug: SERVICES.find(s => s.h1 === titleHtml)?.slug})}
    </div>${meta ? `
    <p class="hero-meta">${meta}</p>` : ''}
  </div>
  <div class="cin-media">
    <div class="cin-slides"${many ? ' aria-live="off"' : ''}>
${figs}
    </div>
    <span class="cin-image-label" aria-hidden="true">KINGSON / ON SITE & IN THE WORKSHOP</span>
  </div>
${ctl}
`;
}

/* ── icons ──────────────────────────────────────────────────────────────── */

export const ICON_PHONE = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.6 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.8.6a2 2 0 0 1 1.7 2z"/></svg>';
export const ICON_WA = '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.7 15L2 22l5.2-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.4-.7-1.7-.8s-.4-.1-.5.1-.6.8-.7 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.6-1.3.1-.2 0-.3 0-.5s-.5-1.3-.7-1.7-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.1.6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .1-1.2z"/></svg>';
export const ICON_EXPAND = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>';
export const ICON_ARROW = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

/* ── buttons ────────────────────────────────────────────────────────────── */

const cls = (ghost) => (ghost ? 'btn-ghost' : 'btn');

export function callBtn(label, ghost) {
  const p = publish('phone');
  if (!p) return '';
  return `<a class="${cls(ghost)}" href="${tel(p)}">${ICON_PHONE}<span>${esc(label || NAV.call)}</span></a>`;
}
export function waBtn(ghost) {
  const h = wa();
  if (!h) return '';
  return `<a class="${cls(ghost)}" href="${h}" target="_blank" rel="noopener">${ICON_WA}<span>${esc(NAV.whatsapp)}</span></a>`;
}
export function emailBtn(ghost) {
  const address = publish('email');
  if (!address) return '';
  return `<a class="${cls(ghost)}" href="mailto:${esc(address)}"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></svg><span>Email</span></a>`;
}
/* `to` lets a service page point its own CTA at its own form rather than
   bouncing the visitor back to the homepage to convert. */
export function quoteBtn(ghost, to = '#enquiry') {
  return `<a class="${cls(ghost)}" href="${to}"><span>${esc(NAV.quote)}</span></a>`;
}

// Native disclosures keep the quoting checklist close without obscuring the work.
export function quoteBrief({ slug, open = false } = {}) {
  const service = SERVICES.find(s => s.slug === slug);
  const items = service?.send || [
    'DXF or DWG preferred; STEP and PDF also accepted. No drawings? Send site photos or a sketch.',
    'Material, thickness and quantity, if known.',
    'Site or town, approximate span and height, or opening dimensions.'
  ];
  return `<details class="quote-brief"${open ? ' open' : ''}><summary>What we need from you</summary><ul>${items.map(item => `<li>${esc(item)}</li>`).join('')}</ul><p>Attach drawings or photos by email or WhatsApp. This form does not upload files.</p></details>`;
}
export function quoteSupport({ slug, open = false } = {}) {
  return `<div class="quote-support">${quoteBrief({slug,open})}<nav class="contact-options" aria-label="Talk to Kingson">${callBtn(NAV.call,true)}${waBtn(true)}${emailBtn(true)}</nav></div>`;
}
export function processCards(slug) {
  const steps = slug ? processFor(slug) : PROCESS.steps;
  return steps.map(st => `<li class="step"><span class="step-n">${esc(st.n)}</span><div class="step-body"><h3>${esc(st.title)}</h3><p class="step-commitment"><strong>${esc(st.commitment)}</strong></p><p>${esc(st.body)}</p></div></li>`).join('\n');
}

/* ── the logo ───────────────────────────────────────────────────────────── */

export function logo(kind, height, sizes, base = '', decorative = false, eager = false) {
  const stem = kind === 'reverse' ? 'kingson-logo-reverse' : 'kingson-logo';
  const alt = decorative ? '' : `${publish('name')} — ${publish('tagline')}`;
  /* A reverse mark in the header is the first thing painted, so it is not
     deferred there the way the footer's is. */
  const lazy = kind === 'reverse' && !eager ? ' loading="lazy" fetchpriority="low"' : '';
  return `<picture><source type="image/webp" srcset="${[240,320,560].map(w=>`${base}assets/brand/${stem}-${w}.webp ${w}w`).join(', ')}" sizes="${sizes}"><img src="${base}assets/brand/${stem}-560.png"` +
    ` srcset="${base}assets/brand/${stem}-320.png 320w, ${base}assets/brand/${stem}-560.png 560w"` +
    ` sizes="${sizes}" width="560" height="229" style="height:${height}"` +
    ` alt="${esc(alt)}" decoding="async"${lazy}></picture>`;
}

/* ── navigation ───────────────────────────────────────────────────────────────
   The service routes are the primary navigation now. A dropdown would hide
   them from a crawler behind a hover; they are real links in the header on a
   wide screen and a real list in the menu on a narrow one.                   */


/* The header keeps four, because a header with nine links in it is a sitemap.
   The menu carries every route. */
/* ── navigation ──────────────────────────────────────────────────────────────
   One structure, two renderings. Before this the header showed four items and
   the menu showed eleven, and they did not agree on what the site contains —
   the header promoted one of the six services to sit beside a whole category,
   which is why it read as arbitrary, and the menu offered "Work", a section
   that no longer exists.

   Laser cutting is not in the header any more. It is the first thing under
   the hero, in a chooser that shows all six, and it has its own page like the
   others. Promoting it here said it was a different kind of thing.          */

const NAV_ITEMS = (home) => [
  [home ? '#services' : '/#services', NAV.services],
  [home ? '#work' : '/#work', 'Our projects'],
  /* Projects appears only once there is a project to show. The portfolio
     architecture is finished and the list is empty — see content/projects.js. */
  ...(hasProjects() ? [['/projects', 'Projects']] : []),
  [home ? '#specs' : '/#specs', NAV.specs],
  [home ? '#how' : '/#how', 'How it works'],
  [home ? '#contact' : '/#contact', NAV.contact]
];

export function headerNav(home, current) {
  return NAV_ITEMS(home).map(([h, t]) =>
    `      <a href="${h}"${h === '/' + current ? ' aria-current="page"' : ''}>${esc(t)}</a>`).join('\n');
}

/* The menu is the header plus the six services nested under the first item,
   because a phone has the room to show them and the header does not. */
export function menuNav(home, current) {
  const [services, ...rest] = NAV_ITEMS(home);
  const rows = [
    [...services, false],
    ...SERVICES.map((s) => [`/${s.slug}`, s.nav, true]),
    ...rest.map(([h, t]) => [h, t, false])
    /* No "Get a price" row: the menu already closes with it as a filled
       button in .menu-contact, and listing it twice in one panel was the
       clearest case of the site asking for the same thing over and over. */
  ];
  return rows.map(([h, t, sub]) =>
    `    <a href="${h}"${sub ? ' class="menu-sub"' : ''}${h === '/' + current ? ' aria-current="page"' : ''}>${esc(t)}</a>`).join('\n');
}

/* ── the service chooser ─────────────────────────────────────────────────────
   Six services, one screen. It sits under the home hero, and it is also the
   whole of the 404 page's recovery path, because a visitor who has landed on
   a URL that does not exist wants the same thing the home page's visitor
   wants: the one of the six that is their job.

   It lives here rather than in the home page's renderer so those two cannot
   drift. An ordered list, because the services are ranked by how much of the
   work they are, and because a screen reader should say "1 of 6".          */
export function serviceChooser({ reveal = true } = {}) {
  const r = reveal ? ' data-reveal="lift" data-reveal-stagger="60"' : '';
  /* Four of the six have a photograph Kingson supplied of that work. The other
     two have none, and they do not borrow one: their media is a plain steel
     plate carrying the figure instead. Decorative here (alt="", aria-hidden)
     because the row's own words already name the service; the same images
     carry full descriptions where they appear as content. */
  const media = (c, large) => {
    if (!c.photo) {
      return `<span class="cx-media cx-plate" aria-hidden="true"><b class="num">${esc(c.lead[0])}</b><span>${esc(c.lead[1])}</span></span>`;
    }
    const a = ASSETS[c.photo];
    return `<span class="cx-media" aria-hidden="true"><img src="/${src(c.photo, 720)}" srcset="${srcset(c.photo).split(', ').map((x) => '/' + x).join(', ')}"
                 sizes="${large ? '(max-width: 760px) 90vw, 48vw' : '(max-width: 760px) 90vw, 150px'}"
                 width="${a.w}" height="${a.h}" loading="lazy" decoding="async"
                 style="object-position:${position(c.photo)}" alt=""></span>`;
  };
  return `    <ol class="cx"${r}>
${CAPABILITIES.map((c, i) => `      <li class="cx-row">
        <a class="cx-hit" href="/${c.route}">
          <span class="cx-n num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
          <h3 class="cx-name">${esc(c.title)}</h3>
          <span class="cx-lead"><b class="num">${esc(c.lead[0])}</b><span>${esc(c.lead[1])}</span></span>
          <span class="cx-body">${esc(c.body)}</span>
          <span class="cx-go" aria-hidden="true">${ICON_ARROW}</span>
          ${media(c, i < 2)}
        </a>
      </li>`).join('\n')}
    </ol>`;
}

/* ── chrome ─────────────────────────────────────────────────────────────── */

export function chromeTop({ home = false, current = '' } = {}) {
  /* One mark on every page. The home page's first sheet is the same light
     ground as the bar, so the reverse artwork it used to carry for a dark
     photographic hero has nothing left to do. */
  const mark = home
    ? `<span class="hd-home-reverse">${logo('reverse', '46px', '(max-width:760px) 116px, 134px', '', false, true)}</span><span class="hd-home-normal">${logo('normal', '46px', '(max-width:760px) 116px, 134px', '', false, true)}</span>`
    : '      ' + logo('normal', '46px', '(max-width:760px) 116px, 134px', '', false, true);

  return `<a class="skip" href="#main">Skip to content</a>

<header class="hd${home ? ' hd-home' : ''}">
  <!-- How far down a seventeen-screen page you are. Driven entirely by CSS
       scroll-driven animation where the browser has it, so there is no scroll
       listener and no JavaScript in the path at all; browsers without it
       simply do not show the bar, which costs a visitor nothing. It is
       decorative to a screen reader, hence aria-hidden. -->
  <div class="hd-progress" aria-hidden="true"><i></i></div>
  <div class="hd-in">
    <a class="hd-mark" href="${home ? '#top' : '/'}" aria-label="Kingson Engineering, home">
${mark}
    </a>
    <nav class="hd-nav" aria-label="Primary">
${headerNav(home, current)}
    </nav>
    <nav class="hd-contacts" aria-label="Contact Kingson">${callBtn(NAV.call, true)}${waBtn(true)}${emailBtn(true)}</nav>
    <div class="hd-act">${quoteBtn(false, '#enquiry')}</div>
    <button class="hd-menu" type="button" data-menu-open aria-expanded="false" aria-controls="menu">
      <span class="hd-menu-bars" aria-hidden="true"></span>Menu
    </button>
  </div>
</header>

<div class="menu on-dark" id="menu" data-menu role="dialog" aria-modal="true" aria-label="Menu" inert>
  <div class="menu-top">
    <span class="menu-logo">${logo('reverse', '40px', '116px', '', true)}</span>
    <button type="button" class="menu-close" data-menu-close aria-label="Close menu">Close</button>
  </div>
  <nav class="menu-list" aria-label="Sections">
${menuNav(home, current)}
  </nav>
  <div class="menu-contact">${quoteBtn(false, '#enquiry')}${callBtn(publish('phone') || NAV.call, true)}${waBtn(true)}${emailBtn(true)}</div>
</div>`;
}

/* ── the footer ───────────────────────────────────────────────────────────────
   Outside <main>, and carrying a real list of the service routes. A footer
   that links every page is the cheapest internal linking there is, and it is
   the one navigation a crawler always reaches.                              */

export function siteFooter() {
  const meta = [
    publish('legalName'),
    publish('address'),
    publish('hours'),
    publish('facebook')
      ? `<a href="${esc(publish('facebook'))}" target="_blank" rel="noopener">Facebook</a>`
      : null
  ].filter(Boolean).map((v) => `      <span>${v}</span>`).join('\n');

  const services = SERVICES.map((s) =>
    `        <li><a href="/${s.slug}">${esc(s.nav)}</a></li>`).join('\n');

  const reach = [['phone', publish('phone')], ['office', publish('office')],
    ['email', publish('email')], ['emailTechnical', publish('emailTechnical')]]
    .filter(([, v]) => v)
    .map(([k, v]) => {
      const href = k === 'email' || k === 'emailTechnical' ? `mailto:${esc(v)}` : tel(v);
      return `        <li><a href="${href}">${esc(v)}</a></li>`;
    }).join('\n');

  return `<footer class="ft on-dark gl">
  <div class="ft-nav wrap">
    <div class="ft-col">
      <span class="ft-logo">${logo('reverse', '52px', '(max-width:760px) 132px, 152px')}</span>
    </div>
    <div class="ft-col">
      <h2>What we do</h2>
      <ul>
${services}
      </ul>
    </div>
    <div class="ft-col">
      <h2>${esc(CONTACT.title.replace(/\.$/, ''))}</h2>
      <ul>
${reach}
      </ul>
    </div>
  </div>
  <div class="ft-in">
${meta}
  </div>
  <nav class="ft-policies wrap" aria-label="Privacy and website policies"><a href="/privacy-policy">Privacy policy</a><a href="/cookie-policy">Cookie policy</a><a href="/terms-of-use">Website terms</a><button type="button" data-cookie-settings>Cookie settings</button></nav>
  <p class="ft-mark" aria-hidden="true" data-mark="${esc(publish('name'))}"></p>
</footer>`;
}

export function chromeBottom() {
  return `<div class="viewer" data-viewer role="dialog" aria-modal="true" aria-label="Photograph" inert>
  <div class="viewer-head">
    <span class="viewer-caption" data-viewer-caption></span>
    <button type="button" data-viewer-close>Close</button>
  </div>
  <!-- A transparent pixel, not an empty src. An <img> with no src attribute
       is invalid, reports naturalWidth 0, and in some browsers paints a
       broken-image glyph — on every page of the site, because this dialog is
       part of the shared chrome. It is inert and off screen so nobody saw it,
       which is exactly why it survived this long. The viewer overwrites the
       src the moment a photograph is opened; the pixel costs no request. -->
  <div class="viewer-body"><img data-viewer-img alt=""
       src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"></div>
  <div class="viewer-foot"><span data-viewer-alt class="viewer-caption"></span></div>
</div>

<!-- The phone action bar. WhatsApp belongs in it: it is how a Zimbabwean
     buyer actually opens a conversation, and before this it appeared twice on
     the home page with neither instance above the fold. The bar is the one
     piece of the page that is reachable at every scroll depth, so the four
     ways to reach us all live here rather than only in a hero somebody has
     already scrolled past. -->
<nav class="bar" aria-label="Call, WhatsApp, email or get a price">${callBtn(NAV.call, true)}${waBtn(true)}${emailBtn(true)}${quoteBtn(false, '#enquiry')}</nav>

<aside class="consent-banner" data-privacy data-analytics-id="${esc(ANALYTICS.measurementId)}" aria-labelledby="privacy-choice-title" hidden>
  <div><h2 id="privacy-choice-title">Your privacy choices</h2><p data-privacy-status>Analytics is optional.</p><p>We use optional Google Analytics cookies to understand visits. <a href="/cookie-policy">Cookie policy</a> · <a href="/privacy-policy">Privacy policy</a></p></div>
  <div class="consent-actions"><button type="button" data-consent-choice="denied">Reject optional</button><button type="button" data-consent-choice="granted">Allow analytics</button></div>
</aside>
<script type="module" src="/assets/site.min.js?v=${BUILD}"></script>`;
}

/* ── <head> ─────────────────────────────────────────────────────────────────── */

const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%230f1211'/%3E%3Ctext x='32' y='43' font-family='Georgia,serif' font-weight='700' font-size='30' fill='%23E21E25' text-anchor='middle'%3EK%3C/text%3E%3C/svg%3E";

export function headHtml({ title, description, path, ogImage, ogAlt, preload, preloadMobile, ld,
                           ogType = 'website', home = false, index = true }) {
  if (SEO.googleSiteVerification && !/^[a-zA-Z0-9_-]+$/.test(SEO.googleSiteVerification)) {
    throw new Error('Use only the Google verification token in content/seo.js');
  }
  const canonical = SITE + (path === '/' ? '/' : path);
  const img = ASSETS[ogImage];
  /* Link previews get a 1200x630 JPEG: WhatsApp — how most people here will
     share this link — does not reliably render a WebP preview. Written by
     tools/og-images.mjs; check-truth.js fails if one is missing. */
  const imgUrl = SITE + '/' + src(ogImage, 1320).replace(/-\d+\.webp$/, '.jpg').replace('img/', 'img/og-');
  /* The preload has to agree with what the markup will actually choose. A
     bleed hero is a <picture> with a 900px breakpoint, so the preload carries
     the same two arms — otherwise a desktop visitor downloads the portrait
     file the preload named AND the wide cut the picture picked. */
  const preSet = (k, wide) => (wide ? wideSrcset(k) : srcset(k))
    .split(', ').map((x) => '/' + x).join(', ');
  const preLink = (k, wide, media) =>
    `<link rel="preload" as="image" href="/${wide ? wideSrc(k, 1320) : src(k, 1320)}"
      imagesrcset="${preSet(k, wide)}"
      imagesizes="${home ? '100vw' : '(max-width: 760px) calc(100vw - 44px), 90.6vw'}"${media ? ` media="${media}"` : ''} fetchpriority="high">\n`;
  const pre = !preload ? ''
    : hasWide(preload)
      ? preLink(preload, true, '(min-width: 900px)')
        + preLink(preloadMobile || preload, false, '(max-width: 899.98px)')
      : preLink(preload, false, '');

  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#faf9f6">
${home && SEO.googleSiteVerification ? `<meta name="google-site-verification" content="${SEO.googleSiteVerification}">` : ''}
${home && SEO.bingSiteVerification ? `<meta name="msvalidate.01" content="${SEO.bingSiteVerification}">` : ''}
${index ? `<link rel="canonical" href="${canonical}">` : '<meta name="robots" content="noindex">'}

<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="${esc(publish('name'))}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${imgUrl}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(ogAlt || img.alt)}">
${index ? `<meta property="og:url" content="${canonical}">\n` : ''}<meta property="og:locale" content="en_ZW">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${imgUrl}">
<meta name="twitter:image:alt" content="${esc(ogAlt || img.alt)}">

<link rel="icon" href="${FAVICON}">
<link rel="apple-touch-icon" href="/assets/brand/kingson-logo-320.png">

<!-- Both faces, not just the display one. The body font arriving after first
     paint reflowed the hero copy and was the entire measured CLS (0.021 on a
     phone): the h1 and lede are set in these two, so neither can be late. -->
<link rel="preload" href="/assets/fonts/archivo-wdth.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
${pre}<!-- --svh is set before first paint so a phone's address bar collapsing
     mid-scroll cannot resize a full-height scene under the reader. From
     main.js it arrived after layout and cost a measured 0.021 CLS.

     The script after fonts.css holds the title of the first sheet back until
     Archivo is in (2.5s at most). It has to come after that stylesheet: before
     it, the face is not declared yet and the check passes at once. Set in the fallback it is a different width, and the
     right-set second line jumped sideways when the face swapped: the whole of
     the page's layout shift. Nothing is held with JavaScript off.
${home ? `
     The second line puts the header into its over-the-hero state before the
     first paint. Left to main.js it arrived after the module graph had loaded
     — measured at 1.2s on a throttled connection — and a visitor watched a
     white bar sit on the hero and then vanish. The observer in main.js takes
     over from here and is what turns it off again. Nothing is added when the
     visitor arrived at an anchor further down, and nothing at all happens with
     JavaScript off: the header is then the solid bar it is everywhere else.` : ''}
     -->
<script>document.documentElement.style.setProperty('--svh',(window.innerHeight/100)+'px')</script>
<link rel="stylesheet" href="/assets/site.min.css?v=${BUILD}">
${ld ? `
<script type="application/ld+json">
${ld}
</script>` : ''}`;
}

/* ── the enquiry form ─────────────────────────────────────────────────────────
   The same form on every page, because sending someone back to the homepage to
   convert is a leak. On a service page the matching option is pre-selected, so
   a visitor who arrived searching for laser cutting does not have to tell the
   form what it already knows.                                               */

/* The initial four fields need only business, reply contact and a description.
   File status is optional; the other context remains in a native disclosure.
   Keep required fields aligned with interface/enquiry.js. */
const REQUIRED = new Set(['company', 'contact', 'description']);

export function enquiryForm(preselectService) {
  const label = (id, key) => `          <label for="f-${id}">${esc(ENQUIRY.fields[key])}${
    REQUIRED.has(id) ? '' : ` <span class="opt">${esc(ENQUIRY.optional)}</span>`}</label>`;
  const req = (id) => (REQUIRED.has(id) ? ' aria-required="true"' : '');
  const err = (id) => `          <span class="field-error" data-error-for="f-${id}" hidden></span>`;
  const ph = (k) => (ENQUIRY.placeholders[k] ? ` placeholder="${esc(ENQUIRY.placeholders[k])}"` : '');

  const text = (id, key, extra = '') => `        <div class="field">
${label(id, key)}
          <input id="f-${id}" name="${id}" type="text"${req(id)}${extra}${ph(key)}>
${err(id)}
        </div>`;

  const area = (id, key, rows) => `        <div class="field">
${label(id, key)}
          <textarea id="f-${id}" name="${id}" rows="${rows}"${req(id)}${ph(key)}></textarea>
${err(id)}
        </div>`;

  const select = (id, key, options, chosen) => `        <div class="field">
${label(id, key)}
          <div class="select">
            <select id="f-${id}" name="${id}"${req(id)}>
              <option value=""${chosen ? '' : ' selected'}>${esc(ENQUIRY.choose)}</option>
${options.map((o) => `              <option${o === chosen ? ' selected' : ''}>${esc(o)}</option>`).join('\n')}
            </select>
          </div>
${err(id)}
        </div>`;

  return `      <div class="field-row">
${text('company', 'company', ' autocomplete="organization"')}
${text('contact', 'contact', ' autocomplete="tel"')}
      </div>
${area('description', 'description', 3)}
${select('drawings', 'drawings', ENQUIRY.drawingOptions, null)}
      <details class="form-extra">
        <summary>Add service, site or organisation details <span class="opt">optional</span></summary>
${select('service', 'service', ENQUIRY.serviceOptions, preselectService || 'Not sure yet')}
${text('location', 'location')}
${text('orgdetails', 'orgdetails')}
      </details>
      <div class="hp" aria-hidden="true">
        <label for="f-website">Leave this field empty</label>
        <input id="f-website" name="website" type="text" tabindex="-1" autocomplete="off">
      </div>`;
}

/* The short privacy notice under every enquiry form. */
export function privacyNote() {
  const mail = publish('email');
  return `<p class="privacy-note">${esc(ENQUIRY.privacy)} ${mail
    ? `<a href="mailto:${esc(mail)}">${esc(mail)}</a>.` : ''} ${esc(ENQUIRY.analytics)} <a href="/privacy-policy">Privacy policy</a> · <a href="/cookie-policy">Cookie policy</a>.</p>`;
}

/* Beside the form: the other way in. Every value through publish(), so an
   unconfirmed one produces no line; with no phone at all the panel is empty
   rather than wrong. */
export function enquiryAside(preselectService) {
  const hours = publish('hours');
  const person = publish('contactPerson');
  return `      <p class="enq-aside-k">Rather talk it through?</p>
      <p class="enq-aside-t">${esc(CONTACT.lede)}</p>
      <div class="enq-aside-act">${callBtn(publish('phone') || NAV.call, true)}${waBtn(true)}${emailBtn(true)}</div>
      ${quoteBrief({ slug: SERVICES.find(s => s.serviceName === preselectService)?.slug, open: true })}
      <p class="enq-aside-meta">${hours ? `<span>Open <b>${esc(hours)}</b></span>` : ''}${person ? `<span>Ask for <b>${esc(person)}</b></span>` : ''}</p>`;
}

export function enquiryBlock(preselectService, { title, lede } = {}) {
  return `    <div class="sec-head">
      <p class="eyebrow">${esc(NAV.quote)}</p>
      <h2 class="display" data-reveal="rise"><span>${esc(title || ENQUIRY.title)}</span></h2>
      <p>${esc(lede || ENQUIRY.lede)}</p>
    </div>

    <div class="enq-body">
    <aside class="enq-aside" aria-label="Call instead">
${enquiryAside(preselectService)}
    </aside>
    <div class="enq-card">
    <form class="form" data-form novalidate>
      <div class="error-summary" data-error-summary tabindex="-1" hidden></div>
${enquiryForm(preselectService)}
      <p class="files-note">${esc(ENQUIRY.filesNote)}</p>
      ${privacyNote()}
      <div class="form-actions">
        <button type="submit" class="btn" data-review><span>${esc(ENQUIRY.actions.review)}</span></button>
      </div>
    </form>

    <div class="sent" data-sent aria-live="polite" hidden>
      <h3 data-sent-title></h3>
      <p data-sent-body></p>
    </div>

    <div class="draft" data-draft aria-live="polite">
      <h3 data-draft-title>${esc(ENQUIRY.draftTitle)}</h3>
      <div class="draft-body" data-draft-body></div>
      <div class="draft-actions" data-draft-actions></div>
      <p class="draft-status" data-draft-status></p>
    </div>
    </div>
    </div>`;
}
