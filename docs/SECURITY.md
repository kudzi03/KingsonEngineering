# Security configuration reference

What protects the public website, where each control is set, and what to do when something goes wrong. Written 12 November 2026 for the state of branch `claude/charming-euler-515w4y`.

No system is completely secure. This file lists the controls that exist and the risks that are accepted.

## 1. Response headers

Set in `vercel.json`. Vercel applies every matching rule. When two rules set the same header, the later rule wins. This was observed on production, where `/crm` receives the CRM policy. The working branch no longer has that CRM policy (see "CRM paths" below).

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

The CRM is switched off. On the working branch `crm/` is listed in `.vercelignore` and is not deployed, so `/crm` answers 404 once the branch is deployed.

- The separate `/crm` Content-Security-Policy was removed from `vercel.json` in commit `d0fe1f2`. No policy on the site names the CRM's Supabase host any more.
- The rules that remain for `/crm` and `/crm/(.*)` send `X-Frame-Options: DENY`, `Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow`.
- `vercel.json` also still has a `noindex` rule for the host `crm.kingsonengineering.co.zw` and a redirect from that host's `/` to `/crm`. After deployment that redirect leads to a 404.
- Production (commit `8abd92b`) still serves the CRM, with its separate policy, until the working branch is deployed.

To bring the CRM back, follow the note at the top of `.vercelignore`: remove its `/crm` line and restore the `/crm` Content-Security-Policy in `vercel.json` from Git history (commit `7da1d8f`).

### Caching

| Path | `Cache-Control` |
|---|---|
| `/assets/fonts/*` | One year, immutable |
| Images | 30 days, stale-while-revalidate one day |
| `*.html`, `*.js`, `*.css` | `max-age=0, must-revalidate` |
| `/api/enquiry` | `no-store` (set by the function) |

## 2. What is public on purpose

These values are in files a browser can download. They are identifiers, not credentials.

| Value | Where | Why it can be public |
|---|---|---|
| CRM Supabase project URL and publishable key | `crm-src/core/config.js`, bundled into `crm/app.js`. Not deployed from the working branch | Identifies the project. Access is decided by database rules. Never replace it with a secret or service-role key |
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
- The Google key is created by a person in the Google account that holds the sheet, and pasted into Vercel by a person. It is never sent through chat or email.
- A secret that reaches a commit, a chat or an email must be treated as exposed. Rotate it. Deleting the message is not enough.
- A scan of the working tree and the full Git history on 12 November 2026 found no real secret. It was a pattern and entropy scan; gitleaks could not be installed in that environment.

## 4. Deployment boundary

`.vercelignore` decides what Vercel uploads. Not uploaded: `crm-src/`, `tools/`, `.claude/`, `docs/`, all `*.md`, `source-hd/`, root photographs and archives, the stock-style derivatives `assets/img/material-*`, `.env*`, the handover package, and since November 2026 the unbundled sources (`main.js`, `content/`, `interface/`, `scenes/`, `styles/`) and the built CRM (`crm/`).

`api/` must not be added to `.vercelignore`. It is the enquiry function.

Observed on production on 12 November 2026 (before the November change was deployed): `/README.md`, `/HANDOVER.md`, `/crm-src/…`, `/tools/…` and `/vercel.json` return 404. `/crm` is still served there. It will answer 404 once the working branch is deployed.

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
| Honeypot and minimum fill time | Refuses simple bots. A real visitor who trips them is shown the hand-off |
| Rate limit | 5 per IP per 10 minutes, 60 per hour overall, in memory |
| Formula neutralising | RAW writes and a leading apostrophe on risky text |
| Least privilege | The service account can edit only sheets shared with it |
| Logging | Stage and status only. No enquiry content, no secrets |
| Error handling | Visitors see a fixed word. Google's error text is never returned |

## 6. The CRM boundary

The CRM is switched off for now. The developer decided this on 12 November 2026: Kingson did not buy the CRM, so it will not be maintained.

- On the working branch the CRM is not deployed. `/crm` answers 404 once the branch is deployed.
- Until then, production serves the CRM at `/crm` on the same origin as the public site. A script-injection flaw on a public page could therefore reach CRM data in the same browser. The public CSP and the absence of user-supplied HTML on public pages are the controls.
- The CRM keeps its session in `sessionStorage`.
- The CRM's code and its Edge Functions were not changed in the November 2026 work. Nothing in its database has been changed either: the first step below was submitted but not applied.
- Database, first step: end every saved sign-in, disable the unused staff account, and turn on the database-level two-factor rule (`require_mfa = true`). Submitted but not applied. It waits for the developer's confirmation.
- Database, second step, after the new enquiry flow is live in production: close the anonymous enquiry entrance and pause the Supabase project. Pending. Pausing keeps the data; it does not delete it. A paused free-plan project can be restored only for a limited time, so an export of the six real enquiries for Kingson is still outstanding.
- The anonymous enquiry endpoint in the CRM database stays open until it is revoked in the database, whatever the website does.
- The admin CRM account uses an authenticator app at sign-in. The staff account was never used by the developer and has no authenticator.
- Open CRM findings (server-side two-factor enforcement, old sessions, backups, ownership) are recorded in the handover package's Security Audit Report. Whether to export the data to Kingson and later delete the project is still a decision for Kingson and VelaBuilt.

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
| Spam is filling the sheet | Add or tighten the Vercel Firewall rate-limit rule on `/api/enquiry`. Mark rows as Spam. If it continues, set `ENQUIRY_ENDPOINT` to `''` so the form uses the hand-off only |
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
| CRM and public site share an origin in production | It ends when the working branch is deployed, because `/crm` is then not served | The CRM is brought back |
| Enquiry data is held in the developer's Google account until handover | Interim arrangement, decided by the developer on 12 November 2026. Kingson names its Google account at handover | Handover. Move the sheet as described in `docs/ENQUIRIES_GOOGLE_SHEETS.md`, section 6 |
| Vercel adds `Access-Control-Allow-Origin: *` to static files | Platform default. The files are public anyway | Not planned |
