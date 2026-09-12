#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   tools/render.js — write the page's content into index.html
   ═══════════════════════════════════════════════════════════════════════════

   The copy, the photographs and every business value have one home each:
   content/copy.js, content/assets.js, content/company.js. Rendering them in
   the browser would mean a page whose text does not exist until JavaScript
   runs — fine for Google, useless for the answer engines this site is meant
   to be found by, and empty for anyone with JavaScript off.

   So the content is written INTO index.html here, and committed. There is
   still no build step to serve the site: this runs when the content changes,
   and its output is a plain static file.

     node tools/render.js          rewrite index.html
     node tools/render.js --check  fail if index.html is out of date

   Every business value is asked for by status, so a value that is not cleared
   for publication cannot reach the file: `publish()` returns null and the
   block that would have carried it is simply not written. tools/check-truth.js
   then asserts that over the rendered output.
   ═══════════════════════════════════════════════════════════════════════════ */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  UPDATED, EYEBROWS, HERO, STRIP, CAPABILITIES, BAND, SPECS, PROCESS,
  WORK, ENQUIRY, FAQ, CONTACT, NAV
} from '../content/copy.js';
import { ASSETS, GALLERY, BAND_IMAGE, src, srcset, position } from '../content/assets.js';
import { publish } from '../content/company.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const file = root + 'index.html';
const SITE = 'https://kingson-engineering.vercel.app/';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const tel = (v) => 'tel:' + v.replace(/[^\d+]/g, '');
const wa = () => (publish('whatsapp') ? `https://wa.me/${publish('whatsapp')}` : null);

/* ── icons ──────────────────────────────────────────────────────────────── */

const ICON_PHONE = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.6 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.8.6a2 2 0 0 1 1.7 2z"/></svg>';
const ICON_WA = '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.7 15L2 22l5.2-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.4-.7-1.7-.8s-.4-.1-.5.1-.6.8-.7 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.6-1.3.1-.2 0-.3 0-.5s-.5-1.3-.7-1.7-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.1.6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .1-1.2z"/></svg>';
const ICON_ARROW = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

/* ── action buttons ─────────────────────────────────────────────────────── */

const cls = (ghost) => (ghost ? 'btn-ghost' : 'btn');

function callBtn(label, ghost) {
  const p = publish('phone');
  if (!p) return '';
  return `<a class="${cls(ghost)}" href="${tel(p)}">${ICON_PHONE}<span>${esc(label || NAV.call)}</span></a>`;
}
function waBtn(ghost) {
  const h = wa();
  if (!h) return '';
  return `<a class="${cls(ghost)}" href="${h}" target="_blank" rel="noopener">${ICON_WA}<span>${esc(NAV.whatsapp)}</span></a>`;
}
function quoteBtn(ghost) {
  return `<a class="${cls(ghost)}" href="#enquiry"><span>${esc(NAV.quote)}</span></a>`;
}

/* ── the logo ────────────────────────────────────────────────────────────────
   One piece of artwork at three sizes, plus a reversed variant for the dark
   grounds: the drawn mark in the logo is near-black and vanishes on them, so
   only that mark is lightened. The red and the green are untouched.          */

function logo(kind, height, sizes) {
  const stem = kind === 'reverse' ? 'kingson-logo-reverse' : 'kingson-logo';
  const alt = `${publish('name')} — ${publish('tagline')}`;
  return `<img src="assets/brand/${stem}-560.png"` +
    ` srcset="assets/brand/${stem}-320.png 320w, assets/brand/${stem}-560.png 560w"` +
    ` sizes="${sizes}" width="560" height="229" style="height:${height}"` +
    ` alt="${esc(alt)}" decoding="async"${kind === 'reverse' ? ' loading="lazy"' : ''}>`;
}

/* ── section headers ─────────────────────────────────────────────────────── */

const head = (key, title, lede) =>
  `    <p class="eyebrow">${esc(EYEBROWS[key])}</p>\n` +
  `    <h2 class="display">${esc(title)}</h2>\n` +
  (lede ? `    <p>${esc(lede)}</p>` : '');

/* ── hero and the strip under it ─────────────────────────────────────────── */

const hero = `    <p class="hero-eyebrow">${esc(HERO.eyebrow)}</p>
    <h1 class="display hero-title">${esc(HERO.title)}</h1>
    <p class="hero-lede">${esc(HERO.lede)}</p>
    <div class="hero-act">${quoteBtn()}${callBtn(NAV.call, true)}${waBtn(true)}</div>`;

const strip = STRIP.map(([label, value]) =>
  `    <li><span class="strip-k">${esc(label)}</span><span class="strip-v">${esc(value)}</span></li>`
).join('\n');

