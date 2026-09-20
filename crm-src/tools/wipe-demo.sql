-- ═══════════════════════════════════════════════════════════════════════════
-- tools/wipe-demo.sql — remove the demonstration dataset, and only that
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Every statement below ends in `where is_demo`. That column defaults to false,
-- so a real enquiry — whether it came through the website or was typed in by
-- somebody at a desk — is production data by construction and cannot be caught
-- by this script. There is deliberately no name matching, no date range and no
-- "delete everything before the demo": a wipe keyed on `title like 'QA%'` will
-- eventually delete a customer called QA Holdings.
--
--   psql "$DATABASE_URL" -f tools/wipe-demo.sql
--
-- Safe to run when nothing is seeded; every statement simply matches no rows.
-- Also run by tools/seed-demo.sql before it re-seeds, which is what makes that
-- script re-runnable.
--
-- Children before parents, because the foreign keys are RESTRICT by design:
-- nothing in this system should be able to delete a customer and silently take
-- their history with it.
-- ═══════════════════════════════════════════════════════════════════════════

delete from public.activities  where is_demo;
delete from public.tasks       where is_demo;
delete from public.files       where is_demo;
delete from public.quotes      where is_demo;
delete from public.site_visits where is_demo;
delete from public.projects    where is_demo;
delete from public.enquiries   where is_demo;

-- Anything still pointing at a demo opportunity is something somebody added
-- during a demonstration — a note logged against a demo record, or a row a
-- trigger wrote and did not stamp. The foreign keys are RESTRICT, so these
-- have to be dealt with before the opportunities go.
--
-- `activities_attached` requires every activity to hang off at least one of an
-- opportunity, a project or a contact, so a blanket detach is not available:
-- it would leave rows attached to nothing and the constraint would refuse.
-- Detach the ones that have somewhere else to live; delete the ones that do
-- not, because a note reachable only through a record being deleted is not
-- reachable at all once it is gone.
update public.activities set opportunity_id = null
 where opportunity_id in (select id from public.opportunities where is_demo)
   and (project_id is not null
        or contact_id in (select id from public.contacts where not is_demo));

delete from public.activities
 where opportunity_id in (select id from public.opportunities where is_demo);

-- Tasks have no such constraint, so a task somebody created during a demo can
-- simply lose its link and stay on their list.
update public.tasks set opportunity_id = null
  where opportunity_id in (select id from public.opportunities where is_demo);

delete from public.opportunities where is_demo;
delete from public.contacts      where is_demo;
delete from public.companies     where is_demo;
