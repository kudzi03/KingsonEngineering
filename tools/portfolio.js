/* ═══════════════════════════════════════════════════════════════════════════
   tools/portfolio.js — /projects and /projects/<id>
   ═══════════════════════════════════════════════════════════════════════════

   Every function here renders from content/projects.js and nothing else, and
   all of it is conditional on there being a publishable job: with an empty
   list no route is written, no link appears and the sitemap does not name
   the section.

   A job's page answers the questions a buyer brings to it, in order: what is
   this, is it really theirs (the footage), what does it look like close up
   (frames), which of their services built it, and how do I get one.

   It never pads. A job that came with a title, a service and footage renders
   a title, a service and footage — not a table of "TBC". Everything that is
   unknown about it is listed for the office in PROJECT_METADATA.md, not for
   the visitor.
   ═══════════════════════════════════════════════════════════════════════════ */

import { publishable, hasProjects, credit } from '../content/projects.js';
import { ASSETS, src, srcset, position } from '../content/assets.js';
import { BY_SLUG } from '../content/services.js';
import { CAPABILITIES } from '../content/copy.js';
import { pageGraph, serviceId, videoObject } from './schema.js';
import {
  headHtml, chromeTop, chromeBottom, siteFooter, enquiryBlock, projectFilm, projectRows,
  ICON_ARROW, esc, SITE
} from './layout.js';

export const PORTFOLIO = {
  slug: 'projects',
  nav: 'Projects',
  title: 'Completed Projects | Kingson Engineering',
  h1: 'Work we have finished.',
  eyebrow: 'Completed work',
  description: 'Completed steelwork by Kingson Engineering of Tynwald, Harare: site footage and photographs of finished jobs, each linked to the service behind it.',
  lede: 'Each job is shown in its own footage or photographs, and says only what we can confirm about it.',
  crumb: 'Projects'
};

const capFor = (slug) => CAPABILITIES.find((c) => c.title === BY_SLUG[slug].serviceName);

const crumbs = (trail) => `  <nav class="crumbs" aria-label="Breadcrumb">
    <ol class="wrap">
${trail.map(([name, href], i) => i === trail.length - 1
    ? `      <li><span aria-current="page">${esc(name)}</span></li>`
    : `      <li><a href="${href}">${esc(name)}</a></li>`).join('\n')}
    </ol>
  </nav>`;

/* A still from the footage, at the size the strip shows it — never larger
   than the 540 px the frames really have. */
const STILL_SIZES = '(max-width: 760px) 72vw, (max-width: 1200px) 30vw, 360px';
const still = (key) => {
  const a = ASSETS[key];
  return `<img src="/${src(key, 540)}" srcset="${srcset(key).split(', ').map((x) => '/' + x).join(', ')}"
             sizes="${STILL_SIZES}" width="${a.w}" height="${a.h}"
             loading="lazy" decoding="async" style="object-position:${position(key)}" alt="${esc(a.alt)}">`;
};

/* The facts a job has, as rows. Only what is known: the service always,
   then whatever the entry actually carries. */
function factRows(p) {
  const rows = [
    ['Service', p.services.map((sl) => `<a href="/${sl}">${esc(BY_SLUG[sl].nav)}</a>`).join(', ')],
    ...(p.state ? [['Status', esc(p.state)]] : []),
    ...(p.type ? [['Building', esc(p.type)]] : []),
    ...(credit(p) ? [['For', esc(credit(p))]] : []),
    ...(p.scope ? [['Our scope', esc(p.scope)]] : []),
    ...(p.figures || []).filter(([, v]) => v).map(([k, v]) => [esc(k), `<span class="num">${esc(v)}</span>`])
  ];
  return `      <dl class="sp-rail pd-facts">
${rows.map(([k, v]) => `        <div><dt>${k}</dt><dd>${v}</dd></div>`).join('\n')}
      </dl>`;
}

/* ── one job ─────────────────────────────────────────────────────────────── */

