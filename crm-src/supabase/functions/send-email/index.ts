/* ═══════════════════════════════════════════════════════════════════════════
   send-email — a member of staff sends one templated email
   ═══════════════════════════════════════════════════════════════════════════

   Called from the CRM with the caller's own access token. Nothing automatic
   goes through here: the staff alert, the customer acknowledgement and the
   morning digest are sent by `notify`, from the outbox. This function exists
   for a PERSON choosing to send a message.

   Secrets (see _shared/mail.ts): RESEND_API_KEY or SMTP_URL, and MAIL_FROM.
   ALLOWED_ORIGINS — comma-separated origins allowed to call this from a
   browser, e.g. "https://crm.kingsonengineering.co.zw,https://kingson-engineering.vercel.app".
   ═══════════════════════════════════════════════════════════════════════════ */

import { TEMPLATES, type Mail } from '../_shared/templates.ts';
import { send, isEmail } from '../_shared/mail.ts';

const ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? 'https://kingson-engineering.vercel.app')
  .split(',').map((s) => s.trim()).filter(Boolean);

function cors(req: Request) {
  const origin = req.headers.get('Origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ORIGINS.includes(origin) ? origin : ORIGINS[0],
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}

/* Active staff only, checked as the caller: an anonymous or deactivated token
   reads no usable profile, so this cannot be used as an open relay. */
async function callerIsStaff(authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith('Bearer ')) return false;
  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !anon) return false;
  const res = await fetch(`${url}/rest/v1/rpc/is_staff`, {
    method: 'POST',
    headers: { apikey: anon, Authorization: authHeader, 'Content-Type': 'application/json' },
    body: '{}'
  });
  if (!res.ok) return false;
  return (await res.json().catch(() => false)) === true;
}

/* manual — nothing leaves.  test — only to the test mailbox.  live — as asked.
   Read as the caller, so an unreadable settings row fails closed (manual). */
async function emailMode(authHeader: string): Promise<{ mode: string; testMailbox: string | null }> {
  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !anon) return { mode: 'manual', testMailbox: null };
  const res = await fetch(`${url}/rest/v1/crm_settings?select=email_mode,test_mailbox&limit=1`, {
    headers: { apikey: anon, Authorization: authHeader }
  }).catch(() => null);
  if (!res?.ok) return { mode: 'manual', testMailbox: null };
  const rows = await res.json().catch(() => []);
  return { mode: rows?.[0]?.email_mode ?? 'manual', testMailbox: rows?.[0]?.test_mailbox ?? null };
}

Deno.serve(async (req) => {
  const headers = { ...cors(req), 'Content-Type': 'application/json' };
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  if (!(await callerIsStaff(req.headers.get('Authorization')))) return json({ error: 'Not authorised.' }, 403);

  let body: { template?: string; to?: string | string[]; replyTo?: string; data?: Record<string, unknown> };
  try { body = await req.json(); } catch { return json({ error: 'Expected JSON.' }, 400); }

  const build = TEMPLATES[body.template as keyof typeof TEMPLATES];
  if (!build) return json({ error: `Unknown template. One of: ${Object.keys(TEMPLATES).join(', ')}` }, 400);

  const to = (Array.isArray(body.to) ? body.to : [body.to]).filter(Boolean) as string[];
  if (!to.length) return json({ error: 'No recipient.' }, 400);
  if (!to.every(isEmail)) return json({ error: 'That is not an email address.' }, 400);

  const { mode, testMailbox } = await emailMode(req.headers.get('Authorization')!);
  if (mode === 'manual') {
    return json({ sent: false, reason: 'manual_mode',
                  detail: 'Email is switched off. Send from your own mailbox and record it in the CRM.' });
  }
  if (mode === 'test') {
    if (!testMailbox) return json({ sent: false, reason: 'no_test_mailbox' });
    to.splice(0, to.length, testMailbox);
  }

  let mail: Mail;
  try { mail = (build as (d: never) => Mail)(body.data as never); }
  catch (e) { return json({ error: `That template needs more than it was given: ${e}` }, 400); }

  const result = await send(to, mail, body.replyTo);
  return json(result, result.sent || result.reason === 'not_configured' ? 200 : 502);
});
