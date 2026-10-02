#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   tools/quality-gate.mjs — the Kingson quality gate
   ═══════════════════════════════════════════════════════════════════════════

   A ledger of what has actually been checked, against which code.

     node tools/quality-gate.mjs run              run every automated check
     node tools/quality-gate.mjs run --browser    …and the browser checks
                                                  (needs the local server:
                                                  node .claude/serve.mjs . 8210)
     node tools/quality-gate.mjs record <id> pass|fail --note "what you saw"
                                                  record a judgement check
     node tools/quality-gate.mjs status [--json]  the ledger, for this code

   FOUR STATES, NEVER CONFLATED

     PASS     the check ran against THIS code and succeeded
     FAIL     the check ran against THIS code and failed
     UNKNOWN  the check has a result, but for different code — the files the
              site ships have changed since, so the old result says nothing
     NOT RUN  there is no result at all

   A check is never PASS because nobody looked. The code is identified by a
   fingerprint: a hash of every file Vercel would deploy plus the build and
   gate tools. Editing a page turns every result into UNKNOWN until the check
   is run again. Editing a markdown note does not, because no visitor sees it.

   Judgement checks (does it look right, is every claim true) cannot be
   automated. They are recorded by a person or an agent with `record`, a note
   is required, and the ledger marks them `attested` so nobody mistakes an
   opinion for a measurement.

   The ledger lives in .quality/gate.json. It is committed, so a reviewer can
   see what was checked against the commit in front of them, and it is never
   deployed (.vercelignore).
   ═══════════════════════════════════════════════════════════════════════════ */

import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const LEDGER = ROOT + '.quality/gate.json';

/* ── what the gate knows how to check ────────────────────────────────────── */

const CHECKS = [
  // id, group, kind, what it means
  ['build',          'Build',    'auto',    'Generated pages match content/ (render.js --check)'],
  ['truth',          'Truth',    'auto',    'Publication gate: no unconfirmed figure, internal links, ids, aria, meta lengths (check-truth.js)'],
  ['syntax',         'Build',    'auto',    'Every shipped and tool module parses (node --check)'],
  ['lint',           'Build',    'auto',    'ESLint, defect rules only (tools/eslint.config.mjs)'],
  ['typecheck',      'Build',    'auto',    'tsc --checkJs over the browser modules, non-strict'],
  ['tests',          'Build',    'auto',    'Automated tests (tools/tests/*.test.mjs)'],
  ['seo-meta',       'SEO',      'auto',    'Title, description, canonical, Open Graph and Twitter tags on every indexable page; OG image exists at 1200x630'],
  ['sitemap',        'SEO',      'auto',    'Every sitemap URL is a page; every indexable page is in the sitemap; robots.txt names it'],
  ['structured-data','SEO',      'auto',    'JSON-LD parses; VideoObject / BreadcrumbList carry their required properties; every @id reference resolves'],
  ['secrets',        'Security', 'auto',    'No keys, tokens or private material in shipped files'],
  ['assets',         'Perf',     'auto',    'Image and video budgets; video has no audio track; every <video> has a poster and dimensions'],
  ['console',        'Browser',  'browser', 'No console errors or failed requests on any page (desktop + mobile)'],
  ['overflow',       'Browser',  'browser', 'No horizontal overflow at 320, 375, 390, 414, 768, 1024, 1280, 1440, 1920'],
  ['links-live',     'Browser',  'browser', 'Every internal link answers 200 from the running server; unknown URL answers 404'],
  ['keyboard',       'Browser',  'browser', 'Tab order reaches every control with a visible focus indicator'],
  ['menu',           'Browser',  'browser', 'Mobile menu opens, traps focus, closes on Escape, restores focus'],
  ['forms',          'Browser',  'browser', 'Empty enquiry submit shows errors and focuses the summary'],
  ['reduced-motion', 'Browser',  'browser', 'Under reduced motion: no video autoplay, hero slideshow starts paused'],
  ['video',          'Browser',  'browser', 'Project video: muted, inline, poster first, plays in view, pauses out of view, pause control works'],
  ['a11y',           'Browser',  'browser', 'axe-core: no serious or critical violations on any page'],
  ['performance',    'Browser',  'browser', 'LCP and CLS measured on home and project pages (local, unthrottled)'],
  ['visual-desktop', 'Judgement','attested','Desktop pages inspected by eye: hierarchy, spacing, crops, type'],
  ['visual-mobile',  'Judgement','attested','Mobile pages inspected by eye at small, standard and large phone widths'],
  ['facts',          'Judgement','attested','Every new project statement traces to a named source; nothing inferred from footage'],
  ['diff-review',    'Judgement','attested','The full diff was read for regressions, deleted content and invented facts']
];
const BY_ID = Object.fromEntries(CHECKS.map(([id, group, kind, what]) => [id, { id, group, kind, what }]));

