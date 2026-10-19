# Kingson Engineering — editorial redesign and search readiness

Review branch: `codex/premium-editorial-redesign`, based on production `47bc8e1`.
The website redesign is not approved for production. No production merge, DNS,
business email or CRM schema change is part of this release.

## Phase A — visual redesign

The supplied restaurant reference video was sampled at several points across
its 11.7-second duration. Its useful principles were restrained navigation,
large typography, generous photography and a deliberate change of scale through
the page. Its restaurant identity, content and exact layouts were not copied.

- Predominantly off-white and light grey, charcoal headings, restrained red
  actions and the original Kingson logo. The crane feature and footer retain
  a darker ground; most of the previous dark panels are now light.
- The hero separates its title, commercial introduction and contact actions
  from a large photograph. Text does not depend on a dark photographic scrim.
- Structural steel and roofing get offset editorial photographs. Cutting,
  fabrication and cranage use technical rows rather than repetitive cards.
- Added a gallery of genuine workshop/site photographs linked to their
  services. Captions describe what is shown; they do not invent client names,
  locations, completed contracts or project results.
- The existing data-driven portfolio now supports status, local short videos,
  posters, optional caption tracks and service links. Videos have controls,
  `playsinline`, `preload="none"` and no autoplay. The page appears only when
  approved project records exist; no fictitious case study is published.
- Keyboard menu and photo-viewer behavior, focus restoration, enquiry fields,
  duplicate-submission protection, WhatsApp and email routing are retained.
- On phones, photographs start paused and reveal preparation is skipped.
  Reduced-motion and data-saving preferences are respected. Below-fold
  sections defer rendering using content visibility, with normal HTML fallback.
- Matched fallback heading metrics to the new typography, removed an initial
  header geometry read, matched hero preload/image sizes and added lossless,
  responsive WebP logo derivatives. All original media remain in the repository.

The redesign remains static HTML, CSS and ES modules. Browser scripts and
styles are bundled/minified into committed assets with esbuild 0.28.2. No
production framework or runtime library was added. Build/QA tools were installed
outside the repository. The builder's source/artifact hash checks require only
Node; rebuilding changed browser sources requires the pinned esbuild executable.

## Phase B — search readiness

- All six indexable pages retain official-domain canonicals, matching Open
  Graph URLs, large Twitter/X cards and genuine JPEG preview images.
- Updated home, roofing and fabrication titles to clear service/location
  intent. Other service metadata was already accurate and remains unique.
- Preserved both old-Vercel redirects, the apex-to-www behavior and the legacy
  `fiber` to `fibre` route. Preview hostnames are not forced to production.
- Kept content, specifications, FAQs and navigation in generated HTML. Improved
  the visible explanation of the Harare workshop base and client-site service
  model. No thin location pages, fabricated reviews, awards or AI-search files.
- The entity graph contains Organization/LocalBusiness, WebSite, WebPage/FAQPage,
  six Services and service-page BreadcrumbLists. Removed invalid Service
  `additionalProperty` usage; verified technical details remain in descriptions
  and visible tables. Removed the unused, superseded graph from the renderer.
- Sitemap lists the six canonical pages and actual page images. `lastmod` is
  the meaningful content revision date, not every build. A future approved
  portfolio route is included automatically.
- Simplified robots guidance, retained the sitemap declaration and excluded
  CRM crawling. Existing CRM `noindex` headers remain in Vercel configuration.
- `content/seo.js` accepts Google's real verification token when supplied.
  It emits a home-page tag only when populated. No fake verification tag ships.
- Added search checks to the existing publication gate and documented both
  URL-prefix and Domain-property verification in `SEARCH_CONSOLE_SETUP.md`.

## Quality verification

The renderer consistency check, publication gate, sharing check and new search
check pass. They cover 26 served text files, 119 confirmed figure occurrences,
82 referenced photograph files, links/fragments, canonical identity, unique
metadata, heading order, entity graphs and visible FAQ parity.

Browser review covered the six pages and 404 at 390px and 1440px, with additional
layout checks at 320, 768, 1024 and 1920px. The affected homepage was retested
after correcting the photograph-selector accessible names. Aggregate results:

