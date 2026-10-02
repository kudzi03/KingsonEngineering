/* The portfolio's rules, tested.  node --test tools/tests/
   These are the rules that keep an invented fact off the site, so they are
   tested against the real content and against entries built to break them. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PROJECTS, publishable, problems, credit, projectsFor } from '../../content/projects.js';
import { ASSETS } from '../../content/assets.js';
import { SERVICES } from '../../content/services.js';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const read = (f) => readFileSync(ROOT + f, 'utf8');
const withEntry = (entry, fn) => {
  PROJECTS.push(entry);
  try { return fn(); } finally { PROJECTS.pop(); }
};

test('the shipped portfolio has no structural problems', () => {
  assert.deepEqual(problems(), []);
});

test('every published job names its source and a publishable status', () => {
  for (const p of publishable()) {
    assert.ok(['owner_verified', 'user_context'].includes(p.status), `${p.id}: status ${p.status}`);
    assert.ok(p.evidence && p.evidence.length > 40, `${p.id}: evidence is missing or too thin to audit`);
  }
});

test('an entry without evidence fails the build', () => {
  const out = withEntry({ id: 'x-job', title: 'X', hero: 'portalFrame', services: ['roofing-and-trusses'], status: 'user_context', summary: 'x' }, problems);
  assert.ok(out.some((m) => /has no evidence/.test(m)), out.join('\n'));
});

test('a draft status cannot ship unless marked internal', () => {
  const entry = { id: 'y-job', title: 'Y', hero: 'portalFrame', services: ['roofing-and-trusses'], status: 'draft', summary: 'x', evidence: 'nobody yet — this entry exists only to test the gate refuses it' };
  assert.ok(withEntry(entry, problems).some((m) => /only owner_verified or user_context may ship/.test(m)));
  assert.ok(!withEntry(entry, publishable).some((p) => p.id === 'y-job'), 'a draft reached publishable()');
  assert.deepEqual(withEntry({ ...entry, internal: true }, problems), []);
});

test('a job must link to a service route that exists', () => {
  const out = withEntry({ id: 'z-job', title: 'Z', hero: 'portalFrame', services: ['bridges'], status: 'user_context', summary: 'x', evidence: 'a test entry naming a service that does not exist on the site' }, problems);
  assert.ok(out.some((m) => /not a route/.test(m)), out.join('\n'));
});

test('a job with nothing to say about itself fails the build', () => {
  const out = withEntry({ id: 'v-job', title: 'V', hero: 'portalFrame', services: ['roofing-and-trusses'], status: 'user_context', evidence: 'a test entry with neither a summary nor a description' }, problems);
  assert.ok(out.some((m) => /neither a summary nor a description/.test(m)), out.join('\n'));
});

test('client and descriptor are never both given', () => {
  const out = withEntry({ id: 'w-job', title: 'W', hero: 'portalFrame', services: ['roofing-and-trusses'], status: 'user_context', summary: 'x', evidence: 'a test entry that both names and anonymises its client', client: 'A', descriptor: 'B' }, problems);
  assert.ok(out.some((m) => /both a client name and an anonymous descriptor/.test(m)));
});

test('credit says nothing when nothing is known', () => {
  assert.equal(credit({}), '');
  assert.equal(credit({ descriptor: 'a Harare operator', year: '2024' }), 'a Harare operator · 2024');
});

test('every asset a job uses exists, with its files on disk', () => {
  for (const p of publishable()) {
    for (const k of [p.hero, ...(p.gallery || []), ...(p.video ? [p.video.poster] : [])]) {
      const a = ASSETS[k];
      assert.ok(a, `${p.id}: no asset ${k}`);
      for (const w of a.widths) assert.ok(existsSync(`${ROOT}assets/img/${a.slug}-${w}.webp`), `${a.slug}-${w}.webp missing`);
    }
    if (p.video) {
      for (const ext of ['webm', 'mp4']) assert.ok(existsSync(`${ROOT}assets/video/${p.video.file}.${ext}`), `${p.video.file}.${ext} missing`);
    }
  }
});

test('each job has a page, is in the sitemap, and is linked from its service pages', () => {
  const sitemap = read('sitemap.xml');
  for (const p of publishable()) {
    assert.ok(existsSync(`${ROOT}projects/${p.id}.html`), `projects/${p.id}.html not rendered`);
    assert.ok(sitemap.includes(`/projects/${p.id}</loc>`), `${p.id} not in sitemap`);
    for (const slug of p.services) {
      assert.ok(read(`${slug}.html`).includes(`href="/projects/${p.id}"`), `/${slug} does not link to ${p.id}`);
    }
  }
  for (const s of SERVICES) {
    const linked = read(`${s.slug}.html`).includes('class="sp-work');
    assert.equal(linked, projectsFor(s.slug).length > 0, `/${s.slug}: completed-work block ${linked ? 'present without' : 'missing despite'} a job`);
  }
});

test('a job page states nothing the entry does not carry', () => {
  for (const p of publishable()) {
    const html = read(`projects/${p.id}.html`);
    const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
    /* The fields the entry leaves out must not appear as rows. */
    if (!p.client && !p.descriptor && !p.location && !p.year) assert.ok(!/<dt>For<\/dt>/.test(html), 'a "For" row with nothing to say');
    if (!p.scope) assert.ok(!/<dt>Our scope<\/dt>/.test(html), 'a scope row the entry does not support');
    for (const word of ['TBC', 'To be confirmed', 'Lorem', 'undefined', 'null']) {
      assert.ok(!text.includes(word), `${p.id}: page text contains "${word}"`);
    }
  }
});

test('the video never autoplays, never has sound, and loads nothing before it is needed', () => {
  /* Below the fold, not even the poster may load with the first screen. */
  const home = read('index.html');
  assert.ok(!/<video\b[^>]*poster=/.test(home), 'index.html: an eager poster attribute on a below-the-fold film');
  for (const f of ['index.html', ...publishable().map((p) => `projects/${p.id}.html`)]) {
    for (const m of read(f).matchAll(/<video\b[^>]*>/g)) {
      const tag = m[0];
      const before = read(f).slice(Math.max(0, m.index - 600), m.index);
      assert.ok(/\bmuted\b/.test(tag), `${f}: not muted`);
      assert.ok(/\bplaysinline\b/.test(tag), `${f}: not playsinline`);
      assert.ok(/preload="none"/.test(tag), `${f}: preload is not none`);
      assert.ok(!/\bautoplay\b/.test(tag), `${f}: autoplay attribute`);
      assert.ok(/poster="\/assets\/img\/[^"]+\.webp"/.test(tag) || /<img class="film-poster"[^>]*loading="lazy"/.test(before), `${f}: no poster`);
      assert.ok(/aria-describedby="([^"]+)"/.test(tag), `${f}: no text alternative`);
      const id = tag.match(/aria-describedby="([^"]+)"/)[1];
      assert.ok(read(f).includes(`id="${id}"`), `${f}: text alternative #${id} missing`);
    }
  }
});
