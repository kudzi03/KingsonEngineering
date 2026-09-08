#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   tools/check-truth.js — the publication gate, asserted
   ═══════════════════════════════════════════════════════════════════════════

   content/company.js holds every business value with a status. Only values
   marked user_context, observed_photo or owner_verified may be published.
   This walks the files a visitor actually receives and fails if a gated value,
   or a claim the owner has not confirmed, appears in any of them.

   Run:  node tools/check-truth.js
   ═══════════════════════════════════════════════════════════════════════════ */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VALUES, unverifiedKeys } from '../content/company.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const SERVED = ['.html', '.js', '.css', '.xml', '.txt', '.json'];
const SKIP = new Set(['node_modules', '.git', 'tools', 'content']);

/* Claims the treatment forbids unless Kingson has confirmed them (§15).
   Each is a pattern, not a word, so ordinary prose is not caught. */
const CLAIMS = [
  [/\b\d+\s?(tonne|tonnes|ton)\b/i,               'a lifting or weight capacity'],
  [/\b(within|in)\s+\d+\s*(hours?|hrs?|days?)\b/i,'a turnaround or lead time'],
  [/\b(since|est\.?|established)\s+(19|20)\d\d\b/i,'a founding date'],
  [/\b\d+\+?\s+years?\s+(of\s+)?(experience|in business|trading)/i, 'years in business'],
  [/\b(ISO|SANS|BS EN)\s?\d/i,                    'a standard or certification'],
  [/\b(certified|accredited|approved contractor)\b/i, 'a certification'],
  [/\bwe\s+(guarantee|warrant)\b/i,               'a guarantee'],
  [/\b\d+\s*(staff|employees|welders|fabricators)\b/i, 'a headcount'],
  [/\bclients?\s+include\b/i,                     'a client list'],
  [/\b\d+\s*(projects|jobs)\s+(completed|delivered)\b/i, 'a project count']
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (SERVED.includes(extname(p))) out.push(p);
  }
  return out;
}

const gated = unverifiedKeys().map((k) => ({ key: k, value: String(VALUES[k].value) }))
  .filter((g) => g.value.length >= 6);

let failures = 0;
for (const file of walk(root)) {
  const rel = file.slice(root.length);
  const text = readFileSync(file, 'utf8');

  for (const g of gated) {
    /* A digits-only value is compared with separators stripped, so a phone
       number cannot slip through as "0772 262 869". */
    const bare = /^[\d+\s-]+$/.test(g.value);
    const hay = bare ? text.replace(/[\s()+-]/g, '') : text;
    const needle = bare ? g.value.replace(/[\s()+-]/g, '') : g.value;
    if (hay.includes(needle)) {
      console.error(`FAIL ${rel}: publishes company.${g.key}, which is not owner-verified`);
      failures++;
    }
  }

  for (const [re, what] of CLAIMS) {
    const m = text.match(re);
    if (m) {
      console.error(`FAIL ${rel}: asserts ${what} — "${m[0].trim()}"`);
      failures++;
    }
  }
}

/* The served HTML is generated from content/. If it has drifted, everything
   above was checked against a file the site is not actually shipping. */
try {
  const { execFileSync } = await import('node:child_process');
  execFileSync(process.execPath, [root + 'tools/render.js', '--check'], { stdio: 'pipe' });
} catch {
  console.error('FAIL index.html is out of date — run: node tools/render.js');
  failures++;
}

if (failures) {
  console.error(`\n${failures} publication-gate violation${failures === 1 ? '' : 's'}.`);
  process.exit(1);
}
console.log(`Publication gate holds. ${gated.length} value${gated.length === 1 ? '' : 's'} ` +
            `held back: ${unverifiedKeys().join(', ')}.`);
