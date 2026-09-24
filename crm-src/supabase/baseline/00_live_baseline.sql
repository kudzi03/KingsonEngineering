-- Live schema baseline, generated from live-schema-2026-09-25.csv by tools/build-baseline.py.
set check_function_bodies = off;  -- functions refer to each other in any order
-- Recreates production on an EMPTY project. Never run it against production.

-- extensions
create extension if not exists "pg_stat_statements" with schema extensions;
create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "supabase_vault" with schema vault;
create extension if not exists "uuid-ossp" with schema extensions;

-- enums
create type public.activity_kind as enum ('enquiry', 'note', 'call', 'whatsapp', 'email', 'meeting', 'site_visit', 'quote', 'stage_change', 'task', 'file', 'won', 'lost', 'system', 'reply', 'on_hold');
create type public.app_role as enum ('admin', 'staff');
create type public.enquiry_source as enum ('website', 'whatsapp', 'phone', 'email', 'referral', 'walk_in', 'other');
create type public.opp_priority as enum ('low', 'normal', 'high', 'urgent');
create type public.opp_stage as enum ('new', 'contacted', 'requirements', 'quoting', 'quote_sent', 'followup', 'on_hold', 'won', 'lost');
create type public.project_status as enum ('planning', 'in_progress', 'on_hold', 'complete', 'cancelled');
create type public.quote_status as enum ('draft', 'sent', 'discussed', 'accepted', 'rejected', 'expired', 'superseded');
create type public.task_status as enum ('open', 'done', 'cancelled');
create type public.visit_status as enum ('scheduled', 'completed', 'cancelled');

-- sequences
create sequence public.opportunity_ref_seq start 2400 increment 1;
select setval('public.opportunity_ref_seq', 2454);
create sequence public.quote_ref_seq start 1200 increment 1;
select setval('public.quote_ref_seq', 1216);

-- tables
create table public.activities (
  "id" uuid not null default gen_random_uuid(),
  "opportunity_id" uuid,
  "contact_id" uuid,
  "project_id" uuid,
  "kind" activity_kind not null default 'note'::activity_kind,
  "body" text not null,
  "actor_id" uuid,
  "occurred_at" timestamp with time zone not null default now(),
  "created_at" timestamp with time zone not null default now(),
  "is_demo" boolean not null default false
);
create table public.companies (
  "id" uuid not null default gen_random_uuid(),
  "name" text not null,
  "kind" text,
  "town" text,
  "notes" text,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  "is_demo" boolean not null default false
);
create table public.contacts (
  "id" uuid not null default gen_random_uuid(),
  "company_id" uuid,
  "full_name" text not null,
  "email" text,
  "phone" text,
  "whatsapp" text,
  "job_title" text,
  "preferred_channel" text,
  "notes" text,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  "is_demo" boolean not null default false
);
create table public.crm_settings (
  "id" boolean not null default true,
  "quote_followup_working_days" integer not null default 3,
  "working_weekdays" smallint[] not null default '{1,2,3,4,5,6}'::smallint[],
  "email_mode" text not null default 'manual'::text,
  "test_mailbox" text,
  "updated_at" timestamp with time zone not null default now(),
  "updated_by" uuid
);
create table public.enquiries (
  "id" uuid not null default gen_random_uuid(),
  "name" text not null,
  "company" text,
  "contact" text not null,
  "email" text,
  "phone" text,
  "service" text,
  "location" text,
  "drawings" text,
  "message" text,
  "source" enquiry_source not null default 'website'::enquiry_source,
  "page" text,
  "honeypot" text,
  "spam" boolean not null default false,
  "processed_at" timestamp with time zone,
  "opportunity_id" uuid,
  "contact_id" uuid,
  "user_agent" text,
  "created_at" timestamp with time zone not null default now(),
  "is_demo" boolean not null default false
);
create table public.files (
  "id" uuid not null default gen_random_uuid(),
  "bucket" text not null default 'kingson-files'::text,
  "path" text not null,
  "name" text not null,
  "mime" text,
  "size_bytes" bigint,
  "opportunity_id" uuid,
  "project_id" uuid,
  "contact_id" uuid,
  "quote_id" uuid,
  "uploaded_by" uuid,
  "created_at" timestamp with time zone not null default now(),
  "is_demo" boolean not null default false
);
create table public.opportunities (
  "id" uuid not null default gen_random_uuid(),
  "ref" text not null default ('ENQ-'::text || lpad((nextval('opportunity_ref_seq'::regclass))::text, 4, '0'::text)),
  "title" text not null,
  "company_id" uuid,
  "contact_id" uuid,
  "owner_id" uuid,
  "stage" opp_stage not null default 'new'::opp_stage,
  "priority" opp_priority not null default 'normal'::opp_priority,
  "source" enquiry_source not null default 'website'::enquiry_source,
  "service" text,
  "description" text,
  "estimated_value" numeric(14,2),
  "currency" text not null default 'USD'::text,
  "location" text,
  "site_visit_required" boolean not null default false,
  "next_action" text,
  "next_action_due" date,
  "last_activity_at" timestamp with time zone not null default now(),
  "decided_at" timestamp with time zone,
  "lost_reason" text,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  "is_demo" boolean not null default false,
  "won_value" numeric,
  "lost_reason_code" text,
  "hold_reason" text,
  "hold_review_on" date,
  "customer_replied_at" timestamp with time zone
);
create table public.profiles (
  "id" uuid not null,
  "full_name" text not null default ''::text,
  "initials" text not null default ''::text,
  "role" app_role not null default 'staff'::app_role,
  "phone" text,
  "active" boolean not null default true,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);
create table public.projects (
  "id" uuid not null default gen_random_uuid(),
  "opportunity_id" uuid,
  "company_id" uuid,
  "contact_id" uuid,
  "name" text not null,
  "description" text,
  "status" project_status not null default 'planning'::project_status,
  "value" numeric(14,2),
  "currency" text not null default 'USD'::text,
  "start_date" date,
  "target_date" date,
  "completed_on" date,
  "owner_id" uuid,
  "notes" text,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  "is_demo" boolean not null default false
);
create table public.quotes (
  "id" uuid not null default gen_random_uuid(),
  "opportunity_id" uuid not null,
  "reference" text not null default ('Q-'::text || lpad((nextval('quote_ref_seq'::regclass))::text, 4, '0'::text)),
  "version" integer not null default 1,
  "amount" numeric(14,2) not null,
  "currency" text not null default 'USD'::text,
  "prepared_on" date not null default CURRENT_DATE,
  "sent_on" date,
  "valid_until" date,
  "follow_up_on" date,
  "status" quote_status not null default 'draft'::quote_status,
  "notes" text,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  "file_id" uuid,
  "is_demo" boolean not null default false,
  "sent_at" timestamp with time zone,
  "sent_by" uuid,
  "document_ref" text
);
create table public.site_visits (
  "id" uuid not null default gen_random_uuid(),
  "opportunity_id" uuid not null,
  "scheduled_at" timestamp with time zone not null,
  "owner_id" uuid,
  "location" text,
  "purpose" text,
  "notes" text,
  "outcome" text,
  "status" visit_status not null default 'scheduled'::visit_status,
  "next_action" text,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  "is_demo" boolean not null default false
);
create table public.tasks (
  "id" uuid not null default gen_random_uuid(),
  "title" text not null,
  "opportunity_id" uuid,
  "contact_id" uuid,
  "project_id" uuid,
  "owner_id" uuid,
  "priority" opp_priority not null default 'normal'::opp_priority,
  "due_date" date,
  "status" task_status not null default 'open'::task_status,
  "channel" text,
  "notes" text,
  "completed_at" timestamp with time zone,
  "completed_by" uuid,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  "is_demo" boolean not null default false
);

