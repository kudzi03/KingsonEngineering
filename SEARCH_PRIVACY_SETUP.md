# Search, Analytics and privacy — 20 October 2026

The public sitemap has nine pages: homepage, five services and three policies.
CRM, 404, alternate hosts and duplicate `.html` URLs remain excluded. Search
engines decide indexing; submission never guarantees indexing or ranking.

Google/Bing properties were created in the signed-in owner's accounts. Their
actual HTML verification tokens are in `content/seo.js`, on the homepage only.
After deployment, verify each pending property and submit the official sitemap.
Keep the tags permanently; no DNS verification or domain/email change is needed.
Authenticated dashboards are the authority for submission and indexing states.

IndexNow proof is `/indexnow-key.txt`; its public source is `content/indexing.js`.
`node tools/submit-indexnow.mjs` validates without sending. After deployment,
`node tools/submit-indexnow.mjs --submit` validates live proof/URLs and submits
the sitemap URLs. HTTP 200 means received; 202 means key verification pending.
Neither means indexed. Keep the proof file live.

Separate Analytics account: Kingson Engineering, `412682037`. Property:
Kingson Engineering — official website, `559818106`. Web stream `16167210677`,
measurement ID `G-T046CNQ6JG`. Reporting time is Zimbabwe UTC+2; USD is the
reporting currency only. The owner confirmed 11–100 employees for onboarding;
this is not published on the site. Zimbabwe was absent from Google's legal
selector; the owner authorised the best available option, so South Africa was
selected for regional terms. The website's business address remains Zimbabwe.
User and event retention are set to two months, with activity-based retention
reset off. Granular location/device collection is off. Ads personalisation is
disallowed in every region; Google signals and user-provided data remain off.

Optional account sharing and enhanced measurement are off. The code uses basic
opt-in, no advertising, Google signals, User ID or customer-data uploads. No
Google tag loads before Allow analytics. The old Vercel Analytics tag is removed.
Canonical page URLs exclude query/fragment data; referrers are origin only.
Contact events contain a fixed method; successful-enquiry events contain no
form fields or references. Privacy choices last 180 days; Analytics cookies
are configured for up to 90 days without activity-based cookie refresh. Cookie
settings allow rejection/withdrawal and clear accessible Analytics cookies.
Google Maps is separately click-to-load. Enquiries and videos work either way.

Policies are generated from `content/policies.js`. The form notice accurately
describes business contact details as potentially personal information. The
existing Supabase CRM is EU West; providers process operational/security data.
Website terms do not replace written project quotations/contracts or statutory
rights. No CRM schema/customer records, DNS, DMARC or business email changes.

Validation covers publication/render/sharing/search/bundle gates, 30 page and
viewport checks with accessibility and intercepted form tests, Chromium/WebKit
privacy choices and PII-exclusion checks, and the existing automatic media suite.
Atomic bundle replacement avoids intermittent Windows preview/sync file locks.
Rebuild/render and recheck notices whenever actual data practices change.
