-- A sent revision replaces every earlier revision still in play, so only one
-- quotation per opportunity is ever "live". Two statements because a new enum
-- value must commit before it can be used.

alter type public.quote_status add value if not exists 'superseded';

-- ── second migration ─────────────────────────────────────────────────────────
alter table public.quotes drop constraint quotes_sent_has_date;
alter table public.quotes add constraint quotes_sent_has_date check (
  status in ('draft', 'expired', 'superseded') or sent_on is not null);

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