-- functions
CREATE OR REPLACE FUNCTION public.add_working_days(d date, n integer)
 RETURNS date
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  days smallint[];
  r date := d;
  remaining integer := greatest(coalesce(n, 0), 0);
begin
  select working_weekdays into days from public.crm_settings where id;
  if days is null or cardinality(days) = 0 then days := '{1,2,3,4,5}'; end if;
  while remaining > 0 loop
    r := r + 1;
    if extract(isodow from r)::smallint = any (days) then
      remaining := remaining - 1;
    end if;
  end loop;
  return r;
end $function$;

CREATE OR REPLACE FUNCTION public.convert_enquiry()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_email      text;
  v_phone      text;
  v_company_id uuid;
  v_contact_id uuid;
  v_opp_id     uuid;
  v_title      text;
  v_due        date;
  v_digits     text;
begin
  -- A bot filled the hidden field. Keep the row so the volume is visible, but
  -- do not let it reach the pipeline.
  if coalesce(trim(new.honeypot), '') <> '' then
    new.spam := true;
    new.processed_at := now();
    return new;
  end if;

  -- "Phone or email" is one field on the form because asking for both loses
  -- enquiries. Split it here.
  if new.contact ~* '^[^@[:space:]]+@[^@[:space:]]+\.[a-z]{2,}$' then
    v_email := lower(trim(new.contact));
  else
    v_digits := regexp_replace(new.contact, '[^0-9+]', '', 'g');
    if char_length(regexp_replace(v_digits, '[^0-9]', '', 'g')) >= 7 then
      v_phone := v_digits;
    end if;
  end if;

  -- Neither parsed cleanly: still convert, still reachable via the raw string,
  -- because a malformed contact is a reason to phone somebody, not to bin it.
  if v_email is null and v_phone is null then
    v_phone := left(new.contact, 60);
  end if;

  new.email := v_email;
  new.phone := v_phone;

  -- ── company ──
  if coalesce(trim(new.company), '') <> '' then
    select id into v_company_id from public.companies
      where lower(name) = lower(trim(new.company)) limit 1;
    if v_company_id is null then
      insert into public.companies (name) values (trim(new.company))
      returning id into v_company_id;
    end if;
  end if;

  -- ── contact: match on email first, then on phone ──
  if v_email is not null then
    select id into v_contact_id from public.contacts where lower(email) = v_email limit 1;
  end if;
  if v_contact_id is null and v_phone is not null then
    select id into v_contact_id from public.contacts
      where regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g')
          = regexp_replace(v_phone, '[^0-9]', '', 'g')
        and regexp_replace(v_phone, '[^0-9]', '', 'g') <> ''
      limit 1;
  end if;

  if v_contact_id is null then
    insert into public.contacts (company_id, full_name, email, phone, whatsapp, preferred_channel)
    values (v_company_id, trim(new.name), v_email, v_phone, v_phone,
            case when v_email is not null then 'Email' else 'Phone' end)
    returning id into v_contact_id;
  else
    -- Known caller. Fill the gaps we did not have before; never overwrite.
    update public.contacts set
      company_id = coalesce(company_id, v_company_id),
      email      = coalesce(nullif(email, ''), v_email),
      phone      = coalesce(nullif(phone, ''), v_phone),
      whatsapp   = coalesce(nullif(whatsapp, ''), v_phone)
    where id = v_contact_id;
  end if;

  -- ── opportunity ──
  v_title := coalesce(nullif(trim(new.service), ''), 'Website enquiry');
  if coalesce(trim(new.location), '') <> '' then
    v_title := v_title || ' — ' || trim(new.location);
  end if;

  -- Next working day. An enquiry that arrives on Saturday is due Monday.
  v_due := (now() at time zone 'Africa/Harare')::date + 1;
  if extract(isodow from v_due) = 7 then v_due := v_due + 1; end if;

  insert into public.opportunities (
    title, company_id, contact_id, stage, priority, source, service,
    description, location, site_visit_required, next_action, next_action_due)
  values (
    v_title, v_company_id, v_contact_id, 'new', 'normal', new.source,
    nullif(trim(new.service), ''),
    nullif(trim(new.message), ''),
    nullif(trim(new.location), ''),
    -- Anyone who says they have no drawings will need somebody to go and look.
    coalesce(new.drawings, '') !~* '^yes',
    'Respond to the website enquiry',
    v_due)
  returning id into v_opp_id;

  -- ── timeline ──
  insert into public.activities (opportunity_id, contact_id, kind, body, occurred_at)
  values (v_opp_id, v_contact_id, 'enquiry',
    'Website enquiry received.'
      || case when coalesce(trim(new.service), '')  <> '' then ' Needs: '    || trim(new.service)  else '' end
      || case when coalesce(trim(new.location), '') <> '' then ' Site: '     || trim(new.location) else '' end
      || case when coalesce(trim(new.drawings), '') <> '' then ' Drawings: ' || trim(new.drawings) else '' end
      || case when coalesce(trim(new.message), '')  <> '' then ' — '         || trim(new.message)  else '' end,
    new.created_at);

  -- ── the first follow-up, so it is on somebody's list from minute one ──
  insert into public.tasks (title, opportunity_id, contact_id, due_date, priority, channel, notes)
  values ('Respond to website enquiry from ' || trim(new.name),
          v_opp_id, v_contact_id, v_due, 'high',
          case when v_email is not null then 'Email' else 'Phone' end,
          'Auto-created when the enquiry arrived. Acknowledge the same working day.');

  new.contact_id     := v_contact_id;
  new.opportunity_id := v_opp_id;
  new.processed_at   := now();
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.convert_to_project(p_opportunity_id uuid, p_name text DEFAULT NULL::text, p_start_date date DEFAULT NULL::date, p_target_date date DEFAULT NULL::date)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare o public.opportunities%rowtype; v_id uuid;
begin
  if not public.is_staff() then raise exception 'not authorised'; end if;
  select * into o from public.opportunities where id = p_opportunity_id;
  if not found then raise exception 'no such opportunity'; end if;

  select id into v_id from public.projects where opportunity_id = p_opportunity_id limit 1;
  if v_id is not null then return v_id; end if;

  insert into public.projects (opportunity_id, company_id, contact_id, name, description,
                               status, value, currency, start_date, target_date, owner_id, is_demo)
  values (o.id, o.company_id, o.contact_id,
          coalesce(nullif(trim(p_name), ''), o.title), o.description,
          'planning', o.won_value, o.currency, p_start_date, p_target_date, o.owner_id, o.is_demo)
  returning id into v_id;

  insert into public.activities (opportunity_id, project_id, contact_id, kind, body, actor_id)
  values (o.id, v_id, o.contact_id, 'system',
          'Project opened from won opportunity ' || o.ref, auth.uid());
  return v_id;
end $function$;

