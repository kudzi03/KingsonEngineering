# HANDOVER — Kingson Engineering, final production pass

Internal. Not published: `.vercelignore` excludes `*.md` except `README.md`.

Last updated by the session that wrote this file. If you are picking this up
cold, read this top to bottom first — it is the checkpoint, not a summary.

## Where things are

| Thing | Where |
|---|---|
| Public site | https://kingson-engineering.vercel.app |
| CRM | https://kingson-engineering.vercel.app/crm |
| Supabase project | `fgzwcxwmaohowryzdgui` |
| Working branch | `claude/kingson-premium-redesign-rf2i0y` |
| Local test server | `python3 -m http.server 8210` from the repo root |
| Chromium for Playwright | `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` |

CRM logins (also in the scratchpad `creds.env`):

- `admin1@kingsonengineering.co.zw` — Mr Murandu, administrator
- `technical@kingsonengineering.co.zw` — Technical Office, staff

## Pre-client audit (23 Sept 2026)

Branch `audit/pre-client-2026-09-23`, rollback tag `pre-audit-baseline`
(= `e5b6665`, the production build before it). Commit messages carry the
detail; the open items are:

- **Supabase Auth: public sign-up is ON** (`/auth/v1/settings` →
  `disable_signup: false`) and a new auth user gets a Staff profile
  automatically (Settings screen says so). Turn off *Allow new users to sign
  up* in the dashboard. Adding staff via Authentication → Users still works.
- **Run `crm-src/supabase/migrations/20260923_flag_audit_tests.sql`** — flags
  ENQ-2452 (developer test) and ENQ-2453 (audit E2E test) as demo. Until then
  the dashboard shows two "real" open opportunities.
- The base schema (tables, RLS, `convert_enquiry`, `handle_new_user`,
  `is_staff`) is not in the repository. Dump it (`supabase db dump --schema
  public`) and commit it, so the database can be audited and rebuilt.
- Local testing without Python: `node .claude/serve.mjs . 8210` mirrors
  Vercel (cleanUrls, headers, .vercelignore).

## Latest pass — quote lifecycle (22 Sept 2026)

Commits `4b219e6` (CRM) and `7fb9c57` (site). SQL for every database change
is in `crm-src/supabase/migrations/20260922_*.sql`, applied to production in
this order: `lifecycle_enums`, `quote_lifecycle`, `quote_superseded`,
`harden_function_surface`.

**How a job moves now.** Every important transition is a database function
that checks `is_staff()` and does the business logic itself; the CRM screens
only collect input.

| Action | Function | What it does |
|---|---|---|
| Record quotation | `record_quote` | Numbered revision (`Q-<enq>-<n>`), draft, stage → quoting, next action "Send quotation …" today |
| Mark as sent | `mark_quote_sent` | Stamps `sent_at` + `sent_by`, follow-up = N working days (settings, default 3, Mon–Sat), replaces the next action, supersedes older revisions |
| Log follow-up | `log_follow_up` | Timeline entry by channel, quote sent → follow-up, books the next date |
| Customer replied | `mark_customer_replied` | Stops the chase, quote → "customer responded", next action "Respond to customer reply" today |
| Won / Lost / On hold | `decide_opportunity` | Won needs an accepted value; lost a coded reason; hold a reason + review date. Decisions stop follow-ups |

The stage select on the board and on the opportunity routes won/lost/on-hold
through the same dialogs; the database refuses them otherwise.

**Values.** No free-typed estimate any more. An opportunity's value is its
latest non-rejected quotation, or its won value. No quotation = "Not quoted
yet", never $0. `dashboard_metrics(p_include_demo)` computes every headline
figure, per currency.

**Demo data.** All lists pass `is_demo=eq.false` unless the browser's
Settings switch is on (then a warning strip shows on every screen).
`dashboard_metrics(false)` currently returns **zero real opportunities** —
every row in the database is demo or test data.

**Email.** `crm_settings.email_mode` = `manual`. The deployed `send-email`
(v2) returns `manual_mode` and sends nothing; `test` mode redirects every
message to `crm_settings.test_mailbox`; `connected` is disabled in the UI
until Kingson's mailbox credentials exist. Reply detection does not exist —
replies are recorded by hand.

**Tests that passed** (scripts in the session scratchpad: `life-ui.mjs`,
`life-staff.mjs`, `mail-mode.mjs`, `vp6.mjs`, `ld.mjs`): the whole lifecycle
in a browser as admin and as staff, reload persistence, overdue display,
dashboard sums, demo toggle, 390px layout, anon locked out of the view and
all functions, triggers still firing after the revokes.

**Still open**
- Kingson's mailbox credentials (for `connected` mode and the office alert).
- Supabase Auth → enable leaked-password protection (dashboard setting; the
  advisor flags it).
- Project portfolio metadata (unchanged, see below).

## How this repository works

Static HTML, CSS and ES modules. **No framework, no bundler, no package.json
for the public site.** Three things to know before editing anything:

1. **`tools/render.js` is the build.** It generates `index.html` (spliced
   between `<!--name-->` / `<!--/name-->` marker pairs), `sitemap.xml`, the
   five service routes and `404.html`. Run `node tools/render.js`. Never hand-
   edit a generated region — the next build overwrites it. `--check` fails if
   the committed files are stale.
2. **`tools/check-truth.js` is the publication gate.** It refuses to pass if a
   figure appears on the site that is not in `content/company.js` /
   `SOURCE_OF_TRUTH.md`, if an image is missing, if a page lacks the shared
   chrome, if an `aria-*` reference dangles or an id is duplicated. Run it
   before every commit.
