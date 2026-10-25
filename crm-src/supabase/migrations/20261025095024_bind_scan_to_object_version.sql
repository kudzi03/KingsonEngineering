-- Bind approval to the exact storage object version, including privileged overwrite detection.
alter table public.files add column if not exists scan_storage_updated_at timestamptz;
create or replace function private.guard_file_scan()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is not null then
    if tg_op='INSERT' then
      if new.scan_status<>'pending' or new.scan_sha256 is not null or new.scanned_at is not null
        or new.scan_engine is not null or new.scan_storage_updated_at is not null then
        raise exception 'Files must be scanned by the protected worker' using errcode='42501';
      end if;
    elsif new.path is distinct from old.path or new.bucket is distinct from old.bucket
      or new.scan_status is distinct from old.scan_status or new.scan_sha256 is distinct from old.scan_sha256
      or new.scanned_at is distinct from old.scanned_at or new.scan_engine is distinct from old.scan_engine
      or new.scan_storage_updated_at is distinct from old.scan_storage_updated_at then
      raise exception 'File bytes and scan results cannot be changed from the browser' using errcode='42501';
    end if;
  end if;
  return new;
end $$;
revoke all on function private.guard_file_scan() from public,anon,authenticated;
alter policy "staff read files" on storage.objects using(
  bucket_id='kingson-files' and public.is_staff() and
  (private.crm_legacy_upload_allowed() or exists(
    select 1 from public.files f where f.bucket=storage.objects.bucket_id and f.path=storage.objects.name
      and f.scan_status='clean' and f.scan_sha256 is not null and f.scanned_at is not null
      and f.scan_storage_updated_at=storage.objects.updated_at
  ))
);
