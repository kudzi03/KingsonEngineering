-- ═══════════════════════════════════════════════════════════════════════════
-- tools/seed-demo.sql — the demonstration dataset
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Nine enquiries at nine different points in the pipeline, with the quotations,
-- site visits, activities and tasks that go with them. It exists so the CRM can
-- be shown working without anybody having to type a morning's work in first.
--
-- IT IS NOT PRODUCTION DATA AND MUST NEVER BE RUN ON A LIVE DATABASE.
-- Every row it writes is stamped `is_demo = true`, which is the only thing
-- tools/wipe-demo.sql looks at. Real enquiries carry is_demo = false and that
-- script cannot touch them, however carelessly it is run.
--
-- Re-runnable. It wipes the demo set first, so running it twice gives one copy,
-- not two, and the dates are always relative to today — a dataset seeded last
-- week still shows three things overdue rather than everything.
--
--   psql "$DATABASE_URL" -f tools/seed-demo.sql
--
-- Owners are matched by role to whatever profiles exist. If a role is unfilled
-- those rows are left unassigned rather than the script failing.
-- ═══════════════════════════════════════════════════════════════════════════

-- Run tools/wipe-demo.sql first. Under psql:  \i tools/wipe-demo.sql
-- Everything below assumes the demo set is already gone, which is what makes
-- this script re-runnable.

-- Two views rather than temporary tables, so this file behaves the same run
-- through psql, through a migration, or pasted into a SQL console — none of
-- which agree about when a transaction begins.
-- Matched on role, not on an address. The email lives in auth.users, which the
-- application never reads and a seed script has no business reaching into; and
-- a demo that breaks because somebody was set up under a different address is
-- a demo that breaks on the morning it is needed. Whoever is admin owns the
-- admin rows. If a role is unfilled those rows are left unassigned, which the
-- follow-up queue already shows as "nothing booked" rather than failing.
create or replace view public._seed_who as select
  (select p.id from public.profiles p where p.role = 'admin' and p.active order by p.created_at limit 1) as admin_id,
  (select p.id from public.profiles p where p.role = 'staff' and p.active order by p.created_at limit 1) as staff_id;

-- Today, in Harare. Every date below is an offset from this, so the demo never
-- goes stale: "three overdue" stays three overdue next month.
create or replace view public._seed_today as
  select (now() at time zone 'Africa/Harare')::date as d;

-- ── companies ────────────────────────────────────────────────────────────────
insert into public.companies (name, kind, town, notes, is_demo) values
  ('Borrowdale Brooke Poultry',     'Agriculture',        'Harare',      'Two houses done in 2024. Pays on terms.', true),
  ('Chiremba Ridge Developments',   'Property',           'Harare',      'Main contractor. Wants a BOQ, not a price.', true),
  ('Highfield Metal Works',         'Fabrication',        'Harare',      'Sub-contracts cutting to us. Repeat.', true),
  ('Ruwa Industrial Park',          'Industrial estates', 'Ruwa',        'Estates manager handles all units.', true),
  ('Nyanga Lodge Holdings',         'Hospitality',        'Nyanga',      'Slow decisions. Worth chasing.', true),
  ('Msasa Park Logistics',          'Transport',          'Harare',      'New. Came in off the website.', true),
  ('Zvimba Grain Handlers',         'Agriculture',        'Chinhoyi',    'Won. Platform is in fabrication.', true),
  ('Glen Lorne Estate',             'Residential',        'Harare',      'Private client, architect-led.', true);

-- ── contacts ─────────────────────────────────────────────────────────────────
insert into public.contacts (company_id, full_name, job_title, email, phone, whatsapp, preferred_channel, is_demo)
select c.id, v.full_name, v.job_title, v.email, v.phone, v.phone, v.channel, true
from (values
  ('Borrowdale Brooke Poultry',   'Rutendo Banda',  'Operations Manager', 'rutendo@bbpoultry.co.zw',     '+263772110341', 'WhatsApp'),
  ('Chiremba Ridge Developments', 'Farai Nyathi',   'Project Manager',    'f.nyathi@chirembaridge.co.zw','+263773884120', 'Email'),
  ('Highfield Metal Works',       'Kuda Marange',   'Workshop Manager',   'kuda@highfieldmetal.co.zw',   '+263712447901', 'WhatsApp'),
  ('Ruwa Industrial Park',        'Anesu Chirwa',   'Estates Manager',    'a.chirwa@ruwapark.co.zw',     '+263772903615', 'Email'),
  ('Ruwa Industrial Park',        'Tapiwa Mhlanga', 'Site Foreman',       null,                          '+263775512208', 'Phone'),
  ('Nyanga Lodge Holdings',       'Nomsa Sibanda',  'General Manager',    'nomsa@nyangalodge.co.zw',     '+263778330147', 'WhatsApp'),
  ('Msasa Park Logistics',        'Grace Mutasa',   'Director',           'grace@msasaparklog.co.zw',    '+263712009884', 'WhatsApp'),
  ('Zvimba Grain Handlers',       'Simba Dube',     'Plant Engineer',     's.dube@zvimbagrain.co.zw',    '+263773661029', 'Email'),
  ('Glen Lorne Estate',           'Tendai Moyo',    'Owner',             'tendai.moyo@example.co.zw',    '+263772445180', 'WhatsApp')
) as v(company, full_name, job_title, email, phone, channel)
join public.companies c on c.name = v.company and c.is_demo;

