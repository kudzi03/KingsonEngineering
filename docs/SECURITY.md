# Security configuration reference

What protects the public website, where each control is set, and what to do when something goes wrong. Written 12 November 2026 for the state of branch `claude/charming-euler-515w4y`.

No system is completely secure. This file lists the controls that exist and the risks that are accepted.

## 1. Response headers

Set in `vercel.json`. Vercel applies every matching rule. When two rules set the same header, the later rule wins; this was observed on production, where `/crm` receives the CRM policy.

### All paths (`/(.*)`)

| Header | Value | Purpose |
|---|---|---|
| `Content-Security-Policy` | See below | Limits what a page may load and where it may send data |
| `X-Content-Type-Options` | `nosniff` | Stops browsers guessing file types |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Other sites see only the origin, not the page path |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` | Switches off device features the site does not use |
| `X-Frame-Options` | `SAMEORIGIN` | Older-browser guard against framing. Added November 2026 |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolates the page from windows it opens. Added November 2026 |

Vercel itself adds `Strict-Transport-Security: max-age=63072000` on the custom domain. It is not set in this repository.

### Public Content-Security-Policy

| Directive | Value | Why |
|---|---|---|
| `default-src` | `'self'` | Everything comes from the site unless listed |
| `script-src` | `'self'`, `https://www.googletagmanager.com`, plus one `sha256-…` hash per inline script | Own bundle, the consent-gated Google tag, and the exact inline scripts in the pages |
| `style-src` | `'self' 'unsafe-inline'` | Pages use inline `style` attributes |
| `font-src` | `'self'` | Fonts are self-hosted |
| `img-src` | `'self' data:` and two Google Analytics hosts | Own images; Analytics beacons after consent |
| `media-src` | `'self'` | Own films |
| `frame-src` | `https://www.google.com` | The click-to-load map |
| `frame-ancestors` | `'self'` | Other sites cannot frame the pages |
| `form-action` | `'self'` | Forms cannot post elsewhere |
| `base-uri` | `'self'` | |
| `object-src` | `'none'` | |
| `connect-src` | `'self'` and two Google Analytics hosts | The enquiry form posts to `/api/enquiry` on the same origin. The CRM database host was removed from this list in November 2026 |

### How the CSP is generated

`tools/security-headers.mjs` reads every root `*.html`, hashes each inline `<script>` and writes the policy into `vercel.json`. `tools/render.js` calls it at the end of every render. `node tools/security-headers.mjs --check` fails if `vercel.json` is out of step with the pages.

To add an allowed host, edit the `csp` array in `tools/security-headers.mjs`, then run `node tools/render.js`. Do not edit the policy in `vercel.json` by hand; the next render overwrites it.

### CRM paths (`/crm`, `/crm/(.*)`)

A stricter, separate policy: scripts from `'self'` only, `connect-src` limited to the site and the CRM's Supabase project, `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`. It allows `fonts.googleapis.com` and `fonts.gstatic.com` because the CRM loads its fonts from Google.

### Caching

| Path | `Cache-Control` |
|---|---|
| `/assets/fonts/*` | One year, immutable |
| Images | 30 days, stale-while-revalidate one day |
| `*.html`, `*.js`, `*.css` | `max-age=0, must-revalidate` |
| `/api/enquiry` | `no-store` (set by the function) |

## 2. What is public on purpose

These values are in files a browser can download. They are identifiers, not credentials.

| Value | Where | Why it is safe to publish |
|---|---|---|
| CRM Supabase project URL and publishable key | `crm-src/core/config.js`, bundled into `crm/app.js` | Identifies the project. Access is decided by database rules. Never replace it with a secret or service-role key |
| Google Analytics measurement ID | `content/analytics.js` | Public by design |
| Google and Bing site-verification tokens | `content/seo.js`, home page `<head>` | Ownership tags, not account credentials. Keep them in place |
| IndexNow key | `content/indexing.js`, `/indexnow-key.txt` | Host-ownership proof. The file must stay live |

Since November 2026 the public site's own bundle (`assets/site.min.js`) no longer contains the Supabase URL or key.

## 3. Secrets

