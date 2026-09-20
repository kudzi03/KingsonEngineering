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

import { NAV, ENQUIRY, CONTACT } from '../content/copy.js';
import { SERVICES } from '../content/services.js';
import { publish } from '../content/company.js';
import { ASSETS, src, srcset, position, hasWide, wideSrc, wideSrcset } from '../content/assets.js';

export const SITE = 'https://kingson-engineering.vercel.app';

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const tel = (v) => 'tel:' + v.replace(/[^\d+]/g, '');
export const wa = () => (publish('whatsapp') ? `https://wa.me/${publish('whatsapp')}` : null);

/* ── the full-bleed photograph ───────────────────────────────────────────────
   One helper, used by the home page's bleed chapter and by all five service
   heroes, so the art direction cannot drift between them.

   Above 900px the frame is a wide band and the photograph is served from the
   16:9 cut `tools/build-images.py` writes around its focal anchor. Below that
   the frame is genuinely portrait and the uncut file is the right one — the
   wide cut squeezed into a 390 x 700 frame would show a third of its width.

   Measured on /fiber-laser-cutting-harare at 1440: the hero went from 405 KB
   to 144 KB, and the whole route from 1103 KB to 842 KB.                    */

export function bleedPhoto(key, { eager = false, abs = false, cls = '',
                                  decorative = false, attrs = '' } = {}) {
  const a = ASSETS[key];
  const u = (path) => (abs ? '/' + path : path);
  const set = (v) => v.split(', ').map((x) => u(x)).join(', ');
  const load = eager ? 'fetchpriority="high" decoding="async"'
                     : 'loading="lazy" decoding="async"';
  const alt = decorative ? '' : esc(a.alt);
  const style = decorative ? '' : ` style="object-position:${position(key)}"`;
  const img = `<img${cls ? ` class="${cls}"` : ''}${attrs ? ' ' + attrs : ''} src="${u(src(key, 1320))}" srcset="${set(srcset(key))}"
             sizes="100vw" width="${a.w}" height="${a.h}" ${load}${style} alt="${alt}">`;
  if (!hasWide(key)) return img;
  return `<picture><source media="(min-width: 900px)" sizes="100vw"
              srcset="${set(wideSrcset(key))}">${img}</picture>`;
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
/* `to` lets a service page point its own CTA at its own form rather than
   bouncing the visitor back to the homepage to convert. */
export function quoteBtn(ghost, to = '#enquiry') {
  return `<a class="${cls(ghost)}" href="${to}"><span>${esc(NAV.quote)}</span></a>`;
}

/* ── the logo ───────────────────────────────────────────────────────────── */

export function logo(kind, height, sizes, base = '', decorative = false) {
  const stem = kind === 'reverse' ? 'kingson-logo-reverse' : 'kingson-logo';
  const alt = decorative ? '' : `${publish('name')} — ${publish('tagline')}`;
  /* A reverse mark in the header is the first thing painted, so it is not
     deferred there the way the footer's is. */
  const lazy = kind === 'reverse' && !decorative ? ' loading="lazy"' : '';
  return `<img src="${base}assets/brand/${stem}-560.png"` +
    ` srcset="${base}assets/brand/${stem}-320.png 320w, ${base}assets/brand/${stem}-560.png 560w"` +
    ` sizes="${sizes}" width="560" height="229" style="height:${height}"` +
    ` alt="${esc(alt)}" decoding="async"${lazy}>`;
}

/* ── navigation ───────────────────────────────────────────────────────────────
   The service routes are the primary navigation now. A dropdown would hide
   them from a crawler behind a hover; they are real links in the header on a
   wide screen and a real list in the menu on a narrow one.                   */

export const NAV_LINKS = (home) => [
  [home ? '#services' : '/#services', NAV.services],
  ...SERVICES.map((s) => [`/${s.slug}`, s.nav]),
  [home ? '#specs' : '/#specs', NAV.specs],
  [home ? '#work' : '/#work', NAV.work],
  [home ? '#contact' : '/#contact', NAV.contact]
];

/* The header keeps four, because a header with nine links in it is a sitemap.
   The menu carries every route. */
export function headerNav(home, current) {
  const items = [
    [home ? '#services' : '/#services', NAV.services],
    ['/fiber-laser-cutting-harare', 'Laser cutting'],
    [home ? '#specs' : '/#specs', NAV.specs],
    [home ? '#contact' : '/#contact', NAV.contact]
  ];
  return items.map(([h, t]) =>
    `      <a href="${h}"${h === '/' + current ? ' aria-current="page"' : ''}>${esc(t)}</a>`).join('\n');
}

export function menuNav(home, current) {
  const rows = [
    [home ? '#services' : '/#services', NAV.services, false],
    ...SERVICES.map((s) => [`/${s.slug}`, s.nav, true]),
    [home ? '#specs' : '/#specs', NAV.specs, false],
    [home ? '#work' : '/#work', NAV.work, false],
    [home ? '#faq' : '/#faq', 'Questions', false],
    [home ? '#enquiry' : '#enquiry', NAV.quote, false],
    [home ? '#contact' : '/#contact', NAV.contact, false]
  ];
  return rows.map(([h, t, sub]) =>
    `    <a href="${h}"${sub ? ' class="menu-sub"' : ''}${h === '/' + current ? ' aria-current="page"' : ''}>${esc(t)}</a>`).join('\n');
}

/* ── chrome ─────────────────────────────────────────────────────────────── */

export function chromeTop({ home = false, current = '' } = {}) {
  /* The home page header sits over the hero, so it carries both marks and the
     stylesheet shows whichever the ground calls for. The anchor already names
     itself, so the second image is decorative rather than a repeat of the
     accessible name. Only the home page pays for it, and the reverse mark is
     on that page regardless — the footer uses it. */
  const mark = home
    ? `      <span class="mark-lit">${logo('light', '46px', '(max-width:760px) 116px, 134px')}</span>
      <span class="mark-rev">${logo('reverse', '46px', '(max-width:760px) 116px, 134px', '', true)}</span>`
    : '      ' + logo('light', '46px', '(max-width:760px) 116px, 134px');

  return `<a class="skip" href="#main">Skip to content</a>

<header class="hd">
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
    <div class="hd-act">${callBtn(NAV.call, true)}${quoteBtn(false, '#enquiry')}</div>
    <button class="hd-menu" type="button" data-menu-open aria-expanded="false" aria-controls="menu">
      <span class="hd-menu-bars" aria-hidden="true"></span>Menu
    </button>
  </div>
</header>

<div class="menu" id="menu" data-menu role="dialog" aria-modal="true" aria-label="Menu" inert>
  <div class="menu-top">
    <span class="menu-logo">${logo('light', '40px', '116px')}</span>
    <button type="button" class="menu-close" data-menu-close aria-label="Close menu">Close</button>
  </div>
  <nav class="menu-list" aria-label="Sections">
${menuNav(home, current)}
  </nav>
  <div class="menu-contact">${quoteBtn(false, '#enquiry')}${callBtn(publish('phone') || NAV.call, true)}${waBtn(true)}</div>
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

  return `<footer class="ft on-dark">
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
</footer>`;
}

export function chromeBottom() {
  return `<div class="viewer" data-viewer role="dialog" aria-modal="true" aria-label="Photograph" inert>
  <div class="viewer-head">
    <span class="viewer-caption" data-viewer-caption></span>
    <button type="button" data-viewer-close>Close</button>
  </div>
  <div class="viewer-body"><img data-viewer-img alt=""></div>
  <div class="viewer-foot"><span data-viewer-alt class="viewer-caption"></span></div>
</div>

<div class="bar">${callBtn(NAV.call, true)}${quoteBtn(false, '#enquiry')}</div>

<script type="module" src="/main.js"></script>`;
}

/* ── <head> ─────────────────────────────────────────────────────────────────── */

const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%230f1211'/%3E%3Ctext x='32' y='43' font-family='Georgia,serif' font-weight='700' font-size='30' fill='%23E21E25' text-anchor='middle'%3EK%3C/text%3E%3C/svg%3E";

export function headHtml({ title, description, path, ogImage, ogAlt, preload, ld, ogType = 'website', home = false }) {
  const canonical = SITE + (path === '/' ? '/' : path);
  const img = ASSETS[ogImage];
  const imgUrl = SITE + '/' + src(ogImage, 1320);
  /* The preload has to agree with what the markup will actually choose. A
     bleed hero is a <picture> with a 900px breakpoint, so the preload carries
     the same two arms — otherwise a desktop visitor downloads the portrait
     file the preload named AND the wide cut the picture picked. */
  const preSet = (k, wide) => (wide ? wideSrcset(k) : srcset(k))
    .split(', ').map((x) => '/' + x).join(', ');
  const preLink = (k, wide, media) =>
    `<link rel="preload" as="image" href="/${wide ? wideSrc(k, 1320) : src(k, 1320)}"
      imagesrcset="${preSet(k, wide)}"
      imagesizes="100vw"${media ? ` media="${media}"` : ''} fetchpriority="high">\n`;
  const pre = !preload ? ''
    : hasWide(preload)
      ? preLink(preload, true, '(min-width: 900px)')
        + preLink(preload, false, '(max-width: 899.98px)')
      : preLink(preload, false, '');

  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#0f1211">
<link rel="canonical" href="${canonical}">

<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="${esc(publish('name'))}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${imgUrl}">
<meta property="og:image:width" content="${img.w}">
<meta property="og:image:height" content="${img.h}">
<meta property="og:image:alt" content="${esc(ogAlt || img.alt)}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="en_ZW">
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
<link rel="preload" href="/assets/fonts/archivo.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
${pre}<!-- --svh is set before first paint so a phone's address bar collapsing
     mid-scroll cannot resize a full-height scene under the reader. From
     main.js it arrived after layout and cost a measured 0.021 CLS.
${home ? `
     The second line puts the header into its over-the-hero state before the
     first paint. Left to main.js it arrived after the module graph had loaded
     — measured at 1.2s on a throttled connection — and a visitor watched a
     white bar sit on the hero and then vanish. The observer in main.js takes
     over from here and is what turns it off again. Nothing is added when the
     visitor arrived at an anchor further down, and nothing at all happens with
     JavaScript off: the header is then the solid bar it is everywhere else.` : ''}
     -->
<script>document.documentElement.style.setProperty('--svh',(window.innerHeight/100)+'px')${home ? `
if(!location.hash&&!window.scrollY)document.documentElement.classList.add('hd-over')` : ''}</script>
<link rel="stylesheet" href="/assets/fonts.css">
<link rel="stylesheet" href="/styles/tokens.css">
<link rel="stylesheet" href="/styles/site.css">

<script type="application/ld+json">
${ld}
</script>`;
}

/* ── the enquiry form ─────────────────────────────────────────────────────────
   The same form on every page, because sending someone back to the homepage to
   convert is a leak. On a service page the matching option is pre-selected, so
   a visitor who arrived searching for laser cutting does not have to tell the
   form what it already knows.                                               */

export function enquiryForm(preselectService) {
  const label = (id, key) => `          <label for="f-${id}">${esc(ENQUIRY.fields[key])}</label>`;
  const err = (id) => `          <span class="field-error" data-error-for="f-${id}" hidden></span>`;
  const ph = (k) => (ENQUIRY.placeholders[k] ? ` placeholder="${esc(ENQUIRY.placeholders[k])}"` : '');

  const text = (id, key, extra = '') => `        <div class="field">
${label(id, key)}
          <input id="f-${id}" name="${id}" type="text"${extra}${ph(key)}>
${err(id)}
        </div>`;

  const area = (id, key, rows) => `        <div class="field">
${label(id, key)}
          <textarea id="f-${id}" name="${id}" rows="${rows}"${ph(key)}></textarea>
${err(id)}
        </div>`;

  const select = (id, key, options, chosen) => `        <div class="field">
${label(id, key)}
          <div class="select">
            <select id="f-${id}" name="${id}">
              <option value=""${chosen ? '' : ' selected'}>${esc(ENQUIRY.choose)}</option>
${options.map((o) => `              <option${o === chosen ? ' selected' : ''}>${esc(o)}</option>`).join('\n')}
            </select>
          </div>
${err(id)}
        </div>`;

  return `      <div class="field-row">
${text('name', 'name', ' autocomplete="name"')}
${text('company', 'company', ' autocomplete="organization"')}
      </div>
      <div class="field-row">
${text('contact', 'contact', ' autocomplete="tel"')}
${select('service', 'service', ENQUIRY.serviceOptions, preselectService)}
      </div>
${text('location', 'location')}
${area('description', 'description', 5)}
${select('drawings', 'drawings', ENQUIRY.drawingOptions, null)}
      <div class="hp" aria-hidden="true">
        <label for="f-website">Leave this field empty</label>
        <input id="f-website" name="website" type="text" tabindex="-1" autocomplete="off">
      </div>`;
}

export function enquiryBlock(preselectService, { title, lede } = {}) {
  return `    <div class="sec-head">
      <p class="eyebrow">${esc(NAV.quote)}</p>
      <h2 class="display" data-reveal="rise"><span>${esc(title || ENQUIRY.title)}</span></h2>
      <p>${esc(lede || ENQUIRY.lede)}</p>
    </div>

    <div class="enq-card">
    <form class="form" data-form novalidate>
      <div class="error-summary" data-error-summary tabindex="-1" hidden></div>
${enquiryForm(preselectService)}
      <p class="files-note">${esc(ENQUIRY.filesNote)}</p>
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
    </div>`;
}
