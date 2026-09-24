-- ═══════════════════════════════════════════════════════════════════════════
-- export-schema.sql — read the live structure, change nothing
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Run in Supabase → SQL Editor. It only SELECTs from the system catalogues:
-- no customer rows are read (only row COUNTS), nothing is written, and it is
-- safe to run on production at any time.
--
-- Output: one row per object — (seq, kind, name, ddl). Use the results
-- pane's Export → "Download CSV" and hand the file over. Every `ddl` is SQL
-- that recreates that object, which is how supabase/baseline/ is built.
-- ═══════════════════════════════════════════════════════════════════════════

with
fn as (
  select p.oid, p.proname, n.nspname
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    left join pg_depend d on d.objid = p.oid and d.deptype = 'e'
   where n.nspname = 'public' and d.objid is null and p.prokind in ('f', 'p')
),
tbl as (
  select c.oid, c.relname, c.relrowsecurity, c.relforcerowsecurity
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('r', 'p')
),
out as (
  -- extensions
  select 10 seq, 'extension' kind, e.extname::text name,
         format('create extension if not exists %I with schema %I; -- v%s',
                e.extname, n.nspname, e.extversion) ddl
    from pg_extension e join pg_namespace n on n.oid = e.extnamespace

  -- enums
  union all
  select 20, 'enum', t.typname::text,
         format('create type public.%I as enum (%s);', t.typname,
                string_agg(quote_literal(e.enumlabel), ', ' order by e.enumsortorder))
    from pg_type t join pg_namespace n on n.oid = t.typnamespace
    join pg_enum e on e.enumtypid = t.oid
   where n.nspname = 'public'
   group by t.typname

  -- sequences
  union all
  select 30, 'sequence', c.relname::text,
         format('create sequence if not exists public.%I start %s increment %s; -- last_value %s',
                c.relname, s.seqstart, s.seqincrement,
                coalesce((select last_value::text from pg_sequences ps
                           where ps.schemaname = 'public' and ps.sequencename = c.relname), 'null'))
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    join pg_sequence s on s.seqrelid = c.oid
   where n.nspname = 'public' and c.relkind = 'S'

  -- tables: columns
  union all
  select 40, 'table', t.relname::text,
         format(E'create table public.%I (\n%s\n);', t.relname,
           string_agg(format('  %I %s%s%s', a.attname, format_type(a.atttypid, a.atttypmod),
                   case when a.attnotnull then ' not null' else '' end,
                   coalesce(' default ' || pg_get_expr(ad.adbin, ad.adrelid), '')
                   || case when a.attgenerated = 's' then ' /* generated */' else '' end),
                 E',\n' order by a.attnum))
    from tbl t
    join pg_attribute a on a.attrelid = t.oid and a.attnum > 0 and not a.attisdropped
    left join pg_attrdef ad on ad.adrelid = t.oid and ad.adnum = a.attnum
   group by t.relname

  -- constraints (pk, fk, unique, check)
  union all
  select case co.contype when 'p' then 41 when 'u' then 42 when 'c' then 43 else 44 end,
         'constraint', t.relname || '.' || co.conname,
         format('alter table public.%I add constraint %I %s;', t.relname, co.conname,
                pg_get_constraintdef(co.oid))
    from pg_constraint co join tbl t on t.oid = co.conrelid

  -- indexes that are not constraint-backed
  union all
  select 50, 'index', i.relname::text, pg_get_indexdef(i.oid) || ';'
    from pg_index x join tbl t on t.oid = x.indrelid
    join pg_class i on i.oid = x.indexrelid
   where not exists (select 1 from pg_constraint co where co.conindid = x.indexrelid)

  -- functions
  union all
  select 60, 'function', f.proname || '(' || pg_get_function_identity_arguments(f.oid) || ')',
         pg_get_functiondef(f.oid) || ';'
    from fn f

  -- views
  union all
  select 70, 'view', c.relname::text,
         format(E'create or replace view public.%I%s as\n%s', c.relname,
                case when c.reloptions is not null then ' with (' || array_to_string(c.reloptions, ', ') || ')' else '' end,
                pg_get_viewdef(c.oid, true))
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('v', 'm')

  -- triggers on public tables AND on auth.users (handle_new_user lives there)
  union all
  select 80, 'trigger', c.relname || '.' || tg.tgname, pg_get_triggerdef(tg.oid) || ';'
    from pg_trigger tg join pg_class c on c.oid = tg.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
   where not tg.tgisinternal and (n.nspname = 'public' or (n.nspname = 'auth' and c.relname = 'users'))

  -- row level security switches
  union all
  select 90, 'rls', t.relname::text,
         format('alter table public.%I %s row level security;%s', t.relname,
                case when t.relrowsecurity then 'enable' else 'disable' end,
                case when t.relforcerowsecurity then format(' alter table public.%I force row level security;', t.relname) else '' end)
    from tbl t

  -- policies, on public tables and on storage.objects
  union all
  select 91, 'policy', p.schemaname || '.' || p.tablename || '.' || p.policyname,
         format('create policy %I on %I.%I as %s for %s to %s%s%s;',
                p.policyname, p.schemaname, p.tablename, p.permissive, p.cmd,
                array_to_string(p.roles, ', '),
                coalesce(E'\n  using (' || p.qual || ')', ''),
                coalesce(E'\n  with check (' || p.with_check || ')', ''))
    from pg_policies p
   where p.schemaname = 'public' or (p.schemaname = 'storage' and p.tablename = 'objects')

  -- table grants to the API roles
  union all
  select 95, 'grant', g.table_name || ' → ' || g.grantee,
         format('grant %s on public.%I to %I;',
                string_agg(g.privilege_type, ', ' order by g.privilege_type), g.table_name, g.grantee)
    from information_schema.role_table_grants g
   where g.table_schema = 'public' and g.grantee in ('anon', 'authenticated')
   group by g.table_name, g.grantee

  -- function execute grants to the API roles
  union all
  select 96, 'fn-grant', f.proname || ' → ' || r.rolname,
         format('grant execute on function public.%I(%s) to %I;', f.proname,
                pg_get_function_identity_arguments(f.oid), r.rolname)
    from fn f cross join pg_roles r
   where r.rolname in ('anon', 'authenticated')
     and has_function_privilege(r.oid, f.oid, 'execute')

  -- storage buckets (configuration only)
  union all
  select 97, 'bucket', b.id,
         format('insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values (%L, %L, %s, %s, %L) on conflict (id) do nothing;',
                b.id, b.name, b.public, coalesce(b.file_size_limit::text, 'null'), b.allowed_mime_types)
    from storage.buckets b

  -- row counts, so the size of production is on record (no row contents)
  union all
  select 99, 'count', t.relname::text,
         format('-- %s: about %s rows', t.relname, c.reltuples::bigint)
    from tbl t join pg_class c on c.oid = t.oid
)
select seq, kind, name, ddl from out order by seq, name;
