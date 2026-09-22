#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   tools/check-truth.js — the publication gate, asserted
   ═══════════════════════════════════════════════════════════════════════════

   Three separate assertions over the files a visitor actually receives:

     1. GATED VALUES   content/company.js holds every business value with a
                       status. Anything not cleared for publication must not
                       appear in any served file.

     2. UNCONFIRMED    A capacity, a lead time, a certification, a headcount,
        CLAIMS         a client list or a project count may appear ONLY if it
                       is on the allowlist below, and an allowlist entry must
                       cite where on the returned document it came from. A new
                       figure therefore fails until someone can say who
                       confirmed it. That is the whole point.

     3. RETIRED        Values the returned document explicitly replaced. The
        VALUES         old site published a gmail address Kingson struck out,
                       hours it had guessed, and a Facebook URL now withdrawn.
                       None of them may come back.

   Plus a drift check: the served HTML is generated from content/, so if it is
   out of date the three assertions above were run against a file the site is
   not shipping.

   Run:  node tools/check-truth.js
   ═══════════════════════════════════════════════════════════════════════════ */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VALUES, unverifiedKeys } from '../content/company.js';
import { ASSETS, PAGE_IMAGES, BAND_IMAGE } from '../content/assets.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const SERVED = ['.html', '.js', '.css', '.xml', '.txt', '.json'];
/* `crm` is the internal system, not the website. This gate polices what a
   visitor is handed as Kingson's published claims: every figure on a public
   page has to cite the returned document. The CRM publishes nothing — it sits
   behind a sign-in, carries noindex, and the numbers on its screens are
   whatever is in the database that morning. Holding it to the same rule would
   mean the gate failing because somebody quoted a real job.

   `crm-src` is the same system before it is bundled, and is not deployed at
   all — see .vercelignore.

   `.claude` is tooling for whoever works on this — installed skills, their
   reference material and their starter files. Several of those starters are
   HTML, which the gate would otherwise read as pages Kingson had published.
   They are not deployed either; see .vercelignore.

   If anything public is ever served from those paths, take them out of here. */
const SKIP = new Set(['node_modules', '.git', '.claude', 'tools', 'content', 'crm', 'crm-src']);

/* ── 1. the numeral vocabulary claims are written in ─────────────────────────
   A gate that only looks for digits is not a gate: "six to ten weeks" and
   "two working days" are lead times too. */

const NUM = '(?:\\d+(?:[.,]\\d+)?|same|one|two|three|four|five|six|seven|eight|nine|ten|' +
            'eleven|twelve|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)';
const RANGE = `(?:${NUM})(?:\\s*(?:–|—|-|to|and)\\s*(?:${NUM}))?`;

/* ── 2. what may not be asserted ──────────────────────────────────────────── */

const CLAIMS = [
  [new RegExp(`\\b${RANGE}\\s*[-–—]?\\s*(?:tonnes?|tons?)\\b`, 'gi'),
    'a lifting or weight capacity'],
  [new RegExp(`\\b${RANGE}\\s+(?:working\\s+)?(?:hours?|hrs?|days?|weeks?|months?)\\b`, 'gi'),
    'a turnaround, lead time or programme'],
  [/\b(?:since|est\.?|established)\s+(?:19|20)\d\d\b/gi, 'a founding date'],
  [new RegExp(`\\b(?:over\\s+|more than\\s+)?${NUM}\\+?\\s+years?\\s+(?:of\\s+)?` +
              `(?:experience|trading|in business|serving)`, 'gi'), 'years in business'],
  [/\b(?:ISO|SANS|BS\s?EN|ASME|AWS)\s?\d/g, 'a standard or certification'],
  [/\b(?:certified|accredited|approved contractor|award[-\s]?winning|winner of)\b/gi,
    'a certification or award'],
  [/\bwe\s+(?:guarantee|warrant)\b/gi, 'a guarantee'],
  [/\bfree\s+(?:quote|quotation|estimate)s?\b/gi, 'a free-quotation promise'],
  [new RegExp(`\\b${NUM}\\+?\\s*(?:staff|employees|welders|fabricators|engineers)\\b`, 'gi'),
    'a headcount'],
  [/\b(?:clients?|customers?)\s+include\b/gi, 'a client list'],
  [/\btrusted by\b/gi, 'a customer endorsement'],
  [new RegExp(`\\b${NUM}\\+?\\s*(?:projects?|jobs?|clients?|customers?|buildings?)\\b`, 'gi'),
    'a project or customer count'],
  [/\b24\s*\/\s*7\b/g, 'round-the-clock availability'],
  [/\bsame[-\s]day\s+(?:delivery|dispatch|turnaround|quote)\b/gi, 'a same-day delivery promise']
];

