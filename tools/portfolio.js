/* ═══════════════════════════════════════════════════════════════════════════
   tools/portfolio.js — the /projects page
   ═══════════════════════════════════════════════════════════════════════════

   Built, tested, and emitting nothing today.

   `content/projects.js` is empty because the office has not yet said which
   photograph belongs to which job. Every function here is conditional on
   there being at least one publishable project, so the route is not written,
   not linked and not in the sitemap until there is.

   That is the whole point of building it now: when the entries arrive, they
   are typed into one file and this renders them. No layout work, no new
   components, no second pass.
   ═══════════════════════════════════════════════════════════════════════════ */

import { PROJECTS, publishable, hasProjects, credit } from '../content/projects.js';
import { ASSETS, src, srcset, position } from '../content/assets.js';
import { CONTACT, NAV } from '../content/copy.js';
import { headHtml, chromeTop, chromeBottom, siteFooter, enquiryBlock,
         ICON_ARROW, esc, SITE } from './layout.js';

export const PORTFOLIO = {
  slug: 'projects',
  nav: 'Projects',
  title: 'Projects | Kingson Engineering',
  h1: 'Work we have finished.',
  eyebrow: 'Projects',
  description: 'Structural steelwork, roofing, fabrication and cranage projects completed by Kingson Engineering in Harare and across Zimbabwe.',
  lede: 'Jobs we have taken from drawing to erection. Every figure on this page is from our own records.'
};

/* A photograph, at the sizes this layout actually asks for. */
const shot = (key, { sizes, w, eager = false, cls = '' }) => {
  const a = ASSETS[key];
  if (!a) return '';
  return `<img${cls ? ` class="${cls}"` : ''} src="${src(key, w)}" srcset="${srcset(key)}"
             sizes="${sizes}" width="${a.w}" height="${a.h}"
             ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"
             style="object-position:${position(key)}" alt="${esc(a.alt)}">`;
};

/* ── one project ─────────────────────────────────────────────────────────────
   Every block below is conditional. A job with nothing but a title and a
   photograph renders a title and a photograph — not a table of dashes. */

function projectArticle(p, i) {
  const line = credit(p);
  const figures = (p.figures || []).filter(([, v]) => v);

  return `    <article class="pj" id="${esc(p.id)}">
      <div class="pj-shot" data-reveal="settle">
        ${shot(p.hero, { sizes: '(max-width:900px) 100vw, 58vw', w: 1320, eager: i === 0 })}
      </div>

      <div class="pj-copy">
        ${p.type ? `<p class="eyebrow">${esc(p.type)}</p>` : ''}
        <h2 class="display pj-title" data-reveal="rise"><span>${esc(p.title)}</span></h2>
        ${line ? `<p class="pj-credit">${esc(line)}</p>` : ''}
        ${p.scope ? `<p class="pj-scope">${esc(p.scope)}</p>` : ''}
        ${p.description ? `<p class="pj-body">${esc(p.description)}</p>` : ''}

        ${figures.length ? `<dl class="pj-figures" data-reveal="lift" data-reveal-stagger="60">
${figures.map(([k, v]) => `          <div><dt>${esc(k)}</dt><dd class="num">${esc(v)}</dd></div>`).join('\n')}
        </dl>` : ''}

        ${(p.highlights || []).length ? `<ul class="pj-points">
${p.highlights.map((h) => `          <li>${esc(h)}</li>`).join('\n')}
        </ul>` : ''}

        ${p.services.length ? `<p class="pj-svc">${p.services.map((s) => esc(s)).join(' · ')}</p>` : ''}
      </div>

      ${(p.gallery || []).length ? `<ul class="pj-gallery" data-reveal="lift" data-reveal-stagger="70">
${p.gallery.map((k) => `        <li>${shot(k, { sizes: '(max-width:760px) 88vw, 30vw', w: 900 })}</li>`).join('\n')}
      </ul>` : ''}
    </article>`;
}

/** The whole page, or null when there is nothing to publish. */
export function portfolioPage() {
  if (!hasProjects()) return null;
  const items = publishable();

  const head = headHtml({
    title: PORTFOLIO.title,
    description: PORTFOLIO.description,
    path: '/projects',
    ogImage: items[0].hero,
    ld: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${SITE}/projects#page`,
      name: PORTFOLIO.h1,
      description: PORTFOLIO.description,
      hasPart: items.map((p) => ({
        '@type': 'CreativeWork',
        name: p.title,
        ...(p.description ? { description: p.description } : {}),
        ...(p.location ? { locationCreated: { '@type': 'Place', name: p.location } } : {}),
        ...(p.year ? { dateCreated: p.year } : {}),
        image: SITE + '/' + src(p.hero, 1320)
      }))
    }
  });

  return `<!doctype html>
<html lang="en-ZW">
${head}
<body>
${chromeTop({ current: PORTFOLIO.slug })}
<main id="main" tabindex="-1">
  <section class="pj-head">
    <div class="wrap">
      <p class="eyebrow">${esc(PORTFOLIO.eyebrow)}</p>
      <h1 class="display" data-reveal="rise"><span>${esc(PORTFOLIO.h1)}</span></h1>
      <p class="pj-lede">${esc(PORTFOLIO.lede)}</p>
    </div>
  </section>

  <section class="pj-list">
    <div class="wrap">
${items.map(projectArticle).join('\n\n')}
    </div>
  </section>

  <section class="enq sec-dark on-dark" id="enquiry">
    <div class="wrap">
${enquiryBlock(null)}
    </div>
  </section>
${siteFooter()}
</main>
${chromeBottom()}
</body>
</html>
`;
}

/** The route, when there is one. Spread into the build's route list. */
export function portfolioRoutes() {
  const html = portfolioPage();
  return html ? [{ file: `${PORTFOLIO.slug}.html`, html }] : [];
}