/* ── the six services ────────────────────────────────────────────────────────
   Two of the six have no photograph, because Kingson supplied none of that
   work. They get a different card rather than a borrowed picture: the facts
   move up into the space the image would have taken.                        */

const facts = (rows) => rows.map(([k, v]) =>
  `          <div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('\n');

const services = CAPABILITIES.map((c) => {
  const a = c.photo ? ASSETS[c.photo] : null;
  const media = a
    ? `      <div class="svc-media">
        <img src="${src(c.photo, 720)}" srcset="${srcset(c.photo)}"
             sizes="(max-width:760px) 100vw, (max-width:1100px) 50vw, 33vw"
             width="${a.w}" height="${a.h}" loading="lazy" decoding="async"
             style="object-position:${position(c.photo)}" alt="${esc(a.alt)}">
      </div>\n`
    : `      <div class="svc-media svc-plate">
        <b>${esc(c.plate[0])}</b>
        <span>${esc(c.plate[1])}</span>
      </div>\n`;
  return `    <li class="svc-item${a ? '' : ' svc-plain'}" id="${c.id}">
${media}      <div class="svc-body">
        <h3>${esc(c.title)}</h3>
        <p class="svc-lede">${esc(c.body)}</p>
        <dl class="svc-facts">
${facts(c.facts)}
        </dl>
        <p class="svc-ask">${esc(c.ask)}</p>
      </div>
    </li>`;
}).join('\n');

/* ── the full-width photograph ───────────────────────────────────────────── */

const bandImg = ASSETS[BAND_IMAGE];
const band = `  <img class="band-img" src="${src(BAND_IMAGE, 1320)}" srcset="${srcset(BAND_IMAGE)}"
       sizes="100vw" width="${bandImg.w}" height="${bandImg.h}" loading="lazy" decoding="async"
       style="object-position:${position(BAND_IMAGE)}" alt="${esc(bandImg.alt)}">
  <div class="band-in">
    <h2 class="display" id="band-h">${esc(BAND.title)}</h2>
    <p>${esc(BAND.lede)}</p>
    <a class="band-link" href="#specs">${esc(BAND.link)}${ICON_ARROW}</a>
  </div>`;

/* ── specifications ──────────────────────────────────────────────────────────
   Native <details>, so every figure is reachable with JavaScript off and is
   in the DOM for anything that reads the page without running scripts.
   The first group starts open so the section is never a row of shut doors.   */

const specs = SPECS.groups.map((g, i) => `      <details class="spec-group" id="spec-${g.id}"${i === 0 ? ' open' : ''}>
        <summary><span>${esc(g.title)}</span></summary>
        <dl class="spec-rows">
${g.rows.map(([k, v]) => `          <div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('\n')}
        </dl>
      </details>`).join('\n');

/* ── work ────────────────────────────────────────────────────────────────── */

const work = GALLERY.map((k, i) => {
  const a = ASSETS[k];
  const wide = i === 0;
  return `    <li${wide ? ' class="work-wide"' : ''}><button type="button" data-open="${k}">
      <img src="${src(k, wide ? 1100 : 720)}" srcset="${srcset(k)}"
           sizes="${wide ? '(max-width:760px) 100vw, 66vw' : '(max-width:760px) 50vw, 33vw'}"
           width="${a.w}" height="${a.h}" loading="${i < 3 ? 'eager' : 'lazy'}" decoding="async"
           style="object-position:${position(k)}" alt="${esc(a.alt)}">
      <span class="work-cap">${esc(WORK.captions[k])}</span>
    </button></li>`;
}).join('\n');

/* ── how it works ────────────────────────────────────────────────────────── */

const steps = PROCESS.steps.map((st) => `      <li class="step">
        <span class="step-n">${esc(st.n)}</span>
        <div class="step-body">
          <h3>${esc(st.title)}</h3>
          <p>${esc(st.body)}</p>
        </div>
      </li>`).join('\n');

const procClose = `    <p>${esc(PROCESS.close)}</p>
    <a class="btn" href="#enquiry"><span>${esc(PROCESS.closeAction)}</span></a>`;

/* ── the enquiry form ────────────────────────────────────────────────────────
   The field set is what the office needs to price a job: who you are, which
   of the six services, where, what it is, and whether drawings exist.

   There is no file input. Files cannot be uploaded from a static page, and a
   picker that only lists filenames reads like an upload to the person using
   it. The note says which formats to attach to the message this page hands
   to WhatsApp or to mail instead.                                           */

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

const select = (id, key, options) => `        <div class="field">
${label(id, key)}
          <div class="select">
            <select id="f-${id}" name="${id}">
              <option value="">${esc(ENQUIRY.choose)}</option>
${options.map((o) => `              <option>${esc(o)}</option>`).join('\n')}
            </select>
          </div>
${err(id)}
        </div>`;

const form = `      <div class="field-row">
${text('name', 'name', ' autocomplete="name"')}
${text('company', 'company', ' autocomplete="organization"')}
      </div>
      <div class="field-row">
${text('contact', 'contact', ' autocomplete="tel"')}
${select('service', 'service', ENQUIRY.serviceOptions)}
      </div>
${text('location', 'location')}
${area('description', 'description', 5)}
${select('drawings', 'drawings', ENQUIRY.drawingOptions)}`;

/* ── questions ───────────────────────────────────────────────────────────── */

const faq = FAQ.items.map((it, i) => `      <details class="faq-item" id="faq-${i + 1}">
        <summary><span>${esc(it.q)}</span></summary>
        <p>${esc(it.a)}</p>
      </details>`).join('\n');

/* ── contact ─────────────────────────────────────────────────────────────────
   Ordered by how a customer actually reaches Kingson, and built by asking for
   each value: an unverified one produces no row at all.                     */

const CT_ORDER = ['phone', 'whatsapp', 'office', 'contactPerson',
  'email', 'emailTechnical', 'address', 'hours'];

const contact = CT_ORDER.map((k) => [k, publish(k)]).filter(([, v]) => v).map(([k, v]) => {
  const inner =
    k === 'phone' || k === 'office' ? `<a href="${tel(v)}">${esc(v)}</a>` :
    k === 'whatsapp' ? `<a href="${wa()}" target="_blank" rel="noopener">${esc(publish('phone') || v)}</a>` :
    k === 'email' || k === 'emailTechnical' ? `<a href="mailto:${esc(v)}">${esc(v)}</a>` :
    esc(v);
  return `    <li><dl><dt>${esc(CONTACT.labels[k])}</dt><dd>${inner}</dd></dl></li>`;
}).join('\n');

const foot = [
  publish('legalName'),
  publish('address'),
  publish('facebook')
    ? `<a href="${esc(publish('facebook'))}" target="_blank" rel="noopener">Facebook</a>`
    : null
].filter(Boolean).map((v) => `      <span>${v}</span>`).join('\n');

/* ── structured data ─────────────────────────────────────────────────────────
   One @graph: the business, the six services it confirmed, and the questions
   with their answers. Every value comes through publish(), so an unverified
   one is absent from the graph rather than guessed into it.                  */

const hoursSpec = publish('hoursSpec');
const BIZ = SITE + '#business';

const graph = [
  {
    '@type': 'LocalBusiness', '@id': BIZ,
    name: publish('name'),
    ...(publish('legalName') ? { legalName: publish('legalName') } : {}),
    ...(publish('tagline') ? { slogan: publish('tagline') } : {}),
    description: HERO.lede,
    url: SITE,
    image: SITE + src('portalFrame'),
    logo: SITE + 'assets/brand/kingson-logo-560.png',
    ...(publish('phone') ? { telephone: publish('phone') } : {}),
    ...(publish('email') ? { email: publish('email') } : {}),
    ...(publish('address') ? {
      address: {
        '@type': 'PostalAddress',
        streetAddress: publish('address').replace(/,\s*Harare$/, ''),
        addressLocality: 'Harare', addressCountry: 'ZW'
      }
    } : {}),
    ...(hoursSpec ? {
      openingHoursSpecification: [{
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: hoursSpec.days, opens: hoursSpec.opens, closes: hoursSpec.closes
      }]
    } : {}),
    ...(publish('contactPerson') ? {
      contactPoint: {
        '@type': 'ContactPoint', contactType: 'sales',
        name: publish('contactPerson'),
        ...(publish('phone') ? { telephone: publish('phone') } : {}),
        ...(publish('email') ? { email: publish('email') } : {}),
        availableLanguage: 'en'
      }
    } : {}),
    areaServed: { '@type': 'Country', name: 'Zimbabwe' },
    ...(publish('facebook') ? { sameAs: [publish('facebook')] } : {})
  },
  ...CAPABILITIES.map((c) => ({
    '@type': 'Service', '@id': `${SITE}#${c.id}`,
    name: c.title, serviceType: c.title, description: c.body,
    provider: { '@id': BIZ },
    areaServed: { '@type': 'Country', name: 'Zimbabwe' },
    additionalProperty: c.facts.map(([k, v]) => ({
      '@type': 'PropertyValue', name: k, value: v
    }))
  })),
  {
    '@type': 'FAQPage', '@id': SITE + '#faq',
    mainEntity: FAQ.items.map((it) => ({
      '@type': 'Question', name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a }
    }))
  }
];

const ld = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2);

