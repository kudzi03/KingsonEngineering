-- ═══════════════════════════════════════════════════════════════════════════
-- Quote lifecycle — the transitions that carry business logic
--
-- Applied after 20260922_lifecycle_enums (opp_stage 'on_hold', activity_kind
-- 'reply' and 'on_hold'), which has to commit on its own because Postgres will
-- not use a new enum value inside the transaction that adds it.
--
-- What this gives the CRM:
--   · one settings row: follow-up working days, working weekdays, email mode
--   · quotations recorded as numbered revisions; the customer never supplies
--     a value, so an opportunity with no quotation has no value — null, not 0
--   · "quote sent" stamps the exact time and the user and books the follow-up
--     N working days later, replacing whatever next action was there before
--   · follow-up, customer-replied, won, lost and on-hold as server functions,
--     so the rules hold no matter which screen calls them
--   · dashboard metrics computed in one place, demo rows excluded by default
--   · anon loses every privilege it never needed
-- ═══════════════════════════════════════════════════════════════════════════

-- ── settings ─────────────────────────────────────────────────────────────────
create table if not exists public.crm_settings (
  id boolean primary key default true check (id),
  quote_followup_working_days integer not null default 3
    check (quote_followup_working_days between 1 and 30),
  -- ISO weekdays, 1 = Monday. Kingson works Monday to Saturday.
  working_weekdays smallint[] not null default '{1,2,3,4,5,6}',
  -- manual:    nothing is sent by the CRM; staff send from their own mailbox
  --            and record it here.
  -- test:      outgoing mail may only go to test_mailbox.
  -- connected: Kingson's own mailbox is connected. Not available until the
  --            credentials exist; see send-email/index.ts.
  email_mode text not null default 'manual'
    check (email_mode in ('manual', 'test', 'connected')),
  test_mailbox text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);
insert into public.crm_settings (id) values (true) on conflict do nothing;

alter table public.crm_settings enable row level security;
drop policy if exists crm_settings_read on public.crm_settings;
create policy crm_settings_read on public.crm_settings
  for select to authenticated using (public.is_staff());
drop policy if exists crm_settings_admin_update on public.crm_settings;
create policy crm_settings_admin_update on public.crm_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.crm_settings from anon;

create or replace function public.add_working_days(d date, n integer)
returns date language plpgsql stable security definer set search_path = public as $$
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
end $$;

create or replace function public.harare_today()
returns date language sql stable as $$
  select (now() at time zone 'Africa/Harare')::date;
$$;

-- ── columns ──────────────────────────────────────────────────────────────────
alter table public.opportunities
  add column if not exists won_value numeric,
  add column if not exists lost_reason_code text,
  add column if not exists hold_reason text,
  add column if not exists hold_review_on date,
  add column if not exists customer_replied_at timestamptz;

alter table public.opportunities drop constraint if exists opportunities_won_value_sane;
alter table public.opportunities add constraint opportunities_won_value_sane
  check (won_value is null or won_value >= 0);
alter table public.opportunities drop constraint if exists opportunities_lost_reason_code_known;
alter table public.opportunities add constraint opportunities_lost_reason_code_known
  check (lost_reason_code is null or lost_reason_code in
    ('price', 'competitor', 'timing', 'project_cancelled', 'scope_changed', 'no_response', 'other'));

alter table public.quotes
  add column if not exists sent_at timestamptz,
  add column if not exists sent_by uuid references public.profiles(id) on delete set null,
  add column if not exists document_ref text;

-- ── labels and openness ──────────────────────────────────────────────────────
-- on_hold stays "open": it is undecided, it keeps its history, and it comes
-- back on its review date. The dashboard counts it separately.
create or replace function public.stage_label(s opp_stage)
returns text language sql immutable as $$
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
$$;

-- ── stage changes ────────────────────────────────────────────────────────────
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
      -- Coming back off hold: the review reminder has done its job, unless
      -- the same statement booked something else in its place.
      if old.stage = 'on_hold' and new.next_action is not distinct from old.next_action then
        new.next_action := null;
        new.next_action_due := null;
      end if;
    end if;

    -- The auto-created "respond to the website enquiry" task is answered the
    -- moment someone moves the enquiry on.
    if old.stage = 'new' then
      update public.tasks
         set status = 'done', completed_at = now(), completed_by = auth.uid()
       where opportunity_id = new.id and status = 'open'
         and title like 'Respond to website enquiry%';
    end if;
  end if;
  new.last_activity_at := now();
  return new;
end $$;

-- ── quotes ───────────────────────────────────────────────────────────────────
create or replace function public.quote_before_write()
returns trigger language plpgsql security definer set search_path = public as $$
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
end $$;

drop trigger if exists quote_before_write on public.quotes;
create trigger quote_before_write before insert or update on public.quotes
  for each row execute function public.quote_before_write();

create or replace function public.log_quote_event()
returns trigger language plpgsql security definer set search_path = public as $$
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
                when 'discussed' then 'customer responded'
                when 'accepted'  then 'accepted'
                when 'rejected'  then 'not accepted'
                when 'expired'   then 'expired'
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

    -- Sending a quotation always replaces the next action: whatever was
    -- booked before ("prepare the BOQ") is finished by definition.
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
end $$;

-- ── workflow functions ───────────────────────────────────────────────────────
create or replace function public.record_quote(
  p_opportunity_id uuid,
  p_amount numeric,
  p_currency text default 'USD',
  p_prepared_on date default null,
  p_valid_until date default null,
  p_notes text default null,
  p_reference text default null,
  p_document_ref text default null)
returns public.quotes language plpgsql security definer set search_path = public as $$
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

  -- A recorded quotation (first or revision) means the next move is sending
  -- it. An opportunity on hold keeps its review reminder.
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
end $$;

