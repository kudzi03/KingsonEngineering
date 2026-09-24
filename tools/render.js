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
  UPDATED, EYEBROWS, HERO, STRIP, CAPABILITIES, SPECS, PROCESS,
  WORK, ENQUIRY, FAQ, CONTACT, NAV, SERVICES_BLOCK, homeFaq
} from '../content/copy.js';
import { ASSETS, PAGE_IMAGES, BAND_IMAGE, src, srcset, position } from '../content/assets.js';
import { CHAPTERS, WORKSHOP, coverage } from '../content/chapters.js';
import { section, flashings } from '../scenes/profiles.js';
import { publish } from '../content/company.js';
import { SERVICES } from '../content/services.js';
import { portfolioRoutes, PORTFOLIO } from './portfolio.js';
import { hasProjects, publishable as publishableProjects, problems as projectProblems } from '../content/projects.js';
import { pageGraph, serviceId } from './schema.js';
import { allServicePages, notFoundPage } from './pages.js';
import {
  SITE, esc, tel, wa, headHtml, chromeTop, chromeBottom, siteFooter,
  enquiryForm, callBtn, waBtn, quoteBtn, logo, bleedPhoto, serviceChooser,
  ICON_PHONE, ICON_WA, ICON_EXPAND, ICON_ARROW, bindFigures, privacyNote
} from './layout.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const file = root + 'index.html';

/* ── section headers ─────────────────────────────────────────────────────── */

/* The heading rises from behind its datum, the same way every chapter title
   above it does. Without this the page speaks in one voice down to the
   workshop and then goes silent for the second half — specifications,
   process, enquiry, questions and contact, which is precisely where a reader
   is being asked to commit. `rise` needs a single wrapped child; see
   scenes/reveal.js. */
/* `id` is not decoration: the section wrapping this block names the h2 in
   aria-labelledby, so a screen reader announces the region by its heading
   rather than as an unnamed group. A dangling reference is announced as
   nothing at all, which is worse than having left the attribute off. */
const head = (key, title, lede, id) =>
  `    <p class="eyebrow">${esc(EYEBROWS[key])}</p>\n` +
  `    <h2 class="display"${id ? ` id="${id}"` : ''} data-reveal="rise"><span>${esc(title)}</span></h2>\n` +
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

/* ── the capability chapters ──────────────────────────────────────────────────
   Five compositions, not five cards. Each one decides its own ground, its own
   media and whether it has earned a large figure. The markup differs by
   `media.kind` because a full-bleed photograph, a pair of drawn sections and
   a strip of vertical plates are genuinely different objects — forcing them
   through one template is what produced the card grid this replaces.       */

/* Every confirmed service must reach the page, and every service must have a
   page of its own to reach. The chooser is what guarantees the first now that
   there is one chapter rather than five, so the check moved onto it — and
   gained a second half, because a tile that links to a route which does not
   exist is a 404 on the most-clicked element on the page.

   A chapter may no longer claim a service that is not confirmed, either. */
{
  const titles = CAPABILITIES.map((c) => c.title);
  const routes = new Set(SERVICES.map((s) => s.slug));

  const unlisted = titles.filter((t) => !CAPABILITIES.some((c) => c.title === t));
  const routeless = CAPABILITIES.filter((c) => !c.route || !routes.has(c.route));
  const leadless = CAPABILITIES.filter((c) => !Array.isArray(c.lead) || c.lead.length !== 2);
  const invented = coverage().filter((t) => !titles.includes(t));

  const problems = [
    unlisted.length  && `services missing from the chooser: ${unlisted.join(', ')}`,
    routeless.length && `chooser tiles pointing at no page: ${routeless.map((c) => c.id).join(', ')}`,
    leadless.length  && `chooser tiles with no headline figure: ${leadless.map((c) => c.id).join(', ')}`,
    invented.length  && `a chapter claims a service that is not confirmed: ${invented.join(', ')}`
  ].filter(Boolean);

  problems.push(...projectProblems());

  if (problems.length) {
    problems.forEach((m) => console.error(m));
    process.exit(2);
  }
}