/* ── navigation ──────────────────────────────────────────────────────────── */

const LINKS = [['#services', NAV.services], ['#specs', NAV.specs],
  ['#work', NAV.work], ['#contact', NAV.contact]];

const hdnav = LINKS.map(([h, t]) => `      <a href="${h}">${esc(t)}</a>`).join('\n');
const menunav = [...LINKS.slice(0, 3), ['#how', 'How it works'], ['#faq', 'Questions'],
  ['#enquiry', NAV.quote], ['#contact', NAV.contact]]
  .map(([h, t]) => `    <a href="${h}">${esc(t)}</a>`).join('\n');

/* ── splice into the file between markers ───────────────────────────────── */

const BLOCKS = {
  ld, hdnav, menunav, hero, strip, services, band, specs, work, steps,
  procClose, form, faq, contact, foot,
  logo:      logo('light', '46px', '(max-width:760px) 116px, 134px'),
  menulogo:  logo('light', '40px', '116px'),
  footlogo:  logo('reverse', '52px', '(max-width:760px) 132px, 152px'),
  headact:   callBtn(NAV.call, true) + quoteBtn(),
  baract:    callBtn(NAV.call, true) + quoteBtn(),
  menuact:   quoteBtn() + callBtn(publish('phone') || NAV.call, true) + waBtn(true),
  svchead:   head('services', 'What we make.', 'Six things, in our own workshop and on site.'),
  specshead: head('specs', SPECS.title, SPECS.lede),
  workhead:  head('work', WORK.title, WORK.lede),
  prochead:  head('process', PROCESS.title, PROCESS.lede),
  enqhead:   head('enquiry', ENQUIRY.title, ENQUIRY.lede),
  faqhead:   head('faq', FAQ.title, null),
  cthead:    head('contact', CONTACT.title, CONTACT.lede),
  review:     esc(ENQUIRY.actions.review),
  filesnote:  esc(ENQUIRY.filesNote),
  drafttitle: esc(ENQUIRY.draftTitle)
};

