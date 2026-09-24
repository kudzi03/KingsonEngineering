-- ═══════════════════════════════════════════════════════════════════════════
-- 20260925_b_production_readiness.sql
-- ═══════════════════════════════════════════════════════════════════════════
--
-- What this adds, in order:
--
--   1. Deactivated staff are refused by the DATABASE, not only the screen.
--   2. Phone and email normalisation on contacts, for duplicate matching.
--   3. find_contact_matches()  — "Existing customer found" in the quick form.
--   4. create_enquiry()        — the one way a person or a future channel
--                                creates an enquiry; atomic, idempotent.
--   5. submit_enquiry()        — the website's insert, returning the ENQ ref.
--   6. global_search()         — contacts, enquiries, quotes and projects,
--                                index-backed, row-level-security respected.
--   7. tasks.task_type         — Won/Lost/Reply close tasks by what they are
--                                FOR, not by their title.
--   8. files.quote_id          — a quotation version can carry its PDF.
--   9. The notification outbox — staff alert, customer acknowledgement and
--                                the daily digest; each sent at most once.
--  10. management_summary()    — the reporting foundation.
--
-- Additive only: no table is dropped, no column removed, no row deleted. Every
-- statement is re-runnable. Existing quote/follow-up/Won/Lost behaviour is
-- kept; the three lifecycle functions below are re-issued with ONE change
-- each (task_type instead of title matching), marked `CHANGED`.
--
-- Run 20260925_a_sources.sql first.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. active staff only ─────────────────────────────────────────────────────
-- Every row-level policy and every lifecycle function asks is_staff() or
-- is_admin(). Checking `active` here closes the window in which a
-- deactivated account's unexpired token could still read and write.
-- RECONCILE: signatures must match the live functions (both take no args).

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                  where id = auth.uid() and active is true);
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                  where id = auth.uid() and active is true and role = 'admin');
$$;

-- ── 2. normalised phone and email ────────────────────────────────────────────
-- The same rules as normPhone() in crm-src/core/model.js. Zimbabwe numbers in
-- any of their usual shapes become 263XXXXXXXXX; anything else keeps its digits.

create or replace function public.norm_phone(p text)
returns text language plpgsql immutable parallel safe as $$
declare d text := regexp_replace(coalesce(p, ''), '\D', '', 'g');
begin
  if d = '' then return null; end if;
  if left(d, 2) = '00' then d := substr(d, 3); end if;
  if length(d) = 10 and left(d, 1) = '0' then d := '263' || substr(d, 2);
  elsif length(d) = 9 and left(d, 1) between '1' and '9' then d := '263' || d;
  end if;
  return case when length(d) >= 7 then d end;
end $$;

create or replace function public.norm_email(p text)
returns text language sql immutable parallel safe as $$
  select nullif(lower(trim(coalesce(p, ''))), '');
$$;

alter table public.contacts
  add column if not exists phone_norm text generated always as (public.norm_phone(phone)) stored,
  add column if not exists whatsapp_norm text generated always as (public.norm_phone(whatsapp)) stored,
  add column if not exists email_norm text generated always as (public.norm_email(email)) stored;

create index if not exists contacts_phone_norm_idx on public.contacts (phone_norm);
create index if not exists contacts_whatsapp_norm_idx on public.contacts (whatsapp_norm);
create index if not exists contacts_email_norm_idx on public.contacts (email_norm);

-- ── search indexes ───────────────────────────────────────────────────────────
create extension if not exists pg_trgm with schema extensions;

create index if not exists contacts_name_trgm on public.contacts using gin (full_name extensions.gin_trgm_ops);
create index if not exists companies_name_trgm on public.companies using gin (name extensions.gin_trgm_ops);
create index if not exists opps_title_trgm on public.opportunities using gin (title extensions.gin_trgm_ops);
create index if not exists opps_location_trgm on public.opportunities using gin (location extensions.gin_trgm_ops);
create index if not exists opps_ref_idx on public.opportunities (upper(ref));
create index if not exists quotes_reference_upper_idx on public.quotes (upper(reference));
create index if not exists projects_name_trgm on public.projects using gin (name extensions.gin_trgm_ops);
create index if not exists opps_decided_idx on public.opportunities (decided_at desc) where stage in ('won', 'lost');
create index if not exists opps_created_idx on public.opportunities (created_at desc);