const photo = (key, { sizes, w, cls = '', eager = false }) => {
  const a = ASSETS[key];
  return `<img${cls ? ` class="${cls}"` : ''} src="${src(key, w)}" srcset="${srcset(key)}"
             sizes="${sizes}" width="${a.w}" height="${a.h}"
             ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"
             style="object-position:${position(key)}" alt="${esc(a.alt)}">`;
};

/* Wraps a photograph in the control that opens it full size. Every photograph
   the page shows is croppped to its composition, so the uncropped frame has to
   stay reachable from wherever it appears — not only from a gallery. */
const zoomable = (key, inner) =>
  `<button type="button" class="zoom" data-open="${key}"
              aria-label="${esc(ASSETS[key].alt)} Select to view full size.">${inner}<span class="zoom-cue" aria-hidden="true">${ICON_EXPAND}</span></button>`;

const figures = (rows, cls = 'ch-figures') => `      <dl class="${cls}">
${rows.map(([k, v]) => `        <div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('\n')}
      </dl>`;

/* The large figure. Split so the unit can be set smaller than the number
   without the markup having to know which is which. */
function heroFigure(h) {
  if (!h) return '';
  const m = h.value.match(/^(\S+)\s*(.*)$/);
  return `      <p class="ch-big" data-reveal="rise"><span>${esc(m[1])}${m[2] ? ` <b>${esc(m[2])}</b>` : ''}</span></p>
      <p class="ch-big-label">${esc(h.label)}</p>`;
}

/* The chapter body in two halves, so a composition can put them in one
   column or in two without the copy being written twice. */
/* No number. There is one chapter, so there is nothing to be third of, and the
   only numbered sequence left on the page is the five commitments. The rule
   that used to sit beside the numeral stays — it is what separates the
   chapter's label from the heading under it. */
const chapterLead = (c) =>
  `      <p class="ch-mark"><span class="ch-name">${esc(c.name)}</span></p>
      <h2 class="display ch-title" data-reveal="rise"><span>${esc(c.title)}</span></h2>
      <p class="ch-lede">${esc(c.body)}</p>`;

/* The chapter ends by pointing at the page for that one service. It is the
   site's principal internal link, and it is the natural next step for someone
   who has just decided this is the thing they need. */
const chapterData = (c, { hero = true } = {}) =>
  `${hero ? heroFigure(c.hero) : ''}
${figures(c.figures)}
      <p class="ch-ask">${esc(c.ask)}</p>
      <p class="ch-more"><a href="/${c.route}">${esc(c.moreLabel || `More on ${c.name.toLowerCase()}`)}${ICON_ARROW}</a></p>`;

const chapterBody = (c) => `${chapterLead(c)}\n${chapterData(c)}`;

/* Section modifier per media kind. Deliberately NOT `ch-${media.kind}`: the
   strip chapter contains a `<ul class="ch-strip">`, and a section that shared
   that class made every `.ch-strip span` rule capture the chapter's own
   headings. Distinct names for container and content. */
const SECTION_CLASS = {
  bleed: 'ch-bleed', sections: 'ch-sections', strip: 'ch-cut',
  folds: 'ch-folds', plate: 'ch-plate'
};

/* The four dark-to-light handovers, alternating direction. Named here rather
   than in the stylesheet so the sequence is visible in one place. */
const SCENE_CUT = { cut: ' scene-cut-r', lift: ' scene-cut-l' };

function chapter(c) {
  const g = (c.ground === 'dark' ? ' ch-dark on-dark' : ' ch-light') + (SCENE_CUT[c.id] || '');
  const head = `  <section class="ch ${SECTION_CLASS[c.media.kind]}${g}" id="${c.id}" aria-labelledby="ch-${c.id}-h">`;

  if (c.media.kind === 'bleed') {
    const k = c.media.photos[0];
    return `${head}
    <div class="ch-bleed-img" data-parallax data-reveal="settle">
      ${zoomable(k, bleedPhoto(k))}
    </div>
    <div class="wrap ch-over">
      <div class="ch-copy" id="ch-${c.id}-h">
