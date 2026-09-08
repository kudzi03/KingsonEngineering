# Kingson Engineering

Public website for Kingson Engineering — steel fabrication, roofing and cranage,
Harare, Zimbabwe.

Static HTML, CSS and two ES modules. No framework, no dependencies, no build
step to serve. Edit, push, Vercel redeploys.

---

## What this is

One page, five sections, about five screens on a laptop:

| | |
|---|---|
| **Hero** | Who this is, what they make, and three actions: call, WhatsApp, get a price |
| **What we do** | The four things a customer can ask for, each with the photograph of it and the line that says what to send |
| **Recent work** | Six photographs from Kingson's own jobs, click to view full size |
| **Get a price** | A form that composes a message and hands it to WhatsApp or email |
| **Talk to us** | Every contact channel, as a working link |

On a phone a **Call / WhatsApp** bar is fixed to the bottom of every screen.

**Nothing hijacks the scroll.** The version this replaced pinned a 620vh stage
and scrubbed six scenes against the scroll position: seven screens of animation
before a visitor reached a single fact, and no way at all to phone the company.
There is no scroll listener anywhere in this build.

---

## The content layer

Three files hold everything a person would want to change:

- `content/copy.js` — every customer-facing string
- `content/assets.js` — the photographs, their crops and their alt text
- `content/company.js` — every business value, each behind a publication gate

`company.js` gives each value a `status`. Only `user_context`,
`observed_photo` and `owner_verified` render; anything left as `draft` is held
in the file and never reaches the page. That is the switch that turns the
enquiry's WhatsApp and email handoff on and off, and it is why the site could
ship honestly while the details were still unconfirmed.

All contact values were confirmed by the owner on 2026-09-08 and are published.

---

## index.html is generated — do not hand-edit it

```
node tools/render.js          rewrite index.html from content/
node tools/render.js --check  fail if it has drifted
node tools/check-truth.js     assert the publication gate over the shipped file
```

The text is written **into** the HTML rather than rendered by JavaScript, so the
page reads correctly with scripts off, in a search index, and in an answer
engine that does not run scripts. `main.js` only wires the four interactive
pieces: the photograph viewer, the enquiry composer, the menu and the
small-viewport unit.

Change copy → run `render.js` → commit both.

---

## Where to change what

| You want to change | Edit |
|---|---|
| Any phone number, email, address, hours — or whether it is published at all | `content/company.js` |
| Any sentence a visitor reads | `content/copy.js` |
| Which photographs, and their alt text | `content/assets.js` |
| Colour, type scale, spacing | `styles/tokens.css` |
| Layout | `styles/site.css` |
| The viewer, the form, the menu | `interface/`, `main.js` |

---

## Photography

Six photographs carry the site: `portal-frame`, `roof-trusses`, `roof-frame`,
`cutting-head`, `laser-machine`, `crane`. All are Kingson's own, and their
colour is left alone — no grade, no vignette, no wash.

The delivered derivatives carried a black letterbox band of up to 0.6% at the
bottom; it has been cropped out and `content/assets.js` carries the matching
dimensions. Do not regenerate them from the originals without re-cropping.

`gantry`, `laser-floor`, `material-*` and `nesting-station` are in the repo but
not used on the page.

---

## Truth rules

Still in force, and `tools/check-truth.js` enforces them:

- No capacity, tonnage, tolerance, lead time or turnaround.
- No certification, standard, founding date or years in business.
- No client names or project counts.
- Capability text describes what is visible in Kingson's own photographs, plus
  what a customer may send. An invitation is not a claim.

Add a figure to that list only when Kingson has confirmed it in writing.