- No horizontal overflow or broken images.
- No browser runtime errors.
- Zero automated axe violations for WCAG 2 A/AA, 2.1 A/AA and 2.2 AA rules tested.
- No visible interactive targets smaller than 24px in either dimension;
  primary buttons and inputs use at least 44px target heights.
- Menu focus trapping/restoration, Escape handling, photo viewer and FAQ pass.
- Form validation, successful reference display, RPC payload, duplicate
  prevention, technical-email routing, WhatsApp handoff and failed-save fallback
  pass with network writes intercepted.
- Static content, service links and contact links remain available without JS.
- Future project status/video/service-link rendering was tested in memory;
  the fixture was not written to the site or database.

Schema.org's external validator reported **0 errors and 0 warnings** for the
new homepage entity graph. Google's Rich Results Test is a separate eligibility
check; see the final verification note below. No Search Console verification or
sitemap submission has been performed.

### Measured performance

Local Lighthouse runs, not production field Core Web Vitals. The local server
uses text compression to approximate production transfer behavior. The
Lighthouse accessibility result is supplemented by the page-by-page axe tests.

| Run | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Desktop preset | 99 | 100 | 100 | 100 | 0.4 s | 0.6 s | 70 ms | 0 |
| Mobile simulated preset | 80 | 100 | 100 | 100 | 1.3 s | 2.7 s | 650 ms | 0 |

Mobile simulation remains the performance limitation: these LCP/TBT values are
not an assertion of excellent mobile field performance. Retest the deployed
preview/production on real phones and monitor Search Console field data after
launch. Do not interpret lab TBT as field INP or a Lighthouse score as a ranking
or accessibility guarantee.

## Approved backend recovery

During verification the connected `kingson-engineering-crm` Supabase project
was **INACTIVE**. The user separately approved restoration and delivery checks.
It was restored and confirmed **ACTIVE_HEALTHY**. No plan/billing, DNS, mail
settings, auth configuration or database schema was changed.

A real anonymous-role call to `submit_enquiry` ran in a transaction. The
database confirmed processing, opportunity creation, activity creation and a
follow-up task. The transaction was rolled back; a subsequent query confirmed
no diagnostic enquiry remained. A public API request with an intentionally
empty payload returned the expected `400 / name` validation and allowed the
official website origin. This verifies API reachability and the database
delivery path without creating a customer or sending a test email.

WhatsApp links and mail drafts were inspected, not sent. Outbound email
delivery and a real customer's complete submission should be checked by the
owner during the final launch check. Supabase notes that free projects can
pause after inactivity; the existing project's availability needs an ongoing
owner decision, not a silent plan upgrade.

## Owner inputs and launch constraints

- Approve the design before a production merge/deploy.
- Supply verified project titles, photograph grouping, scope, location/status,
  client-publication consent and any technical figures to publish case studies.
  The architecture is ready; these factual records are still missing.
- Supply the exact Google HTML verification token, or arrange Domain-property
  TXT verification with Liquid Telecom. Verification/submission remain manual.
- Keep Google Business Profile identity and service-area information consistent.
  Its ongoing verification is independent of Search Console.
- Test fresh Safari and Chrome shares after production release. Local checks
  verify the metadata and redirect configuration; native OS share sheets were
  not automated.

