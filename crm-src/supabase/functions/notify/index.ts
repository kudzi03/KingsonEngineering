/* ═══════════════════════════════════════════════════════════════════════════
   notify — works the notification outbox, and builds the morning digest
   ═══════════════════════════════════════════════════════════════════════════

   Nothing calls this from a browser. It is woken by the database:

     · immediately, by kick_dispatcher() when a website enquiry is saved
     · every five minutes by pg_cron, as a sweep for anything that failed
     · once each morning by pg_cron with { "job": "digest" }

   and it proves who is calling with the x-dispatch-secret header, which must
   equal the DISPATCH_SECRET function secret (the database reads the same
   value from Vault). It uses the service role, which Supabase provides to
   every function and which never leaves the server.

   WHAT IT SENDS, AND WHAT IT NEVER SENDS
     staff    new-enquiry alert; morning follow-up digest
     customer acknowledgement of a website enquiry (a receipt with the ref)
     never    anything that chases a customer. There is no code path here
              that writes to a customer about a quotation.

   ONCE ONLY
     Every message is an outbox row with a unique dedupe_key (one alert per
     enquiry, one acknowledgement per submission, one digest per person per
     day). claim_outbox() takes each row with UPDATE … RETURNING, so two
     overlapping runs cannot both send it.

   EMAIL MODE (crm_settings.email_mode)
     manual   nothing is sent; rows are marked skipped — they will not all go
              out later when somebody switches email on
     test     everything goes to crm_settings.test_mailbox only
     live     real recipients
   ═══════════════════════════════════════════════════════════════════════════ */

import { officeAlert, acknowledgement, digest, type DigestRow, type Mail } from '../_shared/templates.ts';
import { send, providerName, mailConfigured, isEmail } from '../_shared/mail.ts';

const URL_ = Deno.env.get('SUPABASE_URL')!;
const KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const TZ = 'Africa/Harare';

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

async function rest(path: string, init: RequestInit = {}) {
  const res = await fetch(`${URL_}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers || {}) } });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${path}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

const patchOutbox = (id: number, patch: Record<string, unknown>) =>
  rest(`notification_outbox?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(patch),
                                           headers: { Prefer: 'return=minimal' } });

/* ── time, in Harare ─────────────────────────────────────────────────────── */

const harareDate = (d = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);
const pretty = (iso: string | null | undefined, withTime = false) => !iso ? '' :
  new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, day: 'numeric', month: 'short', year: withTime ? undefined : 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
  }).format(new Date(iso.length === 10 ? iso + 'T12:00:00Z' : iso));
const isoWeekday = (ymd: string) => { const d = new Date(ymd + 'T12:00:00Z').getUTCDay(); return d === 0 ? 7 : d; };
const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);

const money = (amount: unknown, cur = 'USD') => amount == null ? '' :
  `${cur === 'USD' ? 'US$' : cur + ' '}${Number(amount).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;

/* ── people ──────────────────────────────────────────────────────────────── */

async function userEmail(id: string): Promise<string | null> {
  const res = await fetch(`${URL_}/auth/v1/admin/users/${id}`, { headers: H });
  if (!res.ok) return null;
  const u = await res.json().catch(() => null);
  return u?.email ?? null;
}

async function activeProfiles(): Promise<{ id: string; full_name: string; role: string; email: string | null }[]> {
  const rows = await rest('profiles?select=id,full_name,role,active&active=is.true');
  return Promise.all(rows.map(async (p: { id: string; full_name: string; role: string }) =>
    ({ ...p, email: await userEmail(p.id) })));
}

async function settings() {
  const rows = await rest('crm_settings?select=*&limit=1');
  return rows?.[0] ?? {};
}

const crmBase = (s: { crm_url?: string | null }) =>
  (s.crm_url || Deno.env.get('CRM_URL') || 'https://kingson-engineering.vercel.app/crm').replace(/\/+$/, '');

/* ── building each message ───────────────────────────────────────────────── */

async function buildNewEnquiry(row: { opportunity_id: string }, s: Record<string, unknown>) {
  const [o] = await rest(`v_opportunity_state?select=*&id=eq.${row.opportunity_id}`);
  if (!o) return { skip: 'enquiry no longer exists' };
  const [first] = await rest(`activities?select=body&opportunity_id=eq.${o.id}&kind=eq.enquiry&order=occurred_at.asc&limit=1`);
  const mail: Mail = officeAlert({
    ref: o.ref, name: o.contact_name || o.company_name || 'Unknown',
    company: o.company_name, contact: o.contact_phone || o.contact_email || '',
    phone: o.contact_phone, email: o.contact_email,
    service: o.service, location: o.location,
    message: (o.description || first?.body || '').slice(0, 600),
    received: pretty(o.created_at, true), source: String(o.source || 'website').replace('_', ' '),
    dueOn: pretty(o.next_action_due), crmUrl: `${crmBase(s)}/#/opportunity/${o.id}`
  });
  let to = (s.alert_recipients as string[] | null)?.filter(isEmail) ?? [];
  if (!to.length) {
    to = (await activeProfiles()).filter((p) => p.role === 'admin' && p.email).map((p) => p.email!);
  }
  return { mail, to };
}

