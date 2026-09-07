# Kingson Engineering

Public website for Kingson Trading (Pvt) Ltd, trading as Kingson Engineering —
steelwork specialists, Harare, Zimbabwe.

Static site. No framework, no build step, no npm install, no dependencies.
Edit, push, Vercel redeploys.

---

## Read this first

Two things about this site are deliberate and easy to undo by accident.

**1. Unconfirmed figures are not on the page.**
The previous version published cover widths, gauges, minimum roof pitches,
purlin spacings, laser cutting thicknesses, tolerances, lead times and
quotation turnarounds. The old README recorded that none of it had been
confirmed by the company — *"A contractor will build to them."*

Every one of those figures is now held in `content.js`, in `PROVISIONAL`, and
none of it reaches the page. The site states the capability without the number
and says the figures are issued with the quotation.

When the figures are signed off, open `content.js` and set:

```js
var SHOW_PROVISIONAL_SPECS = true;
```

The roofing and laser spec tables then render, and the "issued with the
quotation" notes step aside for them. Nothing else has to change.

**2. Two images are not Kingson's work.**
`material-tube` and `material-sheet` are stock material collages. The previous
site captioned them *"Multi-Storey Process Structure, Harare"* and *"Kingson
Engineering mobile crane"*, which they are not — one is a grid of steel tube
stock, the other of sheet and plate. They now appear only in a strip labelled
**"Material reference — stock imagery, not Kingson project photography"**, are
kept out of the project grid, and are kept out of `sitemap.xml`. Replace them
with real photographs when there are some, and delete the strip.

Search the repository for `VERIFY_WITH_KINGSON` for everything else awaiting
confirmation.

---

## Where to change what

| You want to change | Edit |
|---|---|
| Phone, email, address, opening hours, WhatsApp number | `COMPANY` in `content.js` |
| Enquiry form dropdown options | `ENQUIRY` in `content.js` |
| Withheld technical figures, and the flag that shows them | `PROVISIONAL` in `content.js` |
| Anything a visitor reads as a sentence | `index.html` |
| Colours, type scale, spacing | the token block at the top of `assets/site.css` |
| The 3D frame in the hero | `assets/steel.js` |

Prose lives in `index.html` on purpose. Text built by JavaScript is rendered by
Google but not by most AI answer engines, and this site is meant to be found by
both. `index.html` is one file with one commented section per part of the page.

Contact details appear in the HTML *and* in `content.js`: the HTML carries the
current values so a crawler running no JavaScript reads the right number, and
`content.js` overwrites them at runtime so there is one place to edit. Change
`content.js`; the HTML copy is a fallback.

---

## Files

```
index.html            the page — all copy, all markup
content.js            company details, form options, withheld figures, flags
404.html              not-found page
robots.txt            crawler rules, including explicit AI-crawler permissions
sitemap.xml           one URL; Kingson's own photographs only
vercel.json           caching and security headers

assets/
  site.css            the whole visual system
  site.js             behaviour — reveals, parallax, the stage, the form
  steel.js            the WebGL portal frame
  fonts.css           @font-face rules (generated)
  fonts/*.woff2       self-hosted Archivo, Inter, IBM Plex Mono — 96 KB total
  img/*.webp          cropped, resized derivatives of the photographs
  img/manifest.json   source dimensions, written by the image script

tools/
  fetch-fonts.py      regenerates assets/fonts/ and assets/fonts.css
  build-images.py     regenerates assets/img/ from the root photographs

*.jpeg                the original photographs, unmodified
```

The original `.jpeg` files stay at the repository root as the asset library.
Nothing on the page loads them — the page uses the WebP derivatives in
`assets/img/` — but they are the masters, and `tools/build-images.py` reads
them.

---

## Running it locally

The page needs to be served over HTTP, not opened as a `file://` path, or the
browser will refuse the fonts.

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static server works — `npx serve`, `php -S localhost:8000`, whatever is
already installed.

---

## Regenerating assets

Neither script runs at deploy time. Run them by hand when the inputs change and
commit the output.

**Images** — after adding or replacing a photograph:

```bash
python3 tools/build-images.py
```

Reads the `.jpeg` files at the repository root, crops the screenshot letterbox
off the two that have one, and writes WebP derivatives at 440 / 720 / 1100 px
plus the native width. Needs `pillow`.

**Fonts** — only if a weight or family changes:

```bash
python3 tools/fetch-fonts.py
```

---

## Deploying

Framework preset **Other**. No build command, no output directory. Push to the
branch Vercel is watching and it redeploys.

**Caching, and why it is set that way.** `vercel.json` pins fonts for a year
(`immutable`) because a font file never changes once generated. Images get a
month with `stale-while-revalidate` rather than a year, because they are named
by slug and width, not by content hash — replacing a photograph reuses its URL,
and a year of `immutable` would strand the old one in visitors' caches. HTML,
CSS and JS must always revalidate: `content.js` carries the business copy and
the provisional-spec flag, and stale copy is the one thing this site cannot
afford.

---

## How the enquiry form works

**There is no server, and nothing is stored.**

Submitting composes a formatted message and hands it to WhatsApp or the
visitor's email client, pre-filled. The visitor still has to press send in that
app. The confirmation says *"ready to send"* rather than *"received"* for
exactly that reason, and the file picker says in as many words that nothing is
uploaded to the website — it lists the drawings so the message names them, and
the real attachment happens in WhatsApp or the mail client.

To make it send server-side later, `buildPayload()` in `assets/site.js` already
returns the shape a CRM would want. Set both of these in `content.js`:

```js
mode: 'endpoint',
endpoint: 'https://…'
```

and write the POST. Nothing else on the page has to change. A form service
(Web3Forms, Formspree) or a Vercel serverless function with an email provider
both fit.

---

## What happens when things are missing

Nothing on this page depends on everything working.

| If | Then |
|---|---|
| JavaScript is off | Full page, all photographs, all copy. No animation. |
| WebGL is unavailable | The hero is the portal frame photograph, graded to match. It is the default; the canvas replaces it only once a context is confirmed. |
| A shader fails to compile | Same as above — the scene returns `null` and the photograph stays. |
| `prefers-reduced-motion` | The steel frame renders once, assembled and lit, and never moves. Every reveal is already visible. Nothing animates. |
| `IntersectionObserver` is missing | Everything reveals immediately. |
| The stage scrolls off screen | The render loop stops. |
| The tab is hidden | The render loop stops. |
| Small screen | Four bays instead of six, pixel ratio capped at 1.75. |

---

## Still outstanding

- **Confirm the figures in `PROVISIONAL`,** then flip `SHOW_PROVISIONAL_SPECS`.
- **Confirm everything marked `VERIFY_WITH_KINGSON`** — the workshop address,
  the opening hours, the map coordinates, and whether the five process stages
  describe how the company actually runs a job.
- **Replace the two stock collages** with real photographs of Kingson's own
  stock, and delete the material-reference strip.
- Custom domain and a `@kingson.co.zw` address in place of the Gmail. The URL
  is hard-coded in `index.html` (canonical, `og:url`, `og:image`),
  `robots.txt` (the `Sitemap:` line) and `sitemap.xml` (every `<loc>` and
  `<image:loc>`). Find and replace all three together.
- Google Business Profile with the real workshop street address. For a Harare
  fabricator this is worth more than the website.
- Named reference projects, with client permission. The project grid currently
  publishes no client, value, tonnage or date, because none has been supplied.
- On mobile the header has no navigation — the fixed action dock carries Call,
  WhatsApp and Start a project, and the page is scrolled. If the section list
  is wanted on a phone, that is a menu still to build.
- Delete the duplicate deployments. Every extra copy of this site competes with
  the real one in search results. Keep exactly one Vercel project.
- Optional cleanup: `IMG 5167.jpeg`–`IMG 5174.jpeg`, `KE *.jpeg` and
  `kingson-flat.zip` are byte-identical duplicates of the canonically named
  photographs, about 6.7 MB of the repository. Nothing references them.

---

Contact — +263 772 262 869 · kingsonnkm@gmail.com