-- ── extra enquiry detail the quick form captures ─────────────────────────────
alter table public.opportunities
  add column if not exists drawings text not null default 'unknown',
  add column if not exists external_ref text;
alter table public.opportunities drop constraint if exists opportunities_drawings_known;
alter table public.opportunities add constraint opportunities_drawings_known
  check (drawings in ('yes', 'no', 'unknown'));
-- One record per message/call from a future channel, however often it retries.
create unique index if not exists opportunities_external_ref_key
  on public.opportunities (external_ref) where external_ref is not null;

-- ── 3. find_contact_matches ──────────────────────────────────────────────────
-- Strong: the same email, or the same phone/WhatsApp number once normalised.
-- Soft: a similar name or company — offered as a suggestion, never assumed.
-- Security invoker: a caller only ever sees contacts RLS already lets them see.

create or replace function public.find_contact_matches(
  p_phone text default null, p_email text default null,
  p_name text default null, p_company text default null)
returns table (contact_id uuid, full_name text, company_id uuid, company_name text,
               phone text, email text, match text, strength text,
               open_enquiries integer, last_ref text, last_activity timestamptz)
language sql stable security invoker set search_path = public, extensions as $$
  with inp as (
    select public.norm_phone(p_phone) ph, public.norm_email(p_email) em,
           nullif(trim(coalesce(p_name, '')), '') nm, nullif(trim(coalesce(p_company, '')), '') co
  ),
  hits as (
    select c.id, 'email' m, 'strong' s, 1 r from public.contacts c, inp
     where inp.em is not null and c.email_norm = inp.em
    union all
    select c.id, 'phone', 'strong', 1 from public.contacts c, inp
     where inp.ph is not null and (c.phone_norm = inp.ph or c.whatsapp_norm = inp.ph)
    union all
    select c.id, 'name', 'soft', 2 from public.contacts c, inp
     where inp.nm is not null and length(inp.nm) >= 3 and c.full_name ilike '%' || inp.nm || '%'
    union all
    select c.id, 'company', 'soft', 3 from public.contacts c
      join public.companies co on co.id = c.company_id, inp
     where inp.co is not null and length(inp.co) >= 3 and co.name ilike '%' || inp.co || '%'
  ),
  best as (
    select distinct on (id) id, m, s, r from hits order by id, r
  )
  select c.id, c.full_name, c.company_id, co.name, c.phone, c.email, b.m, b.s,
         (select count(*)::int from public.opportunities o
           where o.contact_id = c.id and public.opp_stage_is_open(o.stage)),
         (select o.ref from public.opportunities o where o.contact_id = c.id
           order by o.created_at desc limit 1),
         (select max(o.last_activity_at) from public.opportunities o where o.contact_id = c.id)
    from best b join public.contacts c on c.id = b.id
    left join public.companies co on co.id = c.company_id
   order by b.r, c.full_name
   limit 8;
$$;

-- ── 4. create_enquiry ────────────────────────────────────────────────────────
-- Contact, company, enquiry and its first timeline entry in one transaction:
-- the old quick form made four separate requests, and a failure half way
-- left a contact with no enquiry.
--
-- Contact rules:
--   p_contact_id given       → that contact, exactly as the person chose.
--   p_force_new = false      → reuse a SINGLE strong match (same email or
--                              phone); several strong matches is ambiguous
--                              and is refused so a person decides.
--   p_force_new = true       → a new contact, even if the phone is on file
--                              (two people can share an office number). An
--                              email already on file is still refused: the
--                              email is unique and belongs to one person.
--
-- p_external_ref makes a retry from a future channel return the existing
-- enquiry instead of creating a second one.

create or replace function public.create_enquiry(
  p_full_name text default null, p_phone text default null, p_email text default null,
  p_description text default null, p_title text default null,
  p_company text default null, p_contact_id uuid default null,
  p_service text default null, p_location text default null,
  p_source text default 'phone', p_preferred_channel text default null,
  p_drawings text default 'unknown', p_owner_id uuid default null,
  p_next_action text default null, p_next_due date default null,
  p_force_new boolean default false, p_external_ref text default null,
  p_notify boolean default false)
