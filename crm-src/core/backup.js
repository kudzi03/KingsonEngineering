/* Application export, encrypted locally. No password, plaintext or document goes to a new provider. */
import { db, storage } from './supabase.js';
import { FILES_BUCKET } from './config.js';
const encoder = new TextEncoder();
const b64 = (bytes) => {
  let out = '';
  for (let i=0;i<bytes.length;i+=8192) out+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(out);
};
const unb64 = (value) => Uint8Array.from(atob(value),c=>c.charCodeAt(0));
const sha = async (bytes) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
async function keyFor(password,salt) {
  const base = await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:310000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
export async function encryptBackup(payload,password) {
  if (password.length<16) throw new Error('Use a unique backup passphrase of at least 16 characters.');
  const salt=crypto.getRandomValues(new Uint8Array(16)), iv=crypto.getRandomValues(new Uint8Array(12));
  const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},await keyFor(password,salt),encoder.encode(JSON.stringify(payload)));
  return {format:'kingson-crm-backup',version:1,kdf:'PBKDF2-SHA256',iterations:310000,salt:b64(salt),iv:b64(iv),ciphertext:b64(new Uint8Array(ciphertext))};
}
export async function verifyBackup(archive,password) {
  if (archive.format!=='kingson-crm-backup' || archive.version!==1 || archive.iterations!==310000) throw new Error('Unsupported backup format.');
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(archive.iv)},await keyFor(password,unb64(archive.salt)),unb64(archive.ciphertext));
  const payload=JSON.parse(new TextDecoder().decode(plain));
  if (payload.format!=='kingson-crm-application-export' || !payload.tables || !Array.isArray(payload.files)) throw new Error('Invalid backup contents.');
  for (const file of payload.files) if (await sha(unb64(file.bytes))!==file.sha256) throw new Error('File integrity check failed.');
  return payload;
}
export async function collectBackup() {
  // Counted reads prevent silently truncating a table at PostgREST's row limit.
  const tables={};
  const names=['profiles','crm_settings','enquiries','companies','contacts','opportunities','activities','tasks','site_visits','quotes','projects','files','notification_outbox'];
  for (const name of names) {
    const rows=[];
    for(let offset=0;;offset+=500) {
      const page=await db.select(name,`select=*&order=id&limit=500&offset=${offset}`);
      rows.push(...page);
      if(page.length<500) break;
    }
    tables[name]=rows;
  }
  const files=[]; let total=0;
  for (const row of tables.files) {
    total+=Number(row.size_bytes||0);
    if(total>100*1024*1024) throw new Error('This export exceeds 100 MB. Use the documented operator backup procedure.');
    const response=await fetch(await storage.signedUrl(FILES_BUCKET,row.path,120));
    if(!response.ok) throw new Error('A file could not be backed up. No incomplete export was saved.');
    const bytes=new Uint8Array(await response.arrayBuffer());
    files.push({path:row.path,bytes:b64(bytes),sha256:await sha(bytes)});
  }
  return {format:'kingson-crm-application-export',version:1,created_at:new Date().toISOString(),
    schema:'20261025083326_crm_security_hardening',tables,files,
    scope:'CRM application rows and indexed file bytes. Excludes Auth credentials, secrets, private security tables and unindexed storage objects. Reads are sequential, not a database transaction snapshot.'};
}
