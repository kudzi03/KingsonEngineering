// Browser tests use synthetic accounts and intercept EVERY backend request.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {validateFile} from '../crm-src/core/file-validation.js';
import {nextWorkingDay} from '../crm-src/core/model.js';
import {verifyBackup} from '../crm-src/core/backup.js';
const out=process.env.KINGSON_QA_OUTPUT||join(tmpdir(),'kingson-crm-security-review'); await mkdir(out,{recursive:true});
const base=process.env.KINGSON_PREVIEW_URL||'http://127.0.0.1:4174';
const pw=await import(pathToFileURL(process.env.KINGSON_PLAYWRIGHT_PATH));
const engine=process.env.KINGSON_BROWSER==='webkit'?'webkit':'chromium';
const browser=await pw[engine].launch({headless:true,...(engine==='chromium'?{channel:'msedge'}:{})});
const config=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url)));
const csp=config.headers.find(e=>e.source==='/crm').headers.find(h=>h.key==='Content-Security-Policy').value;
const id='11111111-1111-1111-1111-111111111111';
const factor='22222222-2222-2222-2222-222222222222';
const token=aal=>['eyJhbGciOiJub25lIn0',Buffer.from(JSON.stringify({sub:id,aal,role:'authenticated'})).toString('base64url'),'fixture'].join('.');
const results=[];
function ok(name){results.push(name);console.log('PASS '+name);}
async function fixture({width=1440,verified=false}={}) {
  const context=await browser.newContext({viewport:{width,height:width<500?844:900}});
  const calls=[],errors=[];
  let aal='aal1';
  const session=()=>({access_token:token(aal),refresh_token:'fixture-refresh',expires_in:3600,user:{id,email:'admin@example.test'}});
  await context.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.origin===base) {
      const response=await fetch(request.url());
      const headers=Object.fromEntries(response.headers);
      for(const key of ['content-length','content-encoding','transfer-encoding','connection']) delete headers[key];
      if(url.pathname.startsWith('/crm')) headers['content-security-policy']=csp;
      return route.fulfill({status:response.status,headers,body:Buffer.from(await response.arrayBuffer())});
    }
    if(url.hostname!=='fgzwcxwmaohowryzdgui.supabase.co') return route.fulfill({status:200,body:''});
    calls.push({path:url.pathname,query:url.search,method:request.method(),body:request.postData()});
    let value=[];
    if(url.pathname==='/auth/v1/token') value={...session(),access_token:token('aal1')};
    else if(url.pathname==='/auth/v1/user') value={id,email:'admin@example.test',factors:verified?[{id:factor,factor_type:'totp',status:'verified',friendly_name:'Test device'}]:[]};
    else if(url.pathname==='/auth/v1/factors') value={id:factor,totp:{secret:'JBSWY3DPEHPK3PXP',qr_code:'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="white"/><text x="10" y="30">QA placeholder</text></svg>'}};
    else if(url.pathname.endsWith('/challenge')) value={id:'fixture-challenge'};
    else if(url.pathname.endsWith('/verify')) {aal='aal2'; verified=true; value=session();}
    else if(url.pathname.includes('rpc/touch_crm_session')) value=null;
    else if(url.pathname.includes('profiles')) value=[{id,full_name:'Test Administrator',initials:'TA',role:'admin',active:true}];
    else if(url.pathname.includes('crm_settings')) value=[{id:true,working_weekdays:[1,2,3,4,5],email_mode:'manual',crm_url:'https://www.kingsonengineering.co.zw/crm'}];
    else if(url.pathname.includes('rpc/crm_security_health')) value={mfa_enforced:true,accounts_without_mfa:0,unconverted_enquiries:0};
    else if(url.pathname.includes('rpc/dashboard_metrics')) value={};
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(value)});
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/crm');
  return {context,page,calls,errors};
}
try {
  for(const [width,verified] of [[1440,false],[390,true]]) {
    const f=await fixture({width,verified});
    await f.page.getByLabel('Email',{exact:true}).fill('admin@example.test');
    await f.page.getByLabel('Password',{exact:true}).fill('fixture-password-only');
    await f.page.getByRole('button',{name:'Sign in',exact:true}).click();
    await f.page.getByLabel('Six-digit code').waitFor();
    assert.equal(f.calls.some(c=>c.path.startsWith('/rest/')),false);
    ok(`${engine} ${width}: no CRM read before MFA`);
    if(!verified) await f.page.getByText('Setup key',{exact:true}).waitFor();
    await f.page.screenshot({path:join(out,`${engine}-${width}-mfa.png`),fullPage:true});
    await f.page.getByLabel('Six-digit code').fill('123456');
    await f.page.getByRole('button',{name:'Verify and continue'}).click();
    await f.page.locator('#app:not([hidden])').waitFor();
    assert(f.calls.some(c=>c.path.endsWith('/touch_crm_session')));
    assert.equal(await f.page.evaluate(()=>localStorage.getItem('kingson-crm/session/v1')),null);
    assert(await f.page.evaluate(()=>sessionStorage.getItem('kingson-crm/session/v1')));
    ok(`${engine} ${width}: MFA unlocks CRM; tokens stay out of persistent storage`);
    await f.page.goto(base+'/crm#/settings');
    await f.page.getByText('Security and continuity',{exact:true}).waitFor();
    assert.equal(await f.page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await f.page.screenshot({path:join(out,`${engine}-${width}-settings.png`),fullPage:true});
    assert.equal(f.errors.length,0,f.errors.join('\n'));
    ok(`${engine} ${width}: settings, backup control and layout render without errors`);
    const encrypted=await f.page.evaluate(async()=>{
      // The fixture exports no real records and no real files.
      const input=document.querySelector('#backup-password');input.value='fixture passphrase 123456';
      input.dispatchEvent(new Event('input',{bubbles:true}));
      return Boolean(input);
    });
    assert(encrypted);
    const downloaded=f.page.waitForEvent('download');
    await f.page.getByRole('button',{name:'Download encrypted application backup',exact:true}).click();
    const download=await downloaded;
    const backupPath=join(out,`${engine}-${width}-fixture.encrypted.json`);
    await download.saveAs(backupPath);
    const restored=await verifyBackup(JSON.parse(await readFile(backupPath,'utf8')),'fixture passphrase 123456');
    assert.equal(restored.tables.profiles[0].id,id);
    ok(`${engine} ${width}: actual backup download decrypts and restores synthetic records`);
    if(width===1440) {
      await f.page.goto(base+'/crm#/account');
      await f.page.getByLabel('Current password',{exact:true}).fill('fixture current password');
      await f.page.getByLabel('New password',{exact:true}).fill('fixture replacement passphrase 1234');
      await f.page.getByLabel('New password again',{exact:true}).fill('fixture replacement passphrase 1234');
      await f.page.getByRole('button',{name:'Change password',exact:true}).click();
      await f.page.getByText('Password changed. Use the new one next time you sign in.',{exact:true}).waitFor();
      const saved=await f.page.evaluate(()=>JSON.parse(sessionStorage.getItem('kingson-crm/session/v1')));
      assert.equal(JSON.parse(Buffer.from(saved.access_token.split('.')[1],'base64url').toString()).aal,'aal2');
      assert(f.calls.some(c=>c.path.endsWith('/logout')&&c.query==='?scope=others'));
      ok(`${engine}: password change preserves MFA and revokes other refresh sessions`);
    }
    if(width<500) await f.page.getByRole('button',{name:'Open navigation',exact:true}).click();
    await f.page.getByRole('button',{name:'Sign out',exact:true}).click();
    await f.page.getByRole('heading',{name:'Sign in',exact:true}).waitFor();
    assert.equal(await f.page.locator('#view').textContent(),'');
    assert.equal(await f.page.evaluate(()=>sessionStorage.getItem('kingson-crm/session/v1')),null);
    ok(`${engine} ${width}: sign-out clears tokens and rendered customer data`);
    await f.context.close();
  }
  const f=await fixture();
  await f.page.getByRole('button',{name:'Forgot your password?'}).click();
  await f.page.getByLabel('Email',{exact:true}).fill('admin@example.test');
  await f.page.getByRole('button',{name:'Send the link'}).click();
  await f.page.getByText('If that address has an account, the link is on its way.',{exact:false}).waitFor();
  const recovery=f.calls.find(c=>c.path.endsWith('/recover'));
  assert(recovery); // request is intercepted, no email was sent
  assert.equal(new URLSearchParams(recovery.query).get('redirect_to'),base+'/crm?reset=1');
  ok(`${engine}: password recovery sends a request without disclosing account existence`);
  await f.context.close();
  assert.equal(nextWorkingDay('2026-10-23',1),'2026-10-26');
  assert.equal(nextWorkingDay('2026-10-23',5),'2026-10-30');
  assert.equal(nextWorkingDay('2026-10-24',1),'2026-10-26');
  ok('Frontend counts Monday-Friday working days correctly');
  await validateFile(new File(['%PDF-1.7\nfixture'], 'drawing.pdf'));
  await assert.rejects(()=>validateFile(new File(['MZ executable'], 'drawing.pdf')));
  await assert.rejects(()=>validateFile(new File(['<svg/>'], 'drawing.svg')));
  await assert.rejects(()=>validateFile(new File(['test'], '../drawing.txt')));
  ok('File signatures, executable disguises, unsupported files and unsafe names checked');
} finally {await browser.close();await writeFile(join(out,`${engine}-results.json`),JSON.stringify(results,null,2));}