/* ── the fingerprint of the code a visitor receives ──────────────────────── */

function fingerprint() {
  const files = execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n').filter(Boolean)
    .filter((f) => !f.startsWith('.quality/') && !f.startsWith('.claude/') && !f.endsWith('.md'))
    .filter((f) => existsSync(ROOT + f) && statSync(ROOT + f).isFile())
    .sort();
  const h = createHash('sha256');
  for (const f of files) h.update(f + '\0').update(readFileSync(ROOT + f)).update('\0');
  return h.digest('hex').slice(0, 16);
}

/* ── the ledger ──────────────────────────────────────────────────────────── */

const load = () => (existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, 'utf8')) : { checks: {} });
const save = (l) => { mkdirSync(ROOT + '.quality', { recursive: true }); writeFileSync(LEDGER, JSON.stringify(l, null, 2) + '\n'); };

function stateOf(rec, fp) {
  if (!rec) return 'NOT RUN';
  if (rec.fingerprint !== fp) return 'UNKNOWN';
  return rec.ok ? 'PASS' : 'FAIL';
}

/* ── automated checks ────────────────────────────────────────────────────── */

const sh = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', ...opts });
  return { ok: r.status === 0, out: ((r.stdout || '') + (r.stderr || '')).trim(), missing: r.error?.code === 'ENOENT' };
};
const tail = (s, n = 12) => s.split('\n').slice(-n).join('\n');