async function buildAck(row: { opportunity_id: string; recipient: string }) {
  const [o] = await rest(`v_opportunity_state?select=ref,company_name,contact_name,service,location&id=eq.${row.opportunity_id}`);
  if (!o) return { skip: 'enquiry no longer exists' };
  if (!isEmail(row.recipient)) return { skip: 'no valid email address' };
  return {
    mail: acknowledgement({ name: o.company_name || o.contact_name || '', ref: o.ref,
                            service: o.service, location: o.location }),
    to: [row.recipient]
  };
}

/* ── the outbox ──────────────────────────────────────────────────────────── */

const MAX_AGE_H = { new_enquiry: 24, acknowledgement: 24, digest: 12 };

async function workOutbox() {
  const s = await settings();
  const mode = String(s.email_mode || 'manual');
  const rows = await rest('rpc/claim_outbox', { method: 'POST', body: JSON.stringify({ p_limit: 25 }) });
  const report = { claimed: rows.length, sent: 0, skipped: 0, failed: 0 };

  for (const row of rows) {
    try {
      /* Queued long before email was switched on (or while it was broken):
         "we have received your enquiry" a week later is worse than nothing,
         and an alert that old is already on the dashboard. */
      const ageH = (Date.now() - Date.parse(row.created_at)) / 3.6e6;
      if (ageH > MAX_AGE_H[row.kind as keyof typeof MAX_AGE_H]) {
        await patchOutbox(row.id, { status: 'skipped', last_error: `too old to send (${Math.round(ageH)} h)` });
        report.skipped++; continue;
      }
      const enabled = row.kind === 'new_enquiry' ? s.notify_new_enquiry !== false
                    : row.kind === 'acknowledgement' ? s.send_acknowledgement !== false
                    : s.digest_enabled !== false;
      if (!enabled) { await patchOutbox(row.id, { status: 'skipped', last_error: 'switched off in Settings' }); report.skipped++; continue; }
      if (mode === 'manual') { await patchOutbox(row.id, { status: 'skipped', last_error: 'email is off (manual mode)' }); report.skipped++; continue; }
      if (!mailConfigured()) { await patchOutbox(row.id, { status: 'skipped', last_error: 'no mail provider configured' }); report.skipped++; continue; }

      const built = row.kind === 'new_enquiry' ? await buildNewEnquiry(row, s)
                  : row.kind === 'acknowledgement' ? await buildAck(row)
                  : { mail: row.payload?.mail as Mail, to: [row.recipient] };
      if ('skip' in built) { await patchOutbox(row.id, { status: 'skipped', last_error: built.skip }); report.skipped++; continue; }

      let to = built.to;
      if (mode === 'test') {
        if (!s.test_mailbox || !isEmail(s.test_mailbox)) { await patchOutbox(row.id, { status: 'skipped', last_error: 'test mode with no test mailbox' }); report.skipped++; continue; }
        to = [s.test_mailbox];
      }
      if (!to.length) { await patchOutbox(row.id, { status: 'failed', last_error: 'no recipients: set alert recipients in Settings' }); report.failed++; continue; }

      const r = await send(to, built.mail);
      if (r.sent) { await patchOutbox(row.id, { status: 'sent', sent_at: new Date().toISOString(), recipient: to.join(', '), last_error: null }); report.sent++; }
      else { await patchOutbox(row.id, { status: 'failed', last_error: `${r.reason}: ${r.detail ?? ''}`.slice(0, 500) }); report.failed++; }
    } catch (e) {
      await patchOutbox(row.id, { status: 'failed', last_error: String(e).slice(0, 500) }).catch(() => {});
      report.failed++;
    }
  }
  return report;
}

/* ── the morning digest ──────────────────────────────────────────────────── */

/* Called hourly by pg_cron; builds the digest only in the hour Kingson chose
   (crm_settings.digest_hour, Harare time). The dedupe key makes a second
   call in the same day a no-op, so a retry can never send it twice. */
