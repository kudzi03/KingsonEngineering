# Hero video startup preview — 21 October 2026

Branch: `codex/hero-video-startup`. Local preview: http://127.0.0.1:4173/.
This change has not been pushed, merged or deployed.

## Cause and change

The hero had no video source until `window.load`. That event waits for eager
images and other page resources. A delayed logo request left the page interactive
but the video paused at time zero, with no source. Releasing that image allowed
the video to start. Normal production playback also started without any pointer,
keyboard or scroll input, so the test does not establish a mouse-input requirement.

`scenes/hero-film.js` now starts playback from the initial visibility observation,
without the page-load gate. Browsers without IntersectionObserver start directly.
Reduced-motion, Save-Data, slow-2G, still-review, hidden-tab and offscreen guards
remain in place. There are no new controls, dependencies, footage, layout or copy
changes.

`tools/test-media.mjs` adds a regression that holds eager logo requests pending
and requires the visible video to play while the document is still interactive,
without any user input. `assets/site.min.js` and `tools/public-build.json` are
rebuilt. All ten public HTML files only receive the generated asset-version change;
the CSS bytes are unchanged.

## Validation

- Production before-change reproduction: delayed eager image prevents startup;
  ordinary load plays without user input.
- Chromium: complete media suite passed at 1440×900, 1920×1080 and 390×844,
  including startup regression, loops, project playlists, offscreen pause/resume,
  reduced motion, data-saving cases, blocked playback/network fallbacks, codecs,
  byte ranges and hero accessibility.
- WebKit: startup regression passed on both runs. The first run stopped at a
  project workshop loop timeout; the second passed all three viewports, project
  loops and all media/fallback checks. Its final complete-page accessibility check
  reported obscured target-size warnings for the hero quotation disclosure and
  three contact links after scrolling through the page. This is not an all-green
  full-suite result; the layout has not been changed to address that warning.
- Build freshness, publication/truth, sharing/redirect and search checks passed.
- Rendered desktop screenshot inspected; the roof video is visible behind the
  unchanged homepage content.

Evidence is saved outside the repository in
`C:/Users/pagiw/.codex/visualizations/2026/10/21/kingson-video-search/`.

## Google Search Console checked directly

Verified property: `https://www.kingsonengineering.co.zw/`.
Sitemap `/sitemap.xml`: Success; submitted and last read 20 October 2026;
nine discovered pages. The aggregate indexing report is still processing.

Individual URL Inspection results on 21 October:

| Path | Google's reported status |
| --- | --- |
| `/` | Page is indexed |
| `/structural-steel-harare` | Page is indexed |
| `/roofing-and-trusses` | Page is indexed |
| `/fibre-laser-cutting-harare` | Not indexed; first inspection said Discovered — currently not indexed; a later inspection said URL is unknown to Google |
| `/steel-fabrication` | Page is indexed |
| `/mobile-cranage-harare` | Page is indexed |
| `/privacy-policy` | Page is indexed |
| `/cookie-policy` | Page is indexed |
| `/terms-of-use` | Page is indexed |

Submission and indexing are separate. Eight pages were confirmed indexed; all
nine cannot be described as indexed. A fresh request for the laser-cutting page
was accepted: Google displayed “Indexing requested” and confirmed the URL was
added to a priority crawl queue. This does not mean the page is already indexed.
No DNS, DMARC, email or backend changes.
