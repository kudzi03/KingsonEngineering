# Kingson Engineering — implementation plan

Audit complete. See `SOURCE_OF_TRUTH.md` for the facts and `ARCHITECTURE.md`
for the stack decision and the system shape.

---

## Milestone 0 — Discovery / audit · **DONE**

- Returned *Information required* document read page by page at native
  resolution. Every tick, correction and blank recorded.
- Logo artwork read; brand colours sampled (`#E21E25`, `#039647`, `#2B2A28`).
- All 22 photograph files inspected → 11 unique images, of which 9 are
  Kingson's own work and 2 are stock collages that must never be published.
- Repository and running site inspected; stack assessed and retained.
- TRW notes read as implementation research. Techniques adopted (structured
  data, sitemap, automation boundary, error monitoring, issue discipline);
  subjects and stack choices not copied.
- Deliverables: `SOURCE_OF_TRUTH.md`, `ARCHITECTURE.md`, this file.

### What the audit changes

| Finding | Consequence |
|---|---|
| Six services confirmed, not four | add balustrades and gates, stainless fabrication |
| `kingsonnkm@gmail.com` struck out | replace with `admin1@` / `technical@` |
| Hours are Monday–**Saturday** | correct the live site — it is currently wrong |
| Full confirmed specification set exists | publish it where a buyer needs it |
| Five commitments authorised | publish them; they are the credibility |
| Facebook URL unreadable | link removed until Kingson sends it |
| Original page 5 missing | sections 9–10 unanswered; request it |
| Two services have no photograph | list them honestly, without stock imagery |
| Real logo supplied | replace the type-only wordmark; adopt red/green |

---

## Milestone 1 — Experience foundation · **DONE**

1. Brand: real logo asset (header lockup + footer), brand palette in
   `tokens.css` with a text-safe red derived from `#E21E25`.
2. Type scale, spacing scale, radius scale carried over from the approved
   reference system.
3. Layout primitives: `wrap`, section rhythm, centred section head, card.
4. Media pipeline: derivatives for every published photograph, correct
   `srcset`/`sizes`, no layout shift.
5. Accessibility floor: measured contrast, 44 px targets on a phone and the
   24 px AA minimum on desktop, focus states, reduced motion.

## Milestone 2 — Core website · **DONE**

1. **Hero** — portal frame, the confirmed positioning, three actions.
2. **What we do** — all **six** confirmed services. Each carries what it is,
   what to send, and its confirmed figures. The two without photographs carry
   a spec plate, not stock imagery.
3. **Specifications** — the confirmed IBR / corrugated / flashing / laser
   figures, revealed in disclosures rather than dumped as a wall of tables.
4. **How it works** — the five confirmed commitments as the process. This is
   the single most valuable thing the returned document unlocked.
5. **Recent work** — eight of the nine genuine photographs, viewable full
   size; the ninth carries the full-width band.
6. **Get a price** — structured enquiry: service (the six), location,
   description, drawing availability, declared file formats (DXF, DWG, STEP,
   PDF as confirmed), preferred contact. Hands off to WhatsApp or `admin1@`.
7. **Contact** — both emails, both numbers, hours, address, named contact.
8. **SEO / AEO** — `LocalBusiness` + `Service` ×6 + `FAQPage` structured data,
   per-page metadata, canonical, OG, `sitemap.xml`, `robots.txt`, semantic
   headings, crawlable specifications. FAQ answers drawn only from confirmed
   facts, written in the language a buyer would ask an assistant.

### What M1 and M2 actually shipped