async function queueDigest(force = false) {
  const s = await settings();
  const today = harareDate();
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hour12: false }).format(new Date()));
  const working: number[] = s.working_weekdays ?? [1, 2, 3, 4, 5, 6];
  if (s.digest_enabled === false) return { queued: 0, reason: 'digest switched off' };
  if (!force && hour !== Number(s.digest_hour ?? 7)) return { queued: 0, reason: `not the digest hour (${hour}:00)` };
  if (!working.includes(isoWeekday(today))) return { queued: 0, reason: 'not a working day' };

  const open = await rest(
    `v_opportunity_state?select=id,ref,title,company_name,contact_name,owner_id,owner_name,next_action,next_action_due,` +
    `quoted_value,quote_currency,quote_ref,quote_status,quote_sent_at,stage` +
    `&is_open=is.true&is_demo=is.false&next_action_due=lte.${today}&stage=neq.on_hold&order=next_action_due.asc&limit=500`);
  const awaitingRows = await rest(
    `v_opportunity_state?select=quoted_value,quote_currency&is_demo=is.false&stage=in.(quote_sent,followup)&quote_status=in.(sent,discussed)&limit=2000`);
  const byCur: Record<string, number> = {};
  for (const r of awaitingRows) if (r.quoted_value != null) byCur[r.quote_currency || 'USD'] = (byCur[r.quote_currency || 'USD'] || 0) + Number(r.quoted_value);
  const awaiting = Object.entries(byCur).map(([c, v]) => money(v, c)).join(' + ') || 'nothing';

  const base = crmBase(s);
  const toRow = (o: Record<string, any>): DigestRow => ({
    ref: o.ref, title: o.title, company: o.company_name, contact: o.contact_name,
    quote: o.quote_ref && o.quoted_value != null ? `${o.quote_ref} · ${money(o.quoted_value, o.quote_currency || 'USD')}` : null,
    quoteSent: o.quote_sent_at ? pretty(o.quote_sent_at).replace(/ \d{4}$/, '') : null,
    due: o.next_action_due, late: daysBetween(o.next_action_due, today),
    action: o.next_action, owner: o.owner_name, url: `${base}/#/opportunity/${o.id}`
  });
  const rows = open.map(toRow);
  if (!rows.length) return { queued: 0, reason: 'nothing due or overdue' };

  const people = await activeProfiles();
  const managers = ((s.digest_recipients as string[] | null) ?? []).filter(isEmail);
  const managerList = managers.length ? managers : people.filter((p) => p.role === 'admin' && p.email).map((p) => p.email!);
  const dateLabel = pretty(today);

  const messages: { to: string; name: string | null; rows: DigestRow[] }[] = [];
  for (const email of new Set(managerList)) messages.push({ to: email, name: null, rows });
  for (const p of people) {
    if (!p.email || managerList.includes(p.email)) continue;         // a manager already has the full list
    const mine = open.filter((o: Record<string, any>) => o.owner_id === p.id).map(toRow);
    if (mine.length) messages.push({ to: p.email, name: p.full_name.split(' ')[0], rows: mine });
  }

  let queued = 0;
  for (const m of messages) {
    const mail = digest({
      date: dateLabel, forName: m.name, crmUrl: base, awaiting,
      overdue: m.rows.filter((r) => r.late > 0).sort((a, b) => b.late - a.late),
      today: m.rows.filter((r) => r.late <= 0)
    });
    const res = await fetch(`${URL_}/rest/v1/notification_outbox?on_conflict=dedupe_key`, {
      method: 'POST',
      headers: { ...H, Prefer: 'resolution=ignore-duplicates,return=minimal' },
      body: JSON.stringify({ kind: 'digest', dedupe_key: `digest:${today}:${m.to.toLowerCase()}`,
                             recipient: m.to, payload: { mail } })
    });
    if (res.ok) queued++;
  }
  return { queued };
}

/* ── the handler ─────────────────────────────────────────────────────────── */

function secretOk(req: Request) {
  const want = Deno.env.get('DISPATCH_SECRET') ?? '';
  const got = req.headers.get('x-dispatch-secret') ?? '';
  if (!want || want.length !== got.length) return false;
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ got.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  if (!secretOk(req)) return json({ error: 'Not authorised.' }, 403);

  const { job, force } = await req.json().catch(() => ({ job: 'outbox', force: false }));

  /* Say, where the CRM can read it, whether email can actually leave. */
  await rest('crm_settings?id=eq.true', {
    method: 'PATCH', headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ mail_status: mailConfigured() ? `configured:${providerName()}` : 'not_configured',
                           mail_checked_at: new Date().toISOString() })
  }).catch(() => {});

  try {
    const digestResult = job === 'digest' ? await queueDigest(force === true) : null;
    const outbox = await workOutbox();
    return json({ ok: true, digest: digestResult, outbox });
  } catch (e) {
    return json({ ok: false, error: String(e).slice(0, 300) }, 500);
  }
});
