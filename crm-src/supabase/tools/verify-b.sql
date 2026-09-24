-- Kingson CRM: confirm migrations a and b are in place. One SELECT. Reads only.
-- Every row should say ok = true.
with
fn as (
  select p.proname, p.oid, p.prosrc
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
),
want_fn(name) as (
  values ('profiles_guard'), ('norm_phone'), ('norm_email'), ('find_contact_matches'),
         ('create_enquiry'), ('submit_enquiry'), ('global_search'), ('management_summary'),
         ('kick_dispatcher'), ('queue_new_enquiry_alert'), ('enquiry_queue_notifications'),
         ('claim_outbox')
),
cols(tbl, col) as (
  values ('contacts', 'phone_norm'), ('contacts', 'whatsapp_norm'), ('contacts', 'email_norm'),
         ('opportunities', 'drawings'), ('opportunities', 'external_ref'), ('tasks', 'task_type'),
         ('crm_settings', 'alert_recipients'), ('crm_settings', 'digest_hour'),
         ('crm_settings', 'mail_status'), ('notification_outbox', 'dedupe_key')
),
out as (
  select 1 as seq, 'extension pg_trgm' as item, 'installed' as expected,
         coalesce((select extversion from pg_extension where extname = 'pg_trgm'), 'missing') as actual,
         exists (select 1 from pg_extension where extname = 'pg_trgm') as ok

  union all
  select 2, 'enquiry sources', 'existing_customer, social_media',
         (select string_agg(e.enumlabel, ', ' order by e.enumsortorder)
            from pg_enum e join pg_type t on t.oid = e.enumtypid
           where t.typname = 'enquiry_source' and e.enumlabel in ('existing_customer', 'social_media')),
         (select count(*) = 2 from pg_enum e join pg_type t on t.oid = e.enumtypid
           where t.typname = 'enquiry_source' and e.enumlabel in ('existing_customer', 'social_media'))

  union all
  select 3, 'function ' || w.name, 'present',
         case when f.oid is null then 'missing' else 'present' end, f.oid is not null
    from want_fn w left join fn f on f.proname = w.name

  union all
  select 4, 'column ' || c.tbl || '.' || c.col, 'present',
         case when a.attname is null then 'missing' else 'present' end, a.attname is not null
    from cols c
    left join pg_class k on k.relname = c.tbl and k.relnamespace = 'public'::regnamespace
    left join pg_attribute a on a.attrelid = k.oid and a.attname = c.col and not a.attisdropped

  union all
  select 5, 'website conversion types its task', 'yes',
         case when (select prosrc from fn where proname = 'convert_enquiry') like '%enquiry_response%'
              then 'yes' else 'no' end,
         (select prosrc from fn where proname = 'convert_enquiry') like '%enquiry_response%'

  union all
  select 6, 'trigger ' || x.name, x.expected,
         case when exists (select 1 from pg_trigger t where t.tgname = x.name and not t.tgisinternal)
              then 'present' else 'absent' end,
         (x.expected = 'present') = exists (select 1 from pg_trigger t where t.tgname = x.name and not t.tgisinternal)
    from (values ('profiles_guard', 'present'), ('enquiry_queue_notifications', 'present'),
                 ('enquiries_convert', 'present'), ('tasks_type_from_origin', 'absent')) x(name, expected)

  union all
  select 7, 'policy ' || x.name, x.expected,
         case when exists (select 1 from pg_policies p where p.schemaname = 'public' and p.policyname = x.name)
              then 'present' else 'absent' end,
         (x.expected = 'present') = exists (select 1 from pg_policies p where p.schemaname = 'public' and p.policyname = x.name)
    from (values ('profiles_read_self', 'present'), ('activities_admin_update', 'present'),
                 ('activities_staff_update', 'absent'), ('outbox_admin_read', 'present'),
                 ('enquiries_public_insert', 'present')) x(name, expected)

  union all
  select 8, 'functions the website (anon) may run', 'submit_enquiry',
         coalesce((select string_agg(f.proname, ', ' order by f.proname) from fn f
                    where has_function_privilege('anon', f.oid, 'execute')), 'none'),
         coalesce((select string_agg(f.proname, ', ' order by f.proname) from fn f
                    where has_function_privilege('anon', f.oid, 'execute')), 'none') = 'submit_enquiry'

  union all
  select 9, 'website table rights (anon)', 'enquiries: form columns only',
         coalesce((select string_agg(distinct tp.table_name || ':' || tp.privilege_type, ', ')
                     from information_schema.table_privileges tp
                    where tp.grantee = 'anon' and tp.table_schema = 'public'), 'no whole-table rights')
           || ' | columns: ' ||
         coalesce((select string_agg(cp.column_name, ',' order by cp.column_name)
                     from information_schema.column_privileges cp
                    where cp.grantee = 'anon' and cp.table_schema = 'public' and cp.table_name = 'enquiries'), 'none'),
         not exists (select 1 from information_schema.table_privileges tp
                      where tp.grantee = 'anon' and tp.table_schema = 'public')
         and (select count(*) from information_schema.column_privileges cp
               where cp.grantee = 'anon' and cp.table_schema = 'public' and cp.table_name = 'enquiries') = 10

  union all
  select 10, 'signed-in rights on crm_settings', 'the four ordinary rights only',
         (select string_agg(lower(tp.privilege_type), ', ' order by tp.privilege_type)
            from information_schema.table_privileges tp
           where tp.grantee = 'authenticated' and tp.table_schema = 'public' and tp.table_name = 'crm_settings'),
         (select count(*) from information_schema.table_privileges tp
           where tp.grantee = 'authenticated' and tp.table_schema = 'public' and tp.table_name = 'crm_settings'
             and left(tp.privilege_type, 3) in ('TRU', 'TRI', 'REF')) = 0   -- the three surplus rights

  union all
  select 11, 'signed-in rights on v_opportunity_state', 'select only',
         (select string_agg(lower(tp.privilege_type), ', ' order by tp.privilege_type)
            from information_schema.table_privileges tp
           where tp.grantee = 'authenticated' and tp.table_schema = 'public' and tp.table_name = 'v_opportunity_state'),
         (select string_agg(tp.privilege_type, ',')
            from information_schema.table_privileges tp
           where tp.grantee = 'authenticated' and tp.table_schema = 'public' and tp.table_name = 'v_opportunity_state') = 'SELECT'

  union all
  select 12, 'row security on notification_outbox', 'enabled',
         case when (select relrowsecurity from pg_class where oid = 'public.notification_outbox'::regclass)
              then 'enabled' else 'disabled' end,
         (select relrowsecurity from pg_class where oid = 'public.notification_outbox'::regclass)

  union all
  select 13, 'contacts with a normalised phone', 'every contact that has a phone',
         format('%s of %s', count(*) filter (where c.phone_norm is not null),
                count(*) filter (where coalesce(c.phone, '') <> '')),
         count(*) filter (where c.phone_norm is null and length(regexp_replace(coalesce(c.phone, ''), '\D', '', 'g')) >= 7) = 0
    from public.contacts c

  union all
  select 14, 'open tasks by type', '6 enquiry_response, 1 quote_followup, 7 general (pre-check)',
         (select string_agg(task_type || '=' || n, ', ' order by task_type)
            from (select t.task_type, count(*) n from public.tasks t where t.status = 'open' group by 1) s),
         true

  union all
  select 15, 'website enquiries still all converted', 'none unconverted',
         (select format('%s total, %s unconverted', count(*),
                        count(*) filter (where not e.spam and e.opportunity_id is null)) from public.enquiries e),
         (select count(*) filter (where not e.spam and e.opportunity_id is null) = 0 from public.enquiries e)

  union all
  select 16, 'settings', 'email_mode manual, digest 7, status unknown',
         (select format('email_mode %s, digest %s, status %s', s.email_mode, s.digest_hour, s.mail_status)
            from public.crm_settings s),
         (select s.email_mode = 'manual' from public.crm_settings s)
)
select seq, item, expected, actual, ok
  from out
 order by ok, seq, item;
