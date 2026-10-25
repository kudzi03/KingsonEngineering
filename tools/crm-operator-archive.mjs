// Operator archives use a random AES key, protected by Windows DPAPI in the worker.
// Streaming keeps document bytes out of JSON megastrings and unencrypted backup files.
import {randomBytes,createCipheriv,createDecipheriv,createHash,scryptSync} from 'node:crypto';
import {createReadStream,createWriteStream} from 'node:fs';
import {open,stat,writeFile,mkdir,realpath,rm} from 'node:fs/promises';
import {createGzip,createGunzip} from 'node:zlib';
import {Readable,Writable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {createInterface} from 'node:readline';
import {resolve,join,sep} from 'node:path';
const magic=Buffer.from('KINGSON1\n');
const aad=Buffer.from('Kingson operator backup v1');
export const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export const ident=value=>'"'+String(value).replaceAll('"','""')+'"';
export const canonical=value=>JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b))):item);
export function wrapRecoveryKey(key,password) {
  if(password.length<20 || key.length!==32)throw new Error('Invalid recovery key or passphrase');
  const salt=randomBytes(16),iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',scryptSync(password,salt,32),iv);
  const encrypted=Buffer.concat([cipher.update(key),cipher.final()]);
  return {format:'kingson-recovery-key',version:1,kdf:'scrypt',salt:salt.toString('base64'),iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:encrypted.toString('base64')};
}
export function unwrapRecoveryKey(saved,password) {
  if(saved.format!=='kingson-recovery-key'||saved.version!==1||saved.kdf!=='scrypt')throw new Error('Unsupported recovery format');
  const salt=Buffer.from(saved.salt,'base64'),iv=Buffer.from(saved.iv,'base64'),tag=Buffer.from(saved.tag,'base64'),data=Buffer.from(saved.data,'base64');
  if(salt.length!==16||iv.length!==12||tag.length!==16||data.length!==32)throw new Error('Invalid recovery envelope');
  const check=createDecipheriv('aes-256-gcm',scryptSync(password,salt,32),iv);check.setAuthTag(tag);
  return Buffer.concat([check.update(data),check.final()]);
}
export async function removeStage(root,path) {
  const base=await realpath(root), target=await realpath(path);
  if(target===base || !target.startsWith(base+sep)) throw new Error('Unsafe staging cleanup refused');
  await rm(target,{recursive:true,force:true});
}
export async function packArchive(path,key,snapshot,files) {
  const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(aad);
  await writeFile(path,Buffer.concat([magic,iv]));
  async function* records() {
    yield JSON.stringify({kind:'database',snapshot})+'\n';
    for(const file of files) {
      const digest=createHash('sha256');let size=0,index=0;
      for await(const chunk of createReadStream(file.local,{highWaterMark:1024*1024})) {
        digest.update(chunk);size+=chunk.length;
        yield JSON.stringify({kind:'file_chunk',id:file.id,index:index++,data:chunk.toString('base64')})+'\n';
      }
      yield JSON.stringify({kind:'file_end',id:file.id,bucket:file.bucket,name:file.name,size,sha256:digest.digest('hex')})+'\n';
    }
    yield JSON.stringify({kind:'end',fileCount:files.length})+'\n';
  }
  await pipeline(Readable.from(records()),createGzip(),cipher,createWriteStream(path,{flags:'a'}));
  const handle=await open(path,'a');try{await handle.write(cipher.getAuthTag());}finally{await handle.close();}
}
async function decryptStream(path,key) {
  const info=await stat(path),handle=await open(path,'r');
  const header=Buffer.alloc(magic.length+12),tag=Buffer.alloc(16);
  try{await handle.read(header,0,header.length,0);await handle.read(tag,0,16,info.size-16);}finally{await handle.close();}
  if(info.size<header.length+16 || !header.subarray(0,magic.length).equals(magic)) throw new Error('Invalid archive');
  const decipher=createDecipheriv('aes-256-gcm',key,header.subarray(magic.length));decipher.setAAD(aad);decipher.setAuthTag(tag);
  return {input:createReadStream(path,{start:header.length,end:info.size-17}),decipher};
}
export async function verifyArchive(path,key,verifyRoot,PGlite) {
  // Authenticate the ENTIRE archive before processing any decrypted metadata.
  let stream=await decryptStream(path,key);
  await pipeline(stream.input,stream.decipher,new Writable({write(_chunk,_encoding,done){done();}}));
  stream=await decryptStream(path,key);
  const gunzip=createGunzip(),pumping=pipeline(stream.input,stream.decipher,gunzip);
  pumping.catch(()=>{});
  const lines=createInterface({input:gunzip,crlfDelay:Infinity});
  const files=new Map();let snapshot,finished=false,expected;
  await mkdir(verifyRoot,{recursive:true});
  let db;
  try {
  for await(const line of lines) {
    if(finished)throw new Error('Unexpected records after archive end');
    const item=JSON.parse(line);
    if(item.kind==='database') {if(snapshot)throw new Error('Duplicate snapshot');snapshot=item.snapshot;}
    else if(item.kind==='file_chunk') {
      if(!/^[0-9a-f]{64}$/.test(item.id))throw new Error('Unsafe file identifier');
      let state=files.get(item.id);
      if(!state){state={handle:await open(join(verifyRoot,item.id+'.bin'),'wx'),digest:createHash('sha256'),size:0,index:0,done:false};files.set(item.id,state);}
      if(state.done || item.index!==state.index++)throw new Error('Invalid chunk order');
      const bytes=Buffer.from(item.data,'base64');state.digest.update(bytes);state.size+=bytes.length;await state.handle.write(bytes);
    } else if(item.kind==='file_end') {
      if(!/^[0-9a-f]{64}$/.test(item.id))throw new Error('Unsafe file identifier');
      let state=files.get(item.id);
      if(!state && item.size===0){state={handle:await open(join(verifyRoot,item.id+'.bin'),'wx'),digest:createHash('sha256'),size:0,done:false};files.set(item.id,state);}
      if(!state || state.done || state.size!==item.size || state.digest.digest('hex')!==item.sha256)throw new Error('Document integrity failed');
      await state.handle.close();state.done=true;
    } else if(item.kind==='end'){finished=true;expected=item.fileCount;}
    else throw new Error('Unknown archive record');
  }
  await pumping;
  if(!finished || !snapshot || expected!==files.size || [...files.values()].some(f=>!f.done))throw new Error('Incomplete archive');
  db=new PGlite();
    for(const schema of ['public','private','auth','storage','extensions'])await db.exec('create schema if not exists '+ident(schema));
    for(const type of snapshot.enums)await db.exec(`create type ${ident(type.schema)}.${ident(type.name)} as enum (${type.labels.map(v=>"'"+v.replaceAll("'","''")+"'").join(',')})`);
    for(const table of snapshot.columns) {
      const full=table.table.split('.').map(ident).join('.');
      await db.exec('create table '+full+' ('+table.columns.map(c=>ident(c.name)+' '+c.type).join(',')+')');
      const rows=snapshot.tables[table.table]||[];
      if(rows.length)await db.query(`insert into ${full} select * from jsonb_populate_recordset(null::${full},$1::jsonb)`,[JSON.stringify(rows)]);
      const restored=(await db.query(`select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) rows from ${full} t`)).rows[0].rows;
      if(canonical(restored)!==canonical(rows))throw new Error('Database restore comparison failed for '+table.table);
    }
    let constraints=0;
    const ordered=snapshot.constraints.filter(c=>['p','u','f'].includes(c.type)&&(!c.reference||snapshot.tables[c.reference])).sort((a,b)=>(a.type==='f')-(b.type==='f'));
    for(const c of ordered) {
      await db.exec(`alter table ${c.table.split('.').map(ident).join('.')} add constraint ${ident(c.name)} ${c.definition}`);constraints++;
    }
    return {tables:Object.keys(snapshot.tables).length,rows:Object.values(snapshot.tables).reduce((n,rows)=>n+rows.length,0),files:files.size,constraints,created_at:snapshot.created_at};
  } finally {lines.close();gunzip.destroy();await pumping.catch(()=>{});if(db)await db.close();for(const state of files.values()){if(!state.done)await state.handle.close().catch(()=>{});}}
}