const AUTO = {
  build: () => sh('node', ['tools/render.js', '--check']),
  truth: () => sh('node', ['tools/check-truth.js']),

  syntax: () => {
    const files = execFileSync('git', ['ls-files', '-co', '--exclude-standard', '*.js', '*.mjs'], { cwd: ROOT, encoding: 'utf8' })
      .split('\n').filter((f) => f && !f.startsWith('crm/') && !f.startsWith('crm-src/') && !f.startsWith('.claude/'));
    const bad = files.map((f) => [f, sh('node', ['--check', f])]).filter(([, r]) => !r.ok);
    return { ok: !bad.length, out: bad.length ? bad.map(([f, r]) => `${f}\n${tail(r.out, 4)}`).join('\n') : `${files.length} modules parse` };
  },

  lint: () => {
    const r = sh('eslint', ['-c', 'tools/eslint.config.mjs', 'main.js', 'scenes', 'interface', 'content', 'tools']);
    if (r.missing) return { ok: false, out: 'eslint is not installed — npm i -g eslint', notRun: true };
    return { ok: r.ok, out: r.ok ? 'no findings' : r.out };
  },

  /* The browser modules are plain JavaScript reading the DOM through
     querySelector, which TypeScript types as Element; every `.dataset` and
     `.style` on the result is reported as TS2339. That one class is
     suppressed — and counted, so the suppression is visible — and everything
     else is a finding. */
  typecheck: () => {
    const r = sh('tsc', ['--allowJs', '--checkJs', '--noEmit', '--strict', 'false', '--noImplicitAny', 'false',
      '--target', 'es2022', '--module', 'esnext', '--moduleResolution', 'bundler',
      '--lib', 'es2023,dom,dom.iterable', '--skipLibCheck',
      'main.js', ...['scenes', 'interface'].flatMap((d) =>
        execFileSync('git', ['ls-files', '-co', '--exclude-standard', `${d}/*.js`], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean))]);
    if (r.missing) return { ok: false, out: 'tsc is not installed — npm i -g typescript', notRun: true };
    const errs = r.out.split('\n').filter((l) => /error TS\d+/.test(l));
    const noise = errs.filter((l) => /TS2339: Property '\w+' does not exist on type '(Element|EventTarget|Node|ParentNode)'/.test(l));
    const real = errs.filter((l) => !noise.includes(l));
    return { ok: !real.length, out: `${real.length} finding(s); ${noise.length} DOM-narrowing (TS2339 on Element) suppressed\n${real.join('\n')}`.trim() };
  },

  tests: () => {
    const r = sh('node', ['--test', 'tools/tests/*.test.mjs']);
    return { ok: r.ok, out: tail(r.out, 14) };
  },

  'seo-meta': () => {
    const out = [];
    for (const f of pages()) {
      const html = readFileSync(ROOT + f, 'utf8');
      if (/<meta name="robots" content="noindex">/.test(html)) continue;
      for (const [name, re] of [
        ['title', /<title>[^<]{20,62}<\/title>/], ['description', /<meta name="description" content="[^"]{70,160}">/],
        ['canonical', /<link rel="canonical" href="https:\/\/[^"]+">/], ['og:title', /property="og:title"/],
        ['og:description', /property="og:description"/], ['og:url', /property="og:url"/],
        ['og:image', /property="og:image" content="[^"]+"/], ['twitter:card', /name="twitter:card"/],
        ['h1', /<h1[\s>]/]
      ]) if (!re.test(html)) out.push(`${f}: missing or malformed ${name}`);
      const og = (html.match(/property="og:image" content="https?:\/\/[^/]+\/([^"]+)"/) || [])[1];
      if (og && !existsSync(ROOT + og)) out.push(`${f}: og:image ${og} does not exist`);
      if (og && existsSync(ROOT + og)) {
        const p = sh('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', og]);
        if (!p.missing && p.out && p.out.trim() !== '1200,630') out.push(`${f}: og:image is ${p.out.trim()}, not 1200,630`);
      }
      const canon = (html.match(/<link rel="canonical" href="https?:\/\/[^/]+(\/[^"]*)">/) || [])[1];
      const expect = '/' + f.replace(/\.html$/, '').replace(/^index$/, '');
      if (canon && canon !== expect) out.push(`${f}: canonical ${canon} is not this page (${expect})`);
    }
    return { ok: !out.length, out: out.join('\n') || `${pages().length} pages checked` };
  },

  sitemap: () => {
    const sm = readFileSync(ROOT + 'sitemap.xml', 'utf8');
    const locs = [...sm.matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map((m) => m[1]);
    const out = [];
    for (const l of locs) {
      const f = l === '/' ? 'index.html' : l.slice(1) + '.html';
      if (!existsSync(ROOT + f)) out.push(`sitemap lists ${l}, which is not a page`);
    }
    for (const f of pages()) {
      const html = readFileSync(ROOT + f, 'utf8');
      if (/<meta name="robots" content="noindex">/.test(html)) continue;
      const u = '/' + f.replace(/\.html$/, '').replace(/^index$/, '');
      if (!locs.includes(u)) out.push(`${f} is indexable but not in the sitemap`);
    }
    if (!/^Sitemap: https:\/\/.+\/sitemap\.xml$/m.test(readFileSync(ROOT + 'robots.txt', 'utf8'))) out.push('robots.txt names no sitemap');
    return { ok: !out.length, out: out.join('\n') || `${locs.length} URLs, all pages, all indexable pages listed` };
  },

  'structured-data': () => {
    const out = [];
    let nodes = 0;
    for (const f of pages()) {
      const html = readFileSync(ROOT + f, 'utf8');
      for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
        let json;
        try { json = JSON.parse(m[1]); } catch (e) { out.push(`${f}: JSON-LD does not parse — ${e.message}`); continue; }
        const graph = json['@graph'] || [json];
        const ids = new Set(graph.map((n) => n['@id']).filter(Boolean));
        const refs = [];
        (function walk(n) {
          if (Array.isArray(n)) return n.forEach(walk);
          if (n && typeof n === 'object') {
            if (Object.keys(n).length === 1 && n['@id']) refs.push(n['@id']);
            Object.values(n).forEach(walk);
          }
        })(graph);
        for (const r of refs) if (!ids.has(r)) out.push(`${f}: reference to ${r}, which is not in the graph`);
        for (const n of graph) {
          nodes++;
          const t = [].concat(n['@type']);
          if (t.includes('VideoObject')) {
            for (const k of ['name', 'description', 'thumbnailUrl', 'uploadDate', 'contentUrl', 'duration']) {
              if (!n[k]) out.push(`${f}: VideoObject has no ${k}`);
            }
            if (n.duration && !/^PT(\d+M)?\d+(\.\d+)?S$/.test(n.duration)) out.push(`${f}: VideoObject duration ${n.duration} is not ISO 8601`);
          }
          if (t.includes('BreadcrumbList')) {
            (n.itemListElement || []).forEach((it, i) => {
              if (it.position !== i + 1) out.push(`${f}: breadcrumb position ${it.position} at index ${i}`);
              if (!it.name) out.push(`${f}: breadcrumb item ${i + 1} has no name`);
            });
          }
        }
      }
    }
    return { ok: !out.length, out: out.join('\n') || `${nodes} nodes across ${pages().length} pages` };
  },

  /* Patterns for material that must never ship. The Supabase anon key is a
     public, row-level-security-bounded key by design and is allowed; the
     service-role key is not. */
  secrets: () => {
    const PATTERNS = [
      [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, 'a private key'],
      [/\bAKIA[0-9A-Z]{16}\b/, 'an AWS access key'],
      [/\bsk-(?:ant-)?[A-Za-z0-9_-]{20,}/, 'an API secret key'],
      [/\bgh[pousr]_[A-Za-z0-9]{30,}/, 'a GitHub token'],
      [/\bxox[baprs]-[A-Za-z0-9-]{10,}/, 'a Slack token'],
      [/\bsb_secret_[A-Za-z0-9_-]{16,}/, 'a Supabase secret key'],
      [/SUPABASE_SERVICE_ROLE_KEY\s*=\s*[A-Za-z0-9_.-]{20,}/, 'a service-role key value'],
      [/\b(?:password|passwd|secret)\s*[:=]\s*["'][^"']{6,}["']/i, 'a hard-coded password']
    ];
    const files = execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' })
      .split('\n').filter((f) => f && /\.(html|js|mjs|css|json|xml|txt|env|sh|py|sql)$/.test(f) && !f.startsWith('.claude/'));
    const out = [];
    for (const f of files) {
      if (!existsSync(ROOT + f)) continue;
      const t = readFileSync(ROOT + f, 'utf8');
      for (const [re, what] of PATTERNS) {
        if (f === 'tools/quality-gate.mjs') continue;
        if (re.test(t)) out.push(`${f}: looks like ${what}`);
      }
      /* A Supabase JWT is public when its role is anon (it is meant for the
         browser, bounded by row-level security) and a breach when its role is
         service_role. So the token is decoded, not pattern-matched. */
      for (const [jwt] of t.matchAll(/\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g)) {
        try {
          const role = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString()).role;
          if (role && role !== 'anon' && role !== 'authenticated') out.push(`${f}: a JWT with role "${role}"`);
        } catch { out.push(`${f}: an undecodable JWT-shaped token`); }
      }
    }
    if (existsSync(ROOT + '.env')) out.push('.env is present in the working tree');
    return { ok: !out.length, out: out.join('\n') || `${files.length} files scanned` };
  },

  assets: () => {
    const out = [];
    const IMG_MAX = 500 * 1024, VIDEO_MAX = 2.2 * 1024 * 1024;
    const listed = execFileSync('git', ['ls-files', '-co', '--exclude-standard', 'assets/'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
    for (const f of listed) {
      if (!existsSync(ROOT + f)) continue;
      const size = statSync(ROOT + f).size;
      if (/\.(webp|jpe?g|png|avif)$/.test(f) && size > IMG_MAX && !f.includes('/brand/')) out.push(`${f}: ${(size / 1024) | 0} KB, over the ${(IMG_MAX / 1024) | 0} KB image budget`);
      if (/\.(mp4|webm)$/.test(f)) {
        if (size > VIDEO_MAX) out.push(`${f}: ${(size / 1048576).toFixed(2)} MB, over the 2.2 MB video budget`);
        const p = sh('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type', '-of', 'csv=p=0', f]);
        if (p.missing) out.push('ffprobe is not installed; video streams not inspected');
        else if (/audio/.test(p.out)) out.push(`${f}: carries an audio track — strip it (-an)`);
      }
    }
    for (const f of pages()) {
      const html = readFileSync(ROOT + f, 'utf8');
      for (const m of html.matchAll(/<video\b[^>]*>/g)) {
        const tag = m[0];
        for (const a of ['width=', 'height=', 'muted', 'playsinline', 'preload="none"']) {
          if (!tag.includes(a)) out.push(`${f}: <video> without ${a}`);
        }
        /* A poster attribute (where the film is the first paint) or a lazy
           poster image behind it (below the fold) — never neither. */
        const before = html.slice(Math.max(0, m.index - 600), m.index);
        if (!tag.includes('poster=') && !/<img class="film-poster"[^>]*loading="lazy"/.test(before)) {
          out.push(`${f}: <video> with no poster and no lazy poster image`);
        }
        if (/\bautoplay\b/.test(tag)) out.push(`${f}: <video autoplay> — playback must be started by script, so reduced motion is honoured`);
      }
    }
    return { ok: !out.length, out: out.join('\n') || `${listed.length} asset files within budget` };
  }
};

