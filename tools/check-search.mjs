#!/usr/bin/env node
// Phase B — checks over the exact static HTML shipped to production.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SERVICES } from '../content/services.js';
import { publish } from '../content/company.js';
import { SEO } from '../content/seo.js';
import { hasProjects } from '../content/projects.js';
import { SITE } from './layout.js';
const read = name => readFileSync(new URL('../'+name, import.meta.url),'utf8');
const files=['index.html',...SERVICES.map(s=>s.slug+'.html')];
const normalized = value => value.replace(/&amp;/g,'&').replace(/&nbsp;|\u00a0/g,' ').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const sitemap=read('sitemap.xml');
const listed=[...sitemap.matchAll(/<loc>([^<]+)</g)].map(m=>m[1]);
assert.deepEqual(listed,[SITE+'/',...SERVICES.map(s=>SITE+'/'+s.slug),...(hasProjects()?[SITE+'/projects']:[])],'Sitemap must contain only current indexable pages');
assert.ok(!listed.some(url=>url.endsWith('.html')||url.includes('/crm')||url.includes('vercel.app')));
const titles=new Set(),descriptions=new Set();
for(const file of files) {
  const html=read(file);
  const body=normalized(html.split(/<body\b[^>]*>/)[1]);
  assert.ok(!/<meta name="robots" content="[^"]*noindex/.test(html),`${file}: accidentally noindex`);
  const title=normalized(html.match(/<title>([^<]+)</)[1]);
  const description=normalized(html.match(/name="description" content="([^"]+)"/)[1]);
  assert.ok(!titles.has(title)&&!descriptions.has(description),'Metadata must be unique');
  titles.add(title);descriptions.add(description);
  const headings=[...html.matchAll(/<h([1-6])\b/g)].map(m=>+m[1]);
  assert.equal(headings[0],1,`${file}: first heading must be H1`);
  for(let i=1;i<headings.length;i++) assert.ok(headings[i]<=headings[i-1]+1,`${file}: skipped heading level`);
  const ld=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const nodes=ld['@graph'];
  assert.ok(Array.isArray(nodes));
  const ids=nodes.map(n=>n['@id']);assert.equal(new Set(ids).size,ids.length,'Duplicate graph IDs');
  const org=nodes.find(n=>Array.isArray(n['@type'])&&n['@type'].includes('Organization'));
  assert.equal(org.name,publish('name'));assert.equal(org.telephone,publish('phone'));assert.equal(org.email,publish('email'));
  assert.equal(org.address.addressLocality,'Harare');assert.equal(org.address.addressCountry,'ZW');
  assert.ok(org.areaServed.some(a=>a.name==='Zimbabwe'));
  const services=nodes.filter(n=>n['@type']==='Service');assert.equal(services.length,6);
  for(const service of services) {
    assert.equal(service.provider['@id'],org['@id']);
    assert.ok(!service.additionalProperty,'additionalProperty is not a Service property');
    assert.ok(body.includes(service.name),`${file}: service is not visible`);
  }
  const page=nodes.find(n=>[].concat(n['@type']).includes('WebPage'));
  assert.ok(page);
  for(const q of page.mainEntity||[]) {
    assert.ok(body.includes(normalized(q.name)),`${file}: FAQ question absent from HTML`);
    assert.ok(body.includes(normalized(q.acceptedAnswer.text)),`${file}: FAQ answer absent from HTML`);
  }
  const walk=value=>{
    if(!value||typeof value!=='object')return;
    for(const [key,item]of Object.entries(value)){
      assert.ok(!['aggregateRating','review','award','hasCredential','priceRange','SearchAction'].includes(key),'Unverified or unsupported claim');
      walk(item);
    }
  };walk(ld);
  assert.equal((html.match(/name="google-site-verification"/g)||[]).length,file==='index.html'&&SEO.googleSiteVerification?1:0);
  console.log(`${file}: ${title}`);
}
assert.ok(/Disallow: \/crm/.test(read('robots.txt')));
assert.ok(read('robots.txt').includes(`Sitemap: ${SITE}/sitemap.xml`));
const vercel=JSON.parse(read('vercel.json'));
assert.ok(vercel.headers.some(rule=>rule.source==='/crm'&&rule.headers.some(h=>h.key==='X-Robots-Tag'&&h.value==='noindex, nofollow')));
console.log('Search checks pass: unique metadata, heading hierarchy, entity graphs, visible FAQs, indexable sitemap, CRM exclusions and verification token.');
