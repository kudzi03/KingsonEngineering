# Kingson Engineering — architecture

## Stack decision: keep the current stack

**Current:** static HTML + CSS + two ES modules, content generated into
`index.html` by `tools/render.js`, hosted on Vercel from `main`.

**Recommendation: do not migrate to Vite + React + TypeScript.**

The TRW notes describe that stack because the reference project used it. That
is not a reason. Assessed against what Kingson actually needs:

| Requirement | Current stack | Would React help? |
|---|---|---|
| Cinematic photographic page | already delivered | no |
| Content in the HTML for search and answer engines | already true — `render.js` writes it in | React SPA makes this *worse* without SSR |
| First render speed | 462–560 KB first view, no JS needed for content | a React bundle is a regression |
| Enquiry form | works, hands off to WhatsApp/email | no |
| One editable content layer | `content/*.js`, single source | no |
| **A CRM with auth, persistence and an admin UI (M3+)** | not possible as static files | **yes — this is the real trigger** |

So: the **public site stays static**. The CRM is a separate concern and does
not require rewriting the marketing site. When M3 begins, the admin surface
becomes its own deployment (see below) rather than a rewrite of the front page.

Migration cost if we were to rewrite now: every page, the render pipeline, the
truth-check tool and the SEO baseline, for no gain to the customer. Declined.

---

## Current shape

```
content/            the only place facts and copy live
  company.js        every business value behind a publication gate
  copy.js           every customer-facing string
  assets.js         photographs, crops, alt text
styles/
  tokens.css        design system (brand colours, type, radius, spacing)
  site.css          layout
interface/
  enquiry.js        local enquiry composer → WhatsApp / email handoff
  image-viewer.js   accessible full-size photograph dialog
tools/
  render.js         content/ → index.html   (run on change, output committed)
  check-truth.js    asserts the publication gate over the shipped HTML
  build-images.py   source photographs → responsive webp derivatives
main.js             interaction only — no content, no scroll listeners
index.html          generated, static, committed
```

### The publication gate

`content/company.js` gives every business value a `status`:

| status | meaning | published |
|---|---|---|
| `user_context` | supplied by the owner in conversation | yes |
| `observed_photo` | visible in a supplied photograph | yes |
| `owner_verified` | confirmed in the returned document | yes |
| `draft` | written for approval, never confirmed | **no** |

`publish(key)` returns `null` for anything not cleared, and every consumer
handles `null` — which is why the Facebook link simply disappears rather than
rendering broken.

`tools/check-truth.js` walks the served files and fails the build on any gated
value or forbidden claim pattern (capacities, lead times, certifications,
client lists, years in business). It also fails if `index.html` has drifted
from `content/`.

---

## Enquiry → delivery system

The commercial product is the pipeline, not the page. The page is its entry
point. Target shape:

```
website enquiry form
      │
      ├─ POST /api/enquiry ──────────► persistence (enquiry record)
      │                                      │
      │                                      ├─► internal notification
      │                                      │     (WhatsApp / email to Mr Murandu)
      │                                      └─► customer acknowledgement
      │                                            ("same working day" — confirmed)
      │
      └─ WhatsApp / email handoff  ◄── today's behaviour, no backend
```

### Why the current version hands off instead of posting

There is no backend yet, and a form that silently drops an enquiry is worse
than one that opens WhatsApp. So today the form **composes** the message and
hands it to an app the customer already has. It never claims to have sent
anything. That is the honest state until `/api/enquiry` exists.

### Pipeline states (M3)

```
NEW ENQUIRY → QUALIFICATION / SITE VISIT → ESTIMATING
            → QUOTE SENT → FOLLOW-UP → WON | LOST
```

Won work continues into the operational handoff, which is *architected* now and
built later:

```
ACCEPTED → COMMERCIAL CONFIRMATION → MATERIALS → PRODUCTION → DELIVERY
```

### Entities (M3)

| Entity | Fields that matter on day one |
|---|---|
| `company` | name, contact person, phone, email, town |
| `enquiry` | company, service (one of the six), location, description, files-declared, stage, next action, next action due, source |
| `activity` | enquiry, kind (call/visit/quote/note), body, at, by |
| `quote` | enquiry, reference, sent at, value, expiry |

The admin view must answer, without clicking: what came in, who for, what
service, where, what stage, what is the next action, when was it last touched,
is follow-up due.

