#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   tools/qa-browser.mjs — the gate's browser checks
   ═══════════════════════════════════════════════════════════════════════════

   Run by `node tools/quality-gate.mjs run --browser`, against the local
   stand-in for Vercel:  node .claude/serve.mjs . 8210

   Prints one JSON line, {"results": {id: {ok, out} | {notRun, out}}}, last.
   A check that cannot run here — no Playwright, no axe-core, no server — says
   notRun with the reason. It never reports a pass it did not observe.

     QA_BASE   server origin             default http://localhost:8210
     QA_ONLY   comma list of check ids   default all
     AXE_PATH  path to axe.min.js        default: resolved from node_modules
   ═══════════════════════════════════════════════════════════════════════════ */

import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BASE = process.env.QA_BASE || 'http://localhost:8210';
const ONLY = (process.env.QA_ONLY || '').split(',').filter(Boolean);
const want = (id) => !ONLY.length || ONLY.includes(id);
const results = {};
const done = () => { console.log(JSON.stringify({ results })); process.exit(0); };
const notRun = (ids, why) => ids.forEach((id) => want(id) && (results[id] = { notRun: true, out: why }));
const ALL = ['console', 'overflow', 'links-live', 'keyboard', 'menu', 'forms', 'reduced-motion', 'video', 'a11y', 'performance'];

/* Only the Vercel platform serves this; locally it is always a 404. */
const PLATFORM_ONLY = /\/_vercel\/insights\/script\.js/;

let chromium;
for (const spec of ['playwright', '/opt/node22/lib/node_modules/playwright/index.mjs']) {
  try { ({ chromium } = await import(spec)); break; } catch { /* try the next */ }
}
if (!chromium) { notRun(ALL, 'Playwright is not installed'); done(); }

try { const r = await fetch(BASE + '/'); if (!r.ok) throw new Error(r.status); }
catch { notRun(ALL, `no server at ${BASE} — start: node .claude/serve.mjs . 8210`); done(); }

const PAGES = ['/', ...[...readFileSync(ROOT + 'sitemap.xml', 'utf8').matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)]
  .map((m) => m[1]).filter((p) => p !== '/'), '/this-page-does-not-exist'];
const VIDEO_PAGES = PAGES.filter((p) => {
  const f = p === '/' ? 'index.html' : p.slice(1) + '.html';
  return existsSync(ROOT + f) && /<video\b/.test(readFileSync(ROOT + f, 'utf8'));
});

const browser = await chromium.launch();
const vp = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };

async function open(path, { viewport = vp.desktop, reducedMotion = 'no-preference' } = {}) {
  const ctx = await browser.newContext({ viewport, reducedMotion });
  const page = await ctx.newPage();
  const errors = [];
  /* Chrome's "Failed to load resource" text does not name the URL, so the
     platform-only script is recognised by where the message came from. */
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const where = (m.location() || {}).url || '';
    if (PLATFORM_ONLY.test(where) || PLATFORM_ONLY.test(m.text())) return;
    /* The 404 probe's own document answering 404 is the expected result. */
    if (path === '/this-page-does-not-exist' && where === BASE + path) return;
    errors.push(m.text() + (where ? ` (${where})` : ''));
  });
  page.on('pageerror', (e) => errors.push(String(e)));
  /* A media request the browser abandons (the page closing mid-stream, a
     <source> it skips) reports net::ERR_ABORTED. That is not a failure. */
  page.on('requestfailed', (r) => {
    if (PLATFORM_ONLY.test(r.url())) return;
    if (r.failure()?.errorText === 'net::ERR_ABORTED' && /\.(webm|mp4)(\?|$)/.test(r.url())) return;
    errors.push(`request failed ${r.url()} (${r.failure()?.errorText})`);
  });
  page.on('response', (r) => { if (r.status() >= 400 && !PLATFORM_ONLY.test(r.url()) && r.url() !== BASE + path) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  return { ctx, page, errors };
}
const scrollThrough = (page) => page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += Math.round(innerHeight * 0.7)) {
    window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120));
  }
  window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 200));
});

