# Moving to kingsonengineering.co.zw

Internal. Not published — `.vercelignore` excludes `*.md` except `README.md`.

**Not part of the current build.** This is the list to work through on the day
the `.co.zw` domain is ready, in this order. Nothing here is speculative: every
item names the file or the screen it touches.

The migration surface is deliberately small. The site's canonical URLs, Open
Graph URLs, sitemap entries and structured-data `@id`s are all derived from a
single constant, so step 1 does most of the work.

---

## 1 · Point Vercel at the domain first

Do this before touching the repository, so there is never a window where the
site claims a canonical URL that does not resolve.

- [ ] Vercel → Project → Settings → Domains → **Add** `kingsonengineering.co.zw`
- [ ] Add `www.kingsonengineering.co.zw` as well and set **one** of the two as
      primary; Vercel redirects the other. Pick the apex (no `www`) unless the
      registrar cannot do ALIAS/ANAME at the apex.
- [ ] At the registrar, create the records Vercel shows. For the apex that is
      normally an `A` record to Vercel's anycast address; for `www` a `CNAME`
      to `cname.vercel-dns.com`.
- [ ] Wait for Vercel to report the certificate **Issued** for both names.
      Do not proceed until it does — a half-issued certificate produces
      browser warnings that are much harder to explain than a delay.
- [ ] Confirm from outside: `curl -sI https://kingsonengineering.co.zw/` →
      `200`, and `curl -sI https://www.kingsonengineering.co.zw/` → `308`
      to the apex (or the reverse, if `www` was made primary).

Leave `kingson-engineering.vercel.app` attached. It keeps working, and it is
the fallback if anything in the DNS is wrong.

## 2 · One constant in the repository

- [ ] `tools/layout.js` — `SITE` (or render with `SITE_URL=https://…`). This is now the only place the origin is written: canonicals, OG, JSON-LD, sitemap, robots.txt and the truth gate all derive from it.
      becomes `'https://kingsonengineering.co.zw'` (no trailing slash).

That single edit regenerates, on the next `node tools/render.js`:

| What | Where it comes from |
|---|---|
| `<link rel="canonical">` on all 6 indexed pages | `headHtml()` |
| `og:url` | `headHtml()` |
| every `<loc>` and `<image:loc>` in `sitemap.xml` | `tools/render.js` |
| `Organization`, `LocalBusiness`, `WebSite`, `WebPage`, `Service`, `BreadcrumbList` `@id` and `url` | `tools/schema.js` |
| breadcrumb trail URLs on the service pages | `tools/pages.js` |

- [ ] `robots.txt` — last line, `Sitemap:` — change by hand. It is the one
      file the renderer does not generate.
- [ ] `crm-src/views/settings.js` line 89 — the sentence naming the website
      the CRM receives enquiries from. Cosmetic, but it will be on screen in
      front of Kingson.

## 3 · Rebuild, verify, deploy

- [ ] `node tools/render.js`
- [ ] `node tools/check-truth.js` — must pass. It walks every link and
      fragment on every page, so a half-finished change is caught here.
- [ ] `ESBUILD=<path> bash tools/build-crm.sh` (only if step 2's CRM string
      changed)
- [ ] `grep -rn "vercel.app" --include="*.html" --include="*.xml" --include="*.txt" .`
      → should return **nothing** outside `crm/` and `.git/`.
- [ ] Commit and push. Confirm production is serving the new commit, not a
      cached older one — Vercel deduplicates by commit SHA.

## 4 · Search Console

- [ ] Add `https://kingsonengineering.co.zw` as a **new property** (Domain
      property if the registrar allows the TXT record; URL-prefix otherwise).
- [ ] Verify it.
- [ ] Submit `https://kingsonengineering.co.zw/sitemap.xml`.
- [ ] **Do not** use the Change of Address tool. It is for moving between two
      verified properties, and the `.vercel.app` host was never submitted to
      Search Console — there is no history to migrate and nothing to redirect
      from. If the `.vercel.app` host *was* submitted at some point, check
      Search Console before assuming otherwise.
- [ ] Request indexing for the home page and each of the five service pages.
- [ ] Check Coverage a week later for anything reported as
      "Alternate page with proper canonical" — that would mean a canonical was
      missed in step 2.

## 5 · Supabase

Nothing in the database or the CRM depends on the website's hostname. Two
settings do:

- [ ] Supabase → Authentication → URL Configuration → **Site URL** and
      **Redirect URLs** — add `https://kingsonengineering.co.zw/crm`.
      Password-reset emails link to whatever is set here.
- [ ] The public site posts enquiries straight to PostgREST with the
      publishable key. Supabase's CORS accepts any origin for that, so there
      is nothing to change — but confirm one real enquiry from the new
      hostname reaches the pipeline before calling the migration done.

## 6 · The parts that do NOT change

Worth knowing so nobody goes looking:

- `vercel.json` — no hostnames in it. The CSP uses `'self'`, which follows
  the domain automatically.
- The Supabase project URL and publishable key in `content/crm.js`.
- Every image, font and asset path — all root-relative.
- The `tel:` and `wa.me` links — phone numbers, not URLs.

## 7 · Analytics

There is **no analytics on the site today** — no Google Analytics, no Vercel
Analytics, no tag of any kind. So there is nothing to migrate.

If Kingson wants it after the move, the least invasive option is Vercel Web
Analytics: one toggle in the project settings, no code, no cookie banner
required under most readings, and it does not affect the `script-src 'self'`
CSP because Vercel injects it at the edge. Decide separately; it is not part
of the migration.

## 8 · Last

- [ ] Open the new domain on a phone, submit one real enquiry, and watch it
      appear in the CRM. That is the only test that proves the whole chain
      survived the move.
