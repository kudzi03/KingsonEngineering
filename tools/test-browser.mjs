#!/usr/bin/env node
/* Local review. Set KINGSON_PLAYWRIGHT_PATH and KINGSON_AXE_PATH to your QA
   tools, run tools/preview-server.mjs first. No production enquiries are sent. */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SERVICES } from '../content/services.js';
const playwright = await import(process.env.KINGSON_PLAYWRIGHT_PATH ? pathToFileURL(process.env.KINGSON_PLAYWRIGHT_PATH) : 'playwright');
const { chromium } = playwright.default || playwright;
const base = process.env.KINGSON_PREVIEW_URL || 'http://127.0.0.1:4173';
assert.ok(/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base), 'Run integration tests against a local preview');
const out = process.env.KINGSON_QA_OUTPUT || join(tmpdir(), 'kingson-redesign-review');
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: process.env.KINGSON_BROWSER || 'msedge', headless: true });
const results = { pages: [], interactions: [], errors: [] };
const routes = ['/', ...SERVICES.map(s => '/' + s.slug), '/not-a-page'];
const makePage = async (width, options = {}) => {
  const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : width === 1920 ? 1080 : 900 }, reducedMotion:'reduce', ...options });
  page.on('pageerror', error => results.errors.push(error.message));
  // No test can accidentally write to Kingson's CRM or trigger notifications.
  await page.route('**/*.supabase.co/**', route => route.abort());
  // Keep visual and accessibility checks deterministic, without third-party map UI.
  await page.route('https://www.google.com/maps/**', route => route.fulfill({ body:'', contentType:'text/html' }));
  return page;
};
try {
  for (const width of [390, 1440, 1920]) for (const path of routes) {
    const page = await makePage(width);
    const response = await page.goto(base + path, {waitUntil:'networkidle'});
    assert.equal(response.status(), path === '/not-a-page' ? 404 : 200);
    await page.evaluate(async () => {
      // Visit sections to exercise lazy loading and reveal observers.
      for (const section of document.querySelectorAll('main > section')) {
        section.scrollIntoView({behavior:'instant'});
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }
      await Promise.all([...document.images].filter(i => i.checkVisibility() && (i.getAttribute('src')?.startsWith('/assets/') || i.getAttribute('src')?.startsWith('assets/'))).map(i => Promise.race([i.decode().catch(() => {}), new Promise(resolve=>setTimeout(resolve,3000))])));
      scrollTo({top:0,behavior:'instant'});
    });
    const structure = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: innerWidth,
      h1s: document.querySelectorAll('h1').length,
      brokenImages: [...document.images].filter(i => !i.closest('[data-i]:not(.is-on)') && i.complete && !i.naturalWidth).map(i => i.currentSrc),
      targets: [...document.querySelectorAll('a,button,input,select,textarea,summary')].filter(e => e.checkVisibility() && !e.closest('[inert]')).filter(e => {const r=e.getBoundingClientRect();return r.width < 24 || r.height < 24;}).map(e=>e.outerHTML.slice(0,150))
      , clippedProjectFrames: [...document.querySelectorAll('.work-image,.work-details .zoom')].filter(e=>{const r=e.getBoundingClientRect();return r.left < -1 || r.right > innerWidth+1;}).map(e=>e.className)
    }));
    assert.ok(structure.width <= width + 1, `${width} ${path}: horizontal overflow`);
    assert.equal(structure.h1s,1);
    assert.deepEqual(structure.brokenImages,[],`${path}: broken images`);
    assert.deepEqual(structure.clippedProjectFrames,[],`${path}: project media clipped outside viewport`);
    for (const group of ['.bar','.menu-contact','.enq-aside-act']) {
      assert.equal(await page.locator(`${group} a[href="mailto:admin1@kingsonengineering.co.zw"]`).count(),1,`${path}: direct email alongside other contact actions`);
    }
    let violations = [];
    if (process.env.KINGSON_AXE_PATH) {
      await page.addScriptTag({path:process.env.KINGSON_AXE_PATH});
      violations = await page.evaluate(async () => (await axe.run(document, {runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({html:n.html,summary:n.failureSummary}))})));
    }
    results.pages.push({width,path,...structure,violations});
    await page.screenshot({path:join(out,`${width}-${path === '/' ? 'home' : path.slice(1)}.png`),fullPage:true});
    console.log(JSON.stringify({width,path,overflow:structure.width-width,smallTargets:structure.targets.length,violations:violations.map(v=>v.id)}));
    await page.close();
  }
  for (const width of [320,768,1024,1920]) {
    const page = await makePage(width);
    for (const path of ['/','/steel-fabrication']) {
      await page.goto(base+path);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width} ${path}: overflow`);
    }
    results.interactions.push(`No overflow at ${width}px`);
    await page.close();
  }
  const page = await makePage(390);
  await page.goto(base+'/',{waitUntil:'networkidle'});
  await page.locator('[data-menu-open]').click();
  assert.equal(await page.locator('[data-menu-open]').getAttribute('aria-expanded'),'true');
  await page.keyboard.press('Shift+Tab');
  assert.ok(await page.locator('[data-menu]').evaluate(e=>e.contains(document.activeElement)), 'Menu traps focus');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('[data-menu-open]').getAttribute('aria-expanded'),'false');
  assert.ok(await page.locator('[data-menu-open]').evaluate(e=>e===document.activeElement));
  await page.locator('button[data-open]').first().scrollIntoViewIfNeeded();
  await page.locator('button[data-open]').first().click();
  assert.equal(await page.locator('[data-viewer]').getAttribute('data-open'),'true');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('[data-viewer]').getAttribute('data-open'),'false');
  await page.locator('.faq-item summary').first().click();
  assert.ok(await page.locator('.faq-item').first().evaluate(e=>e.open));
  await page.locator('[data-review]').click();
  assert.equal(await page.locator('[aria-invalid="true"]').count(),3);
  assert.ok(await page.locator('[data-error-summary]').isVisible());
  const payloads=[];
  await page.route('**/rest/v1/rpc/submit_enquiry', async route => {
    payloads.push(route.request().postDataJSON());
    await route.fulfill({contentType:'application/json',body:JSON.stringify({ref:'ENQ-LOCAL-TEST'})});
  });
  await page.locator('#f-company').fill('Local QA organisation');
  await page.locator('#f-contact').fill('qa@example.invalid');
  await page.locator('#f-service').selectOption({label:'Fibre laser cutting'});
  await page.locator('#f-drawings').selectOption({index:1});
  await page.locator('#f-description').fill('Local integration test. No live submission.');
  await page.locator('[data-review]').click();
  await page.locator('[data-sent][data-state="ok"]').waitFor();
  assert.equal(payloads.length,1);
  assert.equal(payloads[0].p.company,'Local QA organisation');
  assert.equal(payloads[0].p.page,'/');
  assert.ok(await page.locator('[data-sent-body]').textContent().then(t=>t.includes('ENQ-LOCAL-TEST')));
  assert.ok((await page.locator('[data-draft-actions] a[href^="mailto:"]').getAttribute('href')).startsWith('mailto:technical@kingsonengineering.co.zw'));
  assert.ok((await page.locator('[data-draft-actions] a[href^="https://wa.me/"]').getAttribute('href')).includes('263772262869?text='));
  await page.locator('[data-review]').click();
  assert.equal(payloads.length,1,'Repeated identical submit must not duplicate a record');
  await page.route('**/rest/v1/rpc/submit_enquiry', route=>route.fulfill({status:503,body:'Temporary local test failure'}));
  await page.locator('#f-description').fill('Different local enquiry for the failure path.');
  await page.locator('[data-review]').click();
  await page.locator('[data-sent][data-state="failed"]').waitFor();
  assert.equal(await page.locator('[data-draft-actions] a').count(),2,'Handoff links survive a failed save');
  results.interactions.push('Menu opens, traps and restores focus; Escape closes menu and image dialog; FAQ disclosure works; form validation, RPC payload, reference display, duplicate prevention, technical-email and WhatsApp handoffs, and failed-save fallbacks pass. All network writes intercepted.');
  await page.close();
  const nojs = await makePage(390,{javaScriptEnabled:false});
  await nojs.goto(base+'/');
  assert.ok((await nojs.locator('main').textContent()).length>6000);
  assert.equal(await nojs.locator('.cx-hit').count(),6);
  assert.equal(await nojs.locator('h1').count(),1);
  results.interactions.push('Content, service links and contact links available without JavaScript.');
  await nojs.close();
  assert.deepEqual(results.errors,[],'No browser runtime errors');
  const failed=results.pages.filter(p=>p.violations.length || p.targets.length);
  await writeFile(join(out,'browser-results.json'),JSON.stringify(results,null,2));
  assert.deepEqual(failed,[], 'Accessibility issues remain; inspect browser-results.json');
  console.log(`PASS ${results.pages.length} page/viewport checks and ${results.interactions.length} interaction checks. Artifacts: ${out}`);
} finally {
  await writeFile(join(out,'browser-results.json'),JSON.stringify(results,null,2));
  await browser.close();
}