-- ── the nine opportunities ───────────────────────────────────────────────────
-- One in each stage, plus a second in `new`, so every column of the board has
-- something in it and the stage rules can be demonstrated on real rows.
--
-- `next_action_due` is an offset from today. Three are negative on purpose:
-- the follow-up queue is the screen this application exists for, and it has
-- nothing to show unless something is actually late. ENQ-2407 is left with no
-- next action at all — that is the "open, with nothing booked" case, which is
-- where enquiries are really lost.
insert into public.opportunities
  (ref, title, company_id, contact_id, owner_id, stage, priority, source, service,
   description, location, estimated_value, currency, site_visit_required,
   next_action, next_action_due, lost_reason, created_at, is_demo)
select v.ref, v.title, ct.company_id, ct.id,
       -- A null owner has to stay null. ENQ-2407 is the unassigned,
       -- nothing-booked case the follow-up queue exists to surface, and a
       -- CASE that falls through to staff quietly takes it away.
       case v.owner when 'admin' then w.admin_id
                    when 'staff' then w.staff_id end,
       v.stage::opp_stage, v.priority::opp_priority, v.source::enquiry_source,
       v.service, v.description, v.location, v.value, 'USD', v.visit,
       v.next_action, case when v.due_in is null then null else t.d + v.due_in end,
       -- opportunities_lost_has_reason is checked on INSERT, so a lost row has
       -- to arrive with its reason rather than be given one afterwards.
       case when v.stage = 'lost'
            then 'Price — the client accepted a lower sheeting specification.' end,
       (now() - (v.age_days || ' days')::interval), true
from (values
  ('ENQ-2401', 'Estate entrance gates and guardhouse screens',
   'Tendai Moyo',    'staff', 'quoting',      'normal', 'website',
   'Balustrades and gates',
   'Two leaf gates 4.5 m and 3.0 m, plus perforated screens to the guardhouse. Architect has elevations.',
   'Glen Lorne, Harare',        8600, false, 'Finish the BOQ and price the perforation', 2, 9),

  ('ENQ-2402', 'Broiler house re-roof — 2 200 m²',
   'Rutendo Banda',  'admin', 'requirements', 'normal', 'referral',
   'Roof steelwork and trusses',
   'Existing trusses stay. Strip and re-sheet in IBR 0.47, plus 40 new purlins where the old ones have gone.',
   'Borrowdale, Harare',       31500, true,  'Site visit Thursday — measure the purlin centres', 1, 12),

  ('ENQ-2403', 'Mixed-use block — structural frame',
   'Farai Nyathi',   'admin', 'quote_sent',   'high',   'website',
   'Structural steelwork',
   'Portal frame to the retail podium, 28 m clear span, 7.5 m eaves. Drawings issued for tender.',
   'Chiremba Road, Harare',   184000, false, 'Chase the tender decision', -4, 26),

  ('ENQ-2404', 'Laser-cut bracket sets — 400 off',
   'Kuda Marange',   'staff', 'quote_sent',   'normal', 'email',
   'Fiber laser cutting',
   '400 brackets, 6 mm mild steel, DXF supplied. Repeat of the March job with two holes moved.',
   'Highfield, Harare',         4200, false, 'Confirm the nesting and the delivery date', -1, 8),

  ('ENQ-2405', 'Unit 7 mezzanine and stair',
   'Anesu Chirwa',   'staff', 'quoting',      'normal', 'phone',
   'Structural steelwork',
   'Mezzanine 180 m² at 3.6 m, with a straight flight and a landing. Loading to be confirmed.',
   'Ruwa',                     46800, true,  'Price the stair separately as asked', 3, 11),

  ('ENQ-2406', 'Lodge walkway balustrades',
   'Nomsa Sibanda',  'staff', 'followup',     'low',    'referral',
   'Balustrades and gates',
   '70 m of balustrade to the walkway, stainless top rail on mild steel uprights, galvanised and painted.',
   'Nyanga',                   12400, false, 'Third chase — call rather than email this time', -9, 41),

  ('ENQ-2407', 'Yard gates and security screens',
   'Grace Mutasa',   null,    'new',          'normal', 'website',
   'Balustrades and gates',
   'Came in off the website on Friday. Two sliding gates to the yard and screens to the office windows.',
   'Msasa Park, Harare',        9800, true,  null, null, 4),

  ('ENQ-2408', 'Crane hire — plant relocation',
   'Tapiwa Mhlanga', 'admin', 'contacted',    'high',   'phone',
   'Mobile cranage',
   'Moving two presses across the yard. Heaviest is 9 t. Needs a Saturday.',
   'Ruwa',                      2600, true,  'Confirm the date and the access route', 1, 3),

  ('ENQ-2409', 'Silo access platform and ladder',
   'Simba Dube',     'admin', 'won',          'normal', 'referral',
   'Structural steelwork',
   'Access platform to the number 3 silo with a caged ladder. Order placed, in fabrication.',
   'Chinhoyi',                 27300, false, null, null, 34),

  ('ENQ-2410', 'Feed store frame and cladding',
   'Rutendo Banda',  'admin', 'lost',         'normal', 'phone',
   'Structural steelwork',
   'Lost on price. The client went with a cheaper sheeting spec we were not prepared to quote.',
   'Borrowdale, Harare',       38900, false, null, null, 58)
) as v(ref, title, contact_name, owner, stage, priority, source, service,
       description, location, value, visit, next_action, due_in, age_days)