returns table (opportunity_id uuid, ref text, contact_id uuid, contact_reused boolean)
language plpgsql security definer set search_path = public as $$
declare
  v_contact uuid := p_contact_id;
  v_company uuid;
  v_reused boolean := p_contact_id is not null;
  v_ph text := public.norm_phone(p_phone);
  v_em text := public.norm_email(p_email);
  v_n int;
  v_title text;
  v_opp public.opportunities%rowtype;
  v_actor uuid := auth.uid();
  v_label text;
begin
  if not (public.is_staff() or coalesce(auth.role(), '') = 'service_role') then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  if p_external_ref is not null then
    select * into v_opp from public.opportunities where external_ref = p_external_ref;
    if found then
      return query select v_opp.id, v_opp.ref, v_opp.contact_id, true;
      return;
    end if;
  end if;

  if v_contact is null then
    if coalesce(trim(p_full_name), '') = '' then
      raise exception 'Who is asking? Enter the contact''s name.' using errcode = '23514';
    end if;
    if v_ph is null and v_em is null then
      raise exception 'A phone number or an email address is needed.' using errcode = '23514';
    end if;
    if p_email is not null and trim(p_email) <> '' and v_em !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
      raise exception 'That email address does not look right.' using errcode = '23514';
    end if;

    if v_em is not null then
      select id into v_contact from public.contacts where email_norm = v_em limit 1;
      if found then
        if p_force_new then
          raise exception '% already has that email address. Choose them as the customer, or leave the email out.',
            (select full_name from public.contacts where id = v_contact) using errcode = '23505';
        end if;
        v_reused := true;
      end if;
    end if;
    if v_contact is null and not p_force_new and v_ph is not null then
      select count(*) into v_n from public.contacts
       where phone_norm = v_ph or whatsapp_norm = v_ph;
      if v_n = 1 then
        select id into v_contact from public.contacts where phone_norm = v_ph or whatsapp_norm = v_ph;
        v_reused := true;
      elsif v_n > 1 then
        raise exception 'More than one contact has that number. Choose the right one, or choose “New customer”.'
          using errcode = '23505';
      end if;
    end if;
  end if;

  if nullif(trim(coalesce(p_company, '')), '') is not null then
    select id into v_company from public.companies where lower(name) = lower(trim(p_company)) limit 1;
    if v_company is null then
      insert into public.companies (name) values (trim(p_company)) returning id into v_company;
    end if;
  end if;

  if v_contact is null then
    insert into public.contacts (full_name, company_id, email, phone, whatsapp, preferred_channel)
    values (trim(p_full_name), v_company, v_em, nullif(trim(coalesce(p_phone, '')), ''),
            nullif(trim(coalesce(p_phone, '')), ''), nullif(trim(coalesce(p_preferred_channel, '')), ''))
    returning id into v_contact;
  else
    -- Fill gaps on a reused contact; never overwrite what is already there.
    update public.contacts c
       set company_id = coalesce(c.company_id, v_company),
           email = coalesce(c.email, v_em),
           phone = coalesce(c.phone, nullif(trim(coalesce(p_phone, '')), '')),
           preferred_channel = coalesce(nullif(trim(coalesce(p_preferred_channel, '')), ''), c.preferred_channel)
     where c.id = v_contact;
    if v_company is null then
      select c.company_id into v_company from public.contacts c where c.id = v_contact;
    end if;
  end if;

  v_title := coalesce(
    nullif(trim(coalesce(p_title, '')), ''),
    nullif(concat_ws(' — ', nullif(trim(coalesce(p_service, '')), ''), nullif(trim(coalesce(p_location, '')), '')), ''),
    nullif(left(regexp_replace(trim(coalesce(p_description, '')), '\s+', ' ', 'g'), 70), ''),
    'Enquiry from ' || coalesce((select full_name from public.contacts where id = v_contact), 'a customer'));

  insert into public.opportunities (title, company_id, contact_id, owner_id, stage, priority, source,
                                    service, description, location, drawings,
                                    next_action, next_action_due, external_ref)
  values (v_title, v_company, v_contact, coalesce(p_owner_id, v_actor), 'new', 'normal',
          coalesce(nullif(p_source, ''), 'other')::enquiry_source,
          nullif(trim(coalesce(p_service, '')), ''), nullif(trim(coalesce(p_description, '')), ''),
          nullif(trim(coalesce(p_location, '')), ''),
          case when p_drawings in ('yes', 'no') then p_drawings else 'unknown' end,
          coalesce(nullif(trim(coalesce(p_next_action, '')), ''), 'Call and qualify the enquiry'),
          coalesce(p_next_due, public.add_working_days(public.harare_today(), 1)),
          p_external_ref)
  returning * into v_opp;

  v_label := initcap(replace(coalesce(nullif(p_source, ''), 'other'), '_', ' '));
  insert into public.activities (opportunity_id, contact_id, kind, body, actor_id)
  values (v_opp.id, v_contact, 'enquiry',
          'Enquiry logged (' || v_label || ')'
            || case when v_reused then ' for an existing customer' else '' end
            || coalesce(' — ' || nullif(trim(coalesce(p_description, '')), ''), ''),
          v_actor);

  if p_notify then
    perform public.queue_new_enquiry_alert(v_opp.id);
    perform public.kick_dispatcher();
  end if;

  return query select v_opp.id, v_opp.ref, v_contact, v_reused;