function projectPage(p) {
  const path = `/projects/${p.id}`;
  const url = SITE + path;
  const lead = BY_SLUG[p.services[0]];
  const cap = capFor(p.services[0]);
  const title = `${p.title} — Completed Project | Kingson`;
  /* The entry's own words, never a template: a sentence written for one job
     and filled in for another is how a page ends up describing steel that is
     not in the picture. */
  const description = p.description || p.summary;

  const ld = pageGraph({
    path, name: p.title, description, image: p.hero,
    about: cap ? serviceId(cap) : undefined,
    trail: [['Home', SITE + '/'], [PORTFOLIO.crumb, `${SITE}/projects`], [p.title, url]],
    mainEntity: p.video ? { '@id': url + '#video' } : null,
    extra: p.video ? [videoObject(p, url)] : []
  });

  /* The first large paint is the film's poster, or the hero photograph when
     there is no film, and nothing in the markup asks for either until it is
     laid out. The preload names exactly the file the page then shows — the
     poster at its one size, or the photograph's own srcset and sizes — or it
     would be a second download competing with the first. */
  const first = p.video
    ? `<link rel="preload" as="image" href="/${src(p.video.poster, p.video.w)}" fetchpriority="high">`
    : `<link rel="preload" as="image" href="/${src(p.hero, 540)}" imagesrcset="${srcset(p.hero).split(', ').map((x) => '/' + x).join(', ')}" imagesizes="${STILL_SIZES}" fetchpriority="high">`;
  const head = headHtml({ title, description, path, ogImage: p.hero, ld, ogType: 'article' })
    .replace('<link rel="stylesheet" href="/assets/fonts.css', `${first}\n<link rel="stylesheet" href="/assets/fonts.css`);

  const frames = (p.gallery || []).filter((k) => ASSETS[k]);

  return `<!DOCTYPE html>
<html lang="en">
<head>
${head}
</head>

<body>
${chromeTop({ current: `projects/${p.id}` })}

<main id="main" tabindex="-1">
${crumbs([['Home', '/'], [PORTFOLIO.crumb, '/projects'], [p.title, path]])}

  <!-- ═══ the job ═══ -->
  <section class="pd gl" aria-labelledby="pd-h">
    <div class="wrap pd-in">
      <div class="pd-head">
        <p class="eyebrow">${esc(PORTFOLIO.eyebrow)}<span aria-hidden="true">·</span>${esc(lead.nav)}</p>
        <h1 class="display pd-title" id="pd-h">${esc(p.title)}<span class="pt">.</span></h1>
      </div>
      ${p.video ? `<figure class="pd-film">
      ${projectFilm(p, { id: 'pd', describedBy: 'pd-shows' })}
      </figure>` : `<figure class="pd-film pd-photo">${still(p.hero)}</figure>`}
      <div class="pd-copy">
        ${p.description ? `<p class="pd-lede">${esc(p.description)}</p>` : ''}
${factRows(p)}
        ${p.video ? `<p class="pd-shows" id="pd-shows">${esc(p.video.shows)}</p>` : ''}
        <div class="pd-act">
          <a class="btn" href="#enquiry"><span>Get a price</span></a>
          <a class="btn-ghost" href="/${lead.slug}"><span>${esc(lead.nav)}</span>${ICON_ARROW}</a>
        </div>
      </div>
    </div>
  </section>
${frames.length ? `
  <!-- ═══ frames from the footage ═══ -->
  <section class="pd-frames sec-dark on-dark" aria-labelledby="pd-fr-h">
    <div class="wrap">
      <h2 class="pd-sub" id="pd-fr-h">${p.video ? 'Frames from the footage' : 'Photographs'}</h2>
      <ul class="pd-strip" tabindex="0" aria-label="${p.video ? 'Frames from the footage' : 'Photographs'}. On a narrow screen this row scrolls sideways.">
${frames.map((k, i) => `        <li data-reveal="plate" data-from="below" style="--d:${i * 110}ms">
          <figure>${still(k)}
            <figcaption><span class="num">${String(i + 1).padStart(2, '0')}</span>${esc(ASSETS[k].alt.split(/[:,]/)[0])}</figcaption>
          </figure>
        </li>`).join('\n')}
      </ul>
    </div>
  </section>` : ''}
${cap ? `
  <!-- ═══ the service behind it ═══ -->
  <section class="pd-svc gl" aria-labelledby="pd-svc-h">
    <div class="wrap pd-svc-in">
      <div>
        <p class="eyebrow">The service behind it</p>
        <h2 class="display pd-svc-title" id="pd-svc-h">${esc(cap.title)}</h2>
      </div>
      <div>
        <p class="pd-svc-lead"><b class="num">${esc(cap.lead[0])}</b> <span>${esc(cap.lead[1])}</span></p>
        <p class="pd-svc-body">${esc(cap.body)}</p>
        <p class="pd-svc-note">These are what we confirm for every ${esc(lead.nav.toLowerCase())} job, not the figures of this one.</p>
        <p class="ch-more"><a href="/${lead.slug}">Full specification${ICON_ARROW}</a></p>
      </div>
    </div>
  </section>` : ''}

  <!-- ═══ the brief ═══ -->
  <section class="enq sec-dark on-dark gl" id="enquiry">
    <div class="wrap">
${enquiryBlock(lead.serviceName, { title: p.cta || 'Have a job like this?', lede: 'Send the drawings or a description. Enquiries are acknowledged the same working day.' })}
    </div>
  </section>

  <section class="sp-related sec-alt gl">
    <div class="wrap">
      <h2 class="display">Keep looking</h2>
      <ul class="sp-related-list">
        <li><a href="/projects"><span class="sp-related-name">All completed projects</span><span class="sp-related-go">${ICON_ARROW}</span></a></li>
${lead.related.map((sl) => `        <li><a href="/${sl}"><span class="sp-related-name">${esc(BY_SLUG[sl].nav)}</span><span class="sp-related-go">${ICON_ARROW}</span></a></li>`).join('\n')}
      </ul>
    </div>
  </section>
</main>

${siteFooter()}

${chromeBottom()}
</body>
</html>
`;
}

