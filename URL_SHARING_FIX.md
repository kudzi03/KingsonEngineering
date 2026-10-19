# URL sharing fix — 19 October 2026

Status: deployment approved by the user on 19 October 2026. The fix was applied
to current production source (`c224d5e`) before release, preserving its newer
content, styling and `/fibre-laser-cutting-harare` route. Live verification is
reported in the deployment conversation. This report supersedes the historical
DOMAIN_MIGRATION.md for this change.

## Confirmed cause

Both https://www.kingsonengineering.co.zw/ and
https://kingson-engineering.vercel.app/ returned HTTP 200 with the same ETag
when inspected. The official homepage's canonical and `og:url` both named
https://kingson-engineering.vercel.app/. Its Open Graph and Twitter image URLs
also named the old host.

`tools/layout.js` still set `SITE` to the old host. The static generator uses
that constant for canonical tags, Open Graph URLs, preview images, JSON-LD,
absolute breadcrumb links, sitemap entries and the robots sitemap declaration.
These generated files are committed and served directly; attaching the official
domain in Vercel does not rewrite their metadata. This is the concrete defect
that makes the official page advertise the old sharing identity. Browser and
share-target behavior can differ; native Safari/Chrome share sheets were not
automated in this environment.

There is no custom website-sharing function or JavaScript navigation to the old
host. The clipboard action copies enquiry text, not a website URL. Ordinary
navigation and assets use relative paths. Twitter already has a large-image
card and uses the Open Graph page URL; adding a separate `twitter:url` is not
necessary. No framework SEO configuration or environment override exists.

The non-www domain already returned HTTP 308 with
`Location: https://www.kingsonengineering.co.zw/`, matching the user's official
domain. No additional apex redirect was added.

## Exact changes

- `tools/layout.js`: set `SITE` to `https://www.kingsonengineering.co.zw`.
- Regenerated `index.html` and all five service HTML files: canonical, `og:url`,
  OG/Twitter images, JSON-LD identities/URLs/images and absolute breadcrumb URLs
  now use the official origin, retaining each page's path and fragment.
- Regenerated `404.html`: its two preview image URLs use the official origin;
  it retains `noindex` and has no canonical or `og:url`.
- Regenerated `sitemap.xml`: all six page URLs and image URLs use the official
  origin. Regenerated `robots.txt`: the sitemap declaration uses that origin.
- `vercel.json`: added a permanent redirect from `/:path*` on the exact host
  `kingson-engineering.vercel.app` to
  `https://www.kingsonengineering.co.zw/:path*`. This covers old page, asset and
  CRM paths. Existing CRM-host routing, headers, clean URLs and slash handling
  remain unchanged. Preview deployment hostnames do not match the new rule.
- `tools/check-sharing.mjs`: independently pins the approved origin and checks
  every root HTML file, canonical/OG agreement, OG/Twitter images, internal
  absolute links, structured data, sitemap, robots and redirect configuration.
- `tools/check-truth.js`: runs the sharing check as part of the existing gate.
- `README.md`: documents the sharing check.
- `DOMAIN_MIGRATION.md`: marks the older plan as superseded to prevent it from
  instructing a future maintainer to revert to the apex or skip the redirect.

CRM source contains legacy email-template defaults, URL placeholders and server
origin fallbacks. They do not produce the public site's metadata and were left
unchanged to keep this fix scoped to URL sharing. The exact old hostname now
has a redirect for links already issued. No database, authentication, email,
DNS, form, script, stylesheet, animation or image asset was changed.

## Validation

Passed:

```text
node tools/render.js
node tools/render.js --check
node tools/check-sharing.mjs
node tools/check-truth.js
git diff --check
```

The publication gate passed over 22 served files, 125 confirmed figures and 82
referenced image files. All six indexed pages have exactly their official
canonical and matching `og:url`; all seven HTML files have official-domain
preview images. The new check runs automatically inside the publication gate.

An additional comparison with Git HEAD proved that all seven generated HTML
files, sitemap and robots equal their previous content with only the old
origin replaced. Their page bodies, form markup, script/style URLs and build
stamp are unchanged. No live enquiry or email was submitted during testing.

The redirect configuration is checked locally. Its actual HTTP behavior and
native browser share sheets require verification after the approved deployment;
the prepared redirect is not active on the live website yet. Vercel documents
that host `has` conditions are evaluated in deployed routing rather than
`vercel dev`: https://vercel.com/docs/project-configuration/vercel-json#redirects

## Vercel dashboard and release steps

Before deployment, inspect Project → Settings → Domains:

1. Confirm `www.kingsonengineering.co.zw` is assigned to this project's
   production environment and serves the intended deployment.
2. Keep the existing apex-to-www redirect. It already worked during inspection.
3. Keep the old `kingson-engineering.vercel.app` alias assigned to this project
   so the repository redirect can handle it. No duplicate dashboard redirect is
   required. If an existing dashboard rule sends www to the Vercel URL, remove
   that conflicting rule; the observed www response had no such redirect.

No mandatory dashboard change is indicated by the observed responses. The
repository redirect and regenerated HTML become effective together when this
change is deployed. Do not modify DNS or business email configuration.

After user approval, commit and deploy these source AND generated files through
the existing production workflow. Vercel does not run this renderer as a build
step, so deploying only `tools/layout.js` would not fix the live HTML. Avoid
pushing before approval because Git pushes can trigger automatic deployments.

After deployment, check:

- Official homepage and all five clean service paths return 200 and have
  official-domain canonical/OG URLs and reachable preview images.
- `curl -I https://kingson-engineering.vercel.app/` returns 308 to the official
  homepage. Check a nested service path and a URL with a query string too,
  confirming the path and query survive; follow the response to rule out loops.
- Apex still redirects to www; the CRM hostname keeps its existing routing.
- Open fresh Safari and Chrome tabs on the official homepage and a service
  page; share them and inspect the resulting link. Also open an old Vercel link
  and confirm it lands on the corresponding official URL before sharing.

Previously opened tabs or cached previews can retain old metadata. Reload the
page or open a fresh tab; already sent messages do not change retroactively.
