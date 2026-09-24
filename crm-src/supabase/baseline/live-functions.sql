-- Live function bodies, exported 2026-09-25 (read-only catalogue query).

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

