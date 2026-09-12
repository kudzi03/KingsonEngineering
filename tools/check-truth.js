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

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VALUES, unverifiedKeys } from '../content/company.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const SERVED = ['.html', '.js', '.css', '.xml', '.txt', '.json'];
const SKIP = new Set(['node_modules', '.git', 'tools', 'content']);

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

/* ── the structured data must be real JSON with no holes ─────────────────── */

const html = readFileSync(root + 'index.html', 'utf8');
const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (!ldMatch) fail('index.html: no structured data');
else {
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
    if (holes.length) fail(`index.html: structured data has empty values at ${holes.join(', ')}`);
  } catch (e) {
    fail(`index.html: structured data is not valid JSON — ${e.message}`);
  }
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
