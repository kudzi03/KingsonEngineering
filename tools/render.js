#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   tools/render.js — write the page's content into index.html
   ═══════════════════════════════════════════════════════════════════════════

   The copy, the photographs and every business value have one home each:
   content/copy.js, content/assets.js, content/company.js. Rendering them in
   the browser would mean a page whose text does not exist until JavaScript
   runs — fine for Google, useless for the answer engines this site is meant to
   be found by, and empty for anyone with JavaScript off.

   So the content is written INTO index.html here, and committed. There is
   still no build step to serve the site: this runs when the content changes,
   and its output is a plain static file.

     node tools/render.js          rewrite index.html
     node tools/render.js --check  fail if index.html is out of date

   Every business value is asked for by status, so a value that is not cleared
   for publication cannot reach the file. tools/check-truth.js then asserts
   that over the rendered output.
   ═══════════════════════════════════════════════════════════════════════════ */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { HERO, CAPABILITIES, PROCESS, WORK, ENQUIRY, CONTACT, NAV, EYEBROWS } from '../content/copy.js';
import { ASSETS, src, srcset } from '../content/assets.js';
import { publish, context } from '../content/company.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const file = root + 'index.html';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const tel = (v) => 'tel:' + v.replace(/[^\d+]/g, '');
const wa = () => publish('whatsapp') ? `https://wa.me/${publish('whatsapp')}` : null;

const ICON_PHONE = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.6 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.8.6a2 2 0 0 1 1.7 2z"/></svg>';
const ICON_WA = '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.7 15L2 22l5.2-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.4-.7-1.7-.8s-.4-.1-.5.1-.6.8-.7 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.6-1.3.1-.2 0-.3 0-.5s-.5-1.3-.7-1.7-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.1.6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .1-1.2z"/></svg>';

/* ── action buttons ─────────────────────────────────────────────────────── */

function callBtn(label, ghost) {
  const p = publish('phone'); if (!p) return '';
  return `<a class="${ghost ? 'btn-ghost' : 'btn'}" href="${tel(p)}">${ICON_PHONE}<span>${esc(label || NAV.call + ' ' + p)}</span></a>`;
}
function waBtn(ghost) {
  const h = wa(); if (!h) return '';
  return `<a class="${ghost ? 'btn-ghost' : 'btn'}" href="${h}" target="_blank" rel="noopener">${ICON_WA}<span>${esc(NAV.whatsapp)}</span></a>`;
}
function enqBtn(ghost) {
  return `<a class="${ghost ? 'btn-ghost' : 'btn'}" href="#enquiry"><span>${esc(NAV.enquire)}</span></a>`;
}

/* ── blocks ─────────────────────────────────────────────────────────────── */

const city = publish('address') ? publish('address').split(',').pop().trim() + ', ' : '';

/* A centred section header: dot eyebrow, heading, one line of lede. */
const head = (key, title, lede) =>
  `    <p class="eyebrow">${esc(EYEBROWS[key])}</p>\n` +
  `    <h2 class="display">${esc(title)}</h2>\n` +
  (lede ? `    <p>${esc(lede)}</p>` : '');

const steps = PROCESS.steps.map((st) => `    <li class="step">
      <span class="step-n">${esc(st.n)}</span>
      <h3>${esc(st.title)}</h3>
      <p>${esc(st.body)}</p>
    </li>`).join('\n');

const hero = `    <p class="hero-eyebrow">${esc(HERO.eyebrow)} · ${esc(city)}Zimbabwe</p>
    <h1 class="display hero-title">${esc(HERO.title)}</h1>
    <p class="hero-lede">${esc(HERO.lede)}</p>
    <div class="hero-act">${enqBtn()}${callBtn(NAV.call, true)}${waBtn(true)}</div>`;

const services = CAPABILITIES.map((c) => {
  const a = ASSETS[c.asset];
  return `    <li class="svc-item" id="${c.id}">
      <img src="${src(c.asset, 1100)}" srcset="${srcset(c.asset)}" sizes="(max-width:900px) 100vw, 50vw"
           width="${a.w}" height="${a.h}" loading="lazy" decoding="async" alt="${esc(a.alt)}">
      <div class="svc-body">
        <h3>${esc(c.title)}</h3>
        <p>${esc(c.body)}</p>
        <p class="svc-ask">${esc(c.ask)}</p>
      </div>
    </li>`;
}).join('\n');

const GALLERY = ['portalFrame', 'roofTrusses', 'roofFrame', 'cuttingHead', 'laserMachine', 'crane'];
const work = GALLERY.map((k, i) => {
  const a = ASSETS[k];
  return `    <li><button type="button" data-open="${k}">
      <img src="${src(k, 1100)}" srcset="${srcset(k)}" sizes="(max-width:900px) 50vw, 33vw"
           width="${a.w}" height="${a.h}" loading="${i < 2 ? 'eager' : 'lazy'}" decoding="async" alt="${esc(a.alt)}">
      <span class="work-cap">${esc(WORK.captions[k])}</span>
    </button></li>`;
}).join('\n');

