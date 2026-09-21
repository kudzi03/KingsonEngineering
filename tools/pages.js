/* ═══════════════════════════════════════════════════════════════════════════
   tools/pages.js — the service routes, written as whole files
   ═══════════════════════════════════════════════════════════════════════════

   The homepage is spliced into a hand-authored skeleton because its
   composition is bespoke. These are generated end to end from one template,
   because five pages maintained by hand drift within a week.

   A service page is not a slice of the homepage. It answers a different
   question — "can you do MY job, and what do you need from me" — so it leads
   with the confirmed capability for that one service, states plainly what to
   send, shows the full specification transcript for the groups that apply,
   and carries its own enquiry form with that service already selected.
   ═══════════════════════════════════════════════════════════════════════════ */

import { PROCESS, processFor, SPECS, CONTACT, NAV, ENQUIRY, NOT_FOUND, SERVICES_BLOCK } from '../content/copy.js';
import { SERVICES, SERVICE_PAGE, BY_SLUG } from '../content/services.js';
import { ASSETS, src, srcset, position } from '../content/assets.js';
import { publish } from '../content/company.js';
import { section as profileSection, flashings, bed } from '../scenes/profiles.js';
import { pageGraph, pickFaq, pickSpecs, serviceId } from './schema.js';
import {
  SITE, esc, tel, wa, headHtml, chromeTop, chromeBottom, siteFooter,
  enquiryBlock, callBtn, waBtn, quoteBtn, bleedPhoto, serviceChooser, ICON_ARROW
} from './layout.js';
import { CAPABILITIES } from '../content/copy.js';

const photo = (key, { sizes, w, eager = false }) => {
  const a = ASSETS[key];
  return `<img src="/${src(key, w)}" srcset="${srcset(key).split(', ').map((s) => '/' + s).join(', ')}"
             sizes="${sizes}" width="${a.w}" height="${a.h}"
             ${eager ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"'}
             style="object-position:${position(key)}" alt="${esc(a.alt)}">`;
};

/* The enquiry backdrop is the same photograph as the hero, behind a scrim at
   30%. It takes the SAME two art-directed arms, so it is not a second
   download at any width — the browser already has that exact file from the
   hero, on desktop and on a phone alike. */

const zoomable = (key, inner) =>
  `<button type="button" class="zoom" data-open="${key}"
              aria-label="${esc(ASSETS[key].alt)} Select to view full size.">${inner}<span class="zoom-cue" aria-hidden="true"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg></span></button>`;

/* ── the pieces ─────────────────────────────────────────────────────────── */

const crumbs = (s) => `  <nav class="crumbs" aria-label="Breadcrumb">
    <ol class="wrap">
      <li><a href="/">${esc(SERVICE_PAGE.breadcrumbHome)}</a></li>
      <li><a href="/#services">${esc(SERVICE_PAGE.breadcrumbServices)}</a></li>
      <li><span aria-current="page">${esc(s.nav)}</span></li>
    </ol>
  </nav>`;

const figureRail = (rows) => `      <dl class="sp-rail">
${rows.map(([k, v]) => `        <div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('\n')}
      </dl>`;

/* The specification transcript, in disclosures. Open on the first group so the
   section is never a row of shut doors, and every row is in the DOM whether a
   group is open or not — a crawler and a screen reader both get all of it. */
const specBlock = (ids) => {
  const groups = pickSpecs(ids);
  return groups.map((g, i) => `      <details class="spec-group" id="spec-${g.id}"${i === 0 ? ' open' : ''}>
        <summary><span>${esc(g.title)}</span></summary>
        <dl class="spec-rows">
${g.rows.map(([k, v]) => `          <div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('\n')}
        </dl>
      </details>`).join('\n');
};

const COUNT_WORD = ['no', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];
const processLede = (slug) => {
  const n = processFor(slug).length;
  return SERVICE_PAGE.processLede.replace('{n}', COUNT_WORD[n] || String(n));
};

/* Only the commitments that are true of this service, renumbered. See the note
   on PROCESS in content/copy.js for why the rail is not the same on every
   page — and why a service with no confirmed programme shows none. */
