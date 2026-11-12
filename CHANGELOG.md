# Change log

Material changes to the Kingson Engineering website repository. Newest first.

## 12 November 2026: enquiries to Google Sheets, header tightening, handover documentation

Branch: `claude/charming-euler-515w4y`. Code commit: `537d3c5`. Documentation, the checks workflow and the font licence texts follow in later commits on the same branch.

**Not deployed to production.** Production still serves commit `8abd92b` from 6 November 2026. A Vercel preview deployment of `537d3c5` built successfully and `GET /api/enquiry` on it answered 405 as designed.

**Not live.** The Google Sheets integration needs a Kingson-owned Google account, spreadsheet and service account, and three environment variables in Vercel. Until then `/api/enquiry` answers 503 and the form shows the WhatsApp and email handoff. It has been tested against a faked Google only.

### Why

Kingson Engineering is taking over the website. New public enquiries must go to a spreadsheet Kingson owns, not to the CRM database in the developer's Supabase organisation. A security audit on the same day also found items to tighten.

### Added

| File | What | Why |
|---|---|---|
| `api/enquiry.js` | Vercel serverless function. Accepts a same-origin JSON POST, validates it and appends one row to a Google Sheet through the Sheets API with a service account. No npm dependencies | Keeps the Google credential on the server. Server-side validation, rate limiting, duplicate handling and formula-injection protection |
| `content/enquiry-endpoint.js` | The path the form posts to (`/api/enquiry`) and `canSubmit()` | Replaces `content/crm.js` in the public bundle |
| `tools/test-enquiry-api.mjs` | 17 tests for the function, with Google faked in process | Proves the function's behaviour without touching a real sheet |
| `.env.example` | The four variable names with placeholders | Configuration template without secrets |
| `.github/workflows/checks.yml` | Runs the six publication checks and the endpoint tests on every push and pull request. Uses no third-party action and installs no package | The checks previously ran only when a developer remembered. The production commit was failing its own gate |
| `assets/fonts/OFL-Archivo.txt`, `assets/fonts/OFL-Inter.txt` | SIL Open Font License 1.1 texts with the fonts' copyright notices | The licence asks that its text accompany the fonts |
| `docs/ENQUIRIES_GOOGLE_SHEETS.md`, `docs/SECURITY.md`, `docs/OPERATIONS.md` | Operating guides | Handover |
| `CHANGELOG.md` | This file | Handover |

### Changed

| File | What | Why |
|---|---|---|
| `interface/send-enquiry.js` | Posts to `/api/enquiry` instead of the Supabase REST API. Sends the form fields, the page path, the honeypot value and the time since the script started | New enquiry destination |
| `interface/enquiry.js` | Imports `canSubmit` from `content/enquiry-endpoint.js`. Comments updated | Follows the above |
| `content/policies.js` | Privacy policy now says enquiries go through the website's server to a Google Sheets spreadsheet owned by Kingson, that earlier enquiries are held in the earlier system hosted by Supabase, and that Google and Vercel process data outside Zimbabwe. `POLICY_DATE` set to 2026-11-12 | The policy must describe what the site does. Set the date to the real publication day when deploying |
| `content/runtime-copy.js` | Comments only | Accuracy |
| `tools/security-headers.mjs` | Public `connect-src` no longer lists the CRM's Supabase host | The public pages no longer contact it |
| `vercel.json` | Public CSP regenerated. `X-Frame-Options: SAMEORIGIN` and `Cross-Origin-Opener-Policy: same-origin` added for all paths. CRM rules unchanged | Header hardening |
| `.vercelignore` | Now also excludes `main.js`, `content/`, `interface/`, `scenes/`, `styles/`, `.env*`, `docs/` and the handover package. The `!README.md` exception was removed | Pages load only the two bundles, so the unbundled sources do not need to be public. Internal files stay off the server |
| `.gitignore` | Now also excludes `.env*` (except `.env.example`), `.vercel`, `node_modules`, Python caches and the handover package | Prevents secrets and tooling output being committed |
| `tools/build-public.mjs` | Bundle input list names `content/enquiry-endpoint.js` instead of `content/crm.js` | Follows the above |
| `tools/preview-server.mjs` | Serves `/api/enquiry` by running the real function | Local testing |
| `tools/test-browser.mjs`, `tools/test-privacy.mjs`, `tools/test-media.mjs`, `tools/test-contact-layout.mjs` | Intercept `/api/enquiry` instead of the Supabase host. Payload assertions updated | Tests follow the new flow and still cannot write anywhere real |
| `assets/site.min.js`, `tools/public-build.json` | Rebuilt with esbuild 0.28.2 | The bundle no longer contains the Supabase URL or key. The build manifest was stale at the production commit; it now matches |
| Ten `*.html` pages, `sitemap.xml` | Re-rendered | New cache-busting tag, new privacy text, policy pages' `lastmod` |
| `README.md` | Rewritten to describe the repository as it is | The old file described earlier states |

### Removed

| File | Why |
|---|---|
| `content/crm.js` | Held the Supabase URL and publishable key for the public form. No longer used by the public site. The CRM has its own copy in `crm-src/core/config.js` |
| `tools/__pycache__/build-images.cpython-312.pyc` | Compiled cache file that should not be tracked |

### Not changed

- The CRM application (`crm/`, `crm-src/`), its Supabase database, policies, functions, Edge Functions, users and sessions.
- The anonymous enquiry endpoint in the CRM database. It stays open until it is revoked in the database.
- DNS, domains, certificates.
- The production deployment and its settings. No environment variables were added.
- Site design, page content other than the privacy policy text, images and films.
- GitHub repository settings and visibility.
- Root photographs, archives and `.claude/`. They remain in this repository and are not deployed. They should not be carried into the Kingson-owned repository.

### Verification on 12 November 2026

| Check | Result |
|---|---|
| `render.js --check`, `check-truth.js`, `check-search.mjs`, `check-sharing.mjs`, `build-public.mjs --check`, `security-headers.mjs --check` | All six pass |
| `tools/test-enquiry-api.mjs` | 17 of 17 pass |
| `tools/test-browser.mjs` (Chromium) | 30 page and viewport checks and 6 interaction checks pass |
| `tools/test-privacy.mjs`, `tools/test-contact-layout.mjs`, `tools/test-media.mjs` (Chromium) | Pass |
| axe-core 4.14.0, WCAG A and AA rules, 10 pages at 390 px and 1440 px | 0 violations. Run in a context with CSP bypass so the scanner could be injected |
| End-to-end: real form, real function, faked Google Sheets | Pass, including duplicate handling, abuse refusals and a Google outage |
| Vercel preview deployment of `537d3c5` | Built. `GET /api/enquiry` returns 405. New headers present |
| Firefox, Safari or WebKit | Not tested. Those engines were not installed in the test environment |
| Real Google Sheets | Not tested. No credentials exist yet |

### To do before this reaches production

1. Kingson creates the Google account, spreadsheet and service account (`docs/ENQUIRIES_GOOGLE_SHEETS.md`).
2. Set the three environment variables in Vercel Production.
3. Set `POLICY_DATE` in `content/policies.js` to the publication day, render, run the checks.
4. Merge to `main` with approval. Send a test enquiry on the live site.
5. Decide when to close the anonymous enquiry endpoint in the CRM database.
