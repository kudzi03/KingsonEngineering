# Quotation clarity preview — 20 October 2026

Branch: `codex/quote-clarity-preview`, based on production commit `d10a556`.
These changes are local only. No push, production deployment, DNS, DMARC or
business email configuration changes are part of this preview.

## Changes

- Four numbered commitment panels replace the homepage programme chart:
  acknowledgement the same working day, quotation within 5 working days,
  site visit arranged within 2 working days where needed, and portal frame
  programme 6–10 weeks from order. The owner supplied these commitments on
  20 October 2026. The five-day quotation supersedes the earlier “within the
  week”; its evidence is recorded in the publication gate and source of truth.
- The same commitments appear on service pages, with the portal-frame
  programme limited to the structural service. National delivery information
  remains in the existing coverage sections.
- Quotation and no-drawings FAQs appear on every service page. The rendered
  FAQ schema derives from those same answers.
- Quoting checklists beside the hero, major service/quotation actions and form
  cover preferred CAD formats, material/thickness, photos and approximate
  dimensions. Crane enquiries retain their more useful load/access/date brief.
- Call, WhatsApp and Email are available in the sticky header, section contact
  groups, enquiry area and existing mobile action bar. Header contact targets
  are at least 44px. The header also fits at 320px.
- The form starts with four fields: business name; phone/WhatsApp or email;
  brief description; optional drawing/file status. A native optional disclosure
  retains service, site and organisation details. The homepage defaults to
  “Not sure yet”; service routes retain their service preselection. Description
  is now required, replacing the mandatory service selection. The existing
  CRM payload, reference, duplicate guard, technical-email routing and failed
  save handoffs remain intact. No files are uploaded by the form.
- The short privacy note links to the full policies and accurately describes
  enquiry handling. Optional Analytics behaviour is preserved.
- Descriptive photo alt text now includes verified Kingson/workshop context
  where appropriate. No image claims that the pictured cut is 20mm thick.
  Decorative hero/background and duplicate logo images retain empty alt text
  to prevent repeated screen-reader announcements.
- Rebuilt smaller WebP files from original sources using free Pillow/libwebp;
  retained crops, dimensions and responsive variants. PNG logos were optimised
  losslessly. Of 105 audited public image assets, 52 became smaller: 13,146,612 to
  12,391,550 bytes, saving 755,062 bytes (5.74% across those assets, not per page).
  Stock reference collages excluded from deployment are excluded from these figures.
  Existing optimised JPEG share images were retained. A minimum 0.98 luminance
  block-SSIM comparison against the previous derivative guarded additional
  loss; visual before/after samples were also inspected. Unchanged candidates
  were retained if savings or similarity were insufficient. Originals and
  videos were not modified. Details: `tools/image-optimisation.json`.
- Public build manifests now use atomic replacement, matching the bundles,
  to avoid a Windows file-lock failure observed during local development.

## Validation

- Publication, source/bundle freshness, unique titles and descriptions,
  canonical/share URLs, entity/Service/FAQ schema and sitemap gates pass.
- 30 page/viewport checks at 390×844, 1440×900 and 1920×1080: no overflow,
  undersized tested targets, browser errors or axe accessibility violations.
- Additional overflow checks at 320, 768, 1024 and 1920px pass.
- Menu/focus handling, image viewer, FAQs, form validation, full and short
  enquiry payloads, successful reference, duplicate prevention, technical
  email/WhatsApp handoffs and failed-save fallbacks pass. All writes were
  intercepted; no test customer record or outgoing message was created.
- Chromium and WebKit consent suites pass: no optional requests before consent,
  grant, withdrawal, persistence, blocked-storage usability, no form contents
  in Analytics events, contact/lead events and separately requested maps.
  A WebKit immediate visibility assertion raced initialisation under load;
  the test now waits for the visible consent control. The isolated rerun passed.
- Desktop/mobile screenshots and image comparisons were inspected. A legacy
  hidden chart wrapper and a narrow service-header overflow found during
  review were corrected before the final checks.

The final service-brief wording adds material grades/thicknesses and gauge;
the static gates are rerun after rendering this copy-only refinement.

## Review locally

From the repository, run `node tools/preview-server.mjs` if port 4173 is not
already running. Open `http://127.0.0.1:4173/`, `/#how`, `/#enquiry` and a
service route. The preview is local to this computer and is not production.

To reproduce image optimisation, preserve the extracted handoff and run:

```powershell
python tools/optimise-images.py --input <handoff-folder> --ffmpeg <ffmpeg-binary> --report <output.json>
```

That command reports candidates without writing. Add `--apply` deliberately
after reviewing its output. Original source photographs are never overwritten.