${chapterBody(c)}
      </div>
    </div>
  </section>`;
  }

  if (c.media.kind === 'sections') {
    const k = c.media.photos[0];
    return `${head}
    <div class="wrap ch-split">
      <div class="ch-copy" id="ch-${c.id}-h">
${chapterBody(c)}
      </div>
      <div class="ch-draw">
        <figure class="pf-fig" data-reveal="draw">
          <figcaption>IBR</figcaption>
          ${section('ibr')}
        </figure>
        <figure class="pf-fig" data-reveal="draw">
          <figcaption>Corrugated</figcaption>
          ${section('corrugated')}
        </figure>
        <p class="pf-note">Both sections drawn to the same scale, from the cover widths and rib heights below.</p>
        <div class="ch-aside" data-reveal="plate" data-from="below">
          ${zoomable(k, photo(k, { sizes: '(max-width:900px) 100vw, 46vw', w: 1100 }))}
        </div>
      </div>
    </div>
  </section>`;
  }

  if (c.media.kind === 'strip') {
    /* Four portrait photographs at full height. A 3:4 source hard-cropped to a
       16:9 band shows 41% of its frame and reads as a mistake; stood upright
       side by side, the whole frame is used and the row reads as a machine
       bed. */
    /* All four wipe upward, staggered by position, so the row reads as one
       movement rather than four unrelated ones. */
    const plates = c.media.photos.map((k, i) => `        <li data-reveal="plate" data-from="below" style="--d:${i * 110}ms">
          ${zoomable(k, photo(k, { sizes: '(max-width:640px) 70vw, (max-width:900px) 48vw, 24vw', w: 720 })
            + `<span>${esc(WORK.captions[k])}</span>`)}
        </li>`).join('\n');
    /* The establishing frame, with the tolerance set across it. The figure
       lives here rather than in the data column for two reasons: the column
       put it on flat black beside nothing, and a tolerance belongs to the
       machine that holds it, so it should be written on that machine.

       The scrim is a left-to-right wash, not a flat overlay: the type needs a
       solid field, and the right of the frame — the DXTECH badge, the nozzle,
       the sparks coming off the plate — is the part nothing should be laid
       over. Tuned against the pixels actually behind the glyphs. */
    const scene = c.media.scene ? `
    <div class="cut-scene" data-reveal="settle">
      <div class="cut-scene-img" data-parallax>
        ${zoomable(c.media.scene, bleedPhoto(c.media.scene))}
      </div>
      <div class="wrap cut-tol">
${heroFigure(c.hero)}
      </div>
    </div>` : '';

    return `${head}${scene}
    <div class="wrap ch-cut-head">
      <div class="ch-copy" id="ch-${c.id}-h">
${chapterLead(c)}
      </div>
      <div class="ch-cut-data">
${chapterData(c, { hero: !c.media.scene })}
      </div>
    </div>
    <ul class="ch-strip" tabindex="0" role="group"
        aria-label="Photographs of the fiber laser. On a narrow screen this row scrolls sideways.">
${plates}
    </ul>
  </section>`;
  }

  if (c.media.kind === 'folds') {
    return `${head}
    <div class="wrap ch-split">
      <div class="ch-copy" id="ch-${c.id}-h">
${chapterBody(c)}
      </div>
      <div class="ch-draw">
        <div class="pf-folds" data-reveal="draw">
          ${flashings()}
        </div>
        <p class="pf-note">The three standard flashings, in section. Custom folds to 3 000 mm in the same material range.</p>
      </div>
    </div>
  </section>`;
  }

  /* plate — one portrait photograph at full height beside the big figure */
  const k = c.media.photos[0];
  return `${head}
    <div class="wrap ch-split ch-split-wide">
      <div class="ch-copy" id="ch-${c.id}-h">