3. **The CRM is built separately.** `crm-src/` is the source; `tools/build-crm.sh`
   bundles it with esbuild into `crm/` (3 files), which is what deploys. Edit
   `crm-src/`, then rebuild. `crm-src/` is excluded from the deploy.

## Done in this pass

- **404 page** rebuilt onto the shared chrome (was the last hand-written page:
  no header, no footer, no skip link, no `<main>`). Now generated by
  `notFoundPage()` in `tools/pages.js`, carries the service chooser and the
  enquiry form, `noindex`, never in the sitemap.
- **Service chooser** moved from `tools/render.js` into `tools/layout.js` so
  the home page and the 404 cannot drift.
- **Two markup defects fixed** in `index.html`: a duplicated `id="services"`
  (an orphan anchor span) and an `aria-labelledby="svc-h"` pointing at no
  element. Both are now asserted by the gate on every page.
- **Auditor voice removed** from the one place it still shipped (an HTML
  comment on the five service pages). Zero occurrences in visible copy.
- **Quote references fixed** — see below.

## Phase 6 — the enquiry → CRM chain, tested live

Submitted through the real form on the deployed site, POST returned **201**.
Every link verified in the database and in the CRM UI:

| Link | Result |
|---|---|
| Website enquiry | `enquiries` row, `source=website`, `page=/` |
| Company | created |
| Contact | created; a second enquiry from the same phone **de-duplicated** onto it |
| Opportunity | `ENQ-2443`, stage `new` |
| Source | `website` |
| Activity | `enquiry` — carries the whole brief |
| Owner / initial state | arrives **unassigned**, by design; assigned in one click from Edit |
| Next action | "Respond to the website enquiry" |
| Due date | next working day |
| Follow-up queue | task created: high, open, channel Phone; shows on dashboard and Follow-ups |
| Pipeline | new → contacted → requirements → quoting, all persisted |
| Quote | `Q-2443-1`; setting it to *sent* auto-advances the stage and books a chase |
| Won | stage change logged, "Open a project" appears |
| Project | opened with value, start, target (+56 days), owner, client, activity |

Reload persistence confirmed at every step.

## Real defect found and fixed

**Quote references used two different schemes.** `quotes.reference` defaulted
to `Q-####` from a sequence, but every seeded quote read `Q-<opp number>-<rev>`.
The first quote created in the demo came out `Q-1216` next to `Q-2404-1`, which
in a meeting reads as the system being broken. Fixed with a `BEFORE INSERT`
trigger that derives the reference from the opportunity's ref and the revision,
plus unique indexes on `(opportunity_id, version)` and on `reference`.
SQL committed at `crm-src/supabase/migrations/20260921_quote_reference.sql`
and already applied to the live project.

## Two false alarms — do not "fix" these

- **`text/plain` on `/crm/app.css`** appeared once in a headless run. Vercel
  serves it as `text/css` on every curl, six for six, and the stylesheet
  applies. It was the agent proxy interposing, not the site.
- **A 502 on the enquiry POST** in one run. The POST returned 201 and the row
  is in the database. Same cause.

## All phases complete and deployed

Production is serving commit `26c8a51`. Verified live: all six indexed pages
plus the 404 at 390px and 1440px — one h1 each, focusable `<main>`, skip link,
footer, WhatsApp, enquiry form, valid structured data, no broken images, no
console errors. The CRM's nine screens load on production with no errors.

Everything below was done in this pass:

| Phase | Outcome |
|---|---|
| 1 — consistency | 404 onto the shared chrome; duplicate `id`; dangling aria reference; chooser de-duplicated into `layout.js` |
| 2 — copy | auditor voice removed from its last shipping place |
| 6 — enquiry → CRM | walked live, every link verified; quote-reference defect found and fixed |
| 7 — CRM audit | nine screens, two roles, files, mobile; three queries collapsed to one |
| 8 — contact | WhatsApp into the home hero and the phone bar; bar steps aside for the hero |
| 10 — accessibility | src-less `<img>`; skip link that did not move focus; avatar with no accessible name |
| 12 — performance | content layer off the browser's payload, 99.8 KB → 82.0 KB |
| 13 — QA | 580 links checked and now gated; JS-off, reduced-motion, keyboard |
| 11 — SEO | `DOMAIN_MIGRATION.md` written, not executed |

## Still to do

- Nothing blocking. The only outstanding item is **project portfolio
  metadata**, which is content entry, not development — see below.
- Optional, noted but deliberately not done: the CRM login → dashboard is
  ~3.4s on production, dominated by four serial round trips (auth token,
  profile, enum values, then the parallel data fetch). In-app navigation is
  433–662ms, so this is a once-per-session cost. Parallelising the middle two
  is the fix if it ever matters.

## Known limitation, not a defect

`content/projects.js` holds the finished portfolio architecture and an **empty
list**. `/projects`, its nav item, its sitemap entry and its structured data
are all conditional on `hasProjects()`, so none of it ships today. The moment
the office fills in `PROJECT_METADATA.md` and the entries are added, the whole
path lights up with no further development. Do not invent project metadata.

## Test data in the live database

**Every row in the database is now `is_demo = true`**, the seeded demo records
and every test record — including `ENQ-2445` (the owner's own test through the
live form) and the automated lifecycle tests `ENQ-2448`–`ENQ-2450`. So `crm-src/tools/wipe-demo.sql` clears the
lot in one command, and the first enquiry Kingson receives after the meeting
will be the only live record in the system.

Nothing was deleted. `ENQ-2443` is worth keeping on screen: it is a complete,
honest journey — website enquiry, contact, opportunity, activity, owner, next
action, three pipeline moves, quotation `Q-2443-1` issued and sent, won, and
an open project with a file attached to it.
