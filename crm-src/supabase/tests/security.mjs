// Runs after the existing 83 regression checks, on disposable PGlite only.
export async function runSecurity({db,q,one,ok,err,read,ADMIN,STAFF,GONE}) {
  console.log('\nCRM hardening (local only):');
  await db.exec(`create table auth.sessions(id uuid primary key,user_id uuid,created_at timestamptz default now(),not_after timestamptz);
    create table auth.mfa_factors(id uuid primary key default gen_random_uuid(),user_id uuid,status text);
    create function auth.jwt() returns jsonb language sql stable as
      $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;`);
  const migration=read('../migrations/20261025083326_crm_security_hardening.sql');
  await db.exec(migration);
  await db.exec(read('../migrations/20261025091356_bound_crm_calendar.sql'));
  ok(Boolean(await err(()=>q('select public.add_working_days(null,1)'))),'calendar rejects null dates instead of looping');
  ok(Boolean(await err(()=>q("select public.add_working_days('infinity',1)"))),'calendar rejects infinite dates');
  ok(Boolean(await err(()=>q("select public.add_working_days('2026-10-23',2147483647)"))),'calendar rejects unbounded day counts');
  const S1='91111111-1111-1111-1111-111111111111', S2='92222222-2222-2222-2222-222222222222';
  await db.exec(`insert into auth.sessions(id,user_id) values('${S1}','${ADMIN}'),('${S2}','${STAFF}');
    insert into auth.mfa_factors(user_id,status) values('${ADMIN}','verified'),('${STAFF}','verified');
    update private.crm_security_config set require_mfa=true;`);
  async function as(user,session,aal,fn,role='authenticated') {
    await q(`select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.role',$2,false),
      set_config('request.jwt.claims',$3,false)`,[user||'',role,JSON.stringify({sub:user,role,session_id:session,aal})]);
    await db.exec('set role '+role);
    try {return await fn();} finally {await db.exec('reset role'); await q(`select set_config('request.jwt.claim.sub','',false),set_config('request.jwt.claim.role','',false),set_config('request.jwt.claims','{}',false)`);}
  }
  const admin=fn=>as(ADMIN,S1,'aal2',fn), staff=fn=>as(STAFF,S2,'aal2',fn);
  ok((await one('select email_mode,working_weekdays,crm_url from public.crm_settings')).email_mode==='manual','email remains off');
  ok(JSON.stringify((await one('select working_weekdays from public.crm_settings')).working_weekdays)==='[1,2,3,4,5]','database works Monday to Friday');
  ok((await one('select crm_url from public.crm_settings')).crm_url==='https://www.kingsonengineering.co.zw/crm','official CRM URL set');
  ok((await one("select public.add_working_days('2026-10-23',1)::text d")).d==='2026-10-26','Friday + 1 working day = Monday');
  ok((await as(STAFF,S2,'aal1',()=>one('select public.is_staff() b'))).b===false,'password-only token denied');
  ok(Boolean(await err(()=>as(STAFF,S2,'aal1',()=>q('select public.touch_crm_session()')))),'password-only token cannot open CRM session');
  await admin(()=>q('select public.touch_crm_session()'));
  await staff(()=>q('select public.touch_crm_session()'));
  ok((await staff(()=>one('select public.is_staff() b'))).b===true,'MFA staff can use CRM');
  await db.exec("insert into auth.users(id,email,raw_user_meta_data) values('95555555-5555-5555-5555-555555555555','new@example.test','{\"role\":\"admin\",\"full_name\":\"New Person\"}')");
  const newProfile=await one("select role,active from public.profiles where id='95555555-5555-5555-5555-555555555555'");
  ok(newProfile.role==='staff' && !newProfile.active,'new account starts inactive and user metadata cannot grant admin');
  ok((await staff(()=>one('select public.is_admin() b'))).b===false,'staff cannot gain admin privileges');
  ok(Boolean(await err(()=>staff(()=>q("update public.profiles set role='admin' where id=$1",[STAFF])))),'staff cannot promote themselves');
  ok((await as(GONE,S2,'aal2',()=>q('select * from public.contacts'))).length===0,'deactivated or mismatched account sees no contacts');
  ok((await as(STAFF,'93333333-3333-3333-3333-333333333333','aal2',()=>q('select * from public.contacts'))).length===0,'revoked session cannot read customer data');
  await db.exec(`update private.crm_sessions set last_seen_at=now()-interval '31 minutes' where session_id='${S2}'`);
  ok((await staff(()=>one('select public.is_staff() b'))).b===false,'30-minute idle expiry enforced by database');
  ok(Boolean(await err(()=>staff(()=>q('select public.touch_crm_session()')))),'expired idle session cannot revive itself');
  await db.exec(`update private.crm_sessions set last_seen_at=now(),started_at=now()-interval '9 hours' where session_id='${S2}'`);
  ok((await staff(()=>one('select public.is_staff() b'))).b===false,'eight-hour maximum enforced');
  await db.exec(`update private.crm_sessions set started_at=now(),last_seen_at=now() where session_id='${S2}'`);
  await admin(()=>q('update public.profiles set active=false where id=$1',[STAFF]));
  ok((await staff(()=>one('select public.is_staff() b'))).b===false,'staff deactivation immediately blocks existing token');
  await admin(()=>q('update public.profiles set active=true where id=$1',[STAFF]));
  const before=Number((await one('select count(*) n from public.enquiries')).n);
  for(let i=0;i<5;i++) await as(null,null,'aal1',()=>q("select public.submit_enquiry($1::jsonb)",[JSON.stringify({name:'Security Test',contact:'security@example.test',message:'Disposable local test',honeypot:''})]),'anon');
  ok(Boolean(await err(()=>as(null,null,'aal1',()=>q("select public.submit_enquiry($1::jsonb)",[JSON.stringify({name:'Security Test',contact:'security@example.test'})]),'anon'))),'sixth contact submission is rate limited');
  ok(Boolean(await err(()=>as(null,null,'aal1',()=>q("insert into public.enquiries(name,contact) values('Security Test','security@example.test')"),'anon'))),'direct anonymous insert cannot bypass rate limit');
  ok(Number((await one('select count(*) n from public.enquiries')).n)===before+5,'rejected submissions create no enquiry');
  ok(Boolean(await err(()=>as(null,null,'aal1',()=>q('select * from private.crm_audit'),'anon'))),'anonymous user cannot read security audit');
  ok(Boolean(await err(()=>staff(()=>q('select * from private.crm_audit')))),'staff cannot read security audit');
  ok(Boolean(await err(()=>staff(()=>q('select public.crm_security_health()')))),'staff cannot read administrator health report');
  ok((await admin(()=>one('select public.crm_security_health() h'))).h.mfa_enforced===true,'admin health report states actual MFA enforcement');
  ok(Number((await one('select count(*) n from private.crm_audit')).n)>0,'sensitive changes leave metadata-only audit trail');

  // Complete intake → quotation → follow-up → won → project with valid MFA.
  const [created]=await staff(()=>q("select * from public.create_enquiry(p_full_name=>'Lifecycle Test',p_phone=>'0771112345',p_description=>'Local QA')"));
  const quote=(await staff(()=>one("select (public.record_quote(p_opportunity_id=>$1,p_amount=>1234)).id id",[created.opportunity_id]))).id;
  await staff(()=>q('select public.mark_quote_sent(p_quote_id=>$1)',[quote]));
  await staff(()=>q("select public.log_follow_up(p_opportunity_id=>$1,p_channel=>'phone',p_notes=>'Local QA')",[created.opportunity_id]));
  await staff(()=>q("select public.decide_opportunity(p_opportunity_id=>$1,p_outcome=>'won')",[created.opportunity_id]));
  const project=(await staff(()=>one('select public.convert_to_project(p_opportunity_id=>$1) id',[created.opportunity_id]))).id;
  ok(Boolean(project),'complete enquiry/quote/follow-up/won/project workflow works under MFA');
  const snapshot=await one(`select jsonb_build_object('contacts',(select jsonb_agg(to_jsonb(c)) from public.contacts c),'opportunities',(select jsonb_agg(to_jsonb(o)) from public.opportunities o)) data`);
  const restored=await q("select * from jsonb_populate_recordset(null::public.opportunities,$1::jsonb)",[JSON.stringify(snapshot.data.opportunities)]);
  ok(restored.length===snapshot.data.opportunities.length,'local data export round-trip preserves enquiry rows (not a production restore)');
  await db.exec(migration);
  ok((await one('select require_mfa from private.crm_security_config')).require_mfa===true,'rerunning migration preserves MFA enforcement');
  const maintenance=read('../migrations/20261025085526_crm_security_maintenance.sql').split('-- cron wiring')[0];
  await db.exec(maintenance);
  await db.exec('select private.run_crm_security_maintenance()');
  ok((await one('select count(*) n from private.crm_health_checks')).n===1,'maintenance records aggregate health without sending email');
  ok(Boolean(await err(()=>staff(()=>q('select * from private.crm_health_checks')))),'staff cannot read private maintenance telemetry');
  await db.exec(read('../migrations/20261025093716_crm_file_quarantine.sql'));
  await db.exec(read('../migrations/20261025095024_bind_scan_to_object_version.sql'));
  await db.exec('alter table storage.objects enable row level security; grant select on storage.objects to authenticated');
  const file=(await staff(()=>one("insert into public.files(path,name,opportunity_id,uploaded_by) values('opportunity/fixture/random-drawing.pdf','drawing.pdf',$1,$2) returning id",[created.opportunity_id,STAFF]))).id;
  await db.exec("insert into storage.objects(bucket_id,name) values('kingson-files','opportunity/fixture/random-drawing.pdf')");
  ok((await staff(()=>q('select * from storage.objects'))).length===0,'pending bytes cannot be read or signed by staff');
  ok(Boolean(await err(()=>staff(()=>q("update public.files set scan_status='clean' where id=$1",[file])))),'browser cannot approve its own scan');
  await q("update public.files set scan_status='clean',scan_sha256=repeat('a',64),scanned_at=now(),scan_engine='local test',scan_storage_updated_at=(select updated_at from storage.objects limit 1) where id=$1",[file]);
  ok((await staff(()=>q('select * from storage.objects'))).length===1,'worker-approved bytes can be read with correct path matching');
  await db.exec("update storage.objects set updated_at=now()+interval '1 second'");
  ok((await staff(()=>q('select * from storage.objects'))).length===0,'a privileged overwrite invalidates the previous scan approval');
  await q("update public.files set scan_status='blocked' where id=$1",[file]);
  ok((await staff(()=>q('select * from storage.objects'))).length===0,'blocked bytes remain inaccessible');
  ok(Boolean(await err(()=>staff(()=>q("update public.files set path='elsewhere.pdf' where id=$1",[file])))),'browser cannot swap the bytes behind a scan result');
  await db.exec(read('../migrations/20261025100115_expose_crm_continuity_health.sql'));
  ok(Boolean(await err(()=>staff(()=>q('select public.crm_security_health()')))),'staff cannot read administrator security telemetry');
  const health=(await admin(()=>one('select public.crm_security_health() health'))).health;
  ok(health.files_blocked===1 && health.latest_backup===null,'administrator sees true scan and backup status');
}
