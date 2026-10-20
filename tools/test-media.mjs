#!/usr/bin/env node
// Local integration checks. Never writes to production or the CRM.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
const {chromium,webkit} = await import(process.env.KINGSON_PLAYWRIGHT_PATH ? pathToFileURL(process.env.KINGSON_PLAYWRIGHT_PATH) : 'playwright');
const base = 'http://127.0.0.1:4173';
const out = process.env.KINGSON_QA_OUTPUT || join(tmpdir(),'kingson-cinematic-review');
await mkdir(out,{recursive:true});
const useWebKit = process.env.KINGSON_BROWSER === 'webkit';
const browser = useWebKit ? await webkit.launch({headless:true}) : await chromium.launch({channel:process.env.KINGSON_BROWSER || 'msedge',headless:true});
const results = [], errors = [];
const pageAt = async (width=1440,height=900,options={}) => {
  const page = await browser.newPage({viewport:{width,height},...options});
  await page.route('**/*.supabase.co/**',route=>route.abort());
  page.on('pageerror',e=>errors.push(e.message));
  return page;
};
const state = page => page.locator('[data-hero-video]').evaluate(v=>({src:v.currentSrc,paused:v.paused,time:v.currentTime,width:v.videoWidth,height:v.videoHeight,loop:v.loop,muted:v.muted,inline:v.playsInline,duration:v.duration,opacity:getComputedStyle(v).opacity}));
// Render a deferred section before centering its media. Jumping directly to an
// absolute video can use content-visibility's estimated section geometry.
const revealProject = project => project.evaluate(async v=>{
  v.closest('section').scrollIntoView({block:'start',behavior:'instant'});
  for(let attempt=0;attempt<6;attempt++) {
    await new Promise(resolve=>setTimeout(resolve,150));
    v.closest('.project-media').scrollIntoView({block:'center',behavior:'instant'});
  }
});
const accessibility = async (page, fullPage = false) => {
  if (!process.env.KINGSON_AXE_PATH) return;
  await page.addScriptTag({path:process.env.KINGSON_AXE_PATH});
  // Media-state checks inspect the active UI. A separate complete-page pass
  // below visits deferred sections before evaluating their painted colours.
  const violations=await page.evaluate(async full=>(await axe.run(full?document:document.querySelector('.hero'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({html:n.html,summary:n.failureSummary}))})),fullPage);
  assert.deepEqual(violations,[],'Media state accessibility');
};
try {
  for (const [width,height] of [[1440,900],[1920,1080],[390,844]]) {
    const page = await pageAt(width,height);
    await page.goto(base,{waitUntil:'networkidle'});
    assert.equal(await page.locator('[data-film],.film-link,[data-film-dialog]').count(),0,'No film buttons or popup player');
    assert.equal(await page.locator('[data-project-video][src]').count(),0,'Project media deferred below the hero');
    await page.waitForFunction(()=>document.querySelector('[data-hero-video]').currentTime>.1);
    const s = await state(page);
    assert.ok(s.loop && s.muted && s.inline && !s.paused && s.width>0);
    // WebKit on Windows can report the decoder's presentation dimensions.
    // Verify aspect here; the export audit separately verifies encoded pixels.
    assert.ok(Math.abs(s.width/s.height-(width<900?512/808:16/9))<0.02);
    assert.ok(s.src.includes(width<900?'portrait':'wide'));
    // Seek near the end, then observe an actual wrap to the opening.
    await page.locator('[data-hero-video]').evaluate(v=>{v.currentTime=v.duration-.35;});
    // Poll media time independently of WebKit's animation-frame scheduling.
    await page.waitForFunction(()=>{const v=document.querySelector('[data-hero-video]');return v.currentTime>.1 && v.currentTime<1 && !v.paused;},undefined,{polling:100}).catch(async error=>{throw new Error(`${width}px loop: ${JSON.stringify(await state(page))}`,{cause:error});});
    assert.equal(await page.locator('[data-hero-toggle],.mh-motion').count(),0,'No visible background film control');
    await accessibility(page);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForFunction(()=>document.querySelector('[data-hero-video]').paused,undefined,{timeout:2000});
    assert.equal(await page.locator('.hero').evaluate(h=>h.classList.contains('film-playing')),false);
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.waitForFunction(()=>!document.querySelector('[data-hero-video]').paused);
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('[data-hero-video]')).opacity==='1');
    await page.screenshot({path:join(out,`homepage-${width}x${height}.png`)});
    await page.locator('#work').scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>document.querySelector('[data-hero-video]').paused);
    assert.ok(await page.locator('.hd').evaluate(e=>getComputedStyle(e).color!=='rgb(255, 255, 255)'));
    const projects = await page.locator('[data-project-video]').all();
    assert.equal(projects.length,3);
    for (const [i,project] of projects.entries()) {
      await revealProject(project);
      await project.evaluate(v=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Project autoplay timed out: '+JSON.stringify({src:v.currentSrc,time:v.currentTime,paused:v.paused,ready:v.readyState,network:v.networkState,error:v.error?.message,rect:v.getBoundingClientRect().toJSON()}))),15000);const check=()=>{if(v.currentTime>.1&&!v.paused){clearTimeout(timer);resolve();}else setTimeout(check,100);};check();}));
      const media=await project.evaluate(v=>({muted:v.muted,inline:v.playsInline,controls:v.controls,aspect:v.videoWidth/v.videoHeight}));
      assert.ok(media.muted&&media.inline&&!media.controls);
      assert.ok(Math.abs(media.aspect-(i===0?512/808:512/910))<.02);
      if (i===0) {
        // Exercise both actual transitions, including the return to A.
        for (const file of ['roof-b.mp4','roof-a.mp4']) {
          await project.evaluate(v=>{v.currentTime=v.duration-.35;});
          await page.waitForFunction(file=>{const v=document.querySelector('[data-project-video]');return v.currentSrc.endsWith(file)&&v.currentTime>.1&&!v.paused;},file,{polling:100});
        }
      } else {
        await project.evaluate(v=>{v.currentTime=v.duration-.35;});
        await page.waitForFunction(i=>{const v=document.querySelectorAll('[data-project-video]')[i];return v.currentTime>.1&&v.currentTime<1&&!v.paused;},i,{polling:100}).catch(async error=>{throw new Error(`${width}px project ${i} loop: ${JSON.stringify(await project.evaluate(v=>({time:v.currentTime,paused:v.paused,seeking:v.seeking,src:v.currentSrc,rect:v.getBoundingClientRect().toJSON()})))}`,{cause:error});});
      }
      await page.screenshot({path:join(out,`inline-${width}-${i}.png`)});
    }
    await page.locator('#enquiry').scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>[...document.querySelectorAll('[data-project-video]')].every(v=>v.paused),undefined,{polling:100});
    await revealProject(projects[0]);
    await page.waitForFunction(()=>!document.querySelector('[data-project-video]').paused,undefined,{polling:100});
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForFunction(()=>[...document.querySelectorAll('[data-project-video]')].every(v=>v.paused),undefined,{polling:100});
    assert.equal(await page.locator('.project-playing').count(),0);
    results.push({width,inlineFrames:3,sourceFilms:4,playlistCycles:true,nativeLoops:true,offscreenPauseResume:true,reducedMotion:true,noFilmButtons:true});
    results.push({viewportWidth:width,viewportHeight:height,autoplay:true,loop:true,noFilmToggle:true,reducedMotionChange:true,offscreenPause:true,video:s});
    await page.close();
  }
  for (const condition of ['reduce','save-data','slow-2g','still']) {
    const page = await pageAt(390,844,{reducedMotion:condition==='reduce'?'reduce':'no-preference'});
    if (condition==='save-data' || condition==='slow-2g') await page.addInitScript(c=>Object.defineProperty(navigator,'connection',{value:{saveData:c==='save-data',effectiveType:c==='slow-2g'?'slow-2g':'4g',addEventListener(){}}}),condition);
    const requests=[];
    page.on('request',r=>{if(r.url().includes('/assets/video/'))requests.push(r.url());});
    await page.goto(base+(condition==='still'?'/?hero=still':''),{waitUntil:'networkidle'});
    if(condition!=='still')for(const project of await page.locator('[data-project-video]').all())await revealProject(project);
    await page.waitForTimeout(200);
    assert.equal((await state(page)).src,'',condition+': no video source');
    assert.deepEqual(requests,[],condition+': no automatic video download');
    assert.ok(await page.locator('.mh-poster img').evaluate(i=>i.naturalWidth>0));
    results.push({condition,poster:true,videoRequests:0});
    await page.close();
  }
  for (const failure of ['blocked','network']) {
    const page = await pageAt();
    if (failure==='blocked') await page.addInitScript(()=>{HTMLMediaElement.prototype.play=function(){return Promise.reject(new DOMException('Autoplay blocked','NotAllowedError'));};});
    else await page.route('**/assets/video/*',r=>r.abort());
    await page.goto(base,{waitUntil:'networkidle'});
    await page.waitForTimeout(300);
    assert.equal(await page.locator('.hero').evaluate(h=>h.classList.contains('film-playing')),false);
    assert.ok(await page.locator('.mh-poster img').evaluate(i=>i.naturalWidth>0));
    assert.equal(await page.locator('[data-hero-toggle]').count(),0);
    for(const project of await page.locator('[data-project-video]').all()) {
      await revealProject(project);
      await page.waitForTimeout(200);
      assert.ok(await project.evaluate(v=>!v.closest('.project-media').classList.contains('project-playing')&&v.closest('.project-media').querySelector('img').naturalWidth>0));
    }
    results.push({failure,poster:true});
    await page.close();
  }
  // Exercise VP9 fallback independently of the preferred H.264 path.
  const vp9 = await pageAt();
  await vp9.addInitScript(()=>{const original=HTMLMediaElement.prototype.canPlayType;HTMLMediaElement.prototype.canPlayType=function(type){return type.includes('mp4')?'':original.call(this,type);};});
  await vp9.goto(base,{waitUntil:'networkidle'});
  await vp9.waitForFunction(()=>document.querySelector('[data-hero-video]').currentTime>.1);
  assert.ok((await state(vp9)).src.endsWith('.webm'));
  results.push({h264:true,vp9:true});
  await vp9.close();
  const response = await fetch(base+'/assets/video/roof-c.mp4',{headers:{Range:'bytes=0-1023'}});
  assert.equal(response.status,206);assert.equal((await response.arrayBuffer()).byteLength,1024);
  results.push({httpByteRanges:true});
  if (useWebKit) {
    const full = await pageAt(1440,900,{reducedMotion:'reduce'});
    await full.goto(base,{waitUntil:'networkidle'});
    await full.evaluate(async()=>{for(const section of document.querySelectorAll('main>section')){section.scrollIntoView({behavior:'instant'});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));}});
    await accessibility(full,true);
    results.push({webKitCompletePageAccessibility:true});
    await full.close();
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,results},null,2));
} catch (error) {
  console.error(error);
  throw error;
} finally {
  await writeFile(join(out,'media-results.json'),JSON.stringify({results,errors},null,2));
  await browser.close();
}