end $$;

-- ── 5. submit_enquiry — the website ─────────────────────────────────────────
-- The public form keeps INSERT-only access to `enquiries` and cannot read
-- anything back. This function does the same insert with the same limits
-- and returns ONE thing: the reference, so the visitor can quote it. A row
-- the honeypot catches is accepted silently and gets no reference.
-- RECONCILE: column list and limits against the live enquiries insert policy.

create or replace function public.submit_enquiry(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  e public.enquiries%rowtype;
  v_ref text;
  s text;
begin
  s := nullif(trim(coalesce(p->>'name', '')), '');
  if s is null or length(s) < 2 or length(s) > 120 then
    raise exception 'name' using errcode = '23514';
  end if;
  s := nullif(trim(coalesce(p->>'contact', '')), '');
  if s is null or length(s) < 5 or length(s) > 200 then
    raise exception 'contact' using errcode = '23514';
  end if;

  insert into public.enquiries (name, company, contact, service, location, drawings,
                                message, source, page, honeypot)
  values (left(trim(p->>'name'), 120), left(nullif(trim(p->>'company'), ''), 160),
          left(trim(p->>'contact'), 200), left(nullif(trim(p->>'service'), ''), 120),
          left(nullif(trim(p->>'location'), ''), 160), left(nullif(trim(p->>'drawings'), ''), 120),
          left(nullif(trim(p->>'message'), ''), 4000), 'website',
          left(nullif(trim(p->>'page'), ''), 200), left(nullif(p->>'honeypot', ''), 200))
  returning * into e;

  if coalesce(e.spam, false) or e.opportunity_id is null then
    return jsonb_build_object('ok', true);
  end if;
  select o.ref into v_ref from public.opportunities o where o.id = e.opportunity_id;
  return jsonb_build_object('ok', true, 'ref', v_ref);
end $$;

-- ── 6. global_search ─────────────────────────────────────────────────────────
-- One box, four kinds of record. A number that looks like a phone is matched
-- on the normalised digits; ENQ- and Q- references match directly; words
-- match names, companies, jobs, places and services. Every leg is limited
-- and index-backed, so it costs the same at 100 records as at 10 000.
-- Security invoker: RLS decides what each caller can see.

create or replace function public.global_search(p_q text, p_include_demo boolean default false,
                                                p_limit integer default 8)
returns table (kind text, id uuid, title text, subtitle text, ref text, stage text, rank integer)
language plpgsql stable security invoker set search_path = public, extensions as $$
declare
  q text := trim(coalesce(p_q, ''));
  like_q text;
  ph text;
  lim int := least(greatest(coalesce(p_limit, 8), 1), 25);
begin
  if length(q) < 2 then return; end if;
  like_q := '%' || replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  -- A number: compare the significant digits, so "0771 234", "+263 77 123"
  -- and "771234" all find 263771234567.
  if q ~ '^[+\d\s()\-]{5,}$' then
    ph := regexp_replace(q, '\D', '', 'g');
    if left(ph, 2) = '00' then ph := substr(ph, 3); end if;
    if left(ph, 3) = '263' then ph := substr(ph, 4); end if;
    ph := ltrim(ph, '0');
    if length(ph) < 5 then ph := null; end if;
  end if;

  return query
  (select 'contact'::text, c.id, c.full_name,
          concat_ws(' · ', co.name, c.phone, c.email), null::text, null::text,
          case when c.email_norm = public.norm_email(q)
                 or right(c.phone_norm, length(ph)) = ph or right(c.whatsapp_norm, length(ph)) = ph then 1 else 3 end
     from public.contacts c left join public.companies co on co.id = c.company_id
    where (p_include_demo or not c.is_demo)
      and (c.full_name ilike like_q or co.name ilike like_q or c.email ilike like_q
           or (ph is not null and (c.phone_norm like '%' || ph || '%' or c.whatsapp_norm like '%' || ph || '%')))
    order by 7, c.full_name limit lim)
  union all
  (select 'enquiry', o.id, o.title,
          concat_ws(' · ', co.name, ct.full_name, o.location, o.service), o.ref, o.stage::text,
          case when upper(o.ref) = upper(q) then 0 else 2 end
     from public.opportunities o
     left join public.companies co on co.id = o.company_id
     left join public.contacts ct on ct.id = o.contact_id
    where (p_include_demo or not o.is_demo)
      and (upper(o.ref) = upper(q) or o.ref ilike like_q or o.title ilike like_q
           or o.location ilike like_q or o.service ilike like_q or co.name ilike like_q
           or ct.full_name ilike like_q)
    order by 7, o.created_at desc limit lim)
  union all
  (select 'quote', q2.opportunity_id, q2.reference || ' — ' || o.title,
          concat_ws(' · ', co.name, q2.currency || ' ' || to_char(q2.amount, 'FM999,999,990'), q2.status::text),
          q2.reference, o.stage::text,
          case when upper(q2.reference) = upper(q) then 0 else 2 end
     from public.quotes q2 join public.opportunities o on o.id = q2.opportunity_id
     left join public.companies co on co.id = o.company_id
    where (p_include_demo or not q2.is_demo)
      and (upper(q2.reference) = upper(q) or q2.reference ilike like_q)
    order by 7, q2.version desc limit lim)
  union all
  (select 'project', p.id, p.name, concat_ws(' · ', co.name, p.status::text), null, null, 3
     from public.projects p left join public.companies co on co.id = p.company_id
    where (p_include_demo or not p.is_demo)
      and (p.name ilike like_q or co.name ilike like_q)
    order by p.created_at desc limit lim);
end $$;

-- ── 7. tasks.task_type ───────────────────────────────────────────────────────
alter table public.tasks add column if not exists task_type text not null default 'general';
alter table public.tasks drop constraint if exists tasks_task_type_known;
alter table public.tasks add constraint tasks_task_type_known
  check (task_type in ('general', 'enquiry_response', 'quote_followup', 'customer_reply', 'site_visit'));
create index if not exists tasks_open_type_idx on public.tasks (opportunity_id, task_type) where status = 'open';

-- Backfill once from the titles the old logic read, so existing open tasks
-- close exactly as they would have before. New tasks carry the type.
update public.tasks set task_type = 'enquiry_response'
 where task_type = 'general' and title ilike 'respond to website enquiry%';
update public.tasks set task_type = 'quote_followup'
 where task_type = 'general' and (title ilike 'follow up%' or title ilike 'chase%');

-- The website's task is written by convert_enquiry, which predates the
-- column. Rather than rely on its title, type it the moment it is inserted.
-- RECONCILE: replace with task_type in convert_enquiry's own INSERT once the
-- live function source is in the baseline, then drop this trigger.
create or replace function public.tasks_type_from_origin()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.task_type = 'general' and new.title like 'Respond to website enquiry%' then
    new.task_type := 'enquiry_response';
  end if;
  return new;
end $$;
drop trigger if exists tasks_type_from_origin on public.tasks;
create trigger tasks_type_from_origin before insert on public.tasks
  for each row execute function public.tasks_type_from_origin();

-- CHANGED (log_stage_change): leaving New completes enquiry_response tasks by
-- type. Everything else is identical to 20260922_quote_lifecycle.sql.
create or replace function public.log_stage_change()
returns trigger language plpgsql security definer set search_path = public as $$
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
         and task_type = 'enquiry_response';                       -- CHANGED
    end if;
  end if;
  new.last_activity_at := now();
  return new;
end $$;

-- CHANGED (mark_customer_replied): a reply also cancels any open quotation
-- follow-up TASK, so a task list cannot keep saying "chase them" after they
-- answered. The next action becomes "Respond to customer reply", due today,
-- exactly as before.
create or replace function public.mark_customer_replied(
  p_opportunity_id uuid,
  p_channel text,
  p_notes text default null,
  p_at timestamptz default null)
returns void language plpgsql security definer set search_path = public as $$
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
  update public.tasks set status = 'cancelled',                      -- CHANGED
         notes = coalesce(notes || E'\n', '') || 'Cancelled: the customer replied.'
   where opportunity_id = o.id and status = 'open' and task_type = 'quote_followup';
  if o.stage in ('won', 'lost') then return; end if;
  update public.opportunities
     set customer_replied_at = coalesce(p_at, now()),
         stage = case when stage = 'quote_sent' then 'followup'::opp_stage else stage end,
         next_action = 'Respond to customer reply',
         next_action_due = public.harare_today()
   where id = o.id;
end $$;

-- CHANGED (decide_opportunity): Won and Lost close the SALES tasks by type —
-- responding to the enquiry, chasing the quotation, answering a reply. A
-- manual task ("return the drawings", "invoice the deposit") is left alone.
-- Lost also cancels any open site-visit task, which no longer has a purpose.
create or replace function public.decide_opportunity(
  p_opportunity_id uuid,
  p_outcome text,
  p_on date default null,
  p_value numeric default null,
  p_reason text default null,
  p_notes text default null,
  p_review_on date default null)
returns void language plpgsql security definer set search_path = public as $$
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
    update public.tasks set status = 'cancelled',                    -- CHANGED
           notes = coalesce(notes || E'\n', '') || 'Cancelled: enquiry won.'
     where opportunity_id = o.id and status = 'open'
       and task_type in ('enquiry_response', 'quote_followup', 'customer_reply');
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
    update public.tasks set status = 'cancelled',                    -- CHANGED
           notes = coalesce(notes || E'\n', '') || 'Cancelled: enquiry lost.'
     where opportunity_id = o.id and status = 'open'
       and task_type in ('enquiry_response', 'quote_followup', 'customer_reply', 'site_visit');
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
end $$;

-- ── 8. a quotation version's own document ────────────────────────────────────
alter table public.files add column if not exists quote_id uuid
  references public.quotes(id) on delete set null;
create index if not exists files_quote_idx on public.files (quote_id) where quote_id is not null;

-- ── 9. notifications ─────────────────────────────────────────────────────────
-- Settings. The old `email_mode` stays (the send-email function reads it):
--   manual — nothing leaves (the default, and the state today)
--   test   — everything goes to test_mailbox and nowhere else
--   live   — real recipients; an administrator turns this on deliberately
-- `mail_status` is written by the dispatcher each time it runs, so the CRM
-- can say truthfully whether a provider is configured.

alter table public.crm_settings drop constraint if exists crm_settings_email_mode_check;
update public.crm_settings set email_mode = 'manual' where email_mode = 'connected';
alter table public.crm_settings add constraint crm_settings_email_mode_check
  check (email_mode in ('manual', 'test', 'live'));

alter table public.crm_settings
  add column if not exists alert_recipients text[] not null default '{}',
  add column if not exists digest_recipients text[] not null default '{}',
  add column if not exists notify_new_enquiry boolean not null default true,
  add column if not exists send_acknowledgement boolean not null default true,
  add column if not exists digest_enabled boolean not null default true,
  add column if not exists digest_hour smallint not null default 7
    check (digest_hour between 5 and 11),
  add column if not exists crm_url text,
  add column if not exists mail_status text not null default 'unknown',
  add column if not exists mail_checked_at timestamptz;

create table if not exists public.notification_outbox (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('new_enquiry', 'acknowledgement', 'digest')),
  dedupe_key text not null unique,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  enquiry_id uuid,
  recipient text,
  payload jsonb not null default '{}',
  status text not null default 'pending'
    check (status in ('pending', 'sending', 'sent', 'failed', 'skipped')),
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists outbox_pending_idx on public.notification_outbox (created_at)
  where status in ('pending', 'failed');

alter table public.notification_outbox enable row level security;
drop policy if exists outbox_admin_read on public.notification_outbox;
create policy outbox_admin_read on public.notification_outbox
  for select to authenticated using (public.is_admin());
revoke all on public.notification_outbox from anon;
-- No insert/update policy: only the functions below (security definer) and
-- the dispatcher (service role) write to it.

-- Wake the dispatcher now rather than at the next minute. Best effort: if
-- pg_net or the secrets are missing, the cron sweep picks the row up later,
-- and the enquiry itself is never affected by a notification failing.
create or replace function public.kick_dispatcher()
returns void language plpgsql security definer set search_path = public as $$
declare v_url text; v_secret text;
begin
  begin
    select decrypted_secret into v_url from vault.decrypted_secrets where name = 'dispatch_url';
    select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'dispatch_secret';
    if v_url is not null and v_secret is not null then
      perform net.http_post(url := v_url,
                            headers := jsonb_build_object('Content-Type', 'application/json',
                                                          'x-dispatch-secret', v_secret),
                            body := '{"job":"outbox"}'::jsonb);
    end if;
  exception when others then
    null;
  end;
end $$;

create or replace function public.queue_new_enquiry_alert(p_opportunity_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.notification_outbox (kind, dedupe_key, opportunity_id)
  values ('new_enquiry', 'new_enquiry:' || p_opportunity_id, p_opportunity_id)
  on conflict (dedupe_key) do nothing;
end $$;

-- After a website enquiry is committed-to-be: one staff alert per enquiry, and
-- one acknowledgement per enquiry if (and only if) the visitor gave an email
-- address. Spam and demonstration rows produce nothing. AFTER INSERT, so
-- convert_enquiry (BEFORE INSERT) has already created the opportunity; the
-- outbox row is in the same transaction, so nothing is queued for a save
-- that rolls back.
-- RECONCILE: enquiries.spam / opportunity_id / is_demo names.
create or replace function public.enquiry_queue_notifications()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_email text;
begin
  if coalesce(new.spam, false) or coalesce(new.is_demo, false) or new.opportunity_id is null then
    return new;
  end if;
  perform public.queue_new_enquiry_alert(new.opportunity_id);
  v_email := public.norm_email(new.contact);
  if v_email ~ '^[^@\s]+@[^@\s]+\.[a-z]{2,}$' then
    insert into public.notification_outbox (kind, dedupe_key, opportunity_id, enquiry_id, recipient)
    values ('acknowledgement', 'ack:' || new.id, new.opportunity_id, new.id, v_email)
    on conflict (dedupe_key) do nothing;
  end if;
  perform public.kick_dispatcher();
  return new;
end $$;
drop trigger if exists enquiry_queue_notifications on public.enquiries;
create trigger enquiry_queue_notifications after insert on public.enquiries
  for each row execute function public.enquiry_queue_notifications();

-- The dispatcher claims work with this, so two runs can never send the same
-- row: the UPDATE … RETURNING takes each row exactly once.
create or replace function public.claim_outbox(p_limit integer default 20)
returns setof public.notification_outbox
language sql security definer set search_path = public as $$
  update public.notification_outbox o
     set status = 'sending', attempts = o.attempts + 1
   where o.id in (select id from public.notification_outbox
                   where status = 'pending' or (status = 'failed' and attempts < 5
                                                and created_at > now() - interval '2 days')
                   order by created_at limit p_limit
                   for update skip locked)
  returning o.*;
$$;
revoke execute on function public.claim_outbox(integer) from public, anon, authenticated;

-- ── 10. management summary ───────────────────────────────────────────────────
-- Counts and values for a period, straight from the records. Response time is
-- derived from the timeline (first logged contact by a person, or the first
-- move out of New) and time to quote from quotes.sent_at, so no second copy
-- of either fact exists to drift.

create or replace function public.management_summary(p_from date, p_to date,
                                                     p_include_demo boolean default false)
returns jsonb language sql stable security invoker set search_path = public as $$
  with o as (
    select * from public.opportunities
     where (p_include_demo or not is_demo)
  ),
  inp as (
    select * from o where (created_at at time zone 'Africa/Harare')::date between p_from and p_to
  ),
  firsts as (
    select i.id, i.created_at,
           (select min(a.occurred_at) from public.activities a
             where a.opportunity_id = i.id and a.actor_id is not null
               and a.kind in ('call', 'email', 'whatsapp', 'meeting', 'note', 'stage_change', 'site_visit', 'quote')) first_touch,
           (select min(q.sent_at) from public.quotes q where q.opportunity_id = i.id and q.sent_at is not null) first_quote
      from inp i
  ),
  sent as (
    select q.* from public.quotes q join o on o.id = q.opportunity_id
     where q.sent_at is not null
       and (q.sent_at at time zone 'Africa/Harare')::date between p_from and p_to
  ),
  decided as (
    select * from o where stage in ('won', 'lost') and decided_at is not null
       and (decided_at at time zone 'Africa/Harare')::date between p_from and p_to
  )
  select jsonb_build_object(
    'from', p_from, 'to', p_to,
    'enquiries', (select count(*) from inp),
    'by_source', coalesce((select jsonb_object_agg(source, n) from
                   (select source::text, count(*) n from inp group by source) s), '{}'),
    'by_service', coalesce((select jsonb_object_agg(coalesce(service, 'Not stated'), n) from
                   (select service, count(*) n from inp group by service) s), '{}'),
    'quotes_sent', (select count(*) from sent),
    'quoted_value', coalesce((select jsonb_object_agg(currency, v) from
                   (select currency, sum(amount) v from sent group by currency) s), '{}'),
    'won', (select count(*) from decided where stage = 'won'),
    'won_value', coalesce((select jsonb_object_agg(currency, v) from
                   (select currency, sum(won_value) v from decided where stage = 'won' group by currency) s), '{}'),
    'lost', (select count(*) from decided where stage = 'lost'),
    'lost_reasons', coalesce((select jsonb_object_agg(coalesce(lost_reason, 'Not recorded'), n) from
                   (select lost_reason, count(*) n from decided where stage = 'lost' group by lost_reason) s), '{}'),
    'win_rate_quoted', (select round(100.0 * count(*) filter (where d.stage = 'won')
                                     / nullif(count(*), 0))
                          from decided d
                         where exists (select 1 from public.quotes q
                                        where q.opportunity_id = d.id and q.sent_at is not null)),
    'avg_hours_to_first_response', (select round(avg(extract(epoch from first_touch - created_at) / 3600)::numeric, 1)
                                      from firsts where first_touch is not null),
    'avg_days_to_quote', (select round(avg(extract(epoch from first_quote - created_at) / 86400)::numeric, 1)
                            from firsts where first_quote is not null)
  );
$$;

-- ── grants ───────────────────────────────────────────────────────────────────
-- The project revokes execute from anon by default (20260922_quote_lifecycle).
-- Staff functions to `authenticated`; the website's one function to `anon`.
revoke execute on function public.norm_phone(text), public.norm_email(text) from public, anon;
grant execute on function public.norm_phone(text), public.norm_email(text) to authenticated, service_role;
grant execute on function public.find_contact_matches(text, text, text, text) to authenticated;
grant execute on function public.create_enquiry(text, text, text, text, text, text, uuid, text, text, text,
                                               text, text, uuid, text, date, boolean, text, boolean)
  to authenticated, service_role;
grant execute on function public.global_search(text, boolean, integer) to authenticated;
grant execute on function public.management_summary(date, date, boolean) to authenticated;
grant execute on function public.submit_enquiry(jsonb) to anon, authenticated;
revoke execute on function public.kick_dispatcher(), public.queue_new_enquiry_alert(uuid),
                           public.enquiry_queue_notifications(), public.tasks_type_from_origin()
  from public, anon, authenticated;