### Where it will live

The public site is static on Vercel. The CRM needs auth and a database, so:

- **Persistence:** Postgres. Supabase is the pragmatic choice (auth + row-level
  security + a REST layer out of the box), and this session already has a
  Supabase MCP server available for provisioning.
- **API:** Vercel serverless functions under `/api/` in this same repository —
  no second deployment, no CORS, and the static site keeps its cache headers.
- **Admin UI:** a separate authenticated route. This is the one place a
  component framework is justified, and it does not touch the public page.

Row-level security is the known trap here — the TRW notes record a booking
system failing to fetch on misconfigured RLS. Budget for it.

---

## Automation boundary

Events leave the system through one adapter, not from inside UI code:

```
/api/enquiry ──► emit('enquiry.created', payload)
                      │
                      └──► ADAPTER (env-configured)
                              ├─ n8n webhook   (ENQUIRY_WEBHOOK_URL)
                              ├─ email         (SMTP_* / provider key)
                              └─ WhatsApp      (provider credentials)
```

Rules:

1. **No credentials in the repository.** `.env.example` declares the contract;
   real values live in Vercel's environment settings.
2. **No live customer email during development.** The adapter has a `log` mode
   that prints the payload and sends nothing, and that is the default.
3. **Follow-up cadence is configuration, not code.** Kingson confirmed
   *acknowledgement on the same working day* and *a written quotation within the
   week*. It did **not** authorise a chase sequence. So the scheduler reads a
   config table; it ships with acknowledgement on, chasing off.
4. **A reply stops automated follow-up.** Any inbound activity on an enquiry
   clears its pending reminders.

### Environment contract (to exist before M4)

```
ENQUIRY_WEBHOOK_URL=            # n8n entry point; unset = log mode
ENQUIRY_NOTIFY_EMAIL=           # internal, defaults to admin1@
ENQUIRY_NOTIFY_WHATSAPP=        # internal, E.164
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=      # server only, never shipped to the browser
SENTRY_DSN=                     # unset = monitoring disabled, build still passes
SITE_URL=https://…              # canonical, for OG and sitemap
```

---

## Deliberately not built

| Thing | Why not |
|---|---|
| **Stripe / online payments** | Nothing in the source material says Kingson wants online card deposits. Architectural room is left at `ACCEPTED → COMMERCIAL CONFIRMATION`; no implementation. |
| **Calendly or any scheduler** | Kingson's process is a **site visit within two working days**, arranged by a person. A "book a Zoom call" widget is the wrong shape for this business. |
| **WhatsApp Business API automation** | No provider account or credentials supplied. `wa.me` handoff is the honest first version; the adapter boundary is ready for the real API later. |
| **A full ERP** | Explicitly out of scope. The system stops at accepted-job handoff. |
| **3D / WebGL on the public page** | See below. |

### On 3D

The brief asks for intelligent 3D. Two facts argue against putting it on the
page in this milestone:

1. **There is no authentic Kingson model.** No `.glb`, no assembly, no drawing.
   Fabricating a "Kingson product" and presenting it as real is forbidden by
   the content rules.
2. **The reference build the owner chose has no 3D at all.** It is flat cards,
   photography and type. Adding a WebGL scene would move *away* from the design
   that was approved, not toward it.

An earlier iteration of this site did ship a registered WebGL steel corner. It
worked and it is in the history (`experience/geometry.js` at `24ff29b`) if it
is ever wanted back. The reason it is not here is that it sat on top of a
scroll-jacked stage the owner rejected, and the 3D was not the part that made
the page good.

**Recommendation:** if 3D returns, it returns as an *exploded portal-frame
connection* — procedural, clearly decorative, lazy-loaded below the fold, with
the page complete without it. Scoped as optional, after M3. Not now.

---

## Performance and accessibility standing rules

- Content in the HTML; JavaScript for interaction only.
- Responsive `srcset` on every photograph; `loading="lazy"` below the fold.
- Explicit `width`/`height` on every image — no layout shift.
- No scroll hijacking, ever. The previous build cost seven screens of scroll
  before a visitor reached a fact; that is not repeated.
- Every tap target ≥ 44 px. Verified by script, not by eye.
- Every colour pair ≥ 4.5:1, large display type ≥ 3:1. Measured.
- Keyboard reachable, visible focus, focus restored after any dialog.
- `prefers-reduced-motion` honoured.
