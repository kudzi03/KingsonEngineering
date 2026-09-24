"""Build supabase/baseline/00_live_baseline.sql from the export-schema.sql CSV.

    py -3 crm-src/supabase/tools/build-baseline.py crm-src/supabase/baseline/live-schema-2026-09-25.csv

The CSV is the output of tools/export-schema.sql run against production. The
result recreates the live public schema (enums, sequences, tables, functions,
constraints, indexes, view, triggers, RLS, policies, grants, bucket) on an
empty Supabase project, in an order Postgres accepts. It is a record of what
production IS, not a migration: never run it against production.
"""
import csv
import re
import sys
from pathlib import Path

src = Path(sys.argv[1])
out = src.parent / '00_live_baseline.sql'
rows = list(csv.DictReader(src.open(encoding='utf-8')))
by = {}
for r in rows:
    by.setdefault(r['kind'], []).append(r)

q = lambda s: '"' + s.replace('"', '""') + '"'
L = [f'-- Live schema baseline, generated from {src.name} by tools/build-baseline.py.',
     'set check_function_bodies = off;  -- functions refer to each other in any order',
     '-- Recreates production on an EMPTY project. Never run it against production.', '']

L.append('-- extensions')
for r in by.get('extension', []):
    schema = re.search(r'schema=(\S+)', r['detail']).group(1)
    if r['name'] in ('plpgsql',):
        continue
    L.append(f'create extension if not exists {q(r["name"])} with schema {schema};')

L.append('\n-- enums')
for r in by.get('enum', []):
    labels = ', '.join("'" + v.strip().replace("'", "''") + "'" for v in r['detail'].split(' | '))
    L.append(f'create type public.{r["name"]} as enum ({labels});')

L.append('\n-- sequences')
for r in by.get('sequence', []):
    m = dict(re.findall(r'(\w+)=(\S+)', r['detail']))
    L.append(f'create sequence public.{r["name"]} start {m["start"]} increment {m["increment"]};')
    if m.get('last_value') not in (None, 'null'):
        L.append(f"select setval('public.{r['name']}', {m['last_value']});")

L.append('\n-- tables')
for r in by.get('columns', []):
    cols = []
    for line in r['detail'].split('\n'):
        parts = line.split('  ')
        name, typ, rest = parts[0], parts[1], parts[2:]
        tail = ''
        for p in rest:
            if p == 'NOT NULL':
                tail += ' not null'
            elif p.startswith('DEFAULT '):
                tail += ' default ' + p[8:]
            elif p == '(generated)':
                raise SystemExit(f'generated column {r["name"]}.{name}: add by hand')
        cols.append(f'  {q(name)} {typ}{tail}')
    L.append(f'create table public.{r["name"]} (\n' + ',\n'.join(cols) + '\n);')

L.append('\n-- functions')
for r in by.get('function', []):
    L.append(r['detail'].rstrip() + ';\n')

cons = by.get('constraint', [])
order = lambda d: 0 if d.startswith('PRIMARY KEY') else 1 if d.startswith('UNIQUE') else 2 if d.startswith('CHECK') else 3
L.append('\n-- constraints')
for r in sorted(cons, key=lambda r: (order(r['detail']), r['name'])):
    table, name = r['name'].split('.', 1)
    L.append(f'alter table public.{table} add constraint {q(name)} {r["detail"]};')

L.append('\n-- indexes')
for r in by.get('index', []):
    L.append(r['detail'] + ';')

L.append('\n-- views')
for r in by.get('view', []):
    first, body = r['detail'].split('\n', 1)
    opts = first.split('=', 1)[1]
    w = f' with ({opts})' if opts != 'none' else ''
    L.append(f'create view public.{r["name"]}{w} as\n{body}')

L.append('\n-- triggers')
for r in by.get('trigger', []):
    L.append(r['detail'] + ';')

L.append('\n-- row level security')
for r in by.get('row_security', []):
    m = dict(re.findall(r'(\w+)=(\S+)', r['detail']))
    if m['enabled'] == 't':
        L.append(f'alter table public.{r["name"]} enable row level security;')
    if m['forced'] == 't':
        L.append(f'alter table public.{r["name"]} force row level security;')

L.append('\n-- policies')
for r in by.get('policy', []):
    schema, table, name = r['name'].split('.', 2)
    head, using, check = r['detail'].split('\n')
    m = dict(re.findall(r'(\w+)=(\S+)', head))
    using, check = using[len('using: '):], check[len('check: '):]
    s = f'create policy {q(name)} on {schema}.{table} as {m["mode"].lower()} for {m["command"].lower()} to {m["roles"]}'
    if using != '-':
        s += f'\n  using ({using})'
    if check != '-':
        s += f'\n  with check ({check})'
    L.append(s + ';')

L.append('\n-- privileges: exactly what production grants the API roles')
L.append('revoke all on all tables in schema public from anon, authenticated;')
L.append('revoke execute on all functions in schema public from public, anon, authenticated;')
for r in by.get('table_privilege', []):
    table, role = r['name'].split(' / ')
    L.append(f'grant {r["detail"].lower()} on public.{table} to {role};')
for r in by.get('function_execute', []):
    sig, role = r['name'].rsplit(' / ', 1)
    L.append(f'grant execute on function public.{sig} to {role};')

L.append('\n-- storage')
for r in by.get('bucket', []):
    m = dict(re.findall(r'(\w+)=(\S+)', r['detail']))
    mimes = m['mime_types']
    arr = 'null' if mimes == 'any' else "array[" + ', '.join("'" + x + "'" for x in mimes.split(',')) + "]"
    lim = 'null' if m['size_limit'] == 'none' else m['size_limit']
    L.append(f"insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) "
             f"values ('{r['name']}', '{r['name']}', {m['public'] == 't'}, {lim}, {arr}) on conflict (id) do nothing;")

L.append('\n-- the one settings row (not exported: data, not structure)')
L.append('insert into public.crm_settings default values on conflict do nothing;')

out.write_text('\n'.join(L) + '\n', encoding='utf-8', newline='\n')
print(f'{out}: {len(L)} lines from {len(rows)} catalogue rows')
