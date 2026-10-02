/* ═══════════════════════════════════════════════════════════════════════════
   content/projects.js — the portfolio
   ═══════════════════════════════════════════════════════════════════════════

   Completed work, one entry per job. Everything downstream renders from this
   file: /projects, one page per job at /projects/<id>, the "Built by Kingson"
   sheet on the home page, the completed-work block on each service page the
   job used, the navigation item, the sitemap entries (with video), and the
   structured data. Adding a job is content entry, not development.

   ── THE ONE RULE ─────────────────────────────────────────────────────────

   Nothing about a job is read off its photographs or footage. A picture shows
   a roof; it does not show whose roof, where, what span, what tonnage, what
   year, or which part of it we did. Those come from the office, in writing,
   or they are left out. A portfolio with an invented tonnage on it is worth
   less than no portfolio, because the one thing a buyer is looking for here
   is whether we are the sort of firm that says only what is so.

   So every entry carries `status` and `evidence`, the same publication gate
   content/company.js puts on every business value, and the build refuses an
   entry without them.

   ── WHAT IS STILL NEEDED, PER JOB ───────────────────────────────────────

     · what it was            "Warehouse portal frame", "Broiler house re-roof"
     · client or site name    only if we may publish it
     · or a descriptor        "a Harare logistics operator" — if we may not
     · location               town or suburb
     · year
     · scope                  what we actually did: fabricated, erected, both
     · size                   span, area, height, tonnage — whatever is known
     · which photographs      which of the images on file belong to this job

   See PROJECT_METADATA.md at the root — it is the form to fill in.

   ── THE RULES THIS FILE ENFORCES ────────────────────────────────────────

   1. A project needs `id`, `title`, `hero`, at least one `service`, a
      publishable `status` and `evidence`. Anything less fails the build
      rather than shipping half a case study.
   2. `internal: true` marks a draft. It never renders and never reaches the
      sitemap, however complete it looks.
   3. Every optional field is genuinely optional. Leave it out and it does not
      render — no "Client: TBC", no empty rows, no placeholder dashes.
   4. `client` and `descriptor` are mutually exclusive. Name them, or describe
      them without naming them. Never both.
   5. `services` are route slugs from content/services.js, so a job always
      links to a page that exists, and that page links back.
   ═══════════════════════════════════════════════════════════════════════════ */

import { SERVICES } from './services.js';

/**
 * @typedef  {object} Project
 * @property {string}   id           slug — /projects/<id>
 * @property {string}   title        what the job was. Required.
 * @property {string}   hero         a key in content/assets.js. Required.
 * @property {string[]} services     route slugs from content/services.js. Required.
 * @property {'owner_verified'|'user_context'} status  who confirmed what is said here
 * @property {string}   evidence     where every statement in the entry came from
 * @property {boolean}  [internal]   true = a draft; never ships
 * @property {string}   [summary]    one sentence, for cards
 * @property {string}   [client]     only with permission to name them
 * @property {string}   [descriptor] "a Harare logistics operator" — when not
 * @property {string}   [location]   town or suburb
 * @property {string}   [year]       as a string: '2024'
 * @property {string}   [type]       'Warehouse', 'Poultry house', 'Workshop'
 * @property {string}   [state]      'Completed' — only when the source says so
 * @property {string}   [scope]      one sentence on what we did
 * @property {string}   [description] two or three sentences, no more
 * @property {string[]} [gallery]    further asset keys, in reading order
 * @property {Array<[string,string]>} [figures]  [label, value] — span, area,
 *                                   tonnage, eaves height. Only what is known.
 * @property {string[]} [highlights] one clause each: what made it worth doing
 * @property {string}   [cta]        the enquiry heading on the job's page
 * @property {Video}    [video]
 *
 * @typedef  {object} Video
 * @property {string}   file         stem under assets/video/: <file>.webm, <file>.mp4
 * @property {string}   poster       a key in content/assets.js
 * @property {number}   w
 * @property {number}   h
 * @property {number}   seconds
 * @property {string}   published    YYYY-MM-DD, the day it went on the site
 * @property {string}   shows        what the footage shows, in words — the
 *                                   text alternative for a video with no sound
 */

/** Real jobs. */
export const PROJECTS = [
  {
    id: 'steel-roof-structure',
    title: 'Steel roof structure',
    hero: 'roofStructure',
    services: ['roofing-and-trusses'],
    state: 'Completed',
    status: 'user_context',
    evidence: 'The owner, in conversation on 2 October 2026, supplying the footage: real Kingson ' +
      'project footage of a completed steel roof/truss structure. Nothing else about the job — ' +
      'its name, client, location, year, dimensions, tonnage or the split of fabrication and ' +
      'erection — has been supplied, so none of it is stated.',
    summary: 'A completed steel roof, filmed from the floor beneath it.',
    description: 'Site footage of a completed steel roof by Kingson Engineering. The camera ' +
      'looks across the floor, then up along the trusses and purlins to the edge of the roof.',
    gallery: ['roofStructureTrusses', 'roofStructureColumns', 'roofStructureEdge'],
    cta: 'Need a roof like this?',
    video: {
      file: 'steel-roof-structure',
      poster: 'roofStructure',
      w: 540, h: 900, seconds: 14.5,
      published: '2026-10-02',
      shows: 'The footage has no sound. It opens on the concrete floor under the roof, with the ' +
        'open side of the building and brick structures beyond, then tilts up to the lattice ' +
        'trusses and purlins and follows them to the edge of the roof against the sky.'
    }
  }
];

/* ── what the rest of the site may use ───────────────────────────────────── */

const REQUIRED = ['id', 'title', 'hero', 'services', 'evidence'];
const PUBLISHABLE = new Set(['owner_verified', 'user_context']);
const SLUGS = new Set(SERVICES.map((s) => s.slug));

/** Everything that may actually be shown to the public. */
export const publishable = () =>
  PROJECTS.filter((p) => !p.internal && PUBLISHABLE.has(p.status) && REQUIRED.every((k) =>
    Array.isArray(p[k]) ? p[k].length : p[k]));

/** True when the portfolio has anything in it worth a page. */
export const hasProjects = () => publishable().length > 0;

/** The published jobs that used a given service route. */
export const projectsFor = (slug) => publishable().filter((p) => p.services.includes(slug));

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
    if (!PUBLISHABLE.has(p.status) && !p.internal) {
      out.push(`project ${name} has status "${p.status}" — only owner_verified or user_context may ship; mark it internal until then`);
    }
    if (!p.summary && !p.description) {
      out.push(`project ${name} has neither a summary nor a description — its page, card and metadata would have nothing to say`);
    }
    if (p.client && p.descriptor) {
      out.push(`project ${name} has both a client name and an anonymous descriptor — pick one`);
    }
    for (const s of p.services || []) {
      if (!SLUGS.has(s)) out.push(`project ${name} names service "${s}", which is not a route in content/services.js`);
    }
    if (p.id && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.id)) out.push(`project id "${p.id}" is not a URL slug`);
    if (p.id && seen.has(p.id)) out.push(`two projects share the id ${p.id}`);
    if (p.id) seen.add(p.id);
    if (p.video) {
      for (const k of ['file', 'poster', 'w', 'h', 'seconds', 'published', 'shows']) {
        if (!p.video[k]) out.push(`project ${name}: video has no ${k}`);
      }
      if (p.video.published && !/^\d{4}-\d{2}-\d{2}$/.test(p.video.published)) {
        out.push(`project ${name}: video.published must be YYYY-MM-DD`);
      }
    }
  }
  return out;
}
