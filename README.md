# Kingson Engineering

Public website for Kingson Engineering / Kingson Trading (Pvt) Ltd — steelwork
specialists, No. 1262 Tynwald Industries, Harare, Zimbabwe.

Static HTML, CSS and three ES modules. No framework, no dependencies, no build
step to serve. Edit, run the renderer, push; Vercel redeploys.

Start here: **`SOURCE_OF_TRUTH.md`** for what may be published and why,
**`ARCHITECTURE.md`** for the stack decision and the enquiry-to-delivery system,
**`IMPLEMENTATION_PLAN.md`** for what is built and what is next.

---

## The one rule

Every figure on this site is ticked or handwritten on the *Information
required* document Kingson completed and returned. Nothing else is a figure.

`tools/check-truth.js` enforces that over the shipped files. It fails on an
unconfirmed capacity, lead time, certification, headcount, client list or
project count, and it fails on values the returned document explicitly retired
(the struck-out gmail address, the guessed Monday–Friday hours, the withdrawn
Facebook URL). Confirmed figures pass because they are on an allowlist in that
file, and **each allowlist entry cites the section of the document it came
from**. Adding a figure means being able to say who confirmed it.

```
node tools/render.js          rewrite index.html and sitemap.xml from content/
node tools/render.js --check  fail if either has drifted
node tools/check-truth.js     assert all three gates over the shipped files
```

Run `check-truth.js` before every push. It also runs `render.js --check`, so a
pass means the file you tested is the file you are shipping.

---

## What is on the page

| Section | |
|---|---|
| **Hero** | Who this is, what they make, three actions. A portal frame erects itself once on load and hands over to the real photograph — see `scenes/assembly.js` |
| **Strip** | Four confirmed facts — the machine, the crane, the workshop, the acknowledgement |
| **01 Structure** | Full-bleed site photograph, copy in a masthead field |
| **02 Form** | The IBR and corrugated sections **drawn to scale** from the confirmed figures, at one shared scale |
| **03 Cut** | **±0.1 MM** beside the thickness table, over four portrait plates of the laser |
| **04 Fabricate** | **3 000 MM** and the three confirmed flashings drawn in section. No photograph of this work exists |
| **05 Lift** | **25 TONNES** beside the crane at full height |
| **Workshop** | Tynwald Industries, Harare — place, not an About Us |
| **Specifications** | All 29 confirmed figures in five `<details>` groups |
| **Proof** | Three near-full-viewport bands of site work, labelled with confirmed facts only |
| **How it works** | The five commitments Kingson confirmed in writing, as a rail |
| **Send us the brief** | The structured enquiry, over the hero photograph — the arc closes where it opened |
| **Questions** | Ten questions, every answer a confirmed fact, also emitted as `FAQPage` |
| **Contact** | Both numbers, both email addresses, hours, address, named contact |

On a phone a **Call / Get a price** bar is fixed to the bottom of every screen.

**Nothing hijacks the scroll.** There is no scroll listener anywhere in this
build. The hero's assembly is a one-shot on load, not scroll-scrubbed; reveals
are driven by an IntersectionObserver that fires once per element. The version
this replaced pinned a 620vh stage and scrubbed six scenes against scroll
position: seven screens of animation before a visitor reached a single fact.

### Six of nine photographs are 3:4 portrait

That is the constraint the whole art direction is built around. A portrait
source cropped into a 16:9 band shows 41% of its frame and reads as a mistake,
so the three landscape photographs carry the full-bleed moments and the six
portraits stand upright at full height — which is also their native format on
a phone.

### Two services have no photograph

Kingson supplied none of a balustrade, a gate or a stainless job, so chapter 04
is carried by the three confirmed flashing folds drawn in section — for a
folder, arguably more useful than a photograph. The two stock-style collages in
the repository (`structure.jpeg`, `crane.jpeg`) are not Kingson's work and must
never be published as if they were; their derivatives have been deleted so they
cannot be served by accident.

---

## The content layer

Three files hold everything a person would want to change:

- `content/company.js` — every business value, each behind a publication gate
- `content/copy.js` — every customer-facing string
- `content/assets.js` — the photographs, their focal anchors and their alt text

`company.js` gives each value a `status`. Only `owner_verified` and
`user_context` render; `draft` and `unreadable` are held in the file and never
reach the page. `publish()` returns `null` for those, and **every consumer
handles null** — which is why the unreadable Facebook URL produces no link at
all rather than a broken one, and why the enquiry form's handoff buttons would
disappear rather than dead-end if a recipient were ever withdrawn.

