-- ═══════════════════════════════════════════════════════════════════════════
-- 20260925_c_schedule.sql — wake the notify function
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Run LAST, after:
--   1. 20260925_a_sources.sql and 20260925_b_production_readiness.sql
--   2. the `notify` function is deployed, with secrets DISPATCH_SECRET,
--      MAIL_FROM and RESEND_API_KEY (or SMTP_URL)
--
-- Before running, replace the two placeholders below:
--   <PROJECT_REF>      fgzwcxwmaohowryzdgui for production
--   <DISPATCH_SECRET>  the same long random value set as the function secret
-- The secret is stored in Supabase Vault (encrypted at rest), not in a table,
-- and never reaches the browser. Do NOT commit a copy with the real value.
--
-- Re-runnable: each schedule is replaced, each secret is updated in place.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pg_net;
create extension if not exists pg_cron;

do $$
declare
  v_url text := 'https://<PROJECT_REF>.supabase.co/functions/v1/notify';
  v_secret text := '<DISPATCH_SECRET>';
begin
  if v_secret like '<%' or v_url like '%<PROJECT_REF>%' then
    raise exception 'Replace <PROJECT_REF> and <DISPATCH_SECRET> before running this file.';
  end if;
  if exists (select 1 from vault.secrets where name = 'dispatch_url') then
    perform vault.update_secret((select id from vault.secrets where name = 'dispatch_url'), v_url);
  else
    perform vault.create_secret(v_url, 'dispatch_url', 'notify function URL');
  end if;
  if exists (select 1 from vault.secrets where name = 'dispatch_secret') then
    perform vault.update_secret((select id from vault.secrets where name = 'dispatch_secret'), v_secret);
  else
    perform vault.create_secret(v_secret, 'dispatch_secret', 'shared secret for the notify function');
  end if;
end $$;

-- Every five minutes: send anything queued that the instant wake-up missed
-- (and retry a failed send, up to five times over two days).
select cron.schedule('kingson-outbox-sweep', '*/5 * * * *', $$ select public.kick_dispatcher(); $$);

-- Every hour on the hour: the function builds the digest only in the hour set
-- in Settings (default 07:00 Harare), and only on a working day. The hourly
-- call is what lets that hour be a setting instead of a cron edit.
select cron.schedule('kingson-daily-digest', '0 * * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'dispatch_url'),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-dispatch-secret',
                 (select decrypted_secret from vault.decrypted_secrets where name = 'dispatch_secret')),
    body := '{"job":"digest"}'::jsonb);
$$);