Reference documentation: [Schema.org Service](https://schema.org/Service),
[additionalProperty domains](https://schema.org/additionalProperty),
[Google AI-search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide),
[Supabase availability](https://supabase.com/docs/guides/deployment/going-into-prod#availability).

## Reproduce the checks

```text
node tools/render.js
node tools/build-public.mjs --check
node tools/render.js --check
node tools/check-truth.js
node tools/check-sharing.mjs
node tools/check-search.mjs
git diff --check
node tools/preview-server.mjs
```

For browser QA, provide `KINGSON_PLAYWRIGHT_PATH` to a Playwright installation
and `KINGSON_AXE_PATH` to axe-core's `axe.min.js`, then run
`node tools/test-browser.mjs`. The default browser is installed Edge; set
`KINGSON_BROWSER=chrome` to use Chrome. The runner only targets localhost and
intercepts CRM writes. Screenshots and JSON results are written to the system
temporary directory `kingson-redesign-review`.

## Exact changed files and metadata

The following generated inventories describe this branch relative to its
production base.

<!--file-inventory-->
- `404.html`
- `PROJECT_METADATA.md`
- `README.md`
- `REDESIGN_REPORT.md`
- `SEARCH_CONSOLE_SETUP.md`
- `assets/brand/kingson-logo-160.webp`
- `assets/brand/kingson-logo-240.webp`
- `assets/brand/kingson-logo-320.webp`
- `assets/brand/kingson-logo-560.webp`
- `assets/brand/kingson-logo-reverse-160.webp`
- `assets/brand/kingson-logo-reverse-240.webp`
- `assets/brand/kingson-logo-reverse-320.webp`
- `assets/brand/kingson-logo-reverse-560.webp`
- `assets/site.min.css`
- `assets/site.min.js`
- `content/assets.js`
- `content/chapters.js`
- `content/copy.js`
- `content/editorial.js`
- `content/projects.js`
- `content/seo.js`
- `content/services.js`
- `fibre-laser-cutting-harare.html`
- `index.html`
- `main.js`
- `mobile-cranage-harare.html`
- `robots.txt`
- `roofing-and-trusses.html`
- `scenes/cinema.js`
- `scenes/reveal.js`
- `sitemap.xml`
- `steel-fabrication.html`
- `structural-steel-harare.html`
- `styles/editorial.css`
- `styles/public.css`
- `styles/tokens.css`
- `tools/build-brand.py`
- `tools/build-public.mjs`
- `tools/check-search.mjs`
- `tools/check-truth.js`
- `tools/layout.js`
- `tools/portfolio.js`
- `tools/preview-server.mjs`
- `tools/public-build.json`
- `tools/render.js`
- `tools/schema.js`
- `tools/test-browser.mjs`
<!--/file-inventory-->

<!--metadata-inventory-->
| Canonical URL | Title / OG title / Twitter title | Description / OG / Twitter description |
|---|---|---|
| https://www.kingsonengineering.co.zw/ | Steelwork & Fabrication in Harare \| Kingson Engineering | Structural steelwork, roofing, fabrication and fibre laser cutting up to 20 mm in Harare, Zimbabwe. Own 25-tonne crane. Send drawings for a quotation. |
| https://www.kingsonengineering.co.zw/structural-steel-harare | Structural Steel Fabrication & Erection, Harare \| Kingson | Portal frames, columns, rafters and purlins fabricated here in our Harare workshop and erected with our own 25-tonne crane. Six to ten weeks from order. |
| https://www.kingsonengineering.co.zw/roofing-and-trusses | Roofing, Steel Trusses & Sheeting in Harare \| Kingson | Roof trusses, purlins and sheeting for any span and height. IBR and corrugated, cut to 12 m, galvanised or pre-painted. Flashings folded to match. |
| https://www.kingsonengineering.co.zw/fibre-laser-cutting-harare | Fibre Laser Cutting in Harare — DXTECH \| Kingson | Plate and sheet cut up to 20 mm thick on a DXTECH fibre laser in Harare. 3 000 × 1 500 mm bed, ± 0.1 mm. Send DXF, DWG, STEP or PDF. |
| https://www.kingsonengineering.co.zw/steel-fabrication | Steel Fabrication in Harare, Zimbabwe \| Kingson | Balustrades, handrails, roller shutter doors and general metal fabrication in Harare, folded to 3 000 mm in 0.4 – 3.0 mm steel or aluminium. |
| https://www.kingsonengineering.co.zw/mobile-cranage-harare | 25-Tonne Mobile Crane Hire, Harare \| Kingson | A 25-tonne telescopic mobile crane for hire in Harare and nationally, worked on our own erection contracts. Transport priced per load. |
<!--/metadata-inventory-->

<!--external-validation-note-->
Google Rich Results Test was attempted in code mode; a completed result has not
yet been confirmed in this environment. Run it again before launch and record
the outcome. Schema.org validation succeeded as described above.
<!--/external-validation-note-->
