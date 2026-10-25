-- Bytes remain private while a scanner checks them. A failed scanner never marks a file clean.
alter table public.files add column if not exists scan_status text not null default 'pending'
  check(scan_status in ('pending','clean','blocked','error'));
alter table public.files add column if not exists scan_sha256 text check(scan_sha256 is null or scan_sha256 ~ '^[0-9a-f]{64}$');
alter table public.files add column if not exists scanned_at timestamptz;
alter table public.files add column if not exists scan_engine text;
create or replace function private.guard_file_scan()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is not null then
    if tg_op='INSERT' then
      if new.scan_status<>'pending' or new.scan_sha256 is not null or new.scanned_at is not null or new.scan_engine is not null then
        raise exception 'Files must be scanned by the protected worker' using errcode='42501';
      end if;
    elsif new.path is distinct from old.path or new.bucket is distinct from old.bucket
      or new.scan_status is distinct from old.scan_status or new.scan_sha256 is distinct from old.scan_sha256
      or new.scanned_at is distinct from old.scanned_at or new.scan_engine is distinct from old.scan_engine then
      raise exception 'File bytes and scan results cannot be changed from the browser' using errcode='42501';
    end if;
  end if;
  return new;
end $$;
revoke all on function private.guard_file_scan() from public,anon,authenticated;
drop trigger if exists guard_file_scan on public.files;
create trigger guard_file_scan before insert or update on public.files for each row execute function private.guard_file_scan();
alter policy "staff read files" on storage.objects using(
  bucket_id='kingson-files' and public.is_staff() and
  (private.crm_legacy_upload_allowed() or exists(
    select 1 from public.files f where f.bucket=storage.objects.bucket_id and f.path=storage.objects.name and f.scan_status='clean'
      and f.scan_sha256 is not null and f.scanned_at is not null
  ))
);
create table if not exists private.crm_worker_runs(
  id bigint generated always as identity primary key,
  checked_at timestamptz not null default now(),
  kind text not null check(kind in ('scan','backup')),
  status text not null check(status in ('verified','error')),
  summary jsonb not null
);
alter table private.crm_worker_runs enable row level security;
revoke all on private.crm_worker_runs from public,anon,authenticated;
revoke all on sequence private.crm_worker_runs_id_seq from public,anon,authenticated;
grant all on private.crm_worker_runs to service_role;
grant all on sequence private.crm_worker_runs_id_seq to service_role;