${chapterBody(c)}
      </div>
      <div class="ch-tall" data-reveal="swing">
        ${zoomable(k, photo(k, { sizes: '(max-width:900px) 100vw, 40vw', w: 1100 }))}
      </div>
    </div>
  </section>`;
}

const chooser = serviceChooser();

const chapters = CHAPTERS.map(chapter).join('\n\n');

/* ── the workshop ───────────────────────────────────────────────────────────── */

const workshop = `    <div class="ws-img" data-parallax data-reveal="settle">
      ${zoomable(WORKSHOP.photo, photo(WORKSHOP.photo, { sizes: '(max-width:900px) 100vw, 52vw', w: 1100 }))}
    </div>
    <div class="ws-copy">
      <p class="eyebrow">${esc(WORKSHOP.eyebrow)}</p>
      <p class="ws-place" data-reveal="rise"><span>${esc(WORKSHOP.place)}<b>${esc(WORKSHOP.city)}</b></span></p>
      <h2 class="display" id="ws-h">${esc(WORKSHOP.title)}</h2>
      <p class="ws-lede">${esc(WORKSHOP.body)}</p>
${figures(WORKSHOP.figures, 'ch-figures ws-figures')}
      <div class="ws-act">${quoteBtn()}</div>
    </div>`;

/* ── the full-width photograph ───────────────────────────────────────────── */

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

/* ── how it works ────────────────────────────────────────────────────────── */

/* The programme chart (home page, desktop). A construction programme is issued
   as a bar chart, so the commitments are drawn as one: one row per step, a
   numbered balloon, and a broken axis — the first working week in days, a
   break line for the customer's own decision to order, then weeks from order
   with the six-to-ten-week range hatched. All positions come from PROCESS, so
   the bars cannot disagree with the words beside them. Decorative: each row's
   text is the content, the bar is aria-hidden. */
const AX = PROCESS.axis;
const WEEK_END = 36, ORDER_START = 44;                 // % of the chart column
const wx = (d) => +(d / 6 * WEEK_END).toFixed(2);      // Mon–Sat working week
const ox = (w) => +(ORDER_START + w / 10 * (100 - ORDER_START)).toFixed(2);
const tick = (x, label, end) => `<span class="g-tick${end ? ' g-tick-end' : ''}" style="--x:${x}%">${esc(label)}</span>`;
const gantt = `      <div class="g-axis" aria-hidden="true">
        <span class="g-zone" style="--x0:0%;--x1:${WEEK_END}%">${esc(AX.week)}</span>
        <span class="g-zone" style="--x0:${ORDER_START}%;--x1:100%">${esc(AX.order)}</span>
        ${AX.weekTicks.map(([d, l], i, all) => tick(wx(d), l, i === all.length - 1)).join('')}
        ${AX.orderTicks.map(([w, l], i, all) => tick(ox(w), l, i === all.length - 1)).join('')}
      </div>
      <div class="g-lines" aria-hidden="true">${[...AX.weekTicks.map(([d]) => wx(d)), ...AX.orderTicks.map(([w]) => ox(w))]
        .map((x) => `<i style="--x:${x}%"></i>`).join('')}<span class="g-gap" style="--x0:${WEEK_END}%;--x1:${ORDER_START}%"></span><span class="g-gap-label" style="--x0:${WEEK_END}%;--x1:${ORDER_START}%">${esc(AX.gap)}</span></div>`;

const bar = (st) => {
  if (!st.bar) return '';
  if ('week' in st.bar) {
    return st.bar.week === 0
      ? `
        <span class="g-bar" aria-hidden="true"><span class="g-ms" style="--x0:0%"></span></span>`
      : `
        <span class="g-bar" aria-hidden="true"><span class="g-fill" style="--x0:0%;--x1:${wx(st.bar.week)}%"></span></span>`;
  }
  const [lo, hi] = st.bar.order;
  return `
        <span class="g-bar" aria-hidden="true"><span class="g-fill" style="--x0:${ox(0)}%;--x1:${ox(lo)}%"></span><span class="g-fill g-range" style="--x0:${ox(lo)}%;--x1:${ox(hi)}%"></span></span>`;
};

const steps = PROCESS.steps.map((st) => `      <li class="step">
        <span class="step-n">${esc(st.n)}</span>
        <div class="step-body">
          <h3>${esc(st.title)}</h3>
          <p>${esc(st.body)}</p>
        </div>${bar(st)}
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

/* The markup is enquiryForm() in tools/layout.js, the same function the five
   service routes call. It used to be copied out here as well, and the copy is
   exactly how the home page came to be missing a field the service pages had.
   One definition, six pages. */