create or replace function public.mark_quote_sent(
  p_quote_id uuid,
  p_sent_at timestamptz default null,
  p_follow_up_on date default null,
  p_channel text default 'email',
  p_notes text default null)
returns public.quotes language plpgsql security definer set search_path = public as $$
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
end $$;

create or replace function public.log_follow_up(
  p_opportunity_id uuid,
  p_channel text,
  p_notes text,
  p_at timestamptz default null,
  p_next_action text default null,
  p_next_due date default null)
returns void language plpgsql security definer set search_path = public as $$
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
end $$;

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

  if o.stage in ('won', 'lost') then return; end if;

  -- The chase stops: the next move is ours.
  update public.opportunities
     set customer_replied_at = coalesce(p_at, now()),
         stage = case when stage = 'quote_sent' then 'followup'::opp_stage else stage end,
         next_action = 'Respond to customer reply',
         next_action_due = public.harare_today()
   where id = o.id;
end $$;

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
end $$;

-- ── dashboard metrics ────────────────────────────────────────────────────────
-- Money is summed per currency and only from recorded figures. An opportunity
-- without a quotation contributes a count to "not quoted yet", never a zero.
create or replace function public.dashboard_metrics(p_include_demo boolean default false)
returns jsonb language sql stable security invoker set search_path = public as $$
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
$$;

-- ── the view ─────────────────────────────────────────────────────────────────
create or replace view public.v_opportunity_state with (security_invoker = true) as
 select o.id, o.ref, o.title, o.company_id, o.contact_id, o.owner_id, o.stage, o.priority,
    o.source, o.service, o.description, o.estimated_value, o.currency, o.location,
    o.site_visit_required, o.next_action, o.next_action_due, o.last_activity_at,
    o.decided_at, o.lost_reason, o.created_at, o.updated_at,
    c.name as company_name,
    p.full_name as contact_name, p.phone as contact_phone,
    p.whatsapp as contact_whatsapp, p.email as contact_email,
    pr.full_name as owner_name, pr.initials as owner_initials,
    opp_stage_is_open(o.stage) as is_open,
    stage_label(o.stage) as stage_name,
    o.next_action_due - (now() at time zone 'Africa/Harare')::date as days_until_due,
    (select count(*) from quotes q
      where q.opportunity_id = o.id and q.status in ('sent', 'discussed')) as live_quotes,
    (select max(q.sent_on) from quotes q
      where q.opportunity_id = o.id and q.sent_on is not null) as last_quote_sent,
    case
      when not opp_stage_is_open(o.stage) then 'closed'
      when o.stage = 'on_hold' and o.hold_review_on > (now() at time zone 'Africa/Harare')::date then 'held'
      when o.next_action_due is null then 'unbooked'
      when o.next_action_due < (now() at time zone 'Africa/Harare')::date then 'overdue'
      when o.next_action_due = (now() at time zone 'Africa/Harare')::date then 'today'
      when o.next_action_due <= (now() at time zone 'Africa/Harare')::date + 7 then 'soon'
      else 'clear'
    end as attention,
    o.is_demo,
    lq.amount as quoted_value,
    lq.currency as quote_currency,
    lq.status as quote_status,
    lq.reference as quote_ref,
    lq.version as quote_version,
    lq.sent_at as quote_sent_at,
    o.won_value,
    o.lost_reason_code,
    o.hold_reason,
    o.hold_review_on,
    o.customer_replied_at
   from opportunities o
     left join companies c on c.id = o.company_id
     left join contacts p on p.id = o.contact_id
     left join profiles pr on pr.id = o.owner_id
     left join lateral (
       select q.amount, q.currency, q.status, q.reference, q.version, q.sent_at
         from quotes q
        where q.opportunity_id = o.id and q.status <> 'rejected'
        order by q.version desc, q.created_at desc
        limit 1) lq on true;

-- ── projects take the won value ──────────────────────────────────────────────
create or replace function public.convert_to_project(
  p_opportunity_id uuid, p_name text default null,
  p_start_date date default null, p_target_date date default null)
returns uuid language plpgsql security definer set search_path = public as $$
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
end $$;

-- ── backfill ─────────────────────────────────────────────────────────────────
-- Demonstration rows that were already won take the value of their accepted
-- (or latest) quotation. Triggers are held off so last_activity_at is not
-- rewritten to today.
alter table public.opportunities disable trigger opportunities_stage_history;
alter table public.opportunities disable trigger opportunities_touch;
update public.opportunities o
   set won_value = coalesce(
         (select amount from public.quotes q where q.opportunity_id = o.id and q.status = 'accepted'
           order by version desc limit 1),
         (select amount from public.quotes q where q.opportunity_id = o.id
           order by version desc limit 1),
         o.estimated_value)
 where o.stage = 'won' and o.won_value is null;
update public.quotes set sent_at = (sent_on + time '10:00') at time zone 'Africa/Harare'
 where sent_on is not null and sent_at is null;
alter table public.opportunities enable trigger opportunities_touch;
alter table public.opportunities enable trigger opportunities_stage_history;

-- ── privileges ───────────────────────────────────────────────────────────────
-- anon writes one thing: a row in public.enquiries. It needs nothing else.
-- Trigger functions do not need EXECUTE to fire, so revoking it is safe.
revoke all on public.v_opportunity_state from anon;
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      left join pg_depend d on d.objid = p.oid and d.deptype = 'e'
     where n.nspname = 'public' and d.objid is null
  loop
    execute format('revoke execute on function %s from public, anon', r.sig);
    execute format('grant execute on function %s to authenticated, service_role', r.sig);
  end loop;
end $$;
alter default privileges in schema public revoke execute on functions from public, anon;