/* ── the index ───────────────────────────────────────────────────────────── */

function indexPage(items) {
  const url = `${SITE}/projects`;
  const ld = pageGraph({
    path: '/projects', name: PORTFOLIO.h1, description: PORTFOLIO.description, image: items[0].hero,
    pageType: 'CollectionPage',
    trail: [['Home', SITE + '/'], [PORTFOLIO.crumb, url]],
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: items.map((p, i) => ({
        '@type': 'ListItem', position: i + 1, name: p.title, url: `${SITE}/projects/${p.id}`
      }))
    }
  });
  const head = headHtml({
    title: PORTFOLIO.title, description: PORTFOLIO.description, path: '/projects',
    ogImage: items[0].hero, ld
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
${head}
</head>

<body>
${chromeTop({ current: PORTFOLIO.slug })}

<main id="main" tabindex="-1">
${crumbs([['Home', '/'], [PORTFOLIO.crumb, '/projects']])}

  <section class="pj-index gl" aria-labelledby="pj-h">
    <div class="wrap">
      <div class="sec-head">
        <p class="eyebrow">${esc(PORTFOLIO.eyebrow)}</p>
        <h1 class="display" id="pj-h">${esc(PORTFOLIO.h1)}</h1>
        <p>${esc(PORTFOLIO.lede)}</p>
      </div>
${projectRows(items, { headingLevel: 2 })}
    </div>
  </section>

  <section class="enq sec-dark on-dark gl" id="enquiry">
    <div class="wrap">
${enquiryBlock(null)}
    </div>
  </section>
</main>

${siteFooter()}

${chromeBottom()}
</body>
</html>
`;
}

/** The routes, when there are any. Spread into the build's route list. */
export function portfolioRoutes() {
  if (!hasProjects()) return [];
  const items = publishable();
  return [
    { file: `${PORTFOLIO.slug}.html`, html: indexPage(items) },
    ...items.map((p) => ({ file: `projects/${p.id}.html`, html: projectPage(p) }))
  ];
}