const form = enquiryForm(null);

/* ── questions ───────────────────────────────────────────────────────────── */

const faq = homeFaq().map((it, i) => `      <details class="faq-item" id="faq-${i + 1}">
        <summary><span>${esc(it.q)}</span></summary>
        <p>${esc(it.a)}</p>
      </details>`).join('\n');

/* Beside the questions: the one thing to do when the answer is not there.
   Same numbers as everywhere else, so nothing new is being claimed. */
const faqask = `    <p class="faq-ask-k">Not answered here?</p>
    <p class="faq-ask-t">Ask the workshop directly. Enquiries are acknowledged the same working day.</p>
    <div class="faq-ask-act">${callBtn(NAV.call, true)}${waBtn(true)}</div>`;

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
    /* The seven the page shows, not the seventeen that exist. A FAQPage that
       declares answers the page does not display is the structured-data
       version of lying about content. */
    mainEntity: homeFaq().map((it) => ({
      '@type': 'Question', name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a }
    }))
  }
];

const ld = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2);


/* ── the homepage's <head> ───────────────────────────────────────────────────
   Through the same function the service routes use, so a metadata change
   cannot reach five pages and miss the sixth. */

const HOME_TITLE = 'Steel Fabrication, Roofing & Cranage in Harare | Kingson';
const HOME_DESC = 'Steelwork specialists in Tynwald, Harare. Structural steel, roof trusses and sheeting, fiber laser cutting to \u00b1 0.1 mm, and a 25-tonne mobile crane.';

const homeHead = headHtml({
  home: true,
  title: HOME_TITLE,
  description: HOME_DESC,
  path: '/',
  ogImage: 'portalFrame',
  preload: 'portalFrame',
  ld: pageGraph({
    path: '/', name: HOME_TITLE, description: HOME_DESC,
    image: 'portalFrame', faq: homeFaq()
  })
});

/* ── splice into the file between markers ───────────────────────────────── */