| | |
|---|---|
| Brand | Logo lockup in the header, menu, footer and 404, plus a reversed variant for the dark grounds. Palette sampled from the artwork; `--red-ink` (6.01:1 on white) and `--red-on-dark` (4.50:1 on `#1a1e1c`) both computed, not eyeballed |
| Sections | Hero → strip of four confirmed facts → six services → full-width band → 29 specification figures in five `<details>` → eight-photograph gallery on dark → five-commitment rail → structured enquiry → ten questions → contact → footer |
| Two photoless services | A spec plate carrying the one confirmed figure that matters, sized where the photograph would have been. No stock imagery |
| Enquiry | Name, company, contact, service (the six plus "more than one" and "not sure yet"), site, description, drawings. Required: name, contact, service. Composes a message and hands it to WhatsApp or mail. A drawings enquiry routes to `technical@`. **No file input** — a static page cannot upload, and a picker that only lists filenames reads like an upload |
| Structured data | One `@graph`: `LocalBusiness` (with `openingHoursSpecification` for Mon–Sat 07:30–17:00 and a `ContactPoint` naming Mr Murandu) + `Service` ×6 with their confirmed figures as `additionalProperty` + `FAQPage` ×10. Asserted to parse and to contain no empty values |
| Generated artefacts | `index.html` **and** `sitemap.xml` both render from `content/`; `--check` fails on drift in either |
| The gate | Rewritten. Three assertions — gated values, unconfirmed claims, retired values — over 12 served files. The claim patterns read written numerals too, so "six to ten weeks" and "two working days" are caught like "6 weeks". Confirmed figures pass via a citation-carrying allowlist. Proved against 16 deliberately injected violations, all 16 caught |
| Fixed on the way | The 404 page was styling itself against tokens deleted two passes ago and rendered with no colour at all; the contact block printed `undefined` for a missing WhatsApp label; the photograph viewer showed the placeholder string "Photograph" instead of the caption; the viewer's `aria-modal` had no focus trap |

### Not done in this pass, deliberately

- **3D.** No authentic Kingson model exists, and the reference the owner chose
  has none. `experience/geometry.js` at `24ff29b` is recoverable if that
  changes. See `ARCHITECTURE.md`.
- **File upload.** Needs the M3 API and object storage. Until then the form
  says which formats to attach and does not pretend otherwise.
- **Facebook link.** Held back by the gate until Kingson sends it.

---

## Milestone 3 — Enquiry pipeline · next pass

`POST /api/enquiry` → Supabase persistence → internal notification →
customer acknowledgement. Pipeline states and the admin opportunity view.
Blocked on nothing technical; needs a Supabase project and the decision to
provision it.

## Milestone 4 — Follow-up system · after M3

Event adapter, acknowledgement on the same working day (confirmed),
configurable chase cadence shipped **off**, stop-on-reply, n8n boundary.

## Milestone 5 — Won-job handoff · after M4

Accepted state, materials and production visibility. No ERP.

## Milestone 6 — Hardening · continuous

Cross-browser, mobile, accessibility, performance, Sentry, documentation.

---

## Open items for Kingson

These are the only things blocking a complete public site. None of them stops
this pass from shipping.

1. **The Facebook page link** — send it by WhatsApp rather than writing it out;
   the handwritten version cannot be transcribed safely.
2. **A photograph of page 5** of the information document — sections 9 and 10
   were never seen.
3. **Photographs of a balustrade, a gate, and a stainless job** — two confirmed
   services currently have no visual evidence.
4. **A photograph of fabrication in progress** — welding or assembly in the
   workshop. The strongest evidence for structural steelwork, and missing.
5. **Confirm the crane capacity verbally** — 25 tonnes is written clearly in
   the confirm column; the draft-column copy carries an ambiguous mark.
6. **Whether the site should move to `kingsonengineering.co.zw`** — the domain
   exists (the confirmed email addresses use it).
7. **The IBR rib pitch.** §2 gives both "686 mm cover, five ribs" and "rib
   height / pitch 36 mm / 200 mm", and 686 / 5 = 137.2 mm. Both figures are
   published in the specification table as written, but the drawn section uses
   only the consistent set. Which is right?
8. **Photographs of fabrication in progress, a balustrade, a gate and a
   stainless job.** The FABRICATE chapter is currently carried by drawn fold
   geometry because there is no photograph of that work at all.
