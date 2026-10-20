# Kingson Engineering — cinematic redesign review

Date: 20 October 2026. The original redesign was approved and deployed.
The inline-playback follow-up uses `codex/inline-project-videos`; see the final
section for the current media presentation, which supersedes the popup player.

## Source audit and repository baseline

- Fetched the latest remote repository before editing. `origin/main` was
  `f516166434ce208d286e6ed1119b546e3605b537`; its four commits after the domain
  fix only added the handoff ZIPs. The new feature branch includes those uploads
  and the existing editorial preview's static rendering/performance pipeline.
- The start document was packaged as `KINGSON_CODEX_START_HERE_ONLY.zip`, rather
  than a loose Markdown file. Extracted it and all three source archives into
  the same scratch directory, preserving paths and checking for conflicting
  archive entries. Read every word of `KINGSON_CODEX_START_HERE.md`,
  `CODEX_START_HERE.md`, `CODEX_TASK.md` and `ADDITIONAL_PROJECT_C_README.md`.
- Input directory on this machine:
  `C:\Users\pagiw\AppData\Local\Temp\kingson-cinematic-input`.
  Originals were never overwritten. The three committed source archives are
  also unchanged and remain excluded from Vercel's public files.
- Audited the live official site and the local editorial preview, including
  before screenshots at 1440×900 and 390×844. Both had correct official-domain
  canonical metadata; neither used video. The live site had a full-image
  slideshow with diagram annotations and dense text. The editorial preview
  pushed the main image beneath a large text area. Neither presented the newly
  supplied project films or architectural work.
- Kept static HTML/CSS/ES modules, committed generated pages and the existing
  enquiry implementation. No framework migration, domain, DNS or email changes.

## Reference interpretation

Reviewed the entire **18.20-second** `reference/user-design-reference.mp4`,
including its closing promotional segment. Decoded the complete video and
inspected a continuous 0.25-second frame sequence, alongside the supplied
contact sheet. The reference is a phone recording of a construction website
on a laptop; the physical camera movement and edited cuts limit what can be
inferred about the website's own animation.

1. **0–2.2 s:** a house photograph fills the website's opening viewport.
   Compact white navigation sits over the image; central identity, a short
   description and two outlined actions let the building remain dominant.
2. **2.25–4.5 s:** the page changes to a light project gallery. Photographs use
   most of the width, with a large leading image and smaller aligned views.
   Captions and gutters are restrained rather than decorative card shells.
3. **4.75–6.75 s:** a dark testimonial section creates a clear tonal change.
   Oversized editorial headings sit over pale review panels. Kingson has no
   supplied verified testimonials or ratings, so that content was not copied.
4. **7–9.25 s:** the opening is shown again with construction imagery changing
   from a frame under construction to a house exterior. This gives a useful
   principle: imagery can change while identity and actions stay stable.
5. **9.5–10.5 s:** a light services section pairs small work images with large
   service names, using rows and shared alignment instead of identical cards.
6. **10.75–14 s:** the contact/footer uses a strong dark ground, a large contact
   invitation, concise contact information and a persistent call action.
7. **14.25–18.2 s:** the social-media promotion fades to its end card. The
   Instagram text, watermark, laptop frame and another company's identity are
   recording context, not Kingson design assets.
8. Many section changes are **cuts in the reel**, not evidence of scroll
   hijacking or elaborate website transitions. The implementation therefore
   uses natural scrolling, short photographic reveals, quiet media fades and
   progressive cross-document fades where the browser supports them.

The translation is industrial: Kingson's actual roof geometry replaces the
house, Archivo replaces the reference's company typography, and Kingson's
real logo/red accent anchors a steel-blue, charcoal and light-paper palette.

## Implemented design

- Full-viewport film opening with a compact overlaid header, short two-line
  headline, **Request a quote** and **Our projects** actions. No loading screen
  blocks navigation or the enquiry form.
- A clearer desktop roof film from C, and a separate portrait A/C edit. A
  responsive, eager-loaded photograph appears first and survives blocked
  autoplay, missing media, reduced motion, data saving and JavaScript failure.
- A persistent play/pause control. Films stop when the hero leaves the viewport,
  the document becomes hidden, another project film opens, or reduced motion is
  enabled. Manual pause survives subsequent viewport changes.
