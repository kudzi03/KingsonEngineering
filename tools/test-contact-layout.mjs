#!/usr/bin/env node
// Local contact/image-viewer regression checks; never opens external contact apps.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
const {chromium,webkit} = await import(process.env.KINGSON_PLAYWRIGHT_PATH ? pathToFileURL(process.env.KINGSON_PLAYWRIGHT_PATH) : 'playwright');
const out=process.env.KINGSON_QA_OUTPUT || join(tmpdir(),'kingson-contact-layout');
await mkdir(out,{recursive:true});
const useWebKit=process.env.KINGSON_BROWSER==='webkit';
const browser=useWebKit ? await webkit.launch({headless:true}) : await chromium.launch({channel:process.env.KINGSON_BROWSER || 'msedge',headless:true});
const results=[],errors=[];
const reveal = locator => locator.evaluate(async e=>{
  e.closest('section').scrollIntoView({block:'start',behavior:'instant'});
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  e.scrollIntoView({block:'center',behavior:'instant'});
});
try {
  for(const [width,height] of [[1440,900],[1920,1080],[1280,720],[1024,768],[390,844],[320,640]]) {
    const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*.supabase.co/**',r=>r.abort());
    await page.addInitScript(()=>localStorage.setItem('kingson_privacy_v1',JSON.stringify({version:1,analytics:'denied',expires:Date.now()+86400000})));
    await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
    for(const section of ['.hero','#workshop']) {
      const brief=page.locator(`${section} .quote-brief`);
      const summary=brief.locator('summary');
      await reveal(summary);
      // Check native keyboard operation as well as pointer actionability.
      await summary.focus();
      await summary.press('Enter');
      assert.equal(await brief.evaluate(e=>e.open),true);
      assert.equal(await brief.locator('li').count(),5);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Expanded checklist fits the viewport');
      for(const link of await page.locator(`${section} .contact-options a`).all()) {
        await reveal(link);
        await link.click({trial:true});
        const box=await link.boundingBox();
        assert.ok(box.width>=44 && box.height>=44,'Contact links retain 44px targets');
      }
      await reveal(summary);
      await summary.click();
      assert.equal(await brief.evaluate(e=>e.open),false);
    }
    const crane=page.locator('#crane .band-img .zoom');
    await reveal(crane);
    const bounds=await crane.evaluate(e=>({button:e.getBoundingClientRect().toJSON(),section:e.closest('section').getBoundingClientRect().toJSON()}));
    for(const edge of ['top','left']) assert.ok(bounds.button[edge]>=bounds.section[edge]-.5,'Image viewer starts inside its own section');
    for(const edge of ['bottom','right']) assert.ok(bounds.button[edge]<=bounds.section[edge]+.5,'Image viewer ends inside its own section');
    // Find a visible part of the image without clicking through its text or
    // the fixed header. The composition changes at narrow screen widths.
    const point=await crane.evaluate(e=>{
      const r=e.getBoundingClientRect();
      for(const x of [.9,.98,.5,.1]) for(const y of [.2,.4,.6,.8]) {
        const px=r.left+r.width*x,py=r.top+r.height*y;
        const hit=document.elementFromPoint(px,py);
        if(hit && (hit===e || e.contains(hit))) return {x:r.width*x,y:r.height*y};
      }
      return null;
    });
    assert.ok(point,'A visible part of the crane image can open its viewer');
    await crane.click({position:point});
    assert.equal(await page.locator('[data-viewer]').getAttribute('data-open'),'true');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-viewer]').getAttribute('data-open'),'false');
    assert.equal(await crane.evaluate(e=>document.activeElement===e),true,'Image viewer restores focus');
    const summary=page.locator('#workshop .quote-brief summary');
    await reveal(summary);
    await summary.click({trial:true});
    await page.screenshot({path:join(out,`workshop-${width}x${height}.png`)});
    results.push({width,height,keyboardChecklists:true,contactTargets:true,craneBounds:true,imageViewer:true});
    await page.close();
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,results},null,2));
} finally {
  await writeFile(join(out,'contact-layout-results.json'),JSON.stringify({results,errors},null,2));
  await browser.close();
}