| Secret | Where it lives | Never |
|---|---|---|
| Google service-account private key | Vercel environment variable `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, marked Sensitive | In the repository, in chat, in email, in a document |
| Spreadsheet ID and service-account email | Vercel environment variables | Not secret on their own, but keep them out of the repository |
| Supabase service-role key, Edge Function secrets, database password | Supabase project, in VelaBuilt's organisation | In any file under this repository |
| CRM passwords and authenticator secrets | With the staff who hold the accounts | Shared, or written into a document |

Rules:

- `.env.example` holds names and placeholders only. `.gitignore` excludes `.env` and `.env.*`.
- A secret that reaches a commit, a chat or an email must be treated as exposed. Rotate it. Deleting the message is not enough.
- A scan of the working tree and the full Git history on 12 November 2026 found no real secret. It was a pattern and entropy scan; gitleaks could not be installed in that environment.

## 4. Deployment boundary

`.vercelignore` decides what Vercel uploads. Not uploaded: `crm-src/`, `tools/`, `.claude/`, `docs/`, all `*.md`, `source-hd/`, root photographs and archives, the stock-style derivatives `assets/img/material-*`, `.env*`, the handover package, and since November 2026 the unbundled sources (`main.js`, `content/`, `interface/`, `scenes/`, `styles/`).

`api/` must not be added to `.vercelignore`. It is the enquiry function.

Observed on production on 12 November 2026 (before the November change was deployed): `/README.md`, `/HANDOVER.md`, `/crm-src/…`, `/tools/…` and `/vercel.json` return 404.

After any change to `.vercelignore`, check a preview deployment before merging.

## 5. Enquiry endpoint controls

Set in `api/enquiry.js`. Full detail in `docs/ENQUIRIES_GOOGLE_SHEETS.md`.

| Control | What it does |
|---|---|
| Method and content type | POST with `application/json` only |
| Same-origin check | `Origin` host must equal the request host. Abuse control, not authentication |
| No CORS headers | Other sites' pages cannot read responses |
| Body limit | 16 KB |
| Field validation | Lengths, required fields, option allow-lists, path format |
| Honeypot and minimum fill time | Refuses simple bots. A real visitor who trips them is shown the handoff |
| Rate limit | 5 per IP per 10 minutes, 60 per hour overall, in memory |
| Formula neutralising | RAW writes and a leading apostrophe on risky text |
| Least privilege | The service account can edit only sheets shared with it |
| Logging | Stage and status only. No enquiry content, no secrets |
| Error handling | Visitors see a fixed word. Google's error text is never returned |

## 6. The CRM boundary

- The CRM is served at `/crm` on the same origin as the public site. A script-injection flaw on a public page could therefore reach CRM data in the same browser. The public CSP and the absence of user-supplied HTML on public pages are the controls.
- The CRM keeps its session in `sessionStorage`.
- The CRM, its database and its Edge Functions were not changed in the November 2026 work.
- Open CRM findings (server-side two-factor enforcement, old sessions, backups, ownership) are recorded in the handover package's Security Audit Report. They need decisions by Kingson and VelaBuilt.
- The anonymous enquiry endpoint in the CRM database stays open until it is revoked in the database, whatever the website does.

## 7. Consent and analytics

Set in `interface/privacy.js`.

- No Google tag loads before the visitor chooses "Allow analytics".
- Analytics runs only on `www.kingsonengineering.co.zw`.
- The choice is stored in `localStorage` under `kingson_privacy_v1` for 180 days.
- Rejecting or withdrawing clears `_ga` cookies the page can reach.
- Page URLs sent to Analytics are the canonical URL without query or fragment. Enquiry text is never sent.
- The Google map loads only when the visitor presses "Load Google map".

If data practices change, update `content/policies.js`, set `POLICY_DATE` to the day of publication, render and deploy.

## 8. Handling an incident

| Situation | Do this |
|---|---|
| The Google key may be exposed | Rotate it at once: new key, update Vercel, redeploy, test, delete the old key. See the rotation steps in `docs/ENQUIRIES_GOOGLE_SHEETS.md` |
| Spam is filling the sheet | Add or tighten the Vercel Firewall rate-limit rule on `/api/enquiry`. Mark rows as Spam. If it continues, set `ENQUIRY_ENDPOINT` to `''` so the form uses the handoff only |
| The site shows wrong or defaced content | Roll back in Vercel to the last good deployment. Then check who pushed to `main` and review repository access |
| A Vercel or GitHub account may be compromised | Change the password, reset two-factor, revoke sessions and tokens, review recent deployments and commits, rotate the Google key |
| A CRM account may be compromised | Change the password, sign out all sessions for that user in Supabase, review the CRM audit log |
| Personal data may have been disclosed | Record what, when and who. Take legal advice on notification duties in Zimbabwe |

Where to look: Vercel project Logs (function log lines beginning `[enquiry]`), Vercel Deployments (who deployed what), GitHub commit history and the `checks` workflow runs.

## 9. Accepted risks

| Risk | Why it is accepted | Revisit when |
|---|---|---|
| HSTS on the custom domain has no `includeSubDomains` or `preload` | Vercel sets the header. Adding `includeSubDomains` at the apex would force HTTPS on every subdomain, including mail hosts not reviewed here | The full DNS zone has been reviewed |
| `style-src 'unsafe-inline'` | Pages use inline `style` attributes for image positioning | The templates are changed to classes |
| `script-src` allows the whole `www.googletagmanager.com` host | Needed for the Google tag. No integrity hash is possible for it | Analytics is removed or replaced |
| Rate limit is in memory | No paid store was added. It resets on a cold start | A Vercel Firewall rule is confirmed, or abuse is seen |
| No CAPTCHA on the form | Honeypot, timing and limits were judged enough for the expected volume, and a CAPTCHA adds a third party | Spam reaches the sheet regularly |
| CRM and public site share an origin | Moving the CRM is outside this work | The CRM's future is decided |
| Vercel adds `Access-Control-Allow-Origin: *` to static files | Platform default. The files are public anyway | Not planned |