const processBlock = (slug) => `      <ol class="steps">
${processFor(slug).map((st) => `        <li class="step">
          <span class="step-n">${esc(st.n)}</span>
          <div class="step-body">
            <h3>${esc(st.title)}</h3>
            <p>${esc(st.body)}</p>
          </div>
        </li>`).join('\n')}
      </ol>`;

const faqBlock = (items) => items.map((it, i) =>
  `      <details class="faq-item" id="q-${i + 1}">
        <summary><span>${esc(it.q)}</span></summary>
        <p>${esc(it.a)}</p>
      </details>`).join('\n');

const relatedBlock = (slugs) => `      <ul class="sp-related-list">
${slugs.map((sl) => {
    const r = BY_SLUG[sl];
    return `        <li><a href="/${r.slug}">
          <span class="sp-related-name">${esc(r.nav)}</span>
          <span class="sp-related-go">${ICON_ARROW}</span>
        </a></li>`;
  }).join('\n')}
      </ul>`;

/* The service-specific drawing. Each of these is already generated from the
   confirmed figures; this only decides which one belongs on which page. */
function drawing(s) {
  if (s.profiles) {
    return `    <div class="sp-draw ch-draw">
      <figure class="pf-fig" data-reveal="draw">
        <figcaption>IBR</figcaption>
        ${profileSection('ibr')}
      </figure>
      <figure class="pf-fig" data-reveal="draw">
        <figcaption>Corrugated</figcaption>
        ${profileSection('corrugated')}
      </figure>
      <p class="pf-note">Both sections drawn to the same scale, from the cover widths and rib heights below.</p>
    </div>`;
  }
  if (s.bed) {
    return `    <div class="sp-draw sp-bed" data-reveal="draw">
      ${bed()}
      <p class="pf-note">The bed at 3 000 × 1 500 mm, drawn to scale. The parts shown are ordinary fabrication shapes, included to show what fits — they are not a Kingson job.</p>
    </div>`;
  }
  if (s.folds) {
    return `    <div class="sp-draw ch-draw">
      <div class="pf-folds" data-reveal="draw">
        ${flashings()}
      </div>
      <p class="pf-note">The three standard flashings, in section. Custom folds to 3 000 mm in the same material range.</p>
    </div>`;
  }
  return '';
}

/* ── the page ───────────────────────────────────────────────────────────── */