const CT_ORDER = ['phone', 'whatsapp', 'office', 'email', 'address', 'hours'];
const contact = CT_ORDER.map((k) => [k, publish(k)]).filter(([, v]) => v).map(([k, v]) => {
  const inner =
    k === 'phone' || k === 'office' ? `<a href="${tel(v)}">${esc(v)}</a>` :
    k === 'email' ? `<a href="mailto:${esc(v)}">${esc(v)}</a>` :
    k === 'whatsapp' ? `<a href="${wa()}" target="_blank" rel="noopener">${esc(publish('phone') || v)}</a>` :
    esc(v);
  return `    <li><dl><dt>${esc(CONTACT.labels[k])}</dt><dd>${inner}</dd></dl></li>`;
}).join('\n');

const foot = [publish('legalName') || context('name'), publish('address'),
  publish('facebook') ? `<a href="${esc(publish('facebook'))}" target="_blank" rel="noopener">Facebook</a>` : null]
  .filter(Boolean).map((v) => `<span>${v}</span>`).join('');

const ld = JSON.stringify({
  '@context': 'https://schema.org', '@type': 'LocalBusiness',
  name: context('name'),
  ...(publish('legalName') ? { legalName: publish('legalName') } : {}),
  description: HERO.lede,
  image: 'https://kingson-engineering.vercel.app/assets/img/portal-frame-1320.webp',
  url: 'https://kingson-engineering.vercel.app/',
  ...(publish('phone') ? { telephone: publish('phone') } : {}),
  ...(publish('email') ? { email: publish('email') } : {}),
  ...(publish('address') ? { address: { '@type': 'PostalAddress',
      streetAddress: publish('address'), addressCountry: 'ZW' } } : {}),
  ...(publish('facebook') ? { sameAs: [publish('facebook')] } : {})
}, null, 2);

/* ── the form, whose labels are copy too ────────────────────────────────── */

const field = (id, key, type = 'text', extra = '') => `        <div class="field">
          <label for="f-${id}">${esc(ENQUIRY.fields[key])}</label>
          ${type === 'textarea'
            ? `<textarea id="f-${id}" name="${id}" rows="4"${extra}></textarea>`
            : `<input id="f-${id}" name="${id}" type="text"${extra}>`}
          <span class="field-error" data-error-for="f-${id}" hidden></span>
        </div>`;
const ph = (k) => ENQUIRY.placeholders[k] ? ` placeholder="${esc(ENQUIRY.placeholders[k])}"` : '';

const form = `      <div class="field-row">
${field('name', 'name', 'text', ' autocomplete="name"')}
${field('contact', 'contact', 'text', ' autocomplete="tel"')}
      </div>
${field('scope', 'scope', 'text', ph('scope'))}
${field('description', 'description', 'textarea', ph('description'))}
      <button type="button" class="disclosure" data-disclosure aria-expanded="false" aria-controls="more">${esc(ENQUIRY.more)}</button>
      <div class="field-row" id="more" data-more hidden>
${field('location', 'location')}
${field('timing', 'timing')}
      </div>`;

/* ── splice into the file between markers ───────────────────────────────── */

const BLOCKS = {
  hero, services, work, contact, form,
  headact: callBtn(NAV.call, true) + enqBtn(),
  baract: callBtn(NAV.call, true) + waBtn(true),
  menuact: enqBtn() + callBtn(NAV.call + ' ' + publish('phone'), true) + waBtn(true),
  foot, ld, steps,
  svchead:  head('services', 'What we make', 'Four things, done in our own workshop and on site.'),
  prochead: head('process', PROCESS.title, PROCESS.lede),
  workhead: head('work', WORK.title, WORK.lede),
  enqhead:  head('enquiry', ENQUIRY.title, ENQUIRY.lede),
  cthead:   head('contact', CONTACT.title, CONTACT.lede),
  review: esc(ENQUIRY.actions.review),
  fileslabel: esc(ENQUIRY.files.label),
  fileschoose: esc(ENQUIRY.files.choose),
  filesnote: esc(ENQUIRY.files.note),
  drafttitle: esc(ENQUIRY.draftTitle)
};

let html = readFileSync(file, 'utf8');
for (const [name, value] of Object.entries(BLOCKS)) {
  const re = new RegExp(`(<!--${name}-->)[\\s\\S]*?(<!--/${name}-->)`, 'g');
  if (!re.test(html)) { console.error(`missing marker: ${name}`); process.exit(2); }
  html = html.replace(re, `$1\n${value}\n$2`);
}

if (process.argv.includes('--check')) {
  if (html !== readFileSync(file, 'utf8')) {
    console.error('index.html is out of date — run: node tools/render.js');
    process.exit(1);
  }
  console.log('index.html matches the content layer.');
} else {
  writeFileSync(file, html);
  console.log('index.html rendered from content/.');
}
