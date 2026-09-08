# Kingson Engineering

Public website for Kingson Engineering — engineering and fabrication, Zimbabwe.

Static site: plain HTML, CSS and ES modules. No framework, no build step, no
npm install, no dependencies. Edit, push, Vercel redeploys.

---

## Read this first

**Nothing unverified is on the page.**

`content/company.js` holds every business value with a `status`:

| status | meaning | published? |
|---|---|---|
| `user_context` | supplied by the owner in the brief | yes |
| `observed_photo` | visible in a photograph the owner supplied | yes |
| `draft` | carried over from an earlier draft, never confirmed | **no** |
| `owner_verified` | confirmed by Kingson | yes |

Only `name` and `sector` are publishable today. The email, phone, WhatsApp
number, office, address, hours and Facebook page are all `draft`, so they are
held in the file and never rendered — which is why the enquiry composer offers
**Copy enquiry** and says the contact details are being confirmed, instead of a
dead Submit button or an address nobody has checked.

To publish a contact channel, change its `status` to `owner_verified` in
`content/company.js`. The handoff buttons, the footer line and the structured
data pick it up with no other edit.

The same rule governs the sitemap, robots.txt and the 404 page: no city, no
client, no project name, no capacity, no lead time, no certification and no
number that has not been confirmed.

Run `node tools/check-truth.js` (or the QA script in the treatment notes) to
assert that nothing gated reaches the rendered page.

---

## What the page is

Eight scenes. Scenes 1–6 share one native sticky stage; Scenes 7–8 scroll over
the photograph that stage releases.

| # | Scene | What it is |
|---|---|---|
| 1 | The opening | The portal photograph, full bleed, with a modelled steel corner across the right that registers onto the real column and withdraws into it |
| 2 | Inside the frame | The same photograph held, then the photographed roof direction opens as an aperture |
| 3 | Under the roof | Two roofs across a hard diagonal, then a loaded edge carries the machine in |
| 4 | At the edge | The cutting head at macro scale, then the workshop beside it |
| 5 | In the yard | One crane photograph at two scales, no gutter |
| 6 | Selected views | Three contiguous full-viewport photographs with one attached dock |
| 7 | Bring the brief | The released photo wall, and what to send |
| 8 | Start a conversation | A local composer that hands the message to an app the visitor already has |

---

## Where to change what

| You want to change | Edit |
|---|---|
| Any business value, and whether it may be published | `content/company.js` |
| Anything a visitor reads as a sentence | `content/copy.js` |
| Which photographs, their crops and their alt text | `content/assets.js` |
| Where a scene starts and how long it runs | `experience/scene-map.js` |
| What a scene looks like at a given progress | `experience/scenes/*.js` |
| What two neighbouring scenes must agree on | the boundary functions in `experience/scene-map.js` |
| The one source-to-viewport crop transform | `experience/crops.js` |
| The modelled corner in Scene 1 | `experience/geometry.js` |
| The two traced masks | `experience/masks.js` |
| Colour, type scale, spacing | `styles/tokens.css` |
| The mobile compositions | `interface/mobile-story.js` + the mobile block in `styles/fallback.css` |

---

## Architecture rules

These are load-bearing. Breaking one produces the class of bug it exists to
prevent.

- **One scroll state source.** `main.js` reads `window.pageYOffset` once per
  frame. No module binds its own scroll listener, on desktop or on mobile.
- **One sampler, one writer.** `experience/state.js` turns a scroll position
  into a complete visual state; `experience/stage.js` writes it. The sampler
  never touches the DOM; the writer never decides anything.
- **One crop transform.** `crops.cover()` is the only place a source-to-viewport
  fit is computed. Photographs, traced masks and the WebGL registration all read
  the same numbers, which is why the modelled corner lands on the real column at
  every viewport ratio instead of only the one it was authored at.
- **Shared boundaries.** Scene N at p=1 and Scene N+1 at p=0 are the same
  function, stored once in `scene-map.js` and referenced by both neighbours.
  Neither scene re-derives the other's coordinates.
- **Planes are pooled by identity.** The crane that ends Scene 5 is the same DOM
  node and the same decoded bitmap that begins Scene 6.
- **Mobile is its own state map**, not a scaled desktop: authored edge-to-edge
  compositions plus two short sticky events. Reduced motion is a third map
  again, with nothing to scrub.

---

## Photography

Six photographs carry the site: `portal-frame`, `roof-trusses`, `roof-frame`,
`cutting-head`, `laser-machine`, `crane`. All are Kingson's own. `gantry` is
kept in `content/assets.js` as archive only and is not published.

Colour is left alone. The sky is blue and white, the ground is red, the
machinery is yellow, the workshop is brick — there is no global grade, no
vignette and no colour wash over any photograph.

The delivered derivatives carried a black letterbox band of up to 0.6% at the
bottom (and 0.2% at the top of `portal-frame`). It has been cropped out, and
`content/assets.js`, `experience/masks.js` and the traced coordinates carry the
matching rescale. Do not regenerate the derivatives from the originals without
re-cropping, or the band will reappear as a blank strip at the edge of a scene.

---

## Debug tools

| URL | What it does |
|---|---|
| `?still=s3-c` | Freezes one named state (`s1-a` … `s6-e`) |
| `?scene=roof&p=0.42` | Freezes a state by coordinate |
| `?notype=1` | Draws the photography with no type, for measuring contrast |

The same code that animates draws the still, so what you inspect is what ships.