join public.contacts ct on ct.full_name = v.contact_name and ct.is_demo
cross join public._seed_who w cross join public._seed_today t;

-- ── quotations ───────────────────────────────────────────────────────────────
insert into public.quotes (opportunity_id, reference, version, status, amount, currency,
                           prepared_on, sent_on, valid_until, follow_up_on, notes, is_demo)
select o.id, v.qref, v.version, v.status::quote_status, v.amount, 'USD',
       t.d - coalesce(v.sent_ago, 0) - 1,
       case when v.sent_ago is null then null else t.d - v.sent_ago end,
       t.d + v.valid_in,
       case when v.sent_ago is null then null else t.d - v.sent_ago + 7 end,
       v.notes, true
from (values
  ('ENQ-2403', 'Q-2403-2', 2, 'sent',  184000, 17,  4, 'Revision 2 — podium frame only, cladding excluded at the client''s request.'),
  ('ENQ-2404', 'Q-2404-1', 1, 'sent',    4200, 12,  1, 'Nested for one 3 000 × 1 500 sheet with 6 % offcut.'),
  ('ENQ-2406', 'Q-2406-1', 1, 'expired', 12400, -2, 41, 'Expired. If they come back this needs re-pricing on today''s steel.'),
  ('ENQ-2409', 'Q-2409-1', 1, 'accepted', 27300, 20, 30, 'Accepted 28 days ago. Deposit received.'),
  ('ENQ-2410', 'Q-2410-1', 1, 'rejected',  38900, -20, 55, 'Declined on price.'),
  ('ENQ-2401', 'Q-2401-1', 1, 'draft',    8600, 30, null, 'Draft. Perforation pattern not yet priced.')
) as v(ref, qref, version, status, amount, valid_in, sent_ago, notes)
join public.opportunities o on o.ref = v.ref and o.is_demo
cross join public._seed_today t;

-- ── site visits ──────────────────────────────────────────────────────────────
insert into public.site_visits (opportunity_id, owner_id, scheduled_at, status, location, purpose, outcome, is_demo)
select o.id, o.owner_id,
       (t.d + v.in_days)::timestamp + v.at_time,
       v.status::visit_status, o.location, v.purpose, v.outcome, true
from (values
  ('ENQ-2402',  1, time '09:00', 'scheduled', 'Measure the purlin centres and check the ridge line.', null),
  ('ENQ-2405',  3, time '14:00', 'scheduled', 'Confirm the mezzanine loading and the stair opening.', null),
  ('ENQ-2408',  1, time '07:30', 'scheduled', 'Walk the access route and check the overhead lines.', null),
  ('ENQ-2409', -26, time '10:00', 'completed', 'Measure the silo and check the ladder fixing.',
     'Silo shell sound. Ladder fixes to the existing lugs — no drilling needed.')
) as v(ref, in_days, at_time, status, purpose, outcome)
join public.opportunities o on o.ref = v.ref and o.is_demo
cross join public._seed_today t;