const before = readFileSync(file, 'utf8');
/* ── the sitemap ─────────────────────────────────────────────────────────────
   Generated from the same asset map the page renders from, so the image list
   cannot drift out of step with the photographs actually published. Titles are
   the gallery captions; a sitemap submitted to a search engine is a published
   claim like any other, so nothing appears here that is not on the page.

   `lastmod` comes from copy.js — see UPDATED there for why it is not taken
   from `git log`.                                                            */

const sitemapImages = [BAND_IMAGE, ...GALLERY].map((k) =>
  `    <image:image>
      <image:loc>${SITE}${src(k)}</image:loc>
      <image:title>${esc(WORK.captions[k])}</image:title>
    </image:image>`).join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<!--
  One live URL: the site is a single page.

  GENERATED by tools/render.js from content/assets.js and content/copy.js.
  Do not edit by hand — run \`node tools/render.js\` instead.

  Every image below is a photograph Kingson supplied, and each title is the
  caption printed beside it on the page. No client, project name, city or
  capacity appears here that is not already published and confirmed.
-->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${SITE}</loc>
    <lastmod>${UPDATED}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>

${sitemapImages}
  </url>
</urlset>
`;

let html = before;
for (const [name, value] of Object.entries(BLOCKS)) {
  const re = new RegExp(`(<!--${name}-->)[\\s\\S]*?(<!--/${name}-->)`, 'g');
  if (!re.test(html)) { console.error(`missing marker: ${name}`); process.exit(2); }
  html = html.replace(re, `$1\n${value}\n$2`);
}

const smFile = root + 'sitemap.xml';
const smBefore = readFileSync(smFile, 'utf8');

if (process.argv.includes('--check')) {
  const stale = [html !== before && 'index.html', sitemap !== smBefore && 'sitemap.xml']
    .filter(Boolean);
  if (stale.length) {
    console.error(`${stale.join(' and ')} out of date — run: node tools/render.js`);
    process.exit(1);
  }
  console.log('index.html and sitemap.xml match the content layer.');
} else {
  writeFileSync(file, html);
  writeFileSync(smFile, sitemap);
  console.log(`index.html rendered from content/ — ${Object.keys(BLOCKS).length} regions, ` +
    `${CAPABILITIES.length} services, ${SPECS.groups.reduce((n, g) => n + g.rows.length, 0)} ` +
    `specification rows, ${GALLERY.length} photographs, ${FAQ.items.length} questions.`);
  console.log(`sitemap.xml rendered — 1 URL, ${GALLERY.length + 1} images.`);
}