Each value also carries an `evidence` string naming where it was confirmed.

---

## `index.html` and `sitemap.xml` are generated — do not hand-edit them

The text is written **into** the HTML rather than rendered by JavaScript, so the
page reads correctly with scripts off, in a search index, and in an answer
engine that does not run scripts. The sitemap's image list is generated from the
same asset map the page renders from, so it cannot drift.

Change content → run `render.js` → commit the generated files with it.

`main.js` wires five interactive pieces only: the hero assembly, the motion
vocabulary, the photograph viewer, the enquiry composer and the menu. Each is a
module under `scenes/` or `interface/` and each is independently removable —
with any of them absent the page is simply static, which is the state the
stylesheet describes by default.

---

## Where to change what

| You want to change | Edit |
|---|---|
| A phone number, email, address, hours — or whether it is published at all | `content/company.js` |
| Any sentence a visitor reads | `content/copy.js` |
| Which photographs, their order, their crops, their alt text | `content/assets.js` |
| Colour, type scale, spacing, radius | `styles/tokens.css` |
| Layout | `styles/site.css` |
| The viewer, the form, the menu | `interface/`, `main.js` |
| The hero's steel, the reveals, the drawn sections | `scenes/` |
| Which chapter a service lives in | `content/chapters.js` |
| Case studies, when Kingson supplies any | `content/projects.js` |
| What counts as a confirmed figure | `tools/check-truth.js` — **with a citation** |

---

## Design system

From the reference build the owner chose (`pastel-pixie-lab.lovable.app`): a
light Tailwind/shadcn theme — white page, `#fafafa` cards, `#0a0a0a` text,
`#e4e4e7` borders, 0.75–1.5rem corners, pill buttons, centred dot-eyebrow
section headers, and dark bookends.

Deliberately **not** taken from it: the awards wall, the team posters, the
polaroid line and the film-strip device. Those are storytelling for a film
company. There is no data behind them here, and inventing awards or staff would
break the rule above.

Colour is Kingson's own, sampled from the supplied logo artwork rather than
chosen: red `#E21E25`, green `#039647`, mark `#2B2A28`. Every derived step is
measured, not eyeballed — `--red-ink` for small text on white (6.01:1),
`--red-on-dark` for small text on the dark grounds (4.50:1).

`assets/brand/kingson-logo-reverse*.png` is the same artwork with only the
near-black drawn mark lightened, for the dark footer and the 404 page. The red
and the green are untouched.

---

## Photography

Nine photographs, all Kingson's own, colour left alone — no grade, no vignette,
no wash. One (`roof-frame`) carries the full-width band; the other eight are
the gallery. Four also crop into a service card.

Alt text describes what is visible and nothing else: never a client, a project,
a capability or a capacity. Where a machine's own badge is legible in the frame
the alt text says so, because that is what the picture shows.

The delivered derivatives carried a black letterbox band of up to 0.6% at the
bottom; it has been cropped out and `content/assets.js` carries the matching
dimensions. **Do not regenerate them from the originals without re-cropping.**

---

## Verified how

Not by looking. Every claim below was measured in a headless browser against
the running site:

- **Contrast** — 31 text/ground pairs computed from rendered colours against
  the WCAG threshold for their own size and weight. 0 below AA.
- **Pointer targets** — every link, button and control measured. 0 below the
  24px AA minimum on desktop; 0 below 44px on a phone.
- **Every interaction** — empty submit (three errors, summary focused, draft
  stays shut), fixing one field clearing only its own error, a complete
  enquiry composing the right message and routing a drawings enquiry to
  `technical@`, the viewer opening and closing on Escape, the menu trapping
  focus.
- **Images** — all 18 confirmed decoded, no failed requests, no console errors.
- **Structure** — one `h1`, no skipped heading level, structured data parsed
  and asserted to contain no empty values.
- **Text over photography** — 25 strings sampled against the *rendered pixels*
  behind them, not against a nominal background colour: 0 below AA.
- **Progressive enhancement** — with JavaScript disabled the page still serves
  6 241 characters, all five chapter headings, all 29 specification rows, all
  10 FAQ answers, 7 phone links and 3 WhatsApp links, and nothing is hidden
  waiting for a callback.
- **Performance** — LCP 116ms desktop / 96ms phone, CLS 0.0000 on both,
  611 KB / 501 KB initial transfer.

See `CREATIVE_ELEVATION_PLAN.md` for the before-and-after numbers and the
judgement calls behind them.