- A guarded loop restart also handles the WebKit media backend that was observed
  rewinding an MP4 but leaving it paused. The safeguard respects visibility,
  user pause, reduced motion and open dialogs; verified by observing a real wrap
  and resumed playback in both Chromium and WebKit.
- Selected work follows the opening immediately: large roof imagery, offset
  photographic compositions and two substantial architectural photographs.
  C leads the desktop roof composition because its simpler geometry survives
  enlargement better. No fictional clients, dates, dimensions or project names.
- Full project films open in a keyboard-accessible native dialog with controls,
  a written visual description, posters, Escape dismissal and focus restoration.
  Ordinary MP4 links still work without JavaScript.
- The workshop becomes a dark photographic section with a walkthrough link;
  service choices, laser details, cranage, specifications, commitments, FAQ,
  contacts and enquiry form remain available. The supplied balustrade photograph
  now also illustrates that capability in the service chooser.
- Mobile typography and actions were revised after inspecting actual renders.
  No scroll locking outside open dialogs/menus and no fabricated project stats.

## Every supplied project asset

These are descriptive image/film labels, not claims about official project
names, locations, clients, dates or completion status.

| Supplied file | Actual use | Processing |
|---|---|---|
| `workshop-walkthrough.mp4` | Workshop section poster and full silent walkthrough | All 12 s retained; native 512×910; gentle cleanup; H.264 fast-start |
| `roof-structure-project-a.mp4` | Large roof-work photograph, full film and portrait hero sequence | Full 25.4 s silent film; native 512×808; hero uses the steadier 19.4–23.4 s portion |
| `roof-structure-project-b.mp4` | “Watch another roof view” film and its own poster | 0.3–15.3 s retained; cropped to 512×860 at y=140 to remove phone/status/reply UI; final Control Centre sequence excluded |
| `roof-structure-project-c-ORIGINAL.mp4` | Leading desktop roof view, full film, desktop opening and portrait hero sequence | Full 28.267 s silent film at 512×910; hero uses 16–20 s; desktop crop 512×288, camera pan slowed by 1.4× |
| `architectural-glass-exterior.jpeg` | Large staircase detail, full-image viewer and balustrade capability thumbnail | Original 1536×1152 retained in staging; responsive WebP at 440/720/1100/1536; no fabricated detail |
| `architectural-atrium-interior.jpeg` | Large atrium detail and full-image viewer | Same responsive sizes; natural original colour and composition |
| `reference/user-design-reference.mp4` | Design analysis only | Never copied into public assets or published |
| Both supplied contact sheets | Inspection only | Never published as project imagery |

Existing photographs, logos and font files are retained. The original roof-frame
photograph remains on the appropriate service pages; the homepage sitemap was
updated to describe the media the redesigned homepage actually presents.

## Video enhancement: what changed and what did not

All original clips are 512 pixels wide, H.264 at 30 fps. A is 808 pixels tall;
B is 1112; C and the workshop clip are 910. Their original aggregate size is
approximately 51.5 MB. The four silent project exports total approximately
22.3 MB and only load after a visitor opens them.

`tools/build-project-media.py` reproduces the derivatives from the extracted
handoff. `tools/project-media-build.json` records original SHA-256 hashes,
crops, durations and output sizes. C's original hash matches the supplied
`c3d883175019a688e8912c67991e10127f8f6f361c47b59fcfee9d4513a17a53`.

- Applied mild temporal/spatial denoising (`hqdn3d`), a small contrast adjustment
  and saturation reduction, and low-strength sharpening. These reduce visible
  compression/noise and balance the footage; they do not restore lost detail.
- Removed all audio from web derivatives. Hero edits use 24 fps, short cyclic
  fades, H.264/MP4 fast-start and VP9/WebM alternatives. No synthetic frames or
  generated engineering imagery.
- Chose steadier camera segments rather than aggressive stabilisation. Retained
  the original steel geometry and intentional pans; no geometric warping was
  applied. Slowing C's camera pan is a presentation change, not an increase in
  captured resolution.
- Tested **real learned super-resolution** locally with the original project's
  portable Real-ESRGAN NCNN/Vulkan executable, the `realesrgan-x4plus` model and
  the machine's AMD GPU. Compared a native roof-A frame, subtle cleanup and the
  neural 4× result at desktop display scale. The neural result introduced
  ragged/false steel edges and waxy roof-panel texture. Rejected it; no AI
  enhancement output is shipped. This was a still-frame feasibility test, not
  a claim to have validated temporal AI restoration on the full films.