/* Every figure Kingson confirmed, with where it was confirmed. An entry here
   is a citation, not a convenience: adding one without being able to fill in
   the source is the failure this file exists to prevent. */
const CONFIRMED = [
  ['25 tonnes',         'returned document §6 — lifting capacity, ticked'],
  ['25-tonne',          'returned document §6 — the same figure, set as a compound adjective'],
  ['same working day',  'returned document §7 — enquiry acknowledged, not struck out'],
  ['two working days',  'returned document §7 — site visit arranged, not struck out'],
  ['six to ten weeks',  'returned document §7 — portal frame programme, not struck out'],
  ['3 – 5 days',        'returned document §4 — flashing lead time on a stock gauge'],
  ['three to five days', 'returned document §4 — the same lead time, written out']
];

/* Comparison is on a normalised form, so a thin space, an en dash or a change
   of case cannot smuggle an unconfirmed figure past the allowlist — nor fail
   a confirmed one on typography alone. */
const norm = (s) => s.toLowerCase()
  .replace(/[    ]/g, ' ')
  .replace(/[‐-―]/g, '-')
  .replace(/\s*-\s*/g, ' - ')
  .replace(/\s+/g, ' ')
  .trim();

const ALLOWED = new Map(CONFIRMED.map(([text, why]) => [norm(text), why]));

/* ── 3. values the returned document replaced ─────────────────────────────── */

const RETIRED = [
  ['kingsonnkm@gmail.com',
    'struck out in §1 and replaced by admin1@kingsonengineering.co.zw'],
  ['18GoTdrLBD',
    'the printed Facebook share URL, struck out in §1 and not yet legibly replaced'],
  [/\bmon(?:day)?\s*[-–—]\s*fri(?:day)?\b/i,
    'the old site guessed Monday to Friday; §1 says Monday to Saturday'],
  [/\bmonday to friday\b/i,
    'the old site guessed Monday to Friday; §1 says Monday to Saturday']
];

/* ── walk the served tree ────────────────────────────────────────────────── */

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (SERVED.includes(extname(p))) out.push(p);
  }
  return out;
}

/* Only string values can leak into a template as themselves; a structured one
   (opening hours, say) is rendered field by field and is caught by its parts. */
const gated = unverifiedKeys()
  .map((k) => ({ key: k, value: VALUES[k].value }))
  .filter((g) => typeof g.value === 'string' && g.value.length >= 6);

let failures = 0;
const fail = (msg) => { console.error(`FAIL ${msg}`); failures++; };

const files = walk(root);
let allowedHits = 0;

for (const file of files) {
  const rel = file.slice(root.length);
  const text = readFileSync(file, 'utf8');

  for (const g of gated) {
    /* A digits-only value is compared with separators stripped, so a phone
       number cannot slip through as "0772 262 869". */
    const bare = /^[\d+\s-]+$/.test(g.value);
    const hay = bare ? text.replace(/[\s()+-]/g, '') : text;
    const needle = bare ? g.value.replace(/[\s()+-]/g, '') : g.value;
    if (hay.includes(needle)) {
      fail(`${rel}: publishes company.${g.key}, which is not cleared for publication`);
    }
  }

  for (const [pattern, why] of RETIRED) {
    const hit = typeof pattern === 'string' ? text.includes(pattern) : pattern.test(text);
    if (hit) fail(`${rel}: republishes a retired value — ${why}`);
  }

  for (const [re, what] of CLAIMS) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) {
      const found = norm(m[0]);
      if (ALLOWED.has(found)) { allowedHits++; continue; }
      const line = text.slice(0, m.index).split('\n').length;
      fail(`${rel}:${line}: asserts ${what} — "${m[0].trim()}" is not on the confirmed list`);
    }
  }
}

/* ── every page's structured data must be real JSON with no holes ────────── */

const allPages = files.filter((f) => f.endsWith('.html'));