-- The quote and visit triggers write their own timeline entries, stamped with
-- now(). The seed writes the same events with the dates they actually happened,
-- which is what makes the demo read like a real month's work rather than like
-- everything arriving this afternoon — so the triggers' copies come straight
-- back out.
--
-- They are identifiable without guesswork: nothing else in this script has
-- written an activity yet, and a trigger never stamps is_demo.
delete from public.activities
 where not is_demo
   and opportunity_id in (select id from public.opportunities where is_demo);

-- The same triggers move the stage when a quotation goes out. The seed already
-- placed each opportunity in the stage it is meant to be demonstrated in, so
-- put them back.
update public.opportunities o set stage = v.stage::opp_stage
from (values ('ENQ-2401','quoting'), ('ENQ-2402','requirements'), ('ENQ-2403','quote_sent'),
             ('ENQ-2404','quote_sent'), ('ENQ-2405','quoting'), ('ENQ-2406','followup'),
             ('ENQ-2407','new'), ('ENQ-2408','contacted'), ('ENQ-2409','won'), ('ENQ-2410','lost')
     ) as v(ref, stage)
where o.ref = v.ref and o.is_demo and o.stage::text <> v.stage;

-- ── the timeline ─────────────────────────────────────────────────────────────
insert into public.activities (opportunity_id, contact_id, actor_id, kind, body, occurred_at, is_demo)
select o.id, o.contact_id, o.owner_id, v.kind::activity_kind, v.body,
       now() - (v.ago_days || ' days')::interval, true
from (values
  ('ENQ-2401', 'enquiry', 'Website enquiry received. Needs: Balustrades and gates. Site: Glen Lorne, Harare.', 9),
  ('ENQ-2401', 'call',    'Spoke to the owner. Architect is sending elevations for the screens.', 7),
  ('ENQ-2402', 'enquiry', 'Called in — referred by the 2024 job.', 12),
  ('ENQ-2402', 'call',    'Agreed a site visit. They want the house empty, so it has to be a Thursday.', 10),
  ('ENQ-2403', 'enquiry', 'Website enquiry received. Tender drawings attached.', 26),
  ('ENQ-2403', 'quote',   'Quotation Q-2403-1 sent — USD 212,000.00', 19),
  ('ENQ-2403', 'email',   'Client asked for the cladding to come out. Re-pricing.', 8),
  ('ENQ-2403', 'quote',   'Quotation Q-2403-2 sent — USD 184,000.00', 4),
  ('ENQ-2404', 'enquiry', 'Repeat — same brackets as March with two holes moved.', 8),
  ('ENQ-2404', 'quote',   'Quotation Q-2404-1 sent — USD 4,200.00', 1),
  ('ENQ-2405', 'enquiry', 'Estates manager asked us to look at Unit 7.', 11),
  ('ENQ-2405', 'meeting', 'Met on site. Loading still to be confirmed by their engineer.', 6),
  ('ENQ-2406', 'enquiry', 'Referred by the Nyanga contractor.', 41),
  ('ENQ-2406', 'quote',   'Quotation Q-2406-1 sent — USD 12,400.00', 41),
  ('ENQ-2406', 'email',   'First chase. No reply.', 28),
  ('ENQ-2406', 'email',   'Second chase. No reply.', 16),
  ('ENQ-2407', 'enquiry', 'Website enquiry received. Needs: Balustrades and gates. Site: Msasa Park, Harare.', 4),
  ('ENQ-2408', 'enquiry', 'Rang the office about moving two presses.', 3),
  ('ENQ-2408', 'call',    'Heaviest is 9 t. Needs a Saturday and the yard cleared.', 2),
  ('ENQ-2409', 'enquiry', 'Referred by the Chinhoyi miller.', 34),
  ('ENQ-2409', 'site_visit', 'Site visit completed. Ladder fixes to the existing lugs.', 26),
  ('ENQ-2409', 'quote',   'Quotation Q-2409-1 sent — USD 27,300.00', 30),
  ('ENQ-2409', 'won',     'Stage moved from Quote sent to Won', 28),
  ('ENQ-2410', 'enquiry', 'Second job from the poultry client.', 58),
  ('ENQ-2410', 'quote',   'Quotation Q-2410-1 sent — USD 38,900.00', 55),
  ('ENQ-2410', 'lost',    'Stage moved from Quote sent to Lost', 44)
) as v(ref, kind, body, ago_days)
join public.opportunities o on o.ref = v.ref and o.is_demo;