export function servicePage(s) {
  const faq = pickFaq(s.faq);
  const cap = CAPABILITIES.find((c) => c.title === s.serviceName);
  const url = `${SITE}/${s.slug}`;

  const ld = pageGraph({
    path: '/' + s.slug,
    name: s.h1,
    description: s.description,
    image: s.hero,
    about: serviceId(cap),
    trail: [
      [SERVICE_PAGE.breadcrumbHome, SITE + '/'],
      [SERVICE_PAGE.breadcrumbServices, SITE + '/#services'],
      [s.nav, url]
    ],
    faq
  });

  const head = headHtml({
    title: s.title,
    description: s.description,
    path: '/' + s.slug,
    ogImage: s.hero,
    preload: s.hero,
    ld,
    ogType: 'website'
  });

  const strip = s.strip && s.strip.length
    ? `  <ul class="ch-strip sp-strip" tabindex="0" role="group"
       aria-label="Photographs of this work. On a narrow screen this row scrolls sideways.">
${s.strip.map((k, i) => `    <li data-reveal="plate" data-from="below" style="--d:${i * 110}ms">
      ${zoomable(k, photo(k, { sizes: '(max-width:900px) 62vw, 32vw', w: 720 })
        + `<span>${esc(ASSETS[k].alt.split(/[:,]/)[0])}</span>`)}
    </li>`).join('\n')}
  </ul>`
    : '';

  const aside = s.aside
    ? `      <div class="sp-aside" data-reveal="plate" data-from="below">
        ${zoomable(s.aside, photo(s.aside, { sizes: '(max-width:900px) 100vw, 46vw', w: 1100 }))}
      </div>`
    : '';

  const draw = drawing(s);

  return `<!DOCTYPE html>
<html lang="en">
<head>
${head}
</head>

<body>
${chromeTop({ home: false, current: s.slug })}

<main id="main">
${crumbs(s)}

  <!-- ═══ the service, at scale ═══ -->
  <section class="sp-hero ch ch-bleed ch-dark on-dark">
    <div class="ch-bleed-img" data-parallax data-reveal="settle">
      ${zoomable(s.hero, bleedPhoto(s.hero, { eager: true, abs: true }))}
    </div>
    <div class="wrap ch-over">
      <div class="ch-copy">
        <p class="ch-mark"><span class="ch-name">${esc(s.eyebrow)}</span></p>
        <h1 class="display ch-title">${esc(s.h1)}</h1>
        <p class="ch-lede">${esc(s.intro)}</p>
        <div class="sp-act">${quoteBtn(false, '#enquiry')}${callBtn(NAV.call, true)}${waBtn(true)}</div>
      </div>
    </div>
  </section>

  <!-- ═══ what we can do, and what we need from you ═══ -->
  <section class="sp-brief">
    <div class="wrap sp-brief-in">
      <div class="sp-brief-col">
        <h2 class="display" data-reveal="rise"><span>${esc(SERVICE_PAGE.figuresTitle)}</span></h2>
${figureRail(s.figures)}
      </div>
      <div class="sp-brief-col">
        <h2 class="display" data-reveal="rise"><span>${esc(s.sendTitle)}</span></h2>
        <ul class="sp-send">
${s.send.map((line) => `          <li>${esc(line)}</li>`).join('\n')}
        </ul>
      </div>
    </div>
  </section>
${draw ? `
  <section class="sp-drawing sec-alt">
    <div class="wrap">
${draw}
    </div>
  </section>` : ''}${strip ? `
  <section class="sp-plates ch-dark on-dark">
${strip}
  </section>` : ''}${s.parts ? `

  <!-- ═══ the work this covers ═══ -->
  <section class="sp-parts">
    <div class="wrap">
      <div class="sp-parts-list">
${s.parts.map((p) => `        <article id="${p.id}">
          <h2 class="display" data-reveal="rise"><span>${esc(p.title)}</span></h2>
          <p>${esc(p.body)}</p>
        </article>`).join('\n')}
      </div>
    </div>
  </section>` : ''}

  <!-- ═══ the transcript ═══ -->
  <section class="spec sec-alt" id="specifications">
    <div class="wrap">
      <div class="sec-head">
        <p class="eyebrow">${esc((s.spec && s.spec.eyebrow) || SERVICE_PAGE.specTitle)}</p>
        <h2 class="display" data-reveal="rise"><span>${esc((s.spec && s.spec.head) || SPECS.title)}</span></h2>
        <p>${esc((s.spec && s.spec.lede) || SERVICE_PAGE.specLede)}</p>
      </div>
      <div class="spec-list">
${specBlock(s.specGroups)}
      </div>
    </div>
  </section>

  <!-- ═══ process and place ═══ -->
  <section class="sp-proc">
    <div class="wrap sp-proc-in">
      <div>
        <h2 class="display" data-reveal="rise"><span>${esc(SERVICE_PAGE.processTitle)}</span></h2>
        <p class="sp-lede">${esc(processLede(s.slug))}</p>
${processBlock(s.slug)}
      </div>
      <aside class="sp-area">
        <h2>${esc(SERVICE_PAGE.areaTitle)}</h2>
        <p>${esc(SERVICE_PAGE.areaBody)}</p>
        <dl class="sp-rail">
${[['address', publish('address')], ['hours', publish('hours')], ['contactPerson', publish('contactPerson')]]
    .filter(([, v]) => v)
    .map(([k, v]) => `          <div><dt>${esc(CONTACT.labels[k])}</dt><dd>${esc(v)}</dd></div>`).join('\n')}
        </dl>
      </aside>
    </div>
  </section>

  <!-- ═══ questions ═══ -->
  <section class="faq" id="faq">
    <div class="wrap">
      <div class="sec-head">
        <p class="eyebrow">Questions</p>
        <h2 class="display" data-reveal="rise"><span>${esc(SERVICE_PAGE.faqTitle)}</span></h2>
      </div>
      <div class="faq-list">
${faqBlock(faq)}
      </div>
    </div>
  </section>

  <!-- ═══ the brief ═══ -->
  <section class="enq sec-dark on-dark" id="enquiry">
    ${bleedPhoto(s.hero, { abs: true, cls: 'enq-bg', decorative: true })}
    <div class="wrap">
${enquiryBlock(s.serviceName, { title: SERVICE_PAGE.ctaTitle, lede: SERVICE_PAGE.ctaLede })}
    </div>
  </section>

  <!-- ═══ where else to go ═══ -->
  <section class="sp-related sec-alt">
    <div class="wrap">
      <h2 class="display" data-reveal="rise"><span>${esc(SERVICE_PAGE.relatedTitle)}</span></h2>
${relatedBlock(s.related)}
      <p class="sp-back"><a href="/#services">${esc(SERVICE_PAGE.backHome)}${ICON_ARROW}</a></p>
    </div>
  </section>
${aside ? `
  <section class="sp-tail sec-alt">
    <div class="wrap">
${aside}
    </div>
  </section>` : ''}
</main>

${siteFooter()}

${chromeBottom()}
</body>
</html>
`;
}