CREATE OR REPLACE FUNCTION public.dashboard_metrics(p_include_demo boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with today as (select public.harare_today() d),
  o as (
    select * from public.opportunities
     where p_include_demo or not is_demo
  ),
  lq as (
    select distinct on (q.opportunity_id) q.*
      from public.quotes q join o on o.id = q.opportunity_id
     where q.status <> 'rejected'
     order by q.opportunity_id, q.version desc, q.created_at desc
  ),
  j as (
    select o.*, lq.amount q_amount, lq.currency q_currency, lq.status q_status
      from o left join lq on lq.opportunity_id = o.id
  ),
  money as (
    select 'pipeline' k, q_currency cur, sum(q_amount) v from j
     where stage not in ('won', 'lost', 'on_hold') and q_status in ('sent', 'discussed')
     group by q_currency
    union all
    select 'overdue', q_currency, sum(q_amount) from j, today
     where stage not in ('won', 'lost', 'on_hold') and q_status in ('sent', 'discussed')
       and next_action_due < today.d
     group by q_currency
    union all
    select 'won', currency, sum(won_value) from j
     where stage = 'won' and won_value is not null group by currency
    union all
    select 'won_month', currency, sum(won_value) from j, today
     where stage = 'won' and won_value is not null
       and date_trunc('month', (decided_at at time zone 'Africa/Harare')) = date_trunc('month', today.d::timestamp)
     group by currency
  )
  select jsonb_build_object(
    'include_demo', p_include_demo,
    'as_of', (select d from today),
    'open_count', (select count(*) from j where stage not in ('won', 'lost', 'on_hold')),
    'unquoted_count', (select count(*) from j where stage not in ('won', 'lost', 'on_hold')
                                               and q_amount is null),
    'awaiting_decision_count', (select count(*) from j where stage in ('quote_sent', 'followup')),
    'quoted_pipeline_count', (select count(*) from j where stage not in ('won', 'lost', 'on_hold')
                                                     and q_status in ('sent', 'discussed')),
    'follow_ups_due_count', (select count(*) from j, today where stage not in ('won', 'lost')
                                                          and next_action_due <= today.d),
    'overdue_count', (select count(*) from j, today where stage not in ('won', 'lost')
                                                   and next_action_due < today.d),
    'overdue_quoted_count', (select count(*) from j, today where stage not in ('won', 'lost', 'on_hold')
                                                          and q_status in ('sent', 'discussed')
                                                          and next_action_due < today.d),
    'on_hold_count', (select count(*) from j where stage = 'on_hold'),
    'won_count', (select count(*) from j where stage = 'won'),
    'lost_count', (select count(*) from j where stage = 'lost'),
    'quoted_pipeline', coalesce((select jsonb_object_agg(cur, v) from money where k = 'pipeline'), '{}'),
    'overdue_quoted_value', coalesce((select jsonb_object_agg(cur, v) from money where k = 'overdue'), '{}'),
    'won_value', coalesce((select jsonb_object_agg(cur, v) from money where k = 'won'), '{}'),
    'won_value_this_month', coalesce((select jsonb_object_agg(cur, v) from money where k = 'won_month'), '{}')
  );
$function$;

CREATE OR REPLACE FUNCTION public.decide_opportunity(p_opportunity_id uuid, p_outcome text, p_on date DEFAULT NULL::date, p_value numeric DEFAULT NULL::numeric, p_reason text DEFAULT NULL::text, p_notes text DEFAULT NULL::text, p_review_on date DEFAULT NULL::date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  o public.opportunities%rowtype;
  lq public.quotes%rowtype;
  v_value numeric;
  v_label text;
  v_at timestamptz;
begin
  if not public.is_staff() then raise exception 'not authorised'; end if;
  select * into o from public.opportunities where id = p_opportunity_id for update;
  if not found then raise exception 'No such opportunity'; end if;

  if o.stage::text = p_outcome then
    raise exception 'This opportunity is already %', public.stage_label(o.stage);
  end if;

  select * into lq from public.quotes
   where opportunity_id = o.id and status in ('sent', 'discussed', 'accepted', 'draft')
   order by (status in ('sent', 'discussed', 'accepted')) desc, version desc
   limit 1;

  v_at := case when p_on is null then now()
               else (p_on + time '12:00') at time zone 'Africa/Harare' end;
  perform set_config('kingson.decision_notes', coalesce(p_notes, ''), true);

  if p_outcome = 'won' then
    v_value := coalesce(p_value, lq.amount);
    if v_value is null then raise exception 'Enter the accepted value'; end if;
    if v_value < 0 then raise exception 'The accepted value cannot be negative'; end if;
    update public.opportunities
       set stage = 'won', won_value = v_value, decided_at = v_at,
           currency = coalesce(lq.currency, currency)
     where id = o.id;
    if lq.id is not null and lq.status in ('sent', 'discussed') then
      update public.quotes set status = 'accepted' where id = lq.id;
    end if;
    update public.tasks set status = 'cancelled',
           notes = coalesce(notes || E'\n', '') || 'Cancelled: opportunity won.'
     where opportunity_id = o.id and status = 'open'
       and (title ilike 'follow up%' or title ilike 'chase%' or title ilike 'respond to website enquiry%');

  elsif p_outcome = 'lost' then
    v_label := case p_reason
      when 'price' then 'Price'
      when 'competitor' then 'Went with a competitor'
      when 'timing' then 'Timing'
      when 'project_cancelled' then 'Project cancelled'
      when 'scope_changed' then 'Scope changed'
      when 'no_response' then 'No response'
      when 'other' then 'Other'
    end;
    if v_label is null then raise exception 'Choose why it was lost'; end if;
    if p_reason = 'other' and coalesce(trim(p_notes), '') = '' then
      raise exception 'Say why it was lost';
    end if;
    update public.opportunities
       set stage = 'lost', lost_reason = v_label, lost_reason_code = p_reason, decided_at = v_at
     where id = o.id;
    if lq.id is not null and lq.status in ('sent', 'discussed') then
      update public.quotes set status = 'rejected' where id = lq.id;
    end if;
    update public.tasks set status = 'cancelled',
           notes = coalesce(notes || E'\n', '') || 'Cancelled: opportunity lost.'
     where opportunity_id = o.id and status = 'open';

  elsif p_outcome = 'on_hold' then
    if coalesce(trim(p_reason), '') = '' then raise exception 'Give a reason for the hold'; end if;
    if p_review_on is null then raise exception 'Choose a review date'; end if;
    update public.opportunities
       set stage = 'on_hold', hold_reason = trim(p_reason), hold_review_on = p_review_on
     where id = o.id;
  else
    raise exception 'Unknown outcome %', p_outcome;
  end if;

  perform set_config('kingson.decision_notes', '', true);
end $function$;

CREATE OR REPLACE FUNCTION public.enum_values(enum_name text)
 RETURNS TABLE(value text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
begin
  return query
    select e.enumlabel::text
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = enum_name and n.nspname = 'public'
    order by e.enumsortorder;
end $function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  nm text := coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
                      split_part(new.email, '@', 1));
begin
  insert into public.profiles (id, full_name, initials)
  values (
    new.id,
    nm,
    upper(left(regexp_replace(nm, '[^a-zA-Z ]', '', 'g'), 1) ||
          coalesce(left(split_part(regexp_replace(nm, '[^a-zA-Z ]', '', 'g'), ' ', 2), 1), ''))
  )
  on conflict (id) do nothing;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.harare_today()
 RETURNS date
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select (now() at time zone 'Africa/Harare')::date;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active and role = 'admin');
$function$;

CREATE OR REPLACE FUNCTION public.is_staff()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active);
$function$;

