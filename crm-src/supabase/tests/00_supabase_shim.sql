-- Test only: the parts of a Supabase project the baseline assumes, so it can be
-- loaded into a plain local Postgres. Never run anywhere near production.

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;
create schema extensions;
create schema storage;
create schema vault;
grant usage on schema public, auth, extensions, storage to anon, authenticated, service_role;

-- Supabase reads the caller from the request's JWT claims; so do these.
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb not null default '{}',
                         last_sign_in_at timestamptz);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.role() returns text language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.role', true), '') $$;
grant execute on function auth.uid(), auth.role() to public;

create table storage.buckets (id text primary key, name text, public boolean,
                              file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
create table vault.decrypted_secrets (name text, decrypted_secret text);

create extension if not exists pg_trgm with schema extensions;

-- Supabase's default privileges: anything new in public is granted to the API
-- roles unless a migration revokes it. The migrations must cope with that.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
