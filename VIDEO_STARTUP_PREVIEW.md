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
remain in place. There are no new controls, dependencies, footage or business-copy
changes.

`tools/test-media.mjs` adds a regression that holds eager logo requests pending
and requires the visible video to play while the document is still interactive,
without any user input. `assets/site.min.js` and `tools/public-build.json` are
rebuilt. All ten public HTML files receive the generated asset-version change.

## Accessibility and loop follow-up

The full diagnostic located the target-size warning in the workshop contact block,
not the hero as initially reported. The following crane section's image-viewer
button inherited the oversized parallax frame, extending its bounds above the
visible section. `tools/render.js` and `styles/cinematic.css` now keep the button
inside the crane section and move just an inner photo span. The photograph retains
the same overscan, crop and parallax treatment. The viewer still opens normally.

`scenes/hero-film.js` and `scenes/project-film.js` also remove a brittle 0.1-second
limit on paused-loop seek recovery. A WebKit decoder can rewind past that timestamp
and remain paused. Recovery now always goes through the existing visibility,
reduced-motion and data-saving guards after a paused native loop seek.

`interface/image-viewer.js` and `main.js` pass the clicked opener explicitly, so
Safari returns focus to the image button when its dialog closes even if pointer
clicking never focused the button. The click handler, viewer contents and styling
otherwise remain unchanged.

`tools/test-contact-layout.mjs` checks six screen sizes in each browser: native
keyboard operation of hero/workshop checklists, 44px contact targets, expanded
layout overflow, crane button containment, image-viewer opening, Escape closing
and focus restoration. `tools/test-media.mjs` additionally checks recovery after
a paused seek past 0.1 seconds, including offscreen and reduced-motion safeguards.
The public CSS and JS bundles and homepage crane markup are regenerated.

## Validation

- Production before-change reproduction: delayed eager image prevents startup;
  ordinary load plays without user input.
- Chromium: complete media suite passed at 1440×900, 1920×1080 and 390×844,
  including startup regression, loops, project playlists, offscreen pause/resume,
  reduced motion, data-saving cases, blocked playback/network fallbacks, codecs,
  byte ranges and hero accessibility.
- WebKit: after the follow-up fixes, the complete media suite passes at all three
  viewports, including seek recovery, loops, guarded pause/resume, codecs and
  fallbacks. Its final complete-page accessibility audit passes with no violations.
- The focused before/after WebKit diagnostic reproduced the target-size warning
  before the crane fix and returns no violations after the fix, both after a full
  page scroll and on returning to the top. No accessibility rule was disabled.
- Contact-layout regression: all six screen sizes pass in Chromium and WebKit
  (12 cases), including the 320px phone and 1280×720 laptop layouts. Pointer and
  keyboard operation, image-viewer focus restoration and contact target sizes pass.
- Broad browser review: all ten public routes pass at 390px, 1440px and 1920px
  (30 page/viewport cases): no overflow, small targets, broken images, accessibility
  violations or runtime errors. Six interaction groups pass, including navigation,
  FAQs, image dialog, enquiry validation/submission/failure fallbacks and no-JS
  content. All enquiry writes are intercepted locally.
- Build freshness, publication/truth, sharing/redirect and search checks passed.
- Rendered desktop screenshot inspected; the roof video is visible behind the
  unchanged homepage content.

Evidence is saved outside the repository in
`C:/Users/pagiw/.codex/visualizations/2026/10/21/kingson-video-search/` and
`C:/Users/pagiw/.codex/visualizations/2026/10/21/kingson-accessibility/`.

## Changed files in the combined preview

- `scenes/hero-film.js`: remove the page-load gate and broaden guarded loop recovery.
- `scenes/project-film.js`: broaden guarded loop recovery.
- `main.js`, `interface/image-viewer.js`: restore focus to the explicit image opener.
- `styles/cinematic.css`, `tools/render.js`: bound the crane viewer button and move
  parallax onto its inner photograph.
- `tools/test-media.mjs`: startup and paused-seek regression coverage.
- `tools/test-contact-layout.mjs`: contact, checklist, crane and focus regressions.
- `assets/site.min.js`, `assets/site.min.css`, `tools/public-build.json`: rebuilt
  bundles and build manifest.
- `index.html`: generated crane wrapper and asset versions.
- `404.html`, `cookie-policy.html`, `fibre-laser-cutting-harare.html`,
  `mobile-cranage-harare.html`, `privacy-policy.html`, `roofing-and-trusses.html`,
  `steel-fabrication.html`, `structural-steel-harare.html`, `terms-of-use.html`:
  generated asset versions only.
- `VIDEO_STARTUP_PREVIEW.md`: findings, corrections and validation record.

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
