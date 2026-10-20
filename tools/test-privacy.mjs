#!/usr/bin/env node
// Isolated production-origin simulation. Every network request is intercepted;
// no real Analytics hit, customer record, map request or mail app is triggered.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {ANALYTICS} from '../content/analytics.js';
import {POLICIES} from '../content/policies.js';
const pw=await import(process.env.KINGSON_PLAYWRIGHT_PATH?pathToFileURL(process.env.KINGSON_PLAYWRIGHT_PATH):'playwright');
const browser=process.env.KINGSON_BROWSER==='webkit'?await pw.webkit.launch({headless:true}):await pw.chromium.launch({channel:process.env.KINGSON_BROWSER||'msedge',headless:true});
const origin='https://www.kingsonengineering.co.zw',base='http://127.0.0.1:4173';
const out=process.env.KINGSON_QA_OUTPUT||join(tmpdir(),'kingson-privacy-review');await mkdir(out,{recursive:true});
const results=[],errors=[];
async function fixture(width,blockedStorage=false){
  const context=await browser.newContext({viewport:{width,height:width<500?844:900},reducedMotion:'reduce'});
  const external=[];
  await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.origin===origin){
      const response=await fetch(base+url.pathname+url.search);
      const headers=Object.fromEntries(response.headers);for(const key of ['content-encoding','content-length','transfer-encoding','connection'])delete headers[key];
      return route.fulfill({status:response.status,headers,body:Buffer.from(await response.arrayBuffer())});
    }
    external.push(url.href);
    if(url.hostname==='www.googletagmanager.com')return route.fulfill({contentType:'text/javascript',body:'window.__qaGoogleTagLoaded=true;'});
    if(url.hostname==='www.google.com'&&url.pathname.startsWith('/maps'))return route.fulfill({contentType:'text/html',body:'<p>Local map test</p>'});
    if(url.hostname.endsWith('.supabase.co'))return route.fulfill({contentType:'application/json',body:'{"ref":"ENQ-PRIVACY-LOCAL"}'});
    return route.abort();
  });
  await context.addInitScript(blocked=>{
    document.addEventListener('click',event=>{const href=event.target.closest('a')?.getAttribute('href')||'';if(/^(mailto:|tel:|https:\/\/wa\.me\/)/.test(href))event.preventDefault();},true);
    if(blocked){Storage.prototype.getItem=function(){throw Error('Storage blocked');};Storage.prototype.setItem=function(){throw Error('Storage blocked');};}
  },blockedStorage);
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  return {context,page,external};
}
const queue=page=>page.evaluate(()=>Array.from(window.dataLayer||[],item=>Array.from(item)));
try{
  assert.match(ANALYTICS.measurementId,/^G-[A-Z0-9]+$/);
  for(const width of [390,1440]){
    const {context,page,external}=await fixture(width);
    await page.goto(origin+'/?email=qa%40example.invalid#PRIVATE-FRAGMENT',{waitUntil:'networkidle'});
    assert.ok(await page.locator('[data-privacy]').isVisible());
    assert.equal(external.length,0,'No external requests before consent or map activation');
    assert.deepEqual(await context.cookies(),[]);
    await page.locator('#f-contact').fill('qa@example.invalid');
    await page.locator('[data-consent-choice="denied"]').click();
    assert.equal(await page.locator('#f-contact').inputValue(),'qa@example.invalid');
    assert.equal(external.length,0);
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('kingson_privacy_v1')));
    assert.equal(saved.analytics,'denied');assert.ok(Math.abs(saved.expires-Date.now()-180*86400000)<10000);
    await page.locator('[data-cookie-settings]').first().click();
    await page.screenshot({path:join(out,`privacy-choice-${width}.png`)});
    if(process.env.KINGSON_AXE_PATH){
      await page.addScriptTag({path:process.env.KINGSON_AXE_PATH});
      const violations=await page.evaluate(async()=>(await axe.run(document.querySelector('[data-privacy]'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}})).violations);
      assert.deepEqual(violations,[],'Consent interface accessibility');
    }
    await page.locator('[data-consent-choice="granted"]').click();
    await page.waitForFunction(()=>window.__qaGoogleTagLoaded);
    assert.equal(external.filter(url=>url.includes('googletagmanager.com')).length,1);
    const config=(await queue(page)).find(item=>item[0]==='config')[2];
    assert.equal(config.page_location,origin+'/');assert.equal(config.page_referrer,'');assert.equal(config.cookie_expires,90*86400);assert.equal(config.allow_google_signals,false);assert.equal(config.send_page_view,false);
    await page.locator('#f-company').fill('Privacy QA organisation');
    await page.locator('#f-service').selectOption({label:'Fibre laser cutting'});
    await page.locator('#f-description').fill('PRIVATE-JOB-CONTENT-QA');
    await page.locator('[data-review]').click();
    await page.locator('[data-sent][data-state="ok"]').waitFor();
    for(const selector of ['.bar a[href^="tel:"]','.bar a[href^="mailto:"]','.bar a[href^="https://wa.me/"]']){
      // Dispatch through the real handler; capture-phase fixture prevents handoff.
      await page.locator(selector).dispatchEvent('click');
    }
    const events=await queue(page),serialized=JSON.stringify(events);
    assert.ok(events.some(item=>item[0]==='event'&&item[1]==='generate_lead'));
    assert.equal(events.filter(item=>item[0]==='event'&&item[1]==='contact_click').length,3);
    for(const secret of ['qa@example.invalid','Privacy QA organisation','PRIVATE-JOB-CONTENT-QA','PRIVATE-FRAGMENT','?email='])assert.ok(!serialized.includes(secret),'No private input in Analytics queue');
    await context.addCookies([{name:'_ga',value:'local-test-cookie',url:origin},{name:'_ga_TEST',value:'local-test-cookie',url:origin}]);
    await page.locator('[data-cookie-settings]').first().click();await page.locator('[data-consent-choice="denied"]').click();
    assert.ok(await page.evaluate(id=>window['ga-disable-'+id]===true,ANALYTICS.measurementId));
    assert.equal((await context.cookies()).filter(cookie=>cookie.name.startsWith('_ga')).length,0);
    const before=(await queue(page)).filter(item=>item[0]==='event').length;
    await page.locator('.bar a[href^="mailto:"]').dispatchEvent('click');
    assert.equal((await queue(page)).filter(item=>item[0]==='event').length,before,'No further events after withdrawal');
    await page.reload({waitUntil:'networkidle'});assert.equal(external.filter(url=>url.includes('googletagmanager.com')).length,1,'Denial persists after reload');
    await page.locator('[data-load-map]').scrollIntoViewIfNeeded();assert.equal(external.filter(url=>url.includes('google.com/maps')).length,0);
    const mapResponse=page.waitForResponse(response=>response.url().startsWith('https://www.google.com/maps'));
    await page.locator('[data-load-map]').click();await mapResponse;
    assert.equal(external.filter(url=>url.includes('google.com/maps')).length,1);
    for(const policy of POLICIES){
      await page.goto(origin+'/'+policy.slug,{waitUntil:'networkidle'});
      assert.equal(await page.locator('h1').textContent(),policy.title);
      assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),origin+'/'+policy.slug);
      assert.ok(await page.locator('.hd-act a[href="/#enquiry"]').count());
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      await page.screenshot({path:join(out,`${policy.slug}-${width}.png`),fullPage:true});
    }
    results.push({width,noOptionalRequestsBeforeConsent:true,grant:true,withdrawal:true,persistence:true,noPII:true,leadAndContactEvents:true,mapOptIn:true,policies:3});
    await context.close();
  }
  const blocked=await fixture(390,true);await blocked.page.goto(origin,{waitUntil:'networkidle'});
  await blocked.page.locator('[data-consent-choice="denied"]').click();assert.equal(blocked.external.length,0);await blocked.page.locator('#f-contact').fill('qa@example.invalid');
  results.push({blockedStorage:true,websiteUsable:true});await blocked.context.close();
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,results},null,2));
}finally{await writeFile(join(out,'privacy-results.json'),JSON.stringify({results,errors},null,2));await browser.close();}
