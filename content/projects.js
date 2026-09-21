/* ═══════════════════════════════════════════════════════════════════════════
   content/projects.js — the portfolio
   ═══════════════════════════════════════════════════════════════════════════

   The photographs exist. The information that says what they are does not yet.

   So this file holds the finished architecture and an empty list. Everything
   downstream of it is built and tested: the cards, the galleries, the detail
   layout, the /projects route, the structured data, the sitemap entry and the
   navigation. All of it is conditional on there being at least one publishable
   project, and today there is none, so none of it ships.

   The moment a filled-in entry is added to PROJECTS, the whole path lights up
   with no further development. Adding a project is content entry.

   ── WHAT IS STILL NEEDED ────────────────────────────────────────────────────

   For each job worth showing, from the office:

     · what it was            "Warehouse portal frame", "Broiler house re-roof"
     · client or site name    only if we may publish it
     · or a descriptor        "a Harare logistics operator" — if we may not
     · location               town or suburb
     · year
     · scope                  what we actually did
     · size                   span, area, height, tonnage — whatever is known
     · which photographs      which of the images on file belong to this job

   None of it may be guessed. A portfolio with an invented tonnage on it is
   worth less than no portfolio, because the one thing a buyer is looking for
   here is whether we are the sort of firm that says only what is so.

   See PROJECT_METADATA.md at the root — it is the form to fill in.

   ── THE RULES THIS FILE ENFORCES ────────────────────────────────────────────

   1. A project needs `id`, `title`, `hero` and at least one `service`.
      Anything less fails the build rather than shipping half a case study.
   2. `internal: true` marks a draft. It never renders and never reaches the
      sitemap, however complete it looks.
   3. Every optional field is genuinely optional. Leave it out and it does not
      render — no "Client: TBC", no empty rows, no placeholder dashes.
   4. `client` and `descriptor` are mutually exclusive. Name them, or describe
      them without naming them. Never both.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * @typedef  {object} Project
 * @property {string}   id           slug — the anchor and the URL fragment
 * @property {string}   title        what the job was. Required.
 * @property {string}   hero         a key in content/assets.js. Required.
 * @property {string[]} services     which of our services it involved. Required.
 * @property {boolean}  [internal]   true = a draft; never ships
 * @property {string}   [client]     only with permission to name them
 * @property {string}   [descriptor] "a Harare logistics operator" — when not
 * @property {string}   [location]   town or suburb
 * @property {string}   [year]       as a string: '2024'
 * @property {string}   [type]       'Warehouse', 'Poultry house', 'Workshop'
 * @property {string}   [scope]      one sentence on what we did
 * @property {string}   [description] two or three sentences, no more
 * @property {string[]} [gallery]    further asset keys, in reading order
 * @property {Array<[string,string]>} [figures]  [label, value] — span, area,
 *                                   tonnage, eaves height. Only what is known.
 * @property {string[]} [highlights] one clause each: what made it worth doing
 */

/** Real jobs. Empty, truthfully, until the office fills in the form. */
export const PROJECTS = [];

/* ── what the rest of the site may use ───────────────────────────────────── */

const REQUIRED = ['id', 'title', 'hero', 'services'];

/** Everything that may actually be shown to the public. */
export const publishable = () =>
  PROJECTS.filter((p) => !p.internal && REQUIRED.every((k) =>
    Array.isArray(p[k]) ? p[k].length : p[k]));

/** True when the portfolio has anything in it worth a page. */
export const hasProjects = () => publishable().length > 0;

/**
 * How a project is credited, given what we are allowed to say.
 * Returns '' when we may say nothing, and the caller then renders nothing.
 */
export const credit = (p) => {
  const who = p.client || p.descriptor || '';
  return [who, p.location, p.year].filter(Boolean).join(' · ');
};

/**
 * Structural problems that should stop a build rather than ship.
 * Called by tools/check-truth.js.
 */
export function problems() {
  const out = [];
  const seen = new Set();
  for (const p of PROJECTS) {
    const name = p.id || p.title || '(unnamed entry)';
    for (const k of REQUIRED) {
      const v = p[k];
      if (Array.isArray(v) ? !v.length : !v) out.push(`project ${name} has no ${k}`);
    }
    if (p.client && p.descriptor) {
      out.push(`project ${name} has both a client name and an anonymous descriptor — pick one`);
    }
    if (p.id && seen.has(p.id)) out.push(`two projects share the id ${p.id}`);
    if (p.id) seen.add(p.id);
  }
  return out;
}