/* ── console ── */
if (want('console')) {
  const bad = [];
  for (const p of PAGES) for (const v of Object.values(vp)) {
    const { ctx, page, errors } = await open(p, { viewport: v });
    await scrollThrough(page);
    await page.waitForTimeout(300);
    if (errors.length) bad.push(`${p} @${v.width}: ${[...new Set(errors)].slice(0, 4).join(' | ')}`);
    await ctx.close();
  }
  results.console = { ok: !bad.length, out: bad.join('\n') || `${PAGES.length} pages × 2 viewports, no errors (Vercel Analytics script excluded: served only on Vercel)` };
}

/* ── overflow ── */
if (want('overflow')) {
  const bad = [];
  const widths = [320, 375, 390, 414, 768, 1024, 1280, 1440, 1920];
  for (const p of PAGES) for (const w of widths) {
    const { ctx, page } = await open(p, { viewport: { width: w, height: 900 } });
    const over = await page.evaluate(() => {
      const d = document.documentElement.scrollWidth - innerWidth;
      if (d <= 0) return null;
      const culprits = [...document.querySelectorAll('body *')].filter((el) => {
        const r = el.getBoundingClientRect(); return r.right > innerWidth + 1 && getComputedStyle(el).position !== 'fixed';
      }).slice(0, 3).map((el) => el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''));
      return `${d}px (${culprits.join(', ')})`;
    });
    if (over) bad.push(`${p} @${w}: ${over}`);
    await ctx.close();
  }
  results.overflow = { ok: !bad.length, out: bad.join('\n') || `${PAGES.length} pages × ${widths.length} widths, none overflow` };
}

/* ── links-live ── */
if (want('links-live')) {
  const hrefs = new Set();
  for (const p of PAGES.slice(0, -1)) {
    const { ctx, page } = await open(p);
    for (const h of await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')))) {
      if (h.startsWith('/') && !h.startsWith('//')) hrefs.add(h.split('#')[0] || '/');
    }
    await ctx.close();
  }
  const bad = [];
  for (const h of hrefs) {
    const r = await fetch(BASE + h, { redirect: 'manual' });
    if (r.status !== 200) bad.push(`${h} → ${r.status}`);
  }
  const nf = await fetch(BASE + '/this-page-does-not-exist');
  if (nf.status !== 404) bad.push(`unknown URL answered ${nf.status}, not 404`);
  results['links-live'] = { ok: !bad.length, out: bad.join('\n') || `${hrefs.size} internal URLs answer 200; unknown URL answers 404` };
}

/* ── keyboard ── */
if (want('keyboard')) {
  const bad = [];
  let total = 0;
  for (const p of PAGES.filter((x) => x === '/' || x.startsWith('/projects'))) {
    const { ctx, page } = await open(p);
    for (let i = 0; i < 80; i++) {
      await page.keyboard.press('Tab');
      const f = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none');
        const r = el.getBoundingClientRect();
        return { name: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : '') + (el.textContent ? ` "${el.textContent.trim().slice(0, 24)}"` : ''), ring, visible: r.width > 0 && r.height > 0 };
      });
      if (!f) continue;
      total++;
      if (!f.ring) bad.push(`${p}: no focus indicator on ${f.name}`);
      if (!f.visible) bad.push(`${p}: focus moved to an invisible element ${f.name}`);
    }
    await ctx.close();
  }
  results.keyboard = { ok: !bad.length, out: [...new Set(bad)].join('\n') || `${total} Tab stops, every one with a visible indicator` };
}

/* ── menu ── */
if (want('menu')) {
  const { ctx, page } = await open('/', { viewport: vp.mobile });
  const out = [];
  await page.click('[data-menu-open]');
  await page.waitForTimeout(400);
  if (await page.getAttribute('[data-menu]', 'data-open') !== 'true') out.push('menu did not open');
  if (!(await page.evaluate(() => document.activeElement?.matches('[data-menu-close]')))) out.push('focus did not move to Close');
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    if (!(await page.evaluate(() => document.querySelector('[data-menu]').contains(document.activeElement)))) { out.push(`focus left the menu after ${i + 1} Tabs`); break; }
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  if (await page.getAttribute('[data-menu]', 'data-open') !== 'false') out.push('Escape did not close the menu');
  if (!(await page.evaluate(() => document.activeElement?.matches('[data-menu-open]')))) out.push('focus did not return to Menu');
  results.menu = { ok: !out.length, out: out.join('\n') || 'opens, focus on Close, 25 Tabs stay inside, Escape closes, focus returns' };
  await ctx.close();
}

