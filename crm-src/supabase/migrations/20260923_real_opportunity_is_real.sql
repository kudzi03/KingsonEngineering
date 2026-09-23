-- A contact or company that a real opportunity points at is real.
--
-- The website enquiry trigger de-duplicates contacts by phone/email. When a
-- real enquiry matches a contact that was flagged is_demo (a test submission
-- from the same number), the new, real opportunity is attached to a demo
-- contact and demo company. Found live on 23 Sept 2026: ENQ-2452 (is_demo =
-- false) pointed at contact "Kudzayi Pagiwa" and company "VelaBuilt", both
-- is_demo = true. Two consequences:
--   · the contact disappears from the Contacts list, which hides demo rows;
--   · tools/wipe-demo.sql deletes that contact and company from under a live
--     opportunity.
--
-- This does not touch convert_enquiry() (its body is not in the repository).
-- It adds a rule at the table instead, so every path that creates or re-points
-- a real opportunity is covered, and it backfills the rows already affected.
-- Idempotent. Rollback: drop the trigger and function; the backfill only ever
-- sets is_demo = false on rows a real opportunity references.

create or replace function public.promote_opportunity_parties()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not new.is_demo then
    update public.contacts  set is_demo = false where id = new.contact_id and is_demo;
    update public.companies set is_demo = false where id = new.company_id and is_demo;
  end if;
  return null;
end $$;

revoke execute on function public.promote_opportunity_parties() from public, anon, authenticated;

drop trigger if exists opportunities_promote_parties on public.opportunities;
create trigger opportunities_promote_parties
  after insert or update of contact_id, company_id, is_demo on public.opportunities
  for each row execute function public.promote_opportunity_parties();

-- Backfill.
update public.contacts c set is_demo = false
 where c.is_demo and exists (select 1 from public.opportunities o where o.contact_id = c.id and not o.is_demo);
update public.companies c set is_demo = false
 where c.is_demo and exists (select 1 from public.opportunities o where o.company_id = c.id and not o.is_demo);
