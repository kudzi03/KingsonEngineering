-- Kingson CRM: schema inspection. One SELECT over the system catalogues.
-- Reads structure and approximate row counts only. No customer data.
with
fn as (
  select p.oid, p.proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    left join pg_depend d on d.objid = p.oid and d.deptype = 'e'
   where n.nspname = 'public' and d.objid is null and p.prokind in ('f', 'p')
),
tbl as (
  select c.oid, c.relname, c.relrowsecurity, c.relforcerowsecurity, c.reltuples
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('r', 'p')
),
out as (
  select 10 as seq, 'extension' as kind, e.extname::text as name,
         format('schema=%s version=%s', n.nspname, e.extversion) as detail
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace

  union all
  select 20, 'enum', t.typname::text,
         string_agg(e.enumlabel, ' | ' order by e.enumsortorder)
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    join pg_enum e on e.enumtypid = t.oid
   where n.nspname = 'public'
   group by t.typname

  union all
  select 30, 'sequence', s.sequencename::text,
         format('start=%s increment=%s last_value=%s',
                s.start_value, s.increment_by, coalesce(s.last_value::text, 'null'))
    from pg_sequences s
   where s.schemaname = 'public'

  union all
  select 40, 'columns', t.relname::text,
         string_agg(format('%s  %s%s%s%s',
                           a.attname,
                           format_type(a.atttypid, a.atttypmod),
                           case when a.attnotnull then '  NOT NULL' else '' end,
                           coalesce('  DEFAULT ' || pg_get_expr(ad.adbin, ad.adrelid), ''),
                           case when a.attgenerated = 's' then '  (generated)' else '' end),
                    E'\n' order by a.attnum)
    from tbl t
    join pg_attribute a on a.attrelid = t.oid and a.attnum > 0 and not a.attisdropped
    left join pg_attrdef ad on ad.adrelid = t.oid and ad.adnum = a.attnum
   group by t.relname

  union all
  select 41, 'constraint', t.relname || '.' || co.conname,
         pg_get_constraintdef(co.oid)
    from pg_constraint co
    join tbl t on t.oid = co.conrelid

  union all
  select 50, 'index', t.relname || '.' || i.relname,
         pg_get_indexdef(i.oid)
    from pg_index x
    join tbl t on t.oid = x.indrelid
    join pg_class i on i.oid = x.indexrelid
   where not exists (select 1 from pg_constraint co where co.conindid = x.indexrelid)

  union all
  select 60, 'function', f.proname || '(' || pg_get_function_identity_arguments(f.oid) || ')',
         pg_get_functiondef(f.oid)
    from fn f

  union all
  select 70, 'view', c.relname::text,
         format('options=%s', coalesce(array_to_string(c.reloptions, ','), 'none'))
           || E'\n' || pg_get_viewdef(c.oid, true)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('v', 'm')

  union all
  select 80, 'trigger', n.nspname || '.' || c.relname || '.' || tg.tgname,
         pg_get_triggerdef(tg.oid)
    from pg_trigger tg
    join pg_class c on c.oid = tg.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
   where not tg.tgisinternal
     and (n.nspname = 'public' or (n.nspname = 'auth' and c.relname = 'users'))

  union all
  select 90, 'row_security', t.relname::text,
         format('enabled=%s forced=%s', t.relrowsecurity, t.relforcerowsecurity)
    from tbl t

  union all
  select 91, 'policy', p.schemaname || '.' || p.tablename || '.' || p.policyname,
         format(E'mode=%s command=%s roles=%s\nusing: %s\ncheck: %s',
                p.permissive, p.cmd, array_to_string(p.roles, ','),
                coalesce(p.qual, '-'), coalesce(p.with_check, '-'))
    from pg_policies p
   where p.schemaname = 'public' or (p.schemaname = 'storage' and p.tablename = 'objects')

  union all
  select 95, 'table_privilege', tp.table_name || ' / ' || tp.grantee,
         string_agg(tp.privilege_type, ', ' order by tp.privilege_type)
    from information_schema.table_privileges tp
   where tp.table_schema = 'public' and tp.grantee in ('anon', 'authenticated')
   group by tp.table_name, tp.grantee

  union all
  select 96, 'function_execute', f.proname || '(' || pg_get_function_identity_arguments(f.oid) || ') / ' || r.rolname,
         'execute'
    from fn f
    cross join pg_roles r
   where r.rolname in ('anon', 'authenticated')
     and has_function_privilege(r.oid, f.oid, 'execute')

  union all
  select 97, 'bucket', b.id,
         format('public=%s size_limit=%s mime_types=%s',
                b.public, coalesce(b.file_size_limit::text, 'none'),
                coalesce(array_to_string(b.allowed_mime_types, ','), 'any'))
    from storage.buckets b

  union all
  select 99, 'approx_rows', t.relname::text,
         t.reltuples::bigint::text
    from tbl t
)
select seq, kind, name, detail
  from out
 order by seq, name;