/* ── forms ── */
if (want('forms')) {
  const { ctx, page } = await open('/');
  await page.evaluate(() => document.querySelector('[data-form]').scrollIntoView());
  await page.click('[data-form] [data-review]');
  await page.waitForTimeout(300);
  const r = await page.evaluate(() => ({
    summary: !document.querySelector('[data-error-summary]').hidden,
    focused: document.activeElement?.matches('[data-error-summary]'),
    errors: [...document.querySelectorAll('.field-error')].filter((e) => !e.hidden).length,
    invalid: document.querySelectorAll('[aria-invalid="true"]').length
  }));
  const out = [];
  if (!r.summary) out.push('no error summary');
  if (!r.focused) out.push('error summary not focused');
  if (r.errors < 3) out.push(`${r.errors} field errors shown, expected 3`);
  if (r.invalid < 3) out.push(`${r.invalid} fields marked aria-invalid, expected 3`);
  results.forms = { ok: !out.length, out: out.join('\n') || `empty submit: summary shown and focused, ${r.errors} field errors, ${r.invalid} aria-invalid` };
  await ctx.close();
}

/* ── reduced-motion ── */
if (want('reduced-motion')) {
  const out = [];
  {
    const { ctx, page } = await open('/', { reducedMotion: 'reduce' });
    await page.waitForTimeout(500);
    if (!(await page.evaluate(() => document.querySelector('[data-cin]')?.classList.contains('is-paused') ?? true))) out.push('/: hero slideshow is running');
    await ctx.close();
  }
  for (const p of VIDEO_PAGES) {
    const { ctx, page } = await open(p, { reducedMotion: 'reduce' });
    await page.evaluate(() => document.querySelector('video').scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(1500);
    const v = await page.evaluate(() => { const v = document.querySelector('video'); return { paused: v.paused, t: v.currentTime }; });
    if (!v.paused || v.t > 0) out.push(`${p}: video played under reduced motion`);
    await ctx.close();
  }
  results['reduced-motion'] = { ok: !out.length, out: out.join('\n') || `hero starts paused; ${VIDEO_PAGES.length} video page(s) do not autoplay` };
}

/* ── video ── */
if (want('video')) {
  if (!VIDEO_PAGES.length) results.video = { notRun: true, out: 'no page carries a <video>' };
  else {
    const out = [];
    const srcs = [];
    for (const p of VIDEO_PAGES) for (const v of Object.values(vp)) {
      const ctx = await browser.newContext({ viewport: v });
      const page = await ctx.newPage();
      const media = [];
      page.on('request', (r) => { if (/\.(webm|mp4)(\?|$)/.test(r.url())) media.push(r.url()); });
      await page.goto(BASE + p, { waitUntil: 'networkidle' });
      const above = await page.evaluate(() => document.querySelector('video').getBoundingClientRect().top < innerHeight);
      if (!above && media.length) out.push(`${p} @${v.width}: video requested before it was near the viewport`);
      const s0 = await page.evaluate(() => { const el = document.querySelector('video'); return { muted: el.muted, inline: el.playsInline, poster: !!el.poster || !!el.closest('[data-film]').querySelector('.film-poster') }; });
      if (!s0.muted) out.push(`${p}: video is not muted`);
      if (!s0.inline) out.push(`${p}: video is not playsinline`);
      if (!s0.poster) out.push(`${p}: video has no poster`);
      await page.evaluate(() => document.querySelector('video').scrollIntoView({ block: 'center' }));
      await page.waitForTimeout(2500);
      const s1 = await page.evaluate(() => { const el = document.querySelector('video'); return { paused: el.paused, t: el.currentTime, src: el.currentSrc }; });
      if (s1.paused || s1.t === 0) out.push(`${p} @${v.width}: video did not play in view (paused=${s1.paused}, t=${s1.t})`);
      const btn = await page.$('[data-video-toggle]');
      if (!btn) out.push(`${p}: no pause control`);
      else {
        /* Reached by keyboard, the control must not land under the fixed
           phone bar (WCAG 2.2 SC 2.4.11), and pressing it must flip the
           state it has at that moment — not the state before any scroll. */
        await btn.focus();
        await page.waitForTimeout(400);
        const hidden = await btn.evaluate((b) => {
          const r = b.getBoundingClientRect();
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return hit && (hit === b || b.contains(hit)) ? null : (hit ? hit.tagName.toLowerCase() + '.' + String(hit.className).split(' ')[0] : 'nothing');
        });
        if (hidden) out.push(`${p} @${v.width}: focused pause control is covered by ${hidden}`);
        for (let n = 0; n < 2; n++) {
          const before = await page.evaluate(() => document.querySelector('video').paused);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(500);
          const s2 = await page.evaluate(() => ({ paused: document.querySelector('video').paused, pressed: document.querySelector('[data-video-toggle]').getAttribute('aria-pressed') }));
          if (s2.paused === before || s2.pressed !== String(s2.paused)) {
            out.push(`${p} @${v.width}: Enter on the control did not toggle (was paused=${before}, now paused=${s2.paused}, aria-pressed=${s2.pressed})`);
          }
        }
      }
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(800);
      if (!(await page.evaluate(() => document.querySelector('video').paused))) out.push(`${p} @${v.width}: video kept playing out of view`);
      srcs.push(`${v.width}px → ${s1.src.split('/').pop()}`);
      await ctx.close();
    }
    results.video = { ok: !out.length, out: out.join('\n') || `${VIDEO_PAGES.join(', ')} at 1440 and 390: muted, inline, poster, no request until near view, plays in view, control unobscured when focused and toggles both ways by keyboard, pauses out of view. Played: ${srcs.join('; ')}` };
  }
}

/* ── a11y ── */
if (want('a11y')) {
  let axePath = process.env.AXE_PATH;
  if (!axePath) { try { axePath = createRequire(ROOT + 'x.js').resolve('axe-core/axe.min.js'); } catch { /* none */ } }
  if (!axePath || !existsSync(axePath)) results.a11y = { notRun: true, out: 'axe-core is not installed — npm i axe-core, or set AXE_PATH' };
  else {
    const axe = readFileSync(axePath, 'utf8');
    const bad = [];
    let minor = 0;
    for (const p of PAGES) for (const v of Object.values(vp)) {
      const { ctx, page } = await open(p, { viewport: v });
      await scrollThrough(page);
      /* Measure the page a visitor reads, not a frame of an entrance
         transition: wait out every finite animation (the hero's slow drift
         is infinite and is left running — it moves the photograph, not text). */
      await page.evaluate(() => Promise.race([
        Promise.all(document.getAnimations()
          .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
          .map((a) => a.finished.catch(() => {}))),
        new Promise((r) => setTimeout(r, 4000))]));
      await page.addScriptTag({ content: axe });
      const r = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] })).violations
        .map((x) => ({ id: x.id, impact: x.impact, n: x.nodes.length, t: x.nodes[0]?.target?.join(' ') })));
      for (const x of r) {
        if (x.impact === 'serious' || x.impact === 'critical') bad.push(`${p} @${v.width}: ${x.impact} ${x.id} ×${x.n} (${x.t})`);
        else minor++;
      }
      await ctx.close();
    }
    results.a11y = { ok: !bad.length, out: bad.join('\n') || `${PAGES.length} pages × 2 viewports: 0 serious or critical (WCAG 2.2 AA rules); ${minor} minor/moderate` };
  }
}

/* ── performance ── */
if (want('performance')) {
  const rows = [];
  let ok = true;
  for (const p of PAGES.filter((x) => x === '/' || x.startsWith('/projects'))) for (const [name, v] of Object.entries(vp)) {
    const ctx = await browser.newContext({ viewport: v });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      window.__lcp = 0; window.__cls = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const m = await page.evaluate(() => ({
      lcp: Math.round(window.__lcp), cls: +window.__cls.toFixed(4),
      kb: Math.round(performance.getEntriesByType('resource').reduce((s, e) => s + (e.encodedBodySize || 0), 0) / 1024
        + (performance.getEntriesByType('navigation')[0]?.encodedBodySize || 0) / 1024),
      lcpEl: null
    }));
    if (m.lcp > 2500 || m.cls > 0.1) ok = false;
    rows.push(`${p} ${name}: LCP ${m.lcp} ms, CLS ${m.cls}, ${m.kb} KB transferred at load`);
    await ctx.close();
  }
  results.performance = { ok, out: rows.join('\n') + '\n(local server, no network throttling — a regression signal, not a field measurement)' };
}

await browser.close();
done();