/* ── every page wears the same chrome ────────────────────────────────────────
   404.html was hand-written until this build and had none of it: no skip
   link, no <main> landmark, no header, no footer. A keyboard visitor who
   landed on a dead URL had to tab the whole page, and a screen reader had no
   landmark to jump to. It is generated now (tools/pages.js), and this assert
   is what stops any future page shipping without the same parts.           */
for (const file of allPages) {
  const rel = file.slice(root.length);
  const html = readFileSync(file, 'utf8');
  if (!/<a class="skip" href="#main">/.test(html)) fail(`${rel}: no skip link`);
  /* tabindex="-1" is not decoration: without it, activating the skip link
     moves the URL fragment but leaves focus on <body>, so the next Tab
     carries on from the skip link and the visitor is back in the header. */
  if (!/<main id="main" tabindex="-1">/.test(html)) {
    fail(`${rel}: no focusable <main id="main"> landmark`);
  }
  if (!/<footer class="ft/.test(html)) fail(`${rel}: no site footer`);
  if (!/<header class="hd">/.test(html)) fail(`${rel}: no site header`);
  if (!/<html lang="en">/.test(html)) fail(`${rel}: no lang on <html>`);

  /* An aria-labelledby pointing at an id that does not exist is announced as
     nothing at all — worse than having left the attribute off. index.html
     carried one of these for the whole of the restructure. */
  for (const m of html.matchAll(/aria-(?:labelledby|describedby|controls)="([^"]+)"/g)) {
    for (const id of m[1].split(/\s+/)) {
      if (!html.includes(`id="${id}"`)) fail(`${rel}: aria reference points at no element — ${id}`);
    }
  }

  /* Two elements sharing an id makes one of them unreachable by fragment and
     makes every aria reference to it ambiguous. */
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dupes = [...new Set(ids.filter((v, i) => ids.indexOf(v) !== i))];
  if (dupes.length) fail(`${rel}: duplicate id — ${dupes.join(', ')}`);
}

/* ── every link, fragment and asset path resolves ────────────────────────────
   A dead internal link is the cheapest possible way to look unserious, and
   the one thing nobody checks before a demonstration. This walks href, src
   and every arm of every srcset on every page, follows Vercel's cleanUrls
   rule, and confirms that a #fragment exists on the page it points at.    */

const isFile = (f) => { try { return statSync(f).isFile(); } catch { return false; } };
const resolveHref = (u) => {
  const path = u === '/' ? '/index.html' : u;
  const base = path.startsWith('/') ? root + path.slice(1) : root + path;
  for (const c of [base, base + '.html', base + '/index.html']) if (isFile(c)) return c;
  return null;
};

let linksChecked = 0;
for (const file of allPages) {
  const rel = file.slice(root.length);
  const html = readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const m of html.matchAll(/(?:href|src|srcset)="([^"]*)"/g)) {
    const value = m[1];
    if (/^(https?:|mailto:|tel:|data:)/.test(value)) continue;
    for (const arm of value.split(',')) {
      const u = arm.trim().split(/\s+/)[0];
      if (!u) continue;
      linksChecked++;
      if (u.startsWith('#')) {
        if (u !== '#' && !ids.has(u.slice(1))) fail(`${rel}: link to #${u.slice(1)}, which is not on this page`);
        continue;
      }
      const [pathQ, frag] = u.split('#');
      /* A ?v= build stamp names the same file; the query is for caches, not
         for the file system. */
      const path = pathQ.split('?')[0];
      const target = resolveHref(path);
      if (!target) { fail(`${rel}: dead link — ${u}`); continue; }
      if (frag && target.endsWith('.html')
          && !readFileSync(target, 'utf8').includes(`id="${frag}"`)) {
        fail(`${rel}: ${path} has no #${frag}`);
      }
    }
  }
}

/* 404.html is deliberately outside the SEO block below: it carries noindex
   and no canonical by design, and a page a crawler is told to ignore has no
   business holding structured data. Everything it DOES owe is asserted
   above and here. */
const notFound = allPages.find((f) => f.endsWith('404.html'));
if (!notFound) fail('404.html is missing');
else {
  const html = readFileSync(notFound, 'utf8');
  if (!/<meta name="robots" content="noindex">/.test(html)) fail('404.html: not noindex');
  if (/<link rel="canonical"/.test(html)) fail('404.html: carries a canonical');
  if ((html.match(/<h1[\s>]/g) || []).length !== 1) fail('404.html: expected exactly one <h1>');
}

