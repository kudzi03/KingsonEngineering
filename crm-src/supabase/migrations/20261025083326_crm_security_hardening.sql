-- Roll out client + RPCs before enabling require_mfa in private.crm_security_config.
-- Email remains in manual mode; no sender, notification worker or DNS changes.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated, service_role;

create table if not exists private.crm_security_config (
  id boolean primary key default true check (id),
  require_mfa boolean not null default false
);
insert into private.crm_security_config(id) values(true) on conflict do nothing;
create table if not exists private.crm_sessions (
  session_id uuid primary key, user_id uuid not null,
  started_at timestamptz not null, last_seen_at timestamptz not null default now()
);
create table if not exists private.enquiry_limits (
  key text primary key, bucket timestamptz not null, attempts integer not null
);
create table if not exists private.crm_audit (
  id bigint generated always as identity primary key,
  happened_at timestamptz not null default now(), actor_id uuid,
  action text not null, entity text not null, record_id text
);
revoke all on all tables in schema private from public, anon, authenticated;
revoke all on all sequences in schema private from public, anon, authenticated;
grant all on all tables in schema private to service_role;
grant all on all sequences in schema private to service_role;
alter table private.crm_security_config enable row level security;
alter table private.crm_sessions enable row level security;
alter table private.enquiry_limits enable row level security;
alter table private.crm_audit enable row level security;

update public.crm_settings set working_weekdays='{1,2,3,4,5}',
  crm_url='https://www.kingsonengineering.co.zw/crm', updated_at=now() where id;
alter table public.crm_settings alter column working_weekdays set default '{1,2,3,4,5}';
alter function public.norm_phone(text) set search_path = pg_catalog, public;
alter function public.norm_email(text) set search_path = pg_catalog, public;
-- Even if signup is accidentally enabled later, new accounts never become staff automatically.
alter table public.profiles alter column active set default false;
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path='' as $$
declare nm text := coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),split_part(new.email,'@',1));
begin
  insert into public.profiles(id,full_name,initials,active,role)
  values(new.id,nm,upper(left(regexp_replace(nm,'[^a-zA-Z ]','','g'),1)||
    coalesce(left(split_part(regexp_replace(nm,'[^a-zA-Z ]','','g'),' ',2),1),'')),false,'staff')
  on conflict(id) do nothing;
  return new;
end $$;
revoke all on function public.handle_new_user() from public,anon,authenticated;

create or replace function private.crm_session_valid()
returns boolean language sql stable security definer set search_path='' as $$
  select exists (
    select 1 from auth.sessions s
    where s.id = nullif(auth.jwt()->>'session_id','')::uuid
      and s.user_id=auth.uid()
      and (s.not_after is null or s.not_after > now())
      and (
        not (select require_mfa from private.crm_security_config where id)
        or (
          auth.jwt()->>'aal'='aal2'
          and exists(select 1 from auth.mfa_factors f where f.user_id=s.user_id and f.status='verified')
          and exists(select 1 from private.crm_sessions c where c.session_id=s.id
            and c.user_id=s.user_id and c.started_at > now()-interval '8 hours'
            and c.last_seen_at > now()-interval '30 minutes')
        )
      )
  );
$$;
revoke all on function private.crm_session_valid() from public, anon;
grant execute on function private.crm_session_valid() to authenticated, service_role;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path='' as $$
  select private.crm_session_valid() and exists (
    select 1 from public.profiles where id=auth.uid() and active);
$$;
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path='' as $$
  select private.crm_session_valid() and exists (
    select 1 from public.profiles where id=auth.uid() and active and role='admin');
$$;

create or replace function public.touch_crm_session()
returns void language plpgsql security definer set search_path='' as $$
declare sid uuid := nullif(auth.jwt()->>'session_id','')::uuid; created timestamptz;
begin
  if auth.jwt()->>'aal' is distinct from 'aal2'
    or not exists(select 1 from auth.mfa_factors where user_id=auth.uid() and status='verified')
    or not exists(select 1 from public.profiles where id=auth.uid() and active) then
    raise exception 'Two-step sign-in and an active staff account are required' using errcode='42501';
  end if;
  select created_at into created from auth.sessions where id=sid and user_id=auth.uid()
    and (not_after is null or not_after>now());
  if created is null or created <= now()-interval '8 hours' then
    raise exception 'Sign in again: session ended' using errcode='42501';
  end if;
  insert into private.crm_sessions(session_id,user_id,started_at,last_seen_at)
    select sid,auth.uid(),created,now() where created>now()-interval '30 minutes'
    on conflict(session_id) do update set last_seen_at=excluded.last_seen_at
      where private.crm_sessions.last_seen_at>now()-interval '30 minutes'
        and private.crm_sessions.started_at>now()-interval '8 hours';
  if not found then
    -- For an established active session the original sign-in can be older than 30 minutes.
    update private.crm_sessions set last_seen_at=now() where session_id=sid
      and user_id=auth.uid() and last_seen_at>now()-interval '30 minutes'
      and started_at>now()-interval '8 hours';
    if not found then raise exception 'Sign in again: session ended' using errcode='42501'; end if;
  end if;
end $$;
revoke all on function public.touch_crm_session() from public, anon;
grant execute on function public.touch_crm_session() to authenticated;

