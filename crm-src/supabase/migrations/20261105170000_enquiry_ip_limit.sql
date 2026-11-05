-- Per-network enquiry limit.
--
-- Before this, anonymous enquiries were limited to 5 per contact per hour and
-- 120 in total per hour. The contact key is whatever the visitor typed, so one
-- machine could vary it and use up the whole 120 on its own, which shuts the
-- form for every real customer until the hour turns.
--
-- This adds a third bucket keyed on the caller's IP as Cloudflare reports it
-- (cf-connecting-ip, set at Supabase's edge and not settable by the client).
-- No IP address is stored: the key is an MD5 of a private random salt plus the
-- address, and the existing daily housekeeping deletes buckets older than two
-- days. If the header is missing for any reason the IP bucket is skipped and
-- the limiter behaves exactly as it did before, so this cannot block a
-- submission that the old rules would have accepted.

alter table private.crm_security_config
  add column if not exists ip_salt text not null
  default encode(extensions.gen_random_bytes(32), 'hex');

create or replace function private.limit_enquiry()
 returns trigger
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  k text; n integer; b timestamptz := date_trunc('hour', now());
  v_ip text; v_salt text; v_keys text[];
begin
  if auth.jwt()->>'role'='service_role' or auth.uid() is not null then return new; end if;
  if coalesce(new.honeypot,'')<>'' then
    raise exception 'Submission rejected' using errcode='23514';
  end if;

  -- Caller's network, as seen by the edge. Never stored in clear.
  begin
    v_ip := nullif(trim(nullif(current_setting('request.headers', true), '')::json->>'cf-connecting-ip'), '');
  exception when others then
    v_ip := null;
  end;

  -- Serialize the global bucket first to prevent concurrent bursts bypassing it.
  v_keys := array['global', 'contact:'||md5(lower(trim(coalesce(new.contact,''))))];
  if v_ip is not null then
    select ip_salt into v_salt from private.crm_security_config where id;
    v_keys := v_keys || ('ip:'||md5(coalesce(v_salt,'')||'|'||v_ip));
  end if;

  foreach k in array v_keys loop
    insert into private.enquiry_limits(key,bucket,attempts) values(k,b,1)
      on conflict(key) do update set
        attempts=case when private.enquiry_limits.bucket=b then private.enquiry_limits.attempts+1 else 1 end,
        bucket=b
      returning attempts into n;
    if n > (case when k='global' then 120 when k like 'ip:%' then 10 else 5 end) then
      raise sqlstate 'PGRST' using message='{"code":"RATE_LIMITED","message":"Too many enquiries. Please contact Kingson by phone, email or WhatsApp.","details":null,"hint":null}',
        detail='{"status":429,"headers":{"Retry-After":"3600"}}';
    end if;
  end loop;
  return new;
end $function$;