const pages = allPages.filter((f) => !f.endsWith('404.html'));
const seenTitles = [], seenDescs = [];
for (const file of pages) {
  const rel = file.slice(root.length);
  const html = readFileSync(file, 'utf8');
  const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!ldMatch) { fail(`${rel}: no structured data`); continue; }
  try {
    const json = JSON.parse(ldMatch[1].replace(/<!--\/?ld-->/g, ''));
    const holes = [];
    (function scan(node, path) {
      if (node === null || node === undefined) { holes.push(path); return; }
      if (Array.isArray(node)) node.forEach((v, i) => scan(v, `${path}[${i}]`));
      else if (typeof node === 'object') {
        for (const [k, v] of Object.entries(node)) scan(v, `${path}.${k}`);
      }
    })(json, '@graph');
    if (holes.length) fail(`${rel}: structured data has empty values at ${holes.join(', ')}`);

    /* A rating or a review would be the easiest lie on the whole site to tell
       and the hardest for a reader to catch, because it never appears in the
       visible page. Kingson has neither on file. */
    const text = JSON.stringify(json);
    for (const banned of ['aggregateRating', '"review"', 'foundingDate',
                          'numberOfEmployees', '"award"', 'priceRange']) {
      if (text.includes(banned)) fail(`${rel}: structured data asserts ${banned}, which is not confirmed`);
    }
  } catch (e) {
    fail(`${rel}: structured data is not valid JSON — ${e.message}`);
  }

  /* One h1 per page, and a canonical that points at this page. */
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) fail(`${rel}: ${h1s} <h1> elements — expected exactly 1`);
  const canon = html.match(/<link rel="canonical" href="([^"]+)"/);
  if (!canon) fail(`${rel}: no canonical link`);

  /* A title or description past the truncation point is not a failure a
     browser will ever show you, which is exactly why it needs asserting. */
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  if (title.length > 62) fail(`${rel}: <title> is ${title.length} characters — over 62 is truncated`);
  if (title.length < 20) fail(`${rel}: <title> is only ${title.length} characters`);
  if (desc.length > 160) fail(`${rel}: meta description is ${desc.length} characters — over 160 is truncated`);
  if (desc.length < 70) fail(`${rel}: meta description is only ${desc.length} characters`);

  /* Titles and descriptions must be unique across the site, or the routes are
     competing with each other for the same query. */
  seenTitles.push([rel, title]); seenDescs.push([rel, desc]);
}

const dupes = (rows, what) => {
  const byValue = {};
  for (const [rel, v] of rows) (byValue[v] = byValue[v] || []).push(rel);
  for (const [v, where] of Object.entries(byValue)) {
    if (where.length > 1) fail(`${where.join(' and ')} share one ${what}: "${v.slice(0, 60)}"`);
  }
};
dupes(seenTitles, '<title>');
dupes(seenDescs, 'meta description');

/* ── the asset map must describe the files that exist ────────────────────────
   `content/assets.js` declares each photograph's dimensions and the widths it
   has been written at; the page's width/height attributes, srcset entries and
   <picture> arms all come from there. `assets/img/manifest.json` records what
   `tools/build-images.py` actually wrote. If those two disagree the page is
   declaring an aspect ratio the file does not have, or naming a derivative
   that was never built — both silent in a browser. */

{
  const manifest = JSON.parse(readFileSync(root + 'assets/img/manifest.json', 'utf8'));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  for (const [key, a] of Object.entries(ASSETS)) {
    const e = manifest[a.slug];
    if (!e) { fail(`content/assets.js declares ${key} (${a.slug}), which the image manifest does not list`); continue; }
    if (e.w !== a.w || e.h !== a.h) {
      fail(`${key}: content/assets.js says ${a.w}x${a.h}, the built file is ${e.w}x${e.h}`);
    }
    if (!same(e.sizes, a.widths)) {
      fail(`${key}: content/assets.js lists widths ${a.widths.join(', ')}, the built set is ${e.sizes.join(', ')}`);
    }
    if (Boolean(e.wide) !== Boolean(a.wide)) {
      fail(`${key}: ${a.wide ? 'declares' : 'does not declare'} a wide cut, but ${e.wide ? 'one was built' : 'none was built'}`);
    } else if (e.wide && (e.wide.w !== a.wide.w || e.wide.h !== a.wide.h || !same(e.wide.sizes, a.wide.widths))) {
      fail(`${key}: the wide cut in content/assets.js does not match the one that was built`);
    }
  }
}

