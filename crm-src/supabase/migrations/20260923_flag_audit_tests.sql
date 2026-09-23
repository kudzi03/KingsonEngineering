-- Data, not schema. Two test submissions through the live website form, both
-- currently counted as REAL in the dashboard:
--
--   ENQ-2452  22 Sept, "Kudzayi Pagiwa" / VelaBuilt — the developer's own test.
--             De-duplicated by phone onto a contact and company that were
--             already flagged demo, so only the opportunity side is real.
--   ENQ-2453  23 Sept, "AUDIT TEST – ignore" / "Claude pre-client audit" — the
--             end-to-end test from the pre-client audit.
--
-- Flag both as demonstration data, with everything hanging off them, so
-- dashboard_metrics(false) is back to zero real opportunities and
-- tools/wipe-demo.sql removes them with the rest. Run once in the Supabase SQL
-- editor. Reversible: set is_demo = false on the same rows.
--
-- Note from 20260922_flag_test_enquiry.sql: that run disabled the
-- opportunities stage-history trigger during the update so last_activity_at
-- was not rewritten. That only matters for display; nothing here needs it.

begin;

with t(opp) as (values
  ('9941160f-dfa0-4346-a973-4dbc5613a4a4'::uuid),   -- ENQ-2452
  ('1e582fd7-34ac-407c-a663-9c5d8a6cc521'::uuid)    -- ENQ-2453
)
, o as (update public.opportunities set is_demo = true where id in (select opp from t)
        returning contact_id, company_id)
, e as (update public.enquiries  set is_demo = true where opportunity_id in (select opp from t) returning 1)
, k as (update public.tasks      set is_demo = true where opportunity_id in (select opp from t) returning 1)
, a as (update public.activities set is_demo = true where opportunity_id in (select opp from t) returning 1)
, c as (update public.contacts   set is_demo = true where id in (select contact_id from o) returning 1)
update public.companies set is_demo = true where id in (select company_id from o);

-- Expect 0.
select count(*) as real_opportunities from public.opportunities where not is_demo;

commit;