-- ── what is actually on somebody's list ──────────────────────────────────────
insert into public.tasks (title, opportunity_id, contact_id, owner_id, due_date,
                          status, priority, channel, notes, is_demo)
select v.title, o.id, o.contact_id, o.owner_id, t.d + v.due_in,
       v.status::task_status, v.priority::opp_priority, v.channel, v.notes, true
from (values
  ('Finish the BOQ and price the perforation', 'ENQ-2401',  2, 'open', 'normal', 'Email', 'Perforation pattern is the only open item.'),
  ('Site visit — measure the purlin centres',  'ENQ-2402',  1, 'open', 'normal', 'Phone', 'House has to be empty. Thursday only.'),
  ('Chase the tender decision',                'ENQ-2403', -4, 'open', 'high',   'Email', 'Revision 2 has been with them eleven days.'),
  ('Confirm the nesting and the delivery date','ENQ-2404', -1, 'open', 'normal', 'WhatsApp', null),
  ('Price the stair separately as asked',      'ENQ-2405',  3, 'open', 'normal', 'Email', 'Their engineer still owes us the loading.'),
  ('Third chase — call, do not email',         'ENQ-2406', -9, 'open', 'normal', 'Phone', 'Two emails ignored. The quotation has expired.'),
  ('Confirm the date and the access route',    'ENQ-2408',  1, 'open', 'high',   'Phone', 'Overhead lines on the north side.'),
  ('Book the platform delivery',               'ENQ-2409',  6, 'open', 'normal', 'Phone', 'Fabrication finishes next week.'),
  ('Send the revised frame drawings',          'ENQ-2403', -2, 'done', 'normal', 'Email', null)
) as v(title, ref, due_in, status, priority, channel, notes)
join public.opportunities o on o.ref = v.ref and o.is_demo
cross join public._seed_today t;

update public.tasks set completed_at = now() - interval '2 days' where status = 'done' and is_demo;

-- ── the one won job that became a project ────────────────────────────────────
insert into public.projects (name, opportunity_id, company_id, contact_id, owner_id,
                             status, start_date, target_date, value, currency, description, is_demo)
select 'Silo access platform and ladder', o.id, o.company_id, o.contact_id, o.owner_id,
       'in_progress'::project_status, t.d - 26, t.d + 12, 27300, 'USD',
       'Access platform to the number 3 silo with a caged ladder. Fabrication in the workshop, erection on site.', true
from public.opportunities o cross join public._seed_today t where o.ref = 'ENQ-2409' and o.is_demo;

insert into public.activities (project_id, contact_id, actor_id, kind, body, occurred_at, is_demo)
select p.id, p.contact_id, p.owner_id, 'system'::activity_kind,
       'Project opened from won opportunity ENQ-2409', now() - interval '26 days', true
from public.projects p where p.is_demo;

-- Triggers write their own rows — a quotation logs itself on the timeline, a
-- stage change logs itself — and they know nothing about is_demo. Anything
-- hanging off a demo record is demo data, so stamp it now rather than leave
-- the wipe to trip over it later.
update public.activities set is_demo = true
 where not is_demo
   and (opportunity_id in (select id from public.opportunities where is_demo)
     or project_id     in (select id from public.projects      where is_demo)
     or contact_id     in (select id from public.contacts      where is_demo));

update public.tasks set is_demo = true
 where not is_demo
   and (opportunity_id in (select id from public.opportunities where is_demo)
     or project_id     in (select id from public.projects      where is_demo));

-- The refs above are explicit, so bump the sequence past them. Without this a
-- real enquiry on a freshly seeded database would be handed ENQ-2401 and fail
-- the unique constraint.
select setval('public.opportunity_ref_seq',
              greatest((select last_value from public.opportunity_ref_seq), 2410));

drop view if exists public._seed_who;
drop view if exists public._seed_today;

-- What the demo now holds.
select 'companies' as table_name, count(*) from public.companies where is_demo
union all select 'contacts',      count(*) from public.contacts      where is_demo
union all select 'opportunities', count(*) from public.opportunities where is_demo
union all select 'quotes',        count(*) from public.quotes        where is_demo
union all select 'site_visits',   count(*) from public.site_visits   where is_demo
union all select 'activities',    count(*) from public.activities    where is_demo
union all select 'tasks',         count(*) from public.tasks         where is_demo
union all select 'projects',      count(*) from public.projects      where is_demo;