export function allServicePages() {
  return SERVICES.map((s) => ({ file: `${s.slug}.html`, html: servicePage(s) }));
}

/* ── the 404 ─────────────────────────────────────────────────────────────────
   It used to be a hand-written file with its own stylesheet block, its own
   logo plaque and none of the site's chrome: no header, no menu, no skip
   link, no <main>, no footer. It was the one page that visibly belonged to an
   older template, and it was also the one page a lost visitor sees.

   It is generated now, from the same chrome as everything else. A dead URL is
   not an apology page — the person still wants something built, so the page
   answers the only useful question it can: which of the six is your job. The
   chooser under the headline is the same component the home page uses, and
   the form below it is the same form, so a visitor who landed here by a bad
   link can finish without going anywhere.

   Never in the sitemap, always noindex. Vercel serves it for any unmatched
   path with a real 404 status — see vercel.json.                           */

export function notFoundPage() {
  const head = headHtml({
    title: `${NOT_FOUND.title} — ${publish('name')}`,
    description: NOT_FOUND.description,
    path: '/404',
    ogImage: NOT_FOUND.hero,
    preload: NOT_FOUND.hero,
    index: false,
    ld: null
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
${head}
</head>

<body>
${chromeTop({ home: false, current: '404' })}

<main id="main">
  <section class="sp-hero nf-hero ch ch-bleed ch-dark on-dark">
    <div class="ch-bleed-img">
      ${bleedPhoto(NOT_FOUND.hero, { eager: true, abs: true, decorative: true })}
    </div>
    <div class="wrap ch-over">
      <div class="ch-copy">
        <p class="ch-mark"><span class="ch-name">${esc(NOT_FOUND.eyebrow)}</span></p>
        <h1 class="display ch-title">${esc(NOT_FOUND.h1)}</h1>
        <p class="ch-lede">${esc(NOT_FOUND.lede)}</p>
        <div class="sp-act">${quoteBtn(false, '#enquiry')}${callBtn(NAV.call, true)}${waBtn(true)}</div>
      </div>
    </div>
  </section>

  <section class="svc nf-svc" id="services" aria-labelledby="nf-svc-h">
    <div class="wrap">
      <div class="sec-head">
        <p class="eyebrow">${esc(SERVICES_BLOCK.eyebrow)}</p>
        <h2 class="display" id="nf-svc-h" data-reveal="rise"><span>${esc(SERVICES_BLOCK.title)}</span></h2>
        <p>${esc(SERVICES_BLOCK.lede)}</p>
      </div>
${serviceChooser()}
    </div>
  </section>

  <section class="enq sec-dark on-dark" id="enquiry">
    ${bleedPhoto(NOT_FOUND.hero, { abs: true, cls: 'enq-bg', decorative: true })}
    <div class="wrap">
${enquiryBlock(null, { title: NOT_FOUND.ctaTitle, lede: NOT_FOUND.ctaLede })}
    </div>
  </section>
</main>

${siteFooter()}

${chromeBottom()}
</body>
</html>
`;
  return { file: '404.html', html };
}
