-- 2026-09-21 — a quotation reference has to name the enquiry it belongs to.
--
-- The column defaulted to Q-#### from its own sequence, so a quote created in
-- the application came out as "Q-1216" while every quote already on record
-- read "Q-2404-1" — the opportunity's number and the revision. Two schemes in
-- one table, and the wrong one was the one the system actually produced. In a
-- demonstration that reads as the system being broken.
--
-- The reference is derived now: ENQ-2443 revision 1 becomes Q-2443-1, and a
-- re-price of the same job becomes Q-2443-2.

create or replace function public.set_quote_reference()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
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
end $$;

drop trigger if exists set_quote_reference on public.quotes;
create trigger set_quote_reference
  before insert on public.quotes
  for each row execute function public.set_quote_reference();

update public.quotes q
   set reference = 'Q-' || substring(o.ref from '[0-9]+$') || '-' || q.version
  from public.opportunities o
 where o.id = q.opportunity_id
   and q.reference ~ '^Q-[0-9]{4}$';

-- A revision number is what distinguishes two quotes on one job, so two rows
-- must never share it: that is exactly the case that would produce two quotes
-- carrying the same reference.
create unique index if not exists quotes_opportunity_version_key
  on public.quotes (opportunity_id, version);
create unique index if not exists quotes_reference_key
  on public.quotes (reference);