/* ── the sitemap's image list must be the page's image list ──────────────────
   `sitemap.xml` declares an <image:image> per entry in PAGE_IMAGES. Those are
   a claim about what is on the page, and they were wrong for two rounds of
   photography changes before anyone looked: the list still named two
   photographs that had been taken off the page, and did not name two that had
   been put on it.

   Nothing in a browser shows this. Only a search engine sees it, and what it
   sees is a page describing images it does not have. Both directions are
   checked, because only checking one is how it drifted in the first place. */

{
  const declared = [BAND_IMAGE, ...PAGE_IMAGES].filter(Boolean);
  const home = readFileSync(root + 'index.html', 'utf8');
  const shown = Object.entries(ASSETS)
    .filter(([, a]) => new RegExp(`assets/img/${a.slug}-\\d`).test(home))
    .map(([key]) => key);

  for (const key of declared) {
    if (!shown.includes(key)) {
      fail(`sitemap.xml declares ${key} as an image of the home page, but index.html does not show it`);
    }
  }
  for (const key of shown) {
    if (!declared.includes(key)) {
      fail(`index.html shows ${key}, but PAGE_IMAGES does not list it, so sitemap.xml omits it`);
    }
  }
  const seen = new Set();
  for (const key of declared) {
    if (seen.has(key)) fail(`PAGE_IMAGES lists ${key} twice`);
    seen.add(key);
  }
}

/* ── every image a page asks for must be on disk ─────────────────────────────
   There are now two derivative families — the plain widths and the 16:9 wide
   cuts the bleed scenes serve above 900px — and a <picture> that names a file
   `tools/build-images.py` has not written fails silently: the browser simply
   falls back and the visitor never knows the art direction was meant to be
   different. This catches it at build time instead. */

const imageRefs = new Set();
for (const f of pages) {
  const html = readFileSync(f, 'utf8');
  for (const m of html.matchAll(/(?:src|srcset|imagesrcset)="([^"]+)"/g)) {
    for (const part of m[1].split(',')) {
      const url = part.trim().split(/\s+/)[0];
      if (/^assets\/img\/|^\/assets\/img\//.test(url)) imageRefs.add(url.replace(/^\//, ''));
    }
  }
}
let missing = 0;
for (const url of imageRefs) {
  if (!existsSync(root + url)) { fail(`${url} is referenced by a page but is not in the repository`); missing++; }
}

/* ── the sitemap must list every route that exists, and nothing that does not ─ */

const sitemapXml = readFileSync(root + 'sitemap.xml', 'utf8');
const listed = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const expected = pages.map((f) => {
  const rel = f.slice(root.length);
  return 'https://kingson-engineering.vercel.app/' + (rel === 'index.html' ? '' : rel.replace(/\.html$/, ''));
});
for (const url of expected) {
  if (!listed.includes(url)) fail(`sitemap.xml does not list ${url}, which is a committed page`);
}
for (const url of listed) {
  if (!expected.includes(url)) fail(`sitemap.xml lists ${url}, which is not a committed page`);
}

/* ── the served HTML must match the content layer ─────────────────────────── */

try {
  const { execFileSync } = await import('node:child_process');
  execFileSync(process.execPath, [root + 'tools/render.js', '--check'], { stdio: 'pipe' });
} catch {
  fail('index.html is out of date — run: node tools/render.js');
}

if (failures) {
  console.error(`\n${failures} publication-gate violation${failures === 1 ? '' : 's'}.`);
  process.exit(1);
}

const held = unverifiedKeys();
console.log(`Publication gate holds across ${files.length} served files.`);
console.log(`  ${allowedHits} confirmed figure${allowedHits === 1 ? '' : 's'} published, ` +
            `each citing the returned document.`);
console.log(`  ${held.length} value${held.length === 1 ? '' : 's'} held back: ${held.join(', ') || 'none'}.`);
console.log(`  ${imageRefs.size} image files referenced, all present.`);
