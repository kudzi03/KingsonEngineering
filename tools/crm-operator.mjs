// Reviewed copy runs from LocalAppData, not from an arbitrary future Git checkout.
// Only the official CLI accesses Supabase credentials. Child output/customer data is never logged.
import {execFileSync,spawnSync} from 'node:child_process';
import {readFile,writeFile,mkdir,rename,stat,copyFile,open,unlink} from 'node:fs/promises';
import {randomUUID,randomBytes,timingSafeEqual} from 'node:crypto';
import {join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {packArchive,verifyArchive,removeStage,hash,ident,wrapRecoveryKey,unwrapRecoveryKey} from './crm-operator-archive.mjs';
import {scanVerdict,queryRows} from './crm-operator-scan.mjs';
const home=process.env.KINGSON_OPS_HOME||join(process.env.USERPROFILE,'.kingson-crm-operator');
const config=JSON.parse(await readFile(join(home,'config.json'),'utf8'));
const cli=config.cli, project='fgzwcxwmaohowryzdgui',pwsh=config.powershell;
const lockPath=join(home,'worker.lock');
let lock;
const recoveryOnly=process.argv.includes('--export-recovery');
if(!recoveryOnly){
try{lock=await open(lockPath,'wx');}catch(error){
  if(error.code!=='EEXIST')throw error;
  const previous=JSON.parse(await readFile(lockPath,'utf8'));let running=false;
  try{process.kill(previous.pid,0);running=true;}catch(e){if(e.code!=='ESRCH')running=true;}
  if(running){console.log(JSON.stringify({ok:true,busy:true}));process.exit(process.argv.includes('--export-recovery')?75:0);}
  await unlink(lockPath);lock=await open(lockPath,'wx');
}
await lock.writeFile(JSON.stringify({pid:process.pid,at:new Date().toISOString()}));
}
const {PGlite}=await import(pathToFileURL(config.pglite));
const stageRoot=join(home,'staging');await mkdir(stageRoot,{recursive:true});
const stage=join(stageRoot,randomUUID());await mkdir(stage);
const literal=v=>"'"+String(v).replaceAll("'","''")+"'";
const sqlName=n=>n.split('.').map(ident).join('.');
let phase='initialization';
function run(args,timeout=120000) {
  try{return execFileSync(cli,args,{cwd:stage,encoding:'utf8',windowsHide:true,timeout,maxBuffer:128*1024*1024,stdio:['ignore','pipe','pipe']});}
  catch(error) {
    const output=String(error.stdout||'')+String(error.stderr||'');
    const hints=['experimental','unauthorized','permission denied','not found','does not exist','403','401','invalid','legacy','api key','network','timeout','disabled','secret','failed to','fetch','schema','bucket','unexpected','file exists','503','502','rate limit','s3','saml','download','stat','copy','unsupported','enotfound','econnrefused','ENOENT'].filter(h=>output.toLowerCase().includes(h.toLowerCase()));
    hints.push(...new Set(output.match(/\b[A-Z][A-Za-z]{1,40}Error\b/g)||[]));
    const safe=new Error('Supabase operation failed during '+phase);safe.safeHints=hints;throw safe;
  }
}
async function query(sql) {
  const path=join(stage,'query.sql');await writeFile(path,sql);
  const out=run(['db','query','--linked','--project-ref',project,'--file',path,'--output','json']);
  try{return queryRows(out);}catch{throw new Error('Invalid query response during '+phase);}
}
function dpapi(mode,input) {
  const fn=mode==='protect'?'Protect':'Unprotect';
  const script=`Add-Type -AssemblyName System.Security; $b=[Convert]::FromBase64String([Console]::In.ReadToEnd()); $e=[Text.Encoding]::UTF8.GetBytes('Kingson CRM operator key v1'); [Console]::Write([Convert]::ToBase64String([Security.Cryptography.ProtectedData]::${fn}($b,$e,[Security.Cryptography.DataProtectionScope]::CurrentUser)))`;
  return Buffer.from(execFileSync(pwsh,['-NoProfile','-Command',script],{input:Buffer.from(input).toString('base64'),encoding:'utf8',windowsHide:true}),'base64');
}
async function key() {
  const path=join(home,'backup-key.dpapi');
  try{return dpapi('unprotect',await readFile(path));}
  catch(error){
    // Never replace a key whose existing file cannot be decrypted.
    try{await stat(path);throw new Error('Existing backup key cannot be decrypted');}catch(e){if(e.code!=='ENOENT')throw e;}
    const value=randomBytes(32);await writeFile(path,dpapi('protect',value),{flag:'wx'});return value;
  }
}
async function record(kind,status,summary) {
  await query(`insert into private.crm_worker_runs(kind,status,summary) values(${literal(kind)},${literal(status)},${literal(JSON.stringify(summary))}::jsonb)`);
}
async function download(object) {
  const id=hash(object.bucket_id+'\0'+object.name),path=join(stage,id+'.bin');
  // The CLI treats a Windows drive letter as a URL scheme; use a relative destination.
  run(['storage','cp','ss:///'+object.bucket_id+'/'+object.name,id+'.bin','--project-ref',project,'--linked','--experimental','--output-format','json']);
  return {id,local:path,bucket:object.bucket_id,name:object.name};
}
async function freshDefinitions() {
  const info=await stat(join(config.database,'daily.cld')).catch(()=>stat(join(config.database,'daily.cvd'))).catch(()=>null);
  if(!info || Date.now()-info.mtimeMs>86400000) {
    const result=spawnSync(config.freshclam,['--config-file',config.freshclamConfig,'--stdout'],{windowsHide:true,timeout:300000,stdio:['ignore','pipe','pipe']});
    if(result.status!==0 && (!info||Date.now()-info.mtimeMs>2*86400000))throw new Error('Antivirus definitions unavailable or stale');
  }
}
async function scan() {
  phase='scan query';
  const filter=process.argv.includes('--rescan')?'true':"f.scan_status in ('pending','error') or f.scan_storage_updated_at is distinct from o.updated_at or f.scanned_at<now()-interval '7 days'";
  const rows=await query(`select f.id,f.path,f.bucket,o.name,o.bucket_id,o.id object_id,o.updated_at from public.files f join storage.objects o on o.bucket_id=f.bucket and o.name=f.path where ${filter} order by f.scanned_at nulls first,f.created_at limit 20`);
  phase='scan version';const engine=execFileSync(config.scanner,['--version'],{encoding:'utf8',windowsHide:true,timeout:30000}).trim();
  phase='scan definitions';if(rows.length)await freshDefinitions();
  const counts={clean:0,blocked:0,error:0,changed:0};
  phase='scan download';const files=[];for(const row of rows){const file=await download(row);files.push({...file,row,before:hash(await readFile(file.local))});}
  // One engine load per batch avoids repeatedly loading the large signature database.
  phase='scan engine';const result=files.length?spawnSync(config.scanner,['--database='+config.database,'--no-summary','--stdout','--fail-if-cvd-older-than=3','--max-filesize=25M','--max-scansize=100M','--max-recursion=8','--alert-exceeds-max=yes','--alert-encrypted=yes',...files.map(f=>f.local)],{windowsHide:true,timeout:600000,stdio:['ignore','pipe','pipe']}):null;
  phase='scan update';
  for(const file of files) {
    const {row,before}=file;
    let status=scanVerdict(result,file.local);
    if(await readFile(file.local).then(bytes=>hash(bytes)!==before).catch(()=>true))status='error';
    const updated=await query(`update public.files f set scan_status=${literal(status)},scan_sha256=${literal(before)},scanned_at=now(),scan_engine=${literal(engine)},scan_storage_updated_at=${literal(row.updated_at)}::timestamptz where f.id=${literal(row.id)}::uuid and f.path=${literal(row.path)} and f.bucket=${literal(row.bucket)} and exists(select 1 from storage.objects o where o.id=${literal(row.object_id)}::uuid and o.updated_at=${literal(row.updated_at)}::timestamptz) returning f.id`);
    if(updated.length)counts[status]++;else counts.changed++;
  }
  const diagnostics={engineExit:result?.status??null,timeout:result?.error?.code==='ETIMEDOUT',okLines:linesForDiagnostics(result).filter(line=>line.endsWith(': OK')).length};
  await writeFile(join(home,'last-scan.json'),JSON.stringify({...counts,...diagnostics,at:new Date().toISOString()}));
  await record('scan',counts.error||counts.changed||counts.blocked?'error':'verified',{...counts,engine,...diagnostics});
  return counts;
}
const linesForDiagnostics=result=>String(result?.stdout||'').split(/\r?\n/);
const tables=['profiles','crm_settings','enquiries','companies','contacts','opportunities','activities','tasks','site_visits','quotes','projects','files','notification_outbox'].map(n=>'public.'+n)
  .concat(['private.crm_security_config','private.crm_audit','private.crm_health_checks','private.crm_worker_runs','auth.users','auth.identities','auth.mfa_factors','auth.instances','storage.buckets','storage.objects']);
function snapshotSql() {
  const names=tables.map(literal).join(',');
  const data=tables.map(table=>{
    const where=table==='storage.objects'?" where t.bucket_id='kingson-files'":table==='storage.buckets'?" where t.id='kingson-files'":'';
    return literal(table)+`,(select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) from ${sqlName(table)} t${where})`;
  }).join(',');
  return `select jsonb_build_object('created_at',now(),'scope','Consistent logical database rows, schema metadata and version-matched private file bytes. Excludes active Auth sessions, refresh tokens and platform/provider secrets.',
    'tables',jsonb_build_object(${data}),
    'columns',(select jsonb_agg(t order by t.table) from (select n.nspname||'.'||c.relname as "table",jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod)) order by a.attnum) as columns from pg_class c join pg_namespace n on n.oid=c.relnamespace join pg_attribute a on a.attrelid=c.oid and a.attnum>0 and not a.attisdropped where n.nspname||'.'||c.relname in (${names}) group by n.nspname,c.relname)t),
    'enums',(select coalesce(jsonb_agg(t),'[]'::jsonb) from(select n.nspname as schema,t.typname as name,jsonb_agg(e.enumlabel order by e.enumsortorder) labels from pg_type t join pg_namespace n on n.oid=t.typnamespace join pg_enum e on e.enumtypid=t.oid where n.nspname in ('public','auth','storage','private') group by n.nspname,t.typname)t),
    'constraints',(select coalesce(jsonb_agg(jsonb_build_object('table',n.nspname||'.'||c.relname,'type',co.contype,'name',co.conname,'definition',pg_get_constraintdef(co.oid),'reference',case when co.confrelid<>0 then rn.nspname||'.'||rc.relname end)),'[]'::jsonb) from pg_constraint co join pg_class c on c.oid=co.conrelid join pg_namespace n on n.oid=c.relnamespace left join pg_class rc on rc.oid=co.confrelid left join pg_namespace rn on rn.oid=rc.relnamespace where n.nspname||'.'||c.relname in (${names})),
    'functions',(select jsonb_agg(pg_get_functiondef(p.oid)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.prokind='f'),
    'indexes',(select jsonb_agg(indexdef) from pg_indexes where schemaname in ('public','private')),
    'policies',(select jsonb_agg(p) from pg_policies p where schemaname in ('public','private','storage')),
    'sequences',(select jsonb_agg(s) from pg_sequences s where schemaname in ('public','private'))
  ) snapshot;`;
}
async function backup(force=false) {
  phase='backup';
  if(!force) {
    const previous=await query("select checked_at from private.crm_worker_runs where kind='backup' and status='verified' order by checked_at desc limit 1");
    if(previous[0] && Date.now()-Date.parse(previous[0].checked_at)<23*3600000)return {skipped:true};
  }
  phase='backup snapshot';const snapshot=(await query(snapshotSql()))[0].snapshot;
  const files=[];
  phase='backup files';for(const object of snapshot.tables['storage.objects'])files.push({...await download(object),version:object.updated_at,objectId:object.id});
  for(const file of files) {
    const changed=await query(`select id from storage.objects where id=${literal(file.objectId)}::uuid and updated_at=${literal(file.version)}::timestamptz`);
    if(!changed.length)throw new Error('Storage changed during backup; retry required');
  }
  phase='backup encryption';const encryptionKey=await key(),name='kingson-'+new Date().toISOString().replaceAll(':','-')+'.kingson.enc';
  const partial=join(stage,'backup.partial');await packArchive(partial,encryptionKey,snapshot,files);
  phase='backup restore';const verified=await verifyArchive(partial,encryptionKey,join(stage,'restore-drill'),PGlite);
  await mkdir(config.backups,{recursive:true});const final=join(config.backups,name);await rename(partial,final);
  phase='backup copy';let offDevice=false;
  if(config.oneDrive) {await mkdir(config.oneDrive,{recursive:true});await copyFile(final,join(config.oneDrive,name));
    if(hash(await readFile(final))!==hash(await readFile(join(config.oneDrive,name))))throw new Error('Encrypted off-device copy differs');offDevice=true;}
  await record('backup','verified',{...verified,archive:name,encrypted:true,oneDriveCopy:offDevice,cloudSyncVerified:false});
  return {...verified,archive:name,oneDriveCopy:offDevice};
}
async function exportRecovery() {
  const password=process.env.KINGSON_RECOVERY_PASSPHRASE;delete process.env.KINGSON_RECOVERY_PASSPHRASE;
  if(!password||password.length<20)throw new Error('Use a recovery passphrase of at least 20 characters');
  const value=await key(),payload=wrapRecoveryKey(value,password);
  const path=join(config.oneDrive||config.backups,'kingson-recovery-key.encrypted.json');await mkdir(dirname(path),{recursive:true});await writeFile(path,JSON.stringify(payload));
  const saved=JSON.parse(await readFile(path,'utf8'));
  if(!timingSafeEqual(value,unwrapRecoveryKey(saved,password)))throw new Error('Recovery key verification failed');
  await writeFile(join(home,'recovery-status.json'),JSON.stringify({at:new Date().toISOString(),verified:true,path}));
  return {recoveryKeyExported:true,path};
}
try {
  let result;
  if(process.argv.includes('--export-recovery'))result=await exportRecovery();
  else if(process.argv.includes('--backup-only'))result=await backup(true);
  else {
    result={};let scanFailed=false;
    try{result.scan=await scan();scanFailed=Boolean(result.scan.error||result.scan.changed||result.scan.blocked);}catch(error){scanFailed=true;result.scan={error:true,stage:phase,hints:error.safeHints||[],code:['ENOENT','EACCES','ENOMEM','ETIMEDOUT','EPERM'].includes(error.code)?error.code:null};await record('scan','error',{message:'Scanner unavailable; quarantine retained.',...result.scan}).catch(()=>{});}
    result.backup=await backup(process.argv.includes('--force-backup'));
    if(scanFailed){phase=result.scan.stage||'scan';const error=new Error('Scan failed; backup completed independently');error.safeHints=result.scan.hints||[];throw error;}
  }
  if(!recoveryOnly)await writeFile(join(home,'last-run.json'),JSON.stringify({at:new Date().toISOString(),ok:true,result},null,2));
  console.log(JSON.stringify({ok:true,result}));
} catch(error) {
  const message='Operator job failed during '+phase+'; no unverified file or backup was approved.';
  if(!recoveryOnly)await writeFile(join(home,'last-run.json'),JSON.stringify({at:new Date().toISOString(),ok:false,phase,message,hints:error.safeHints||[]}));
  if(phase.startsWith('scan')||phase.startsWith('backup'))await record(phase.startsWith('scan')?'scan':'backup','error',{message}).catch(()=>{});
  console.error(message+(error.safeHints?.length?' Hints: '+error.safeHints.join(', '):''));process.exitCode=1;
} finally {try{await removeStage(stageRoot,stage);}finally{if(lock){await lock.close();await unlink(lockPath);}}}
