-- Kingson CRM: production pre-check. One SELECT. Reads, changes nothing.
-- Staff accounts are listed (names, roles, sign-in dates); no customer data.
with
ext as (
  select a.name, a.default_version, a.installed_version
    from pg_available_extensions a
   where a.name in ('pg_trgm', 'pg_net', 'pg_cron')
),
people as (
  select p.full_name, p.role, p.active, p.created_at, p.updated_at, u.last_sign_in_at
    from public.profiles p
    left join auth.users u on u.id = p.id
),
digits as (
  select c.id,
         case when left(regexp_replace(coalesce(c.phone, ''), '\D', '', 'g'), 2) = '00'
              then substr(regexp_replace(coalesce(c.phone, ''), '\D', '', 'g'), 3)
              else regexp_replace(coalesce(c.phone, ''), '\D', '', 'g') end as d
    from public.contacts c
),
phones as (
  select case when length(d) = 10 and left(d, 1) = '0' then '263' || substr(d, 2)
              when length(d) = 9 and left(d, 1) between '1' and '9' then '263' || d
              else d end as n
    from digits
   where length(d) >= 7
),
out as (
  select 1 as seq, 'extension' as item, e.name as name,
         format('available=%s installed=%s', e.default_version, coalesce(e.installed_version, 'no')) as detail
    from ext e

  union all
  select 2, 'staff account', pe.full_name,
         format('role=%s active=%s created=%s changed=%s last_sign_in=%s',
                pe.role, pe.active, pe.created_at::date, pe.updated_at::date,
                coalesce(pe.last_sign_in_at::date::text, 'never'))
    from people pe

  union all
  select 3, 'setting', 'email_mode', s.email_mode
    from public.crm_settings s

  union all
  select 4, 'open tasks by future type',
         case when t.title ilike 'respond to website enquiry%' then 'enquiry_response'
              when t.title ilike 'follow up%' or t.title ilike 'chase%' then 'quote_followup'
              else 'general' end,
         count(*)::text
    from public.tasks t
   where t.status = 'open'
   group by 3

  union all
  select 5, 'contacts sharing a phone number', 'groups', count(*)::text
    from (select n from phones group by n having count(*) > 1) g

  union all
  select 6, 'website enquiries', 'total / spam / not converted',
         format('%s / %s / %s', count(*), count(*) filter (where e.spam),
                count(*) filter (where not e.spam and e.opportunity_id is null))
    from public.enquiries e

  union all
  select 7, 'open enquiries with no next date', 'count', count(*)::text
    from public.opportunities o
   where o.stage not in ('won', 'lost') and o.next_action_due is null
)
select seq, item, name, detail
  from out
 order by seq, item, name;
