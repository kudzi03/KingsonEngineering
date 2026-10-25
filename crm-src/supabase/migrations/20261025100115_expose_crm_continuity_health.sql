create or replace function public.crm_security_health()
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if not public.is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
  return jsonb_build_object(
    'mfa_enforced',(select require_mfa from private.crm_security_config where id),
    'accounts_without_mfa',(select count(*) from public.profiles p where p.active
      and not exists(select 1 from auth.mfa_factors f where f.user_id=p.id and f.status='verified')),
    'failed_notifications',(select count(*) from public.notification_outbox where status='failed'),
    'pending_notifications',(select count(*) from public.notification_outbox where status='pending'),
    'email_mode',(select email_mode from public.crm_settings where id),
    'unconverted_enquiries',(select count(*) from public.enquiries where not coalesce(spam,false)
      and not coalesce(is_demo,false) and opportunity_id is null),
    'working_weekdays',(select working_weekdays from public.crm_settings where id),
    'crm_url',(select crm_url from public.crm_settings where id),
    'files_pending',(select count(*) from public.files f left join storage.objects o on o.bucket_id=f.bucket and o.name=f.path
      where f.scan_status in ('pending','error') or f.scan_storage_updated_at is distinct from o.updated_at),
    'files_blocked',(select count(*) from public.files where scan_status='blocked'),
    'latest_backup',(select jsonb_build_object('at',checked_at,'status',status,'summary',summary) from private.crm_worker_runs where kind='backup' order by checked_at desc limit 1),
    'latest_scan',(select jsonb_build_object('at',checked_at,'status',status,'summary',summary) from private.crm_worker_runs where kind='scan' order by checked_at desc limit 1));
end $$;
revoke all on function public.crm_security_health() from public,anon;
grant execute on function public.crm_security_health() to authenticated;