function pages() {
  return execFileSync('git', ['ls-files', '-co', '--exclude-standard', '*.html'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n').filter((f) => f && !f.startsWith('crm') && !f.startsWith('.claude/') && f !== '404.html');
}

/* ── commands ─────────────────────────────────────────────────────────────── */

function record(ledger, id, ok, out, by, fp) {
  ledger.checks[id] = { ok, fingerprint: fp, at: new Date().toISOString(), by, out: tail(String(out || ''), 30) };
}

function printStatus(ledger, fp, json) {
  const rows = CHECKS.map(([id]) => {
    const rec = ledger.checks[id];
    return { id, ...BY_ID[id], state: stateOf(rec, fp), by: rec?.by || '', at: rec?.at || '', note: rec?.note || '' };
  });
  const count = (s) => rows.filter((r) => r.state === s).length;
  const summary = { fingerprint: fp, PASS: count('PASS'), FAIL: count('FAIL'), UNKNOWN: count('UNKNOWN'), 'NOT RUN': count('NOT RUN') };
  if (json) { console.log(JSON.stringify({ summary, rows }, null, 2)); return summary; }
  console.log(`Kingson quality gate — code ${fp}\n`);
  let group = '';
  for (const r of rows) {
    if (r.group !== group) { group = r.group; console.log(`  ${group}`); }
    const mark = { PASS: 'PASS   ', FAIL: 'FAIL   ', UNKNOWN: 'UNKNOWN', 'NOT RUN': 'NOT RUN' }[r.state];
    console.log(`    ${mark}  ${r.id.padEnd(16)} ${r.kind === 'attested' && r.state !== 'NOT RUN' ? '(attested) ' : ''}${r.what}`);
    if (r.state === 'FAIL') console.log(ledger.checks[r.id].out.split('\n').slice(0, 8).map((l) => '               │ ' + l).join('\n'));
  }
  console.log(`\n  ${summary.PASS} PASS · ${summary.FAIL} FAIL · ${summary.UNKNOWN} UNKNOWN · ${summary['NOT RUN']} NOT RUN`);
  return summary;
}

const [cmd = 'status', ...rest] = process.argv.slice(2);
const ledger = load();
const fp = fingerprint();

if (cmd === 'run') {
  const only = rest.filter((a) => !a.startsWith('--'));
  for (const [id, fn] of Object.entries(AUTO)) {
    if (only.length && !only.includes(id)) continue;
    process.stdout.write(`  ${id.padEnd(16)} `);
    const r = fn();
    if (r.notRun) { delete ledger.checks[id]; console.log('NOT RUN — ' + r.out); continue; }
    record(ledger, id, r.ok, r.out, 'auto', fp);
    console.log(r.ok ? 'PASS' : 'FAIL');
  }
  if (rest.includes('--browser')) {
    const r = sh('node', ['tools/qa-browser.mjs'], { env: { ...process.env, QA_ONLY: only.join(',') }, maxBuffer: 64 * 1024 * 1024 });
    let results = null;
    try { results = JSON.parse(r.out.slice(r.out.indexOf('{"results"'))).results; } catch { /* reported below */ }
    if (!results) { console.log('  browser checks NOT RUN —\n' + tail(r.out, 10)); }
    else for (const [id, res] of Object.entries(results)) {
      if (!BY_ID[id]) continue;
      if (res.notRun) { delete ledger.checks[id]; console.log(`  ${id.padEnd(16)} NOT RUN — ${res.out}`); continue; }
      record(ledger, id, res.ok, res.out, 'browser', fp);
      console.log(`  ${id.padEnd(16)} ${res.ok ? 'PASS' : 'FAIL'}`);
    }
  }
  save(ledger);
  console.log('');
  const s = printStatus(ledger, fp, false);
  process.exit(s.FAIL ? 1 : 0);
} else if (cmd === 'record') {
  const [id, verdict] = rest;
  const ni = rest.indexOf('--note');
  const note = ni >= 0 ? rest[ni + 1] : '';
  if (!BY_ID[id]) { console.error(`unknown check: ${id}\nknown: ${Object.keys(BY_ID).join(', ')}`); process.exit(2); }
  if (BY_ID[id].kind !== 'attested') { console.error(`${id} is measured, not attested — run it: node tools/quality-gate.mjs run ${BY_ID[id].kind === 'browser' ? '--browser' : id}`); process.exit(2); }
  if (!['pass', 'fail'].includes(verdict)) { console.error('verdict must be pass or fail'); process.exit(2); }
  if (!note || note.length < 20) { console.error('a judgement needs evidence: --note "what was looked at and what was seen" (20+ characters)'); process.exit(2); }
  record(ledger, id, verdict === 'pass', note, 'attested', fp);
  ledger.checks[id].note = note;
  save(ledger);
  console.log(`${id}: recorded ${verdict.toUpperCase()} against code ${fp}`);
} else if (cmd === 'status') {
  const s = printStatus(ledger, fp, rest.includes('--json'));
  process.exit(s.FAIL ? 1 : 0);
} else {
  console.error('usage: quality-gate.mjs run [--browser] [ids…] | record <id> pass|fail --note "…" | status [--json]');
  process.exit(2);
}