- A's fine lattice looked too soft in the first wide desktop video trial. It
  was replaced there by C's larger, clearer members. The source remains visibly
  softer than a good high-resolution original on a large monitor.

The default remains video-led. Compare the sharper photographic treatment at
`http://127.0.0.1:4173/?hero=still`. Native landscape originals would be the
material improvement for a future 1920-pixel cinematic film; ordinary upscaling
cannot supply that missing detail.

Sources for the processing/playback approach:
[FFmpeg filters](https://ffmpeg.org/ffmpeg-filters.html),
[Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN),
[browser autoplay guidance](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay).

## Verification

- Static publication, generated-file consistency, official canonical/OG/Twitter
  URLs, internal links, image manifests, sitemap and search/schema checks pass.
- Browser integration: 21 page/viewport checks across the homepage, five service
  routes and 404 at 390×844, 1440×900 and 1920×1080; no horizontal overflow,
  broken images, undersized checked targets, runtime errors or automated WCAG
  A/AA violations. Additional 320/768/1024/1920 widths checked for overflow.
- Navigation/menu focus, photograph viewer, FAQ, required-field validation,
  enquiry payload/reference, duplicate prevention, WhatsApp, technical-email
  handoff and failed-save fallbacks pass. Test writes are intercepted.
- Media checks cover all three required viewport sizes, actual loop wrap,
  pause/resume, dynamic reduced motion, off-screen suspension, no automatic
  video requests under reduced motion/Save-Data/slow-2g/still treatment, autoplay
  rejection/network-failure posters, all four full-film decodes, dialog keyboard
  containment/Escape/focus restoration, VP9 and H.264, and HTTP byte ranges.
- Supabase CRM health checked on 20 October: **ACTIVE_HEALTHY**. The existing
  enquiry adapter is unchanged. Earlier separately approved recovery verified
  the anonymous submission-to-CRM pipeline in a rolled-back transaction. This
  redesign did not send a real customer enquiry or test outbound email delivery.

### Final local Lighthouse measurements

| Metric | Desktop | Simulated mobile |
|---|---:|---:|
| Performance | 96 | 79 |
| Accessibility | 100 | 100 |
| Best practices | 100 | 100 |
| SEO | 100 | 100 |
| First contentful paint | 0.4 s | 1.4 s |
| Largest contentful paint | 0.8 s | 3.3 s |
| Total blocking time | 150 ms | 520 ms |
| Cumulative layout shift | 0 | 0 |

Measured in Chrome against the local gzip-enabled preview with the real default
video treatment. These are lab measurements, not field INP or a guarantee for
every device/network. An initial mobile run scored 75 with 770 ms blocking time;
the trace identified a forced layout in the motion setup's viewport read. Using
media queries there reduced blocking time in the final run. Logo source sizes
were also corrected to avoid a rounding-related aspect-ratio warning.

Mobile **79 remains a limitation**: the long static page still incurs layout
work on a simulated slower CPU, and the portrait opening is a 2.21 MB MP4. The
desktop opening is 0.67 MB. Project films do not load until selected; reduced
motion, Save-Data and slow-2g load no background film. Compressed CSS/JS are
approximately 22 KB / 10 KB. No content was removed to inflate a score.

The media suite also passed in **Playwright WebKit 26.5 on Windows**, including
the complete visited homepage accessibility check. This is an engine check,
not a physical iPhone/Safari or Low Power Mode test. A real-device check remains
appropriate before production approval. Outbound email delivery was not tested.

### Review artifacts

- Running local preview: `http://127.0.0.1:4173/`.
- Photographic comparison: `http://127.0.0.1:4173/?hero=still`.
- Screenshots and QA evidence:
  `C:\Users\pagiw\.codex\visualizations\2026\10\20\kingson-cinematic`.
- The evidence folder contains the three requested viewport captures, desktop
  and mobile full-page images, project/workshop detail captures, before images,
  enhancement/UI-cropping comparisons, browser/media result JSON and Lighthouse
  reports.

### Change map

| Files | Change |
|---|---|
| `tools/cinematic.js`, homepage skeleton in `index.html`, `tools/render.js` | New film-led opening, selected-work composition, film dialog and workshop walkthrough; removed the obsolete numbered side ruler |
| `styles/cinematic.css`, `styles/public.css` | Cinematic art direction, responsive layouts, readable overlays, image sizing, dark workshop, dialog and progressive page fades |
| `scenes/hero-film.js`, `scenes/project-film.js`, `main.js` | Playback policy, codec selection, loop recovery, controls, modal focus and media lifecycle |
| `scenes/reveal.js`, `scenes/parallax.js` | Media-query viewport checks avoid a forced initial layout while retaining the existing motion rules |
| `content/assets.js`, `content/runtime-copy.js`, `content/copy.js` | Real media entries/captions, updated hero copy, balustrade thumbnail, accurate homepage image list and modification date |
| `tools/build-project-media.py`, `tools/project-media-build.json`, new `assets/video/*` and photographic WebPs | Reproducible native-resolution silent exports, responsive photographs/posters and source provenance |
| `tools/build-images.py` | Preserve handoff-media manifest entries when rebuilding the original photograph set |
| `tools/layout.js` | Responsive hero preloads, overlaid/solid logo states, project navigation label and logo aspect correction; official origin retained |
| `assets/site.min.css`, `assets/site.min.js`, `tools/public-build.json`, six generated routes, `sitemap.xml` | Regenerated shipping artifacts and consistent metadata |
| `tools/build-public.mjs`, `tools/check-search.mjs`, `tools/check-truth.js` | Include the new stylesheet; recognize legitimate body/header classes without weakening content/URL checks |
| `tools/test-browser.mjs`, `tools/test-media.mjs`, `tools/preview-server.mjs` | Required viewport coverage, clipped-media checks, media/fallback/accessibility tests and local HTTP video range support |
| `README.md`, `SOURCE_OF_TRUTH.md`, this report | Updated workflow, owner-supplied media provenance, design rationale, results and limits |

The feature branch carries forward the previous preview's static CSS/JS bundling,
responsive logos and search-readiness fixes (including visible/structured FAQ
consistency and valid Service schema properties). `REDESIGN_REPORT.md` records
that earlier foundation; this report supersedes its visual direction and scores.

## Production boundary

The official-domain metadata and old-host redirects are preserved. No domain,
DNS, Vercel production settings, CRM schema, business mail or unrelated
functionality was changed during preparation. The owner approved deployment
on 20 October 2026, together with the adjustments below.

No manual Vercel dashboard change is required for the redesign. Keep the official
`www.kingsonengineering.co.zw` domain and the existing host-scoped redirects.
The old Vercel hostname already redirects to the official domain. A protected
Vercel preview may require the owner's Vercel login; protection settings were
not changed.

## Approved final adjustments — 20 October 2026

- Removed the visible background-film play/pause button and its manual-toggle
  code. The hero plays and loops automatically; reduced-motion, data-saving,
  off-screen suspension and autoplay-failure posters remain in place. Full
  project films retain their native controls.
- Added a direct Email action to `admin1@kingsonengineering.co.zw` beside Call
  and WhatsApp in the mobile bar, menu, enquiry sidebar, FAQ contact actions
  and service-page hero actions. This opens the visitor's email application.
- Rebalanced the mobile bar into four equal contact targets and regenerated
  the public HTML and versioned CSS/JavaScript bundles.
- Updated browser checks for the email actions and media checks for automatic
  playback without a visible toggle. No DNS, DMARC or email-service settings
  were changed.

## Inline project playback — owner-requested follow-up

Removed every Watch film/another-view action and the film popup, its focus
handling and unused styles. The project imagery now becomes silent footage
inside the same frames: A and B cycle in the trusses frame; C and the workshop
walkthrough loop in their own frames. The workshop footage takes the place of
the previous small film thumbnail; its original photograph remains the still
fallback. Original media exports are unchanged.

Only a frame entering the viewport loads and plays its footage. Off-screen or
hidden-tab footage pauses, and reduced motion, Save-Data, slow 2G, autoplay
rejection and media errors retain the photographs. There are no film buttons
or playback overlays. Service links, photo-detail zoom, enquiry forms and all
four contact actions remain intact. DNS, DMARC and mail settings are unchanged.

The media suite checks all three frames at the required desktop/mobile sizes,
both roof-angle transitions, native loops, visibility/preference changes and
loading/failure fallbacks. The page suite covers the six routes plus 404,
accessibility, navigation and intercepted enquiry submissions.