const BLOCKS = {
  /* site furniture, generated once in tools/layout.js for every page */
  head: homeHead,
  chrometop: chromeTop({ home: true }),
  sitefooter: siteFooter(),
  chromebottom: chromeBottom(),

  /* the homepage's own composition */
  hero, strip, chapters, workshop, specs,
  steps, gantt, procClose, form, faq, faqask, contact,
  specshead: head('specs', SPECS.title, SPECS.lede),
  prochead:  head('process', PROCESS.title, PROCESS.lede),
  svchead:   head('services', SERVICES_BLOCK.title, SERVICES_BLOCK.lede, 'svc-h'),
  chooser,
  enqhead:   head('enquiry', ENQUIRY.title, ENQUIRY.lede),
  faqhead:   head('faq', FAQ.title, null),
  cthead:    head('contact', CONTACT.title, CONTACT.lede),
  review:     esc(ENQUIRY.actions.review),
  filesnote:  esc(ENQUIRY.filesNote),
  privacy:    privacyNote(),
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

/* Homepage images, from the same asset map the page renders from, so the list
   cannot drift out of step with the photographs actually published. */
const sitemapImages = [BAND_IMAGE, ...PAGE_IMAGES].filter(Boolean).map((k) =>
  `    <image:image>
      <image:loc>${SITE}/${src(k)}</image:loc>
      <image:title>${esc(WORK.captions[k])}</image:title>
    </image:image>`).join('\n');

/* /projects, with every photograph the portfolio carries. Empty string while
   the portfolio is empty, so the sitemap never declares a page that the build
   did not write. */
const sitemapProjects = hasProjects() ? `
  <url>
    <loc>${SITE}/${PORTFOLIO.slug}</loc>
    <lastmod>${UPDATED}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
${publishableProjects().flatMap((p) => [p.hero, ...(p.gallery || [])])
    .filter((k, i, all) => all.indexOf(k) === i && ASSETS[k])
    .map((k) => `    <image:image>
      <image:loc>${SITE}/${src(k)}</image:loc>
      <image:title>${esc(ASSETS[k].alt.slice(0, 90))}</image:title>
    </image:image>`).join('\n')}
  </url>` : '';

/* Each service route, with the photographs that route actually shows. */
const sitemapServices = SERVICES.map((sv) => {
  const imgs = [sv.hero, ...(sv.strip || []), ...(sv.aside ? [sv.aside] : [])]
    .filter((k, i, all) => all.indexOf(k) === i)
    .map((k) => `    <image:image>
      <image:loc>${SITE}/${src(k)}</image:loc>
      <image:title>${esc(WORK.captions[k] || ASSETS[k].alt.slice(0, 90))}</image:title>
    </image:image>`).join('\n');
  return `  <url>
    <loc>${SITE}/${sv.slug}</loc>
    <lastmod>${UPDATED}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>

${imgs}
  </url>`;
}).join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<!--
  GENERATED by tools/render.js. Do not edit by hand — run \`node tools/render.js\`.

  Every URL here is a real committed file, and every image is a photograph
  Kingson supplied, titled with the caption printed beside it on the page. A
  sitemap submitted to a search engine is a published claim like any other, so
  nothing appears here that is not already published and confirmed.

  \`lastmod\` comes from UPDATED in content/copy.js — see the note there for why
  it is not taken from \`git log\`.
-->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${SITE}/</loc>
    <lastmod>${UPDATED}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>

${sitemapImages}
  </url>
${sitemapServices}${sitemapProjects}
</urlset>
`;

let html = before;
for (const [name, value] of Object.entries(BLOCKS)) {
  const re = new RegExp(`(<!--${name}-->)[\\s\\S]*?(<!--/${name}-->)`, 'g');
  if (!re.test(html)) { console.error(`missing marker: ${name}`); process.exit(2); }
  html = html.replace(re, `$1\n${value}\n$2`);
}
html = bindFigures(html);

const smFile = root + 'sitemap.xml';
const smBefore = readFileSync(smFile, 'utf8');

/* The service routes are whole generated files — see tools/pages.js. Vercel
   serves `foo.html` at `/foo` (cleanUrls), so a flat file per route is all a
   clean URL needs; no rewrite table, no directory indirection. */
/* The service routes, plus /projects when the portfolio has anything in it.
   It has nothing today, so portfolioRoutes() returns [] and the file is not
   written — see content/projects.js.

   404.html is generated with them. It was the last hand-written page on the
   site and the only one without the shared chrome; a lost visitor was the one
   person who got a page that did not look like the site. It is not in the
   sitemap — that is built from SERVICES and the portfolio, not from this
   list — and it carries noindex. */
const routes = [...allServicePages(), ...portfolioRoutes(), notFoundPage()]
  .map((r) => ({ ...r, html: bindFigures(r.html) }));

const readIf = (f) => { try { return readFileSync(root + f, 'utf8'); } catch { return null; } };

if (process.argv.includes('--check')) {
  const stale = [
    html !== before && 'index.html',
    sitemap !== smBefore && 'sitemap.xml',
    ...routes.filter((r) => readIf(r.file) !== r.html).map((r) => r.file)
  ].filter(Boolean);
  if (stale.length) {
    console.error(`out of date — run: node tools/render.js\n  ${stale.join('\n  ')}`);
    process.exit(1);
  }
  console.log(`index.html, sitemap.xml and ${routes.length} service routes match the content layer.`);
} else {
  writeFileSync(file, html);
  writeFileSync(smFile, sitemap);
  for (const r of routes) writeFileSync(root + r.file, r.html);
  console.log(`index.html rendered from content/ — ${Object.keys(BLOCKS).length} regions, ` +
    `${CHAPTERS.length} chapters covering ${CAPABILITIES.length} services, ` +
    `${SPECS.groups.reduce((n, g) => n + g.rows.length, 0)} specification rows, ` +
    `${PAGE_IMAGES.length + 1} photographs, ${FAQ.items.length} questions.`);
  console.log(`${routes.length} routes rendered:`);
  for (const r of routes) console.log(`  /${r.file.replace(/\.html$/, '')}`);
  console.log(`sitemap.xml rendered — ${(sitemap.match(/<loc>/g) || []).length} URLs.`);
}
