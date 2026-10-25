import assert from 'node:assert/strict';
import {encryptBackup,verifyBackup} from '../crm-src/core/backup.js';
import {validateFile} from '../crm-src/core/file-validation.js';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const bytes=new TextEncoder().encode('fixture drawing bytes');
const hash=Buffer.from(await crypto.subtle.digest('SHA-256',bytes)).toString('hex');
const payload={format:'kingson-crm-application-export',tables:{contacts:[{id:'test',full_name:'Synthetic customer'}]},files:[{path:'test.txt',bytes:Buffer.from(bytes).toString('base64'),sha256:hash}]};
const passphrase='local fixture passphrase 123';
const archive=await encryptBackup(payload,passphrase);
assert(!JSON.stringify(archive).includes('Synthetic customer'));
assert.deepEqual(await verifyBackup(archive,passphrase),payload);
await assert.rejects(()=>verifyBackup(archive,'wrong password 123456'));
await assert.rejects(()=>verifyBackup({...archive,ciphertext:archive.ciphertext.slice(0,-8)+'AAAAAAAA'},passphrase));
await assert.rejects(()=>encryptBackup(payload,'short'));
const damaged=structuredClone(payload);damaged.files[0].sha256='bad';
await assert.rejects(async()=>verifyBackup(await encryptBackup(damaged,passphrase),passphrase));
console.log('PASS encrypted backup round-trip, wrong-password rejection, tamper detection, file integrity and minimum passphrase');

function zip(name) {
  const n=new TextEncoder().encode(name), bytes=new Uint8Array(4+46+n.length), view=new DataView(bytes.buffer);
  view.setUint32(0,0x04034b50,true);view.setUint32(4,0x02014b50,true);view.setUint16(4+28,n.length,true);bytes.set(n,50);
  return bytes;
}
await validateFile(new File([zip('drawing.txt')],'drawings.zip'));
await assert.rejects(()=>validateFile(new File([zip('nested.exe')],'drawings.zip')));
await assert.rejects(()=>validateFile(new File([zip('../escape.txt')],'drawings.zip')));
await assert.rejects(()=>validateFile(new File([zip('word/vbaProject.bin')],'drawings.docx')));
console.log('PASS archive executable, path traversal and macro rejection');

let handler,allowed=true,uploaded=false;
globalThis.Deno={env:{get:name=>({SUPABASE_URL:'https://fixture.invalid',SUPABASE_SERVICE_ROLE_KEY:'fixture-service',SUPABASE_ANON_KEY:'fixture-anon'})[name]},serve:fn=>{handler=fn;}};
const path=join(tmpdir(),'kingson-upload-test.mjs');
execFileSync(process.env.ESBUILD,['crm-src/supabase/functions/crm-upload/index.ts','--bundle','--format=esm','--platform=neutral','--outfile='+path],{stdio:'pipe'});
await import(pathToFileURL(path));
const realFetch=globalThis.fetch;
globalThis.fetch=async (url,options={})=>{
  if(url.endsWith('/rpc/is_staff')) return Response.json(allowed);
  if(url.includes('/opportunities?')) return Response.json([{id:'11111111-1111-1111-1111-111111111111'}]);
  if(url.endsWith('/auth/v1/user')) return Response.json({id:'22222222-2222-2222-2222-222222222222'});
  if(url.includes('/storage/')) {uploaded=true;return Response.json({});}
  if(url.endsWith('/files')) return Response.json([{id:'33333333-3333-3333-3333-333333333333'}]);
  throw new Error('Unexpected fixture URL '+url);
};
const req=(content,name='drawing.pdf',origin='https://www.kingsonengineering.co.zw')=>{
  const form=new FormData();form.append('file',new File([content],name));form.append('link_type','opportunity_id');form.append('link_id','11111111-1111-1111-1111-111111111111');
  return new Request('https://fixture.invalid/upload',{method:'POST',headers:{Origin:origin,Authorization:'Bearer fixture'},body:form});
};
try {
  assert.equal((await handler(req('%PDF-1.7\nfixture'))).status,200);assert(uploaded);
  uploaded=false;assert.equal((await handler(req('MZ executable'))).status,400);assert(!uploaded);
  allowed=false;assert.equal((await handler(req('%PDF-1.7'))).status,403);assert(!uploaded);
  assert.equal((await handler(req('%PDF-1.7','drawing.pdf','https://attacker.invalid'))).status,403);
  console.log('PASS server upload authorizes staff and origin, validates actual bytes, refuses disguised executables');
} finally {globalThis.fetch=realFetch;}
