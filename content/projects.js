/* ═══════════════════════════════════════════════════════════════════════════
   content/projects.js — proof of site work, and the architecture for more
   ═══════════════════════════════════════════════════════════════════════════

   WHY THIS FILE IS ALMOST EMPTY

   Kingson has confirmed no project data at all. Not a client name, not a
   location, not a tonnage, not a completion date, not a contract value, not a
   scope description. The returned document did not ask for any and none was
   volunteered.

   So there are no case studies here, and there is no "Selected Projects"
   section on the site inventing them. What exists instead is the shape a case
   study will take, and three photographs presented as what they actually are:
   evidence of site work, labelled with facts that are already confirmed
   elsewhere on the page.

   `label` and `scope` below say only what the photograph shows and what
   Kingson has confirmed it does. "Portal frame · Fabrication and erection" is
   safe because both are confirmed services and a portal frame is visibly what
   is in the picture. "Portal frame for <client>, <location>, 2024, 42 tonnes"
   would be four inventions in one line.

   WHEN KINGSON SUPPLIES REAL DATA

   Add entries to PROJECTS using the full shape documented below. Each field is
   optional and any field left out simply does not render — the same
   publication-gate discipline as content/company.js. Nothing needs to change
   in the renderer to start showing a client name; it needs a client name.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * The shape of a case study, for when there is one.
 *
 * @typedef  {object} Project
 * @property {string}  id          slug, used for the anchor
 * @property {string}  photo       a key in content/assets.js
 * @property {string}  label       what the thing is — visible in the frame
 * @property {string}  [scope]     which confirmed services it involved
 * @property {string}  [client]    ONLY with written permission to name them
 * @property {string}  [location]  ONLY if confirmed
 * @property {string}  [year]      ONLY if confirmed
 * @property {string}  [tonnage]   ONLY if confirmed
 * @property {string[]}[detail]    confirmed specifics, one clause each
 */

/** Real case studies. Empty, truthfully, until Kingson supplies the data. */
export const PROJECTS = [];

/* ── the proof bands ─────────────────────────────────────────────────────────
   The three photographs of work on site, as opposed to work in the workshop.
   Each is given close to a full viewport, because a 232px tile is not
   evidence of anything. Labels are confirmed facts only.                    */

export const PROOF = {
  eyebrow: 'Proof',
  title: 'Our own work, on site.',
  lede: 'Three photographs from Kingson jobs. No client names, locations or tonnages appear here because none has been confirmed — what is shown is what is in the frame.',
  bands: [
    { photo: 'portalFrame', label: 'Portal frame', scope: 'Fabrication and erection' },
    { photo: 'roofTrusses', label: 'Long-span roof', scope: 'Trusses, purlins and sheeting' },
    { photo: 'crane', label: 'Mobile cranage', scope: '25-tonne telescopic mobile' }
  ]
};
