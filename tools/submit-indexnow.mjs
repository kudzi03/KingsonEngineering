#!/usr/bin/env node
// Run after deployment, explicitly with --submit. Never submit CRM or previews.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { INDEXNOW_KEY } from '../content/indexing.js';
const host='www.kingsonengineering.co.zw',origin='https://'+host;
const sitemap=readFileSync(new URL('../sitemap.xml',import.meta.url),'utf8');
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]);
assert.ok(urls.length>0&&urls.length<100);
for(const url of urls) {
  const parsed=new URL(url);
  assert.equal(parsed.origin,origin);
  assert.ok(!/\/crm(?:\/|$)|404|vercel\.app|\.html$/.test(url));
}
assert.equal(readFileSync(new URL('../indexnow-key.txt',import.meta.url),'utf8').trim(),INDEXNOW_KEY);
if(!process.argv.includes('--submit')) {
  console.log(JSON.stringify({validated:true,urls,submission:'Not sent. Deploy, then use --submit.'},null,2));
}else{
  const proof=await fetch(origin+'/indexnow-key.txt');
  assert.equal(proof.status,200);assert.equal((await proof.text()).trim(),INDEXNOW_KEY);
  for(const url of urls){const response=await fetch(url,{method:'HEAD'});assert.equal(response.status,200);assert.ok(!/noindex/i.test(response.headers.get('x-robots-tag')||''));}
  const response=await fetch('https://api.indexnow.org/indexnow',{
    method:'POST',headers:{'Content-Type':'application/json; charset=utf-8'},
    body:JSON.stringify({host,key:INDEXNOW_KEY,keyLocation:origin+'/indexnow-key.txt',urlList:urls})
  });
  const message=await response.text();
  assert.ok([200,202].includes(response.status),`IndexNow ${response.status}: ${message}`);
  console.log(JSON.stringify({status:response.status,meaning:response.status===200?'URLs received; indexing is not guaranteed.':'URLs received; host-key validation pending.',urls,response:message},null,2));
}