-- Self-service policies must not bypass staff, MFA or revoked-session checks.
drop policy if exists profiles_read_self on public.profiles;
create policy profiles_read_self on public.profiles for select to authenticated
  using(id=auth.uid() and public.is_staff());
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
  using(id=auth.uid() and public.is_staff()) with check(id=auth.uid() and public.is_staff());

-- An anonymous insert cannot bypass submission limits by skipping the RPC.
create or replace function private.limit_enquiry()
returns trigger language plpgsql security definer set search_path='' as $$
declare k text; n integer; b timestamptz := date_trunc('hour',now());
begin
  if auth.jwt()->>'role'='service_role' or auth.uid() is not null then return new; end if;
  if coalesce(new.honeypot,'')<>'' then
    raise exception 'Submission rejected' using errcode='23514';
  end if;
  -- No IP address or raw contact details retained in the limiter.
  -- Serialize the global bucket first to prevent concurrent bursts bypassing it.
  foreach k in array array['global', 'contact:'||md5(lower(trim(coalesce(new.contact,''))))] loop
    insert into private.enquiry_limits(key,bucket,attempts) values(k,b,1)
      on conflict(key) do update set
        attempts=case when private.enquiry_limits.bucket=b then private.enquiry_limits.attempts+1 else 1 end,
        bucket=b
      returning attempts into n;
    if n > (case when k='global' then 120 else 5 end) then
      raise sqlstate 'PGRST' using message='{"code":"RATE_LIMITED","message":"Too many enquiries. Please contact Kingson by phone, email or WhatsApp.","details":null,"hint":null}',
        detail='{"status":429,"headers":{"Retry-After":"3600"}}';
    end if;
  end loop;
  return new;
end $$;
revoke all on function private.limit_enquiry() from public, anon, authenticated;
drop trigger if exists a_enquiry_rate_limit on public.enquiries;
create trigger a_enquiry_rate_limit before insert on public.enquiries for each row execute function private.limit_enquiry();

-- All privileged business RPCs already check is_staff; keep only intentional grants.
alter function public.enum_values(text) security invoker;
alter function public.add_working_days(date,integer) security invoker;
revoke create on schema public from public, anon, authenticated;
alter policy "staff update files" on storage.objects
  using(bucket_id='kingson-files' and public.is_staff())
  with check(bucket_id='kingson-files' and public.is_staff());

create or replace function private.crm_legacy_upload_allowed()
returns boolean language sql stable security definer set search_path='' as $$
  select not require_mfa from private.crm_security_config where id;
$$;
revoke all on function private.crm_legacy_upload_allowed() from public,anon;
grant execute on function private.crm_legacy_upload_allowed() to authenticated;
-- Once the coordinated release is enabled, bytes must pass the server upload validator.
alter policy "staff upload files" on storage.objects
  with check(bucket_id='kingson-files' and public.is_staff() and private.crm_legacy_upload_allowed());
alter policy "staff update files" on storage.objects
  using(bucket_id='kingson-files' and public.is_staff() and private.crm_legacy_upload_allowed())
  with check(bucket_id='kingson-files' and public.is_staff() and private.crm_legacy_upload_allowed());

-- A metadata-only audit trail: never duplicate customer messages or documents.
create or replace function private.audit_crm_change()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into private.crm_audit(actor_id,action,entity,record_id)
    values(auth.uid(),tg_op,tg_table_name,
      case when tg_op='DELETE' then old.id::text else new.id::text end);
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
revoke all on function private.audit_crm_change() from public,anon,authenticated;
do $$
declare t text;
begin
  foreach t in array array['profiles','crm_settings','opportunities','quotes','projects','files'] loop
    execute format('drop trigger if exists security_audit on public.%I',t);
    execute format('create trigger security_audit after insert or update or delete on public.%I for each row execute function private.audit_crm_change()',t);
  end loop;
end $$;

create or replace function public.crm_security_health()
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if not public.is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
  return jsonb_build_object(
    'mfa_enforced',(select require_mfa from private.crm_security_config where id),
    'accounts_without_mfa',(select count(*) from public.profiles p where p.active
      and not exists(select 1 from auth.mfa_factors f where f.user_id=p.id and f.status='verified')),
    'failed_notifications',(select count(*) from public.notification_outbox where status='failed'),
    'pending_notifications',(select count(*) from public.notification_outbox where status='pending'),
    'email_mode',(select email_mode from public.crm_settings where id),
    'unconverted_enquiries',(select count(*) from public.enquiries where not coalesce(spam,false)
      and not coalesce(is_demo,false) and opportunity_id is null),
    'working_weekdays',(select working_weekdays from public.crm_settings where id),
    'crm_url',(select crm_url from public.crm_settings where id));
end $$;
revoke all on function public.crm_security_health() from public,anon;
grant execute on function public.crm_security_health() to authenticated;

-- Expire transient security state only. Customer records, audit history and file bytes are retained.
create or replace function private.crm_security_housekeeping()
returns void language sql security definer set search_path='' as $$
  delete from private.enquiry_limits where bucket<now()-interval '2 days';
  delete from private.crm_sessions where started_at<now()-interval '9 hours';
$$;
revoke all on function private.crm_security_housekeeping() from public,anon,authenticated;
grant execute on function private.crm_security_housekeeping() to service_role;
