-- Security housekeeping and aggregate health only. No email or customer follow-up jobs.
create table if not exists private.crm_health_checks (
  id bigint generated always as identity primary key,
  checked_at timestamptz not null default now(),
  summary jsonb not null
);
alter table private.crm_health_checks enable row level security;
revoke all on private.crm_health_checks from public,anon,authenticated;
revoke all on sequence private.crm_health_checks_id_seq from public,anon,authenticated;
grant all on private.crm_health_checks to service_role;
grant all on sequence private.crm_health_checks_id_seq to service_role;
create or replace function private.run_crm_security_maintenance()
returns void language plpgsql security definer set search_path='' as $$
begin
  perform private.crm_security_housekeeping();
  insert into private.crm_health_checks(summary) select jsonb_build_object(
    'mfa_enforced',(select require_mfa from private.crm_security_config where id),
    'unconverted_enquiries',(select count(*) from public.enquiries where opportunity_id is null
      and not coalesce(spam,false) and not coalesce(is_demo,false)),
    'failed_notifications',(select count(*) from public.notification_outbox where status='failed'),
    'email_mode',(select email_mode from public.crm_settings where id),
    'missing_rls',(select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind='r' and not c.relrowsecurity));
  delete from private.crm_health_checks where checked_at<now()-interval '90 days';
end $$;
revoke all on function private.run_crm_security_maintenance() from public,anon,authenticated;
grant execute on function private.run_crm_security_maintenance() to service_role;
-- cron wiring is deliberately separate from the local SQL test runtime.
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('kingson-security-maintenance','15 2 * * *','select private.run_crm_security_maintenance();');
select private.run_crm_security_maintenance();