CREATE OR REPLACE FUNCTION public.log_follow_up(p_opportunity_id uuid, p_channel text, p_notes text, p_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_next_action text DEFAULT NULL::text, p_next_due date DEFAULT NULL::date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  o public.opportunities%rowtype;
  v_kind activity_kind;
  v_label text;
  v_days integer;
  v_ref text;
begin
  if not public.is_staff() then raise exception 'not authorised'; end if;
  select * into o from public.opportunities where id = p_opportunity_id for update;
  if not found then raise exception 'No such opportunity'; end if;
  if coalesce(trim(p_notes), '') = '' then raise exception 'Say what happened'; end if;

  select case lower(p_channel)
           when 'email' then 'email' when 'whatsapp' then 'whatsapp'
           when 'phone' then 'call' when 'meeting' then 'meeting' else 'note' end::activity_kind,
         case lower(p_channel)
           when 'email' then 'Email' when 'whatsapp' then 'WhatsApp'
           when 'phone' then 'Phone call' when 'meeting' then 'Meeting' else 'Other' end
    into v_kind, v_label;

  insert into public.activities (opportunity_id, contact_id, kind, body, actor_id, occurred_at)
  values (o.id, o.contact_id, v_kind, 'Follow-up (' || v_label || '): ' || trim(p_notes),
          auth.uid(), coalesce(p_at, now()));

  if o.stage in ('won', 'lost') then return; end if;

  select reference into v_ref from public.quotes
   where opportunity_id = o.id and status in ('sent', 'discussed')
   order by version desc limit 1;

  if p_next_due is null then
    select quote_followup_working_days into v_days from public.crm_settings where id;
    p_next_due := public.add_working_days(public.harare_today(), coalesce(v_days, 3));
  end if;

  update public.opportunities
     set stage = case when stage = 'quote_sent' then 'followup'::opp_stage else stage end,
         next_action = coalesce(nullif(trim(p_next_action), ''),
                                case when v_ref is not null then 'Follow up quotation ' || v_ref
                                     else 'Follow up' end),
         next_action_due = p_next_due
   where id = o.id;
end $function$;

CREATE OR REPLACE FUNCTION public.log_quote_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_sent boolean := false;
  v_money text := new.currency || ' ' || to_char(new.amount, 'FM999,999,999,990.00');
  v_channel text := nullif(current_setting('kingson.send_channel', true), '');
  v_notes text := nullif(trim(coalesce(current_setting('kingson.send_notes', true), '')), '');
begin
  if tg_op = 'INSERT' then
    insert into public.activities (opportunity_id, kind, body, actor_id)
    values (new.opportunity_id, 'quote',
            'Quotation ' || new.reference || ' recorded — ' || v_money
              || case when new.version > 1 then ' (revision ' || new.version || ')' else '' end,
            auth.uid());
    v_sent := (new.status = 'sent');
  elsif new.status is distinct from old.status then
    if new.status = 'sent' then
      v_sent := true;
    else
      insert into public.activities (opportunity_id, kind, body, actor_id)
      values (new.opportunity_id, 'quote',
              'Quotation ' || new.reference || ' — ' || case new.status
                when 'discussed'  then 'customer responded'
                when 'accepted'   then 'accepted'
                when 'rejected'   then 'not accepted'
                when 'expired'    then 'expired'
                when 'superseded' then 'superseded by a later revision'
                else new.status::text end,
              auth.uid());
    end if;
  elsif new.amount is distinct from old.amount then
    insert into public.activities (opportunity_id, kind, body, actor_id)
    values (new.opportunity_id, 'quote',
            'Quotation ' || new.reference || ' amount corrected to ' || v_money, auth.uid());
  else
    return new;
  end if;

  if v_sent then
    insert into public.activities (opportunity_id, kind, body, actor_id, occurred_at)
    values (new.opportunity_id, 'quote',
            'Quotation ' || new.reference || ' sent'
              || coalesce(' by ' || v_channel, '') || ' — ' || v_money
              || '. Follow-up booked for ' || to_char(new.follow_up_on, 'Dy DD Mon YYYY')
              || coalesce('. ' || v_notes, ''),
            coalesce(new.sent_by, auth.uid()), coalesce(new.sent_at, now()));

    -- A sent revision replaces every earlier one still in play.
    update public.quotes set status = 'superseded'
     where opportunity_id = new.opportunity_id and version < new.version
       and status in ('draft', 'sent', 'discussed');

    update public.opportunities
       set stage = 'quote_sent',
           next_action = 'Follow up quotation ' || new.reference,
           next_action_due = new.follow_up_on,
           customer_replied_at = null,
           last_activity_at = now()
     where id = new.opportunity_id and stage not in ('won', 'lost');
  else
    update public.opportunities set last_activity_at = now() where id = new.opportunity_id;
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.log_stage_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  k activity_kind;
  v_notes text := nullif(trim(coalesce(current_setting('kingson.decision_notes', true), '')), '');
begin
  if new.stage is distinct from old.stage then
    if new.stage = 'won' and new.won_value is null then
      raise exception 'Record the accepted value before marking this opportunity won'
        using errcode = 'check_violation';
    end if;
    if new.stage = 'on_hold'
       and (coalesce(trim(new.hold_reason), '') = '' or new.hold_review_on is null) then
      raise exception 'Give a reason and a review date before putting this opportunity on hold'
        using errcode = 'check_violation';
    end if;

    k := case new.stage
           when 'won'     then 'won'
           when 'lost'    then 'lost'
           when 'on_hold' then 'on_hold'
           else 'stage_change'
         end::activity_kind;

    insert into public.activities (opportunity_id, contact_id, kind, body, actor_id)
    values (new.id, new.contact_id, k,
            'Stage moved from ' || public.stage_label(old.stage)
              || ' to ' || public.stage_label(new.stage)
              || case new.stage
                   when 'lost' then ' — ' || new.lost_reason
                   when 'won' then ' — accepted ' || new.currency || ' '
                                   || to_char(new.won_value, 'FM999,999,999,990.00')
                   when 'on_hold' then ' — ' || new.hold_reason || ' (review '
                                   || to_char(new.hold_review_on, 'DD Mon YYYY') || ')'
                   else '' end
              || coalesce('. ' || v_notes, ''),
            auth.uid());

    if new.stage in ('won', 'lost') then
      new.decided_at := coalesce(new.decided_at, now());
      new.next_action := null;
      new.next_action_due := null;
      new.hold_reason := null;
      new.hold_review_on := null;
      if new.stage = 'won' then
        new.lost_reason := null;
        new.lost_reason_code := null;
      else
        new.won_value := null;
      end if;
    elsif new.stage = 'on_hold' then
      new.decided_at := null;
      new.won_value := null;
      new.lost_reason := null;
      new.lost_reason_code := null;
      new.next_action := 'Review on-hold opportunity';
      new.next_action_due := new.hold_review_on;
    else
      new.decided_at := null;
      new.won_value := null;
      new.lost_reason := null;
      new.lost_reason_code := null;
      new.hold_reason := null;
      new.hold_review_on := null;
      if old.stage = 'on_hold' and new.next_action is not distinct from old.next_action then
        new.next_action := null;
        new.next_action_due := null;
      end if;
    end if;

    if old.stage = 'new' then
      update public.tasks
         set status = 'done', completed_at = now(), completed_by = auth.uid()
       where opportunity_id = new.id and status = 'open'
         and title like 'Respond to website enquiry%';
    end if;
  end if;
  new.last_activity_at := now();
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.log_task_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.status = 'done' and old.status <> 'done' then
    new.completed_at := coalesce(new.completed_at, now());
    new.completed_by := coalesce(new.completed_by, auth.uid());
    if new.opportunity_id is not null or new.contact_id is not null then
      insert into public.activities (opportunity_id, contact_id, kind, body, actor_id)
      values (new.opportunity_id, new.contact_id, 'task',
              'Completed: ' || new.title
                || case when coalesce(new.channel, '') <> '' then ' (' || new.channel || ')' else '' end,
              auth.uid());
    end if;
  elsif new.status <> 'done' and old.status = 'done' then
    new.completed_at := null;
    new.completed_by := null;
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.log_visit_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if tg_op = 'INSERT' then
    insert into public.activities (opportunity_id, kind, body, actor_id)
    values (new.opportunity_id, 'site_visit',
            'Site visit booked for ' || to_char(new.scheduled_at at time zone 'Africa/Harare', 'DD Mon YYYY, HH24:MI')
              || case when coalesce(new.location, '') <> '' then ' at ' || new.location else '' end,
            auth.uid());
    update public.opportunities set last_activity_at = now() where id = new.opportunity_id;

  elsif new.status = 'completed' and old.status <> 'completed' then
    insert into public.activities (opportunity_id, kind, body, actor_id)
    values (new.opportunity_id, 'site_visit',
            'Site visit completed' || case when coalesce(new.outcome, '') <> ''
                                           then ' — ' || new.outcome else '' end,
            auth.uid());
    update public.opportunities
       set site_visit_required = false, last_activity_at = now()
     where id = new.opportunity_id;
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.mark_customer_replied(p_opportunity_id uuid, p_channel text, p_notes text DEFAULT NULL::text, p_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare o public.opportunities%rowtype; v_label text;
begin
  if not public.is_staff() then raise exception 'not authorised'; end if;
  select * into o from public.opportunities where id = p_opportunity_id for update;
  if not found then raise exception 'No such opportunity'; end if;

  v_label := case lower(coalesce(p_channel, ''))
    when 'email' then 'email' when 'whatsapp' then 'WhatsApp'
    when 'phone' then 'phone' when 'meeting' then 'in a meeting' else 'other means' end;

  insert into public.activities (opportunity_id, contact_id, kind, body, actor_id, occurred_at)
  values (o.id, o.contact_id, 'reply',
          'Customer replied by ' || v_label || coalesce(': ' || nullif(trim(p_notes), ''), ''),
          auth.uid(), coalesce(p_at, now()));

  update public.quotes set status = 'discussed'
   where opportunity_id = o.id and status = 'sent';

  if o.stage in ('won', 'lost') then return; end if;

  update public.opportunities
     set customer_replied_at = coalesce(p_at, now()),
         stage = case when stage = 'quote_sent' then 'followup'::opp_stage else stage end,
         next_action = 'Respond to customer reply',
         next_action_due = public.harare_today()
   where id = o.id;
end $function$;

CREATE OR REPLACE FUNCTION public.mark_quote_sent(p_quote_id uuid, p_sent_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_follow_up_on date DEFAULT NULL::date, p_channel text DEFAULT 'email'::text, p_notes text DEFAULT NULL::text)
 RETURNS quotes
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare q public.quotes%rowtype; v_stage opp_stage;
begin
  if not public.is_staff() then raise exception 'not authorised'; end if;
  select * into q from public.quotes where id = p_quote_id for update;
  if not found then raise exception 'No such quotation'; end if;
  if q.status <> 'draft' then
    raise exception 'Quotation % is already marked %', q.reference, q.status;
  end if;
  select stage into v_stage from public.opportunities where id = q.opportunity_id;
  if v_stage in ('won', 'lost') then
    raise exception 'This opportunity is closed. Reopen it before sending a quotation.';
  end if;
  if coalesce(p_sent_at, now()) > now() + interval '5 minutes' then
    raise exception 'The sent time cannot be in the future';
  end if;

  perform set_config('kingson.send_channel',
    case lower(coalesce(p_channel, ''))
      when 'email' then 'email' when 'whatsapp' then 'WhatsApp'
      when 'hand' then 'hand' when 'meeting' then 'hand at a meeting'
      else nullif(trim(p_channel), '') end, true);
  perform set_config('kingson.send_notes', coalesce(p_notes, ''), true);

  update public.quotes
     set status = 'sent',
         sent_at = coalesce(p_sent_at, now()),
         sent_by = auth.uid(),
         sent_on = (coalesce(p_sent_at, now()) at time zone 'Africa/Harare')::date,
         follow_up_on = p_follow_up_on
   where id = p_quote_id
  returning * into q;

  perform set_config('kingson.send_channel', '', true);
  perform set_config('kingson.send_notes', '', true);
  return q;
end $function$;

CREATE OR REPLACE FUNCTION public.opp_stage_is_open(s opp_stage)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select s not in ('won', 'lost');
$function$;

CREATE OR REPLACE FUNCTION public.quote_before_write()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_days integer;
begin
  if new.status = 'sent' and (tg_op = 'INSERT' or old.status is distinct from 'sent') then
    new.sent_at := coalesce(new.sent_at, now());
    new.sent_by := coalesce(new.sent_by, auth.uid());
    new.sent_on := coalesce(new.sent_on, (new.sent_at at time zone 'Africa/Harare')::date);
    if new.follow_up_on is null then
      select quote_followup_working_days into v_days from public.crm_settings where id;
      new.follow_up_on := public.add_working_days(new.sent_on, coalesce(v_days, 3));
    end if;
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.record_quote(p_opportunity_id uuid, p_amount numeric, p_currency text DEFAULT 'USD'::text, p_prepared_on date DEFAULT NULL::date, p_valid_until date DEFAULT NULL::date, p_notes text DEFAULT NULL::text, p_reference text DEFAULT NULL::text, p_document_ref text DEFAULT NULL::text)
 RETURNS quotes
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  o public.opportunities%rowtype;
  v_version integer;
  q public.quotes%rowtype;
begin
  if not public.is_staff() then raise exception 'not authorised'; end if;
  select * into o from public.opportunities where id = p_opportunity_id for update;
  if not found then raise exception 'No such opportunity'; end if;
  if o.stage in ('won', 'lost') then
    raise exception 'This opportunity is closed. Reopen it before recording a quotation.';
  end if;
  if p_amount is null or p_amount < 0 then
    raise exception 'Enter the quoted amount';
  end if;

  select coalesce(max(version), 0) + 1 into v_version
    from public.quotes where opportunity_id = p_opportunity_id;

  insert into public.quotes (opportunity_id, reference, version, amount, currency,
                             prepared_on, valid_until, status, notes, document_ref, is_demo)
  values (p_opportunity_id, nullif(trim(p_reference), ''), v_version, p_amount,
          coalesce(nullif(upper(trim(p_currency)), ''), 'USD'),
          coalesce(p_prepared_on, public.harare_today()), p_valid_until, 'draft',
          nullif(trim(p_notes), ''), nullif(trim(p_document_ref), ''), o.is_demo)
  returning * into q;

  if o.stage <> 'on_hold' then
    update public.opportunities
       set stage = case when stage in ('new', 'contacted', 'requirements')
                        then 'quoting'::opp_stage else stage end,
           next_action = 'Send quotation ' || q.reference,
           next_action_due = public.harare_today()
     where id = p_opportunity_id;
  end if;
  return q;
exception when unique_violation then
  raise exception 'Quotation number % is already used', coalesce(p_reference, '');
end $function$;

CREATE OR REPLACE FUNCTION public.set_quote_reference()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_num text;
begin
  if new.reference is not null and new.reference <> ''
     and new.reference not like 'Q-____' then
    return new;                       -- an explicit reference is respected
  end if;

  select substring(o.ref from '[0-9]+$') into v_num
    from public.opportunities o
   where o.id = new.opportunity_id;

  if v_num is null then
    return new;                       -- keep whatever the column default gave
  end if;

  new.reference := 'Q-' || v_num || '-' || coalesce(new.version, 1);
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.stage_label(s opp_stage)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select case s
    when 'new'          then 'New enquiry'
    when 'contacted'    then 'Contacted'
    when 'requirements' then 'Requirements / site visit'
    when 'quoting'      then 'Quote / BOQ preparing'
    when 'quote_sent'   then 'Quote sent'
    when 'followup'     then 'Follow-up / awaiting decision'
    when 'on_hold'      then 'On hold'
    when 'won'          then 'Won'
    when 'lost'         then 'Lost'
  end;
$function$;

CREATE OR REPLACE FUNCTION public.touch_opportunity_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- Depth 1 means the application inserted this activity directly: a logged
  -- call, a note, a WhatsApp message. Those are contact, and they move the
  -- clock. Anything deeper was written by a trigger that owns the row.
  if pg_trigger_depth() > 1 then
    return new;
  end if;
  if new.opportunity_id is not null then
    update public.opportunities
       set last_activity_at = greatest(last_activity_at, new.occurred_at)
     where id = new.opportunity_id;
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at := now();
  return new;
end $function$;


-- constraints
alter table public.activities add constraint "activities_pkey" PRIMARY KEY (id);
alter table public.companies add constraint "companies_pkey" PRIMARY KEY (id);
alter table public.contacts add constraint "contacts_pkey" PRIMARY KEY (id);
alter table public.crm_settings add constraint "crm_settings_pkey" PRIMARY KEY (id);
alter table public.enquiries add constraint "enquiries_pkey" PRIMARY KEY (id);
alter table public.files add constraint "files_pkey" PRIMARY KEY (id);
alter table public.opportunities add constraint "opportunities_pkey" PRIMARY KEY (id);
alter table public.profiles add constraint "profiles_pkey" PRIMARY KEY (id);
alter table public.projects add constraint "projects_pkey" PRIMARY KEY (id);
alter table public.quotes add constraint "quotes_pkey" PRIMARY KEY (id);
alter table public.site_visits add constraint "site_visits_pkey" PRIMARY KEY (id);
alter table public.tasks add constraint "tasks_pkey" PRIMARY KEY (id);
alter table public.files add constraint "files_path_key" UNIQUE (path);
alter table public.opportunities add constraint "opportunities_ref_key" UNIQUE (ref);
alter table public.quotes add constraint "quotes_reference_key" UNIQUE (reference);
alter table public.activities add constraint "activities_attached" CHECK (((opportunity_id IS NOT NULL) OR (contact_id IS NOT NULL) OR (project_id IS NOT NULL)));
alter table public.contacts add constraint "contacts_reachable" CHECK (((COALESCE(email, ''::text) <> ''::text) OR (COALESCE(phone, ''::text) <> ''::text) OR (COALESCE(whatsapp, ''::text) <> ''::text)));
alter table public.crm_settings add constraint "crm_settings_email_mode_check" CHECK ((email_mode = ANY (ARRAY['manual'::text, 'test'::text, 'connected'::text])));
alter table public.crm_settings add constraint "crm_settings_id_check" CHECK (id);
alter table public.crm_settings add constraint "crm_settings_quote_followup_working_days_check" CHECK (((quote_followup_working_days >= 1) AND (quote_followup_working_days <= 30)));
alter table public.enquiries add constraint "enquiries_company_len" CHECK (((company IS NULL) OR (char_length(company) <= 160)));
alter table public.enquiries add constraint "enquiries_contact_len" CHECK (((char_length(contact) >= 5) AND (char_length(contact) <= 200)));
alter table public.enquiries add constraint "enquiries_drawings_len" CHECK (((drawings IS NULL) OR (char_length(drawings) <= 200)));
alter table public.enquiries add constraint "enquiries_location_len" CHECK (((location IS NULL) OR (char_length(location) <= 200)));
alter table public.enquiries add constraint "enquiries_message_len" CHECK (((message IS NULL) OR (char_length(message) <= 4000)));
alter table public.enquiries add constraint "enquiries_name_len" CHECK (((char_length(name) >= 2) AND (char_length(name) <= 120)));
alter table public.enquiries add constraint "enquiries_service_len" CHECK (((service IS NULL) OR (char_length(service) <= 160)));
alter table public.files add constraint "files_attached" CHECK (((opportunity_id IS NOT NULL) OR (project_id IS NOT NULL) OR (contact_id IS NOT NULL) OR (quote_id IS NOT NULL)));
alter table public.opportunities add constraint "opportunities_lost_has_reason" CHECK (((stage <> 'lost'::opp_stage) OR (COALESCE(NULLIF(TRIM(BOTH FROM lost_reason), ''::text), NULL::text) IS NOT NULL)));
alter table public.opportunities add constraint "opportunities_lost_reason_code_known" CHECK (((lost_reason_code IS NULL) OR (lost_reason_code = ANY (ARRAY['price'::text, 'competitor'::text, 'timing'::text, 'project_cancelled'::text, 'scope_changed'::text, 'no_response'::text, 'other'::text]))));
alter table public.opportunities add constraint "opportunities_value_sane" CHECK (((estimated_value IS NULL) OR (estimated_value >= (0)::numeric)));
alter table public.opportunities add constraint "opportunities_won_value_sane" CHECK (((won_value IS NULL) OR (won_value >= (0)::numeric)));
alter table public.quotes add constraint "quotes_amount_sane" CHECK ((amount >= (0)::numeric));
alter table public.quotes add constraint "quotes_sent_has_date" CHECK (((status = ANY (ARRAY['draft'::quote_status, 'expired'::quote_status, 'superseded'::quote_status])) OR (sent_on IS NOT NULL)));
alter table public.activities add constraint "activities_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public.activities add constraint "activities_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
alter table public.activities add constraint "activities_opportunity_id_fkey" FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE;
alter table public.activities add constraint "activities_project_fk" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
alter table public.contacts add constraint "contacts_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
alter table public.crm_settings add constraint "crm_settings_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public.enquiries add constraint "enquiries_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;
alter table public.enquiries add constraint "enquiries_opportunity_id_fkey" FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE SET NULL;
alter table public.files add constraint "files_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
alter table public.files add constraint "files_opportunity_id_fkey" FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE;
alter table public.files add constraint "files_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
alter table public.files add constraint "files_quote_id_fkey" FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE;
alter table public.files add constraint "files_uploaded_by_fkey" FOREIGN KEY (uploaded_by) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public.opportunities add constraint "opportunities_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
alter table public.opportunities add constraint "opportunities_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;
alter table public.opportunities add constraint "opportunities_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public.profiles add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.projects add constraint "projects_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
alter table public.projects add constraint "projects_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;
alter table public.projects add constraint "projects_opportunity_id_fkey" FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE SET NULL;
alter table public.projects add constraint "projects_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public.quotes add constraint "quotes_file_id_fkey" FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE SET NULL;
alter table public.quotes add constraint "quotes_opportunity_id_fkey" FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE;
alter table public.quotes add constraint "quotes_sent_by_fkey" FOREIGN KEY (sent_by) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public.site_visits add constraint "site_visits_opportunity_id_fkey" FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE;
alter table public.site_visits add constraint "site_visits_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public.tasks add constraint "tasks_completed_by_fkey" FOREIGN KEY (completed_by) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public.tasks add constraint "tasks_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
alter table public.tasks add constraint "tasks_opportunity_id_fkey" FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE;
alter table public.tasks add constraint "tasks_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public.tasks add constraint "tasks_project_fk" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- indexes
CREATE INDEX activities_contact_idx ON public.activities USING btree (contact_id, occurred_at DESC);
CREATE INDEX activities_opp_idx ON public.activities USING btree (opportunity_id, occurred_at DESC);
CREATE INDEX activities_project_idx ON public.activities USING btree (project_id, occurred_at DESC);
CREATE INDEX companies_demo_idx ON public.companies USING btree (id) WHERE is_demo;
CREATE UNIQUE INDEX companies_name_key ON public.companies USING btree (lower(name));
CREATE INDEX contacts_company_idx ON public.contacts USING btree (company_id);
CREATE INDEX contacts_demo_idx ON public.contacts USING btree (id) WHERE is_demo;
CREATE UNIQUE INDEX contacts_email_key ON public.contacts USING btree (lower(email)) WHERE ((email IS NOT NULL) AND (email <> ''::text));
CREATE INDEX enquiries_created_idx ON public.enquiries USING btree (created_at DESC);
CREATE INDEX enquiries_unprocessed_idx ON public.enquiries USING btree (processed_at) WHERE (processed_at IS NULL);
CREATE INDEX files_opp_idx ON public.files USING btree (opportunity_id);
CREATE INDEX files_project_idx ON public.files USING btree (project_id);
CREATE INDEX opportunities_company_idx ON public.opportunities USING btree (company_id);
CREATE INDEX opportunities_contact_idx ON public.opportunities USING btree (contact_id);
CREATE INDEX opportunities_demo_idx ON public.opportunities USING btree (id) WHERE is_demo;
CREATE INDEX opportunities_due_idx ON public.opportunities USING btree (next_action_due);
CREATE INDEX opportunities_owner_idx ON public.opportunities USING btree (owner_id);
CREATE INDEX opportunities_stage_idx ON public.opportunities USING btree (stage);
CREATE INDEX projects_demo_idx ON public.projects USING btree (id) WHERE is_demo;
CREATE INDEX projects_status_idx ON public.projects USING btree (status);
CREATE INDEX quotes_opp_idx ON public.quotes USING btree (opportunity_id);
CREATE UNIQUE INDEX quotes_opportunity_version_key ON public.quotes USING btree (opportunity_id, version);
CREATE INDEX quotes_status_idx ON public.quotes USING btree (status);
CREATE INDEX site_visits_opp_idx ON public.site_visits USING btree (opportunity_id);
CREATE INDEX site_visits_when_idx ON public.site_visits USING btree (scheduled_at);
CREATE INDEX tasks_open_due_idx ON public.tasks USING btree (status, due_date);
CREATE INDEX tasks_opp_idx ON public.tasks USING btree (opportunity_id);
CREATE INDEX tasks_owner_idx ON public.tasks USING btree (owner_id, status);

-- views
create view public.v_opportunity_state with (security_invoker=true) as
 SELECT o.id,
    o.ref,
    o.title,
    o.company_id,
    o.contact_id,
    o.owner_id,
    o.stage,
    o.priority,
    o.source,
    o.service,
    o.description,
    o.estimated_value,
    o.currency,
    o.location,
    o.site_visit_required,
    o.next_action,
    o.next_action_due,
    o.last_activity_at,
    o.decided_at,
    o.lost_reason,
    o.created_at,
    o.updated_at,
    c.name AS company_name,
    p.full_name AS contact_name,
    p.phone AS contact_phone,
    p.whatsapp AS contact_whatsapp,
    p.email AS contact_email,
    pr.full_name AS owner_name,
    pr.initials AS owner_initials,
    opp_stage_is_open(o.stage) AS is_open,
    stage_label(o.stage) AS stage_name,
    o.next_action_due - (now() AT TIME ZONE 'Africa/Harare'::text)::date AS days_until_due,
    ( SELECT count(*) AS count
           FROM quotes q
          WHERE q.opportunity_id = o.id AND (q.status = ANY (ARRAY['sent'::quote_status, 'discussed'::quote_status]))) AS live_quotes,
    ( SELECT max(q.sent_on) AS max
           FROM quotes q
          WHERE q.opportunity_id = o.id AND q.sent_on IS NOT NULL) AS last_quote_sent,
        CASE
            WHEN NOT opp_stage_is_open(o.stage) THEN 'closed'::text
            WHEN o.stage = 'on_hold'::opp_stage AND o.hold_review_on > (now() AT TIME ZONE 'Africa/Harare'::text)::date THEN 'held'::text
            WHEN o.next_action_due IS NULL THEN 'unbooked'::text
            WHEN o.next_action_due < (now() AT TIME ZONE 'Africa/Harare'::text)::date THEN 'overdue'::text
            WHEN o.next_action_due = (now() AT TIME ZONE 'Africa/Harare'::text)::date THEN 'today'::text
            WHEN o.next_action_due <= ((now() AT TIME ZONE 'Africa/Harare'::text)::date + 7) THEN 'soon'::text
            ELSE 'clear'::text
        END AS attention,
    o.is_demo,
    lq.amount AS quoted_value,
    lq.currency AS quote_currency,
    lq.status AS quote_status,
    lq.reference AS quote_ref,
    lq.version AS quote_version,
    lq.sent_at AS quote_sent_at,
    o.won_value,
    o.lost_reason_code,
    o.hold_reason,
    o.hold_review_on,
    o.customer_replied_at
   FROM opportunities o
     LEFT JOIN companies c ON c.id = o.company_id
     LEFT JOIN contacts p ON p.id = o.contact_id
     LEFT JOIN profiles pr ON pr.id = o.owner_id
     LEFT JOIN LATERAL ( SELECT q.amount,
            q.currency,
            q.status,
            q.reference,
            q.version,
            q.sent_at
           FROM quotes q
          WHERE q.opportunity_id = o.id AND q.status <> 'rejected'::quote_status
          ORDER BY q.version DESC, q.created_at DESC
         LIMIT 1) lq ON true;

-- triggers
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
CREATE TRIGGER activities_touch_opportunity AFTER INSERT ON public.activities FOR EACH ROW EXECUTE FUNCTION touch_opportunity_activity();
CREATE TRIGGER companies_touch BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER contacts_touch BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER enquiries_convert BEFORE INSERT ON public.enquiries FOR EACH ROW EXECUTE FUNCTION convert_enquiry();
CREATE TRIGGER opportunities_stage_history BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION log_stage_change();
CREATE TRIGGER opportunities_touch BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER projects_touch BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER quote_before_write BEFORE INSERT OR UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION quote_before_write();
CREATE TRIGGER quotes_history AFTER INSERT ON public.quotes FOR EACH ROW EXECUTE FUNCTION log_quote_event();
CREATE TRIGGER quotes_status_history AFTER UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION log_quote_event();
CREATE TRIGGER quotes_touch BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER set_quote_reference BEFORE INSERT ON public.quotes FOR EACH ROW EXECUTE FUNCTION set_quote_reference();
CREATE TRIGGER site_visits_history AFTER INSERT ON public.site_visits FOR EACH ROW EXECUTE FUNCTION log_visit_event();
CREATE TRIGGER site_visits_status_history AFTER UPDATE ON public.site_visits FOR EACH ROW EXECUTE FUNCTION log_visit_event();
CREATE TRIGGER site_visits_touch BEFORE UPDATE ON public.site_visits FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER tasks_completion_history BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION log_task_completion();
CREATE TRIGGER tasks_touch BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- row level security
alter table public.activities enable row level security;
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.crm_settings enable row level security;
alter table public.enquiries enable row level security;
alter table public.files enable row level security;
alter table public.opportunities enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.quotes enable row level security;
alter table public.site_visits enable row level security;
alter table public.tasks enable row level security;

-- policies
create policy "activities_admin_delete" on public.activities as permissive for delete to authenticated
  using (is_admin());
create policy "activities_staff_read" on public.activities as permissive for select to authenticated
  using (is_staff());
create policy "activities_staff_update" on public.activities as permissive for update to authenticated
  using (is_staff())
  with check (is_staff());
create policy "activities_staff_write" on public.activities as permissive for insert to authenticated
  with check (is_staff());
create policy "companies_admin_delete" on public.companies as permissive for delete to authenticated
  using (is_admin());
create policy "companies_staff_read" on public.companies as permissive for select to authenticated
  using (is_staff());
create policy "companies_staff_update" on public.companies as permissive for update to authenticated
  using (is_staff())
  with check (is_staff());
create policy "companies_staff_write" on public.companies as permissive for insert to authenticated
  with check (is_staff());
create policy "contacts_admin_delete" on public.contacts as permissive for delete to authenticated
  using (is_admin());
create policy "contacts_staff_read" on public.contacts as permissive for select to authenticated
  using (is_staff());
create policy "contacts_staff_update" on public.contacts as permissive for update to authenticated
  using (is_staff())
  with check (is_staff());
create policy "contacts_staff_write" on public.contacts as permissive for insert to authenticated
  with check (is_staff());
create policy "crm_settings_admin_update" on public.crm_settings as permissive for update to authenticated
  using (is_admin())
  with check (is_admin());
create policy "crm_settings_read" on public.crm_settings as permissive for select to authenticated
  using (is_staff());
create policy "enquiries_public_insert" on public.enquiries as permissive for insert to anon
  with check ((((char_length(name) >= 2) AND (char_length(name) <= 120)) AND ((char_length(contact) >= 5) AND (char_length(contact) <= 200)) AND (COALESCE(char_length(message), 0) <= 4000)));
create policy "enquiries_staff_read" on public.enquiries as permissive for select to authenticated
  using (is_staff());
create policy "files_admin_delete" on public.files as permissive for delete to authenticated
  using (is_admin());
create policy "files_staff_read" on public.files as permissive for select to authenticated
  using (is_staff());
create policy "files_staff_update" on public.files as permissive for update to authenticated
  using (is_staff())
  with check (is_staff());
create policy "files_staff_write" on public.files as permissive for insert to authenticated
  with check (is_staff());
create policy "opportunities_admin_delete" on public.opportunities as permissive for delete to authenticated
  using (is_admin());
create policy "opportunities_staff_read" on public.opportunities as permissive for select to authenticated
  using (is_staff());
create policy "opportunities_staff_update" on public.opportunities as permissive for update to authenticated
  using (is_staff())
  with check (is_staff());
create policy "opportunities_staff_write" on public.opportunities as permissive for insert to authenticated
  with check (is_staff());
create policy "profiles_admin_all" on public.profiles as permissive for all to authenticated
  using (is_admin())
  with check (is_admin());
create policy "profiles_read" on public.profiles as permissive for select to authenticated
  using (is_staff());
create policy "profiles_update_self" on public.profiles as permissive for update to authenticated
  using ((id = auth.uid()))
  with check ((id = auth.uid()));
create policy "projects_admin_delete" on public.projects as permissive for delete to authenticated
  using (is_admin());
create policy "projects_staff_read" on public.projects as permissive for select to authenticated
  using (is_staff());
create policy "projects_staff_update" on public.projects as permissive for update to authenticated
  using (is_staff())
  with check (is_staff());
create policy "projects_staff_write" on public.projects as permissive for insert to authenticated
  with check (is_staff());
create policy "quotes_admin_delete" on public.quotes as permissive for delete to authenticated
  using (is_admin());
create policy "quotes_staff_read" on public.quotes as permissive for select to authenticated
  using (is_staff());
create policy "quotes_staff_update" on public.quotes as permissive for update to authenticated
  using (is_staff())
  with check (is_staff());
create policy "quotes_staff_write" on public.quotes as permissive for insert to authenticated
  with check (is_staff());
create policy "site_visits_admin_delete" on public.site_visits as permissive for delete to authenticated
  using (is_admin());
create policy "site_visits_staff_read" on public.site_visits as permissive for select to authenticated
  using (is_staff());
create policy "site_visits_staff_update" on public.site_visits as permissive for update to authenticated
  using (is_staff())
  with check (is_staff());
create policy "site_visits_staff_write" on public.site_visits as permissive for insert to authenticated
  with check (is_staff());
create policy "tasks_admin_delete" on public.tasks as permissive for delete to authenticated
  using (is_admin());
create policy "tasks_staff_read" on public.tasks as permissive for select to authenticated
  using (is_staff());
create policy "tasks_staff_update" on public.tasks as permissive for update to authenticated
  using (is_staff())
  with check (is_staff());
create policy "tasks_staff_write" on public.tasks as permissive for insert to authenticated
  with check (is_staff());
create policy "admin delete files" on storage.objects as permissive for delete to authenticated
  using (((bucket_id = 'kingson-files'::text) AND is_admin()));
create policy "staff read files" on storage.objects as permissive for select to authenticated
  using (((bucket_id = 'kingson-files'::text) AND is_staff()));
create policy "staff update files" on storage.objects as permissive for update to authenticated
  using (((bucket_id = 'kingson-files'::text) AND is_staff()));
create policy "staff upload files" on storage.objects as permissive for insert to authenticated
  with check (((bucket_id = 'kingson-files'::text) AND is_staff()));

-- privileges: exactly what production grants the API roles
revoke all on all tables in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;
grant delete, insert, select, update on public.activities to authenticated;
grant delete, insert, select, update on public.companies to authenticated;
grant delete, insert, select, update on public.contacts to authenticated;
grant delete, insert, references, select, trigger, truncate, update on public.crm_settings to authenticated;
grant insert on public.enquiries to anon;
grant select on public.enquiries to authenticated;
grant delete, insert, select, update on public.files to authenticated;
grant delete, insert, select, update on public.opportunities to authenticated;
grant select, update on public.profiles to authenticated;
grant delete, insert, select, update on public.projects to authenticated;
grant delete, insert, select, update on public.quotes to authenticated;
grant delete, insert, select, update on public.site_visits to authenticated;
grant delete, insert, select, update on public.tasks to authenticated;
grant delete, insert, references, select, trigger, truncate, update on public.v_opportunity_state to authenticated;
grant execute on function public.add_working_days(d date, n integer) to authenticated;
grant execute on function public.convert_to_project(p_opportunity_id uuid, p_name text, p_start_date date, p_target_date date) to authenticated;
grant execute on function public.dashboard_metrics(p_include_demo boolean) to authenticated;
grant execute on function public.decide_opportunity(p_opportunity_id uuid, p_outcome text, p_on date, p_value numeric, p_reason text, p_notes text, p_review_on date) to authenticated;
grant execute on function public.enum_values(enum_name text) to authenticated;
grant execute on function public.harare_today() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.log_follow_up(p_opportunity_id uuid, p_channel text, p_notes text, p_at timestamp with time zone, p_next_action text, p_next_due date) to authenticated;
grant execute on function public.mark_customer_replied(p_opportunity_id uuid, p_channel text, p_notes text, p_at timestamp with time zone) to authenticated;
grant execute on function public.mark_quote_sent(p_quote_id uuid, p_sent_at timestamp with time zone, p_follow_up_on date, p_channel text, p_notes text) to authenticated;
grant execute on function public.opp_stage_is_open(s opp_stage) to authenticated;
grant execute on function public.record_quote(p_opportunity_id uuid, p_amount numeric, p_currency text, p_prepared_on date, p_valid_until date, p_notes text, p_reference text, p_document_ref text) to authenticated;
grant execute on function public.stage_label(s opp_stage) to authenticated;

-- storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('kingson-files', 'kingson-files', False, 26214400, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/acad', 'image/vnd.dwg', 'image/vnd.dxf', 'application/dxf', 'application/octet-stream', 'application/zip', 'text/plain', 'text/csv']) on conflict (id) do nothing;

-- the one settings row (not exported: data, not structure)
insert into public.crm_settings default values on conflict do nothing;
