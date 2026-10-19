#!/usr/bin/env node
// Independently pin the approved origin: deriving the expected value from
// SITE would let an accidental return to the old domain pass this check.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { SITE } from './layout.js';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const origin = 'https://www.kingsonengineering.co.zw';
const oldHost = 'kingson-engineering.vercel.app';
assert.equal(SITE, origin, 'The generator must use the official www origin');

const pages = readdirSync(root).filter((file) => file.endsWith('.html'));
for (const file of pages) {
  const html = read(file);
  assert.ok(!html.includes(oldHost), `${file}: old deployment URL remains`);
  const meta = (name) => [...html.matchAll(/<meta (?:property|name)="([^"]+)" content="([^"]*)"/g)]
    .filter((match) => match[1] === name).map((match) => match[2]);
  const canonical = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)].map((match) => match[1]);
  if (file === '404.html') {
    assert.deepEqual(canonical, [], '404 must remain without a canonical');
    assert.deepEqual(meta('og:url'), [], '404 must not claim an indexed sharing URL');
  } else {
    const path = file === 'index.html' ? '/' : '/' + file.replace(/\.html$/, '');
    assert.deepEqual(canonical, [origin + path], `${file}: wrong canonical`);
    assert.deepEqual(meta('og:url'), canonical, `${file}: sharing URL disagrees with canonical`);
    // Twitter uses the existing Open Graph URL; no separate twitter:url is needed.
    assert.deepEqual(meta('twitter:card'), ['summary_large_image']);
    assert.deepEqual(meta('twitter:image'), meta('og:image'), `${file}: preview images disagree`);
    const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(ld, `${file}: missing structured data`);
    const graph = JSON.parse(ld[1]);
    const visit = (value) => {
      if (typeof value === 'string' && /^https?:\/\//.test(value)) {
        const url = new URL(value);
        if (/kingson|vercel\.app/.test(url.hostname)) {
          assert.equal(url.origin, origin, `${file}: wrong structured-data origin`);
        }
      } else if (value && typeof value === 'object') Object.values(value).forEach(visit);
    };
    visit(graph);
  }
  for (const key of ['og:image', 'twitter:image']) {
    assert.equal(meta(key).length, 1, `${file}: expected one ${key}`);
    assert.equal(new URL(meta(key)[0]).origin, origin, `${file}: wrong ${key} origin`);
  }
  // Relative navigation stays on the official host after the old-host redirect.
  for (const match of html.matchAll(/href="(https?:\/\/[^\"]+)"/g)) {
    const url = new URL(match[1].replace(/&amp;/g, '&'));
    if (/kingson|vercel\.app/.test(url.hostname)) {
      assert.equal(url.origin, origin, `${file}: wrong internal link origin`);
    }
  }
}

const sitemap = read('sitemap.xml');
assert.ok(!sitemap.includes(oldHost));
for (const match of sitemap.matchAll(/<(?:loc|image:loc)>([^<]+)</g)) {
  assert.equal(new URL(match[1]).origin, origin, 'Wrong sitemap origin');
}
assert.ok(read('robots.txt').includes(`Sitemap: ${origin}/sitemap.xml`));
assert.ok(!read('robots.txt').includes(oldHost));

const config = JSON.parse(read('vercel.json'));
const redirects = config.redirects.filter((rule) =>
  rule.has?.some((condition) => condition.type === 'host' && condition.value === oldHost));
assert.deepEqual(redirects, [{
  source: '/',
  has: [{ type: 'host', value: oldHost }],
  destination: origin + '/',
  permanent: true
}, {
  source: '/:path*',
  has: [{ type: 'host', value: oldHost }],
  destination: origin + '/:path*',
  permanent: true
}], 'Old host must permanently redirect every path to the official origin');
assert.ok(config.redirects.some((rule) => rule.source === '/' && rule.destination === '/crm'
  && rule.permanent === false && rule.has?.some((condition) =>
    condition.type === 'host' && condition.value === 'crm.kingsonengineering.co.zw')),
  'Existing CRM host redirect must remain');
console.log(`Sharing checks pass: ${pages.length} HTML files, sitemap, robots and host-scoped redirect.`);
