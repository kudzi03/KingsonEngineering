/* ═══════════════════════════════════════════════════════════════════════════
   send-email — the provider abstraction
   ═══════════════════════════════════════════════════════════════════════════

   Email is sent from here and nowhere else. The browser never holds a sending
   credential: it calls this function with the caller's own access token, the
   function checks that token belongs to active staff, and only then does the
   provider key — which lives in this function's environment and is never
   returned to anybody — get used.

   ── THE ONE REMAINING CREDENTIAL ───────────────────────────────────────────
   Nothing below is guessed or stubbed, but nothing can actually leave the
   building until a provider key is set. Set exactly one of these:

     RESEND_API_KEY   a key from resend.com — the short path. It needs
                      kingsonengineering.co.zw verified as a sending domain,
                      which is three DNS records.

     SMTP_URL         smtps://user:pass@host:465 — if Kingson would rather send
                      through the mailbox they already have.

   Plus, in both cases:

     MAIL_FROM        e.g. "Kingson Engineering <admin1@kingsonengineering.co.zw>"
     MAIL_OFFICE      where office alerts go. Defaults to MAIL_FROM's address.

       supabase secrets set RESEND_API_KEY=... MAIL_FROM='...' MAIL_OFFICE='...'

   With none of them set the function does not pretend. It returns 200 with
   `{ sent: false, reason: 'not_configured' }`, so an enquiry is still saved
   and the office still sees it in the CRM — the email is the extra, not the
   record. It never returns a success it did not achieve.
   ═══════════════════════════════════════════════════════════════════════════ */

import { TEMPLATES, type Mail } from './templates.ts';

const CORS = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' }
  });

/* ── providers ──────────────────────────────────────────────────────────────
   Each one takes the same message and reports the same three outcomes. Adding
   a third provider means adding a function here and a line in `provider()`,
   and touching nothing else. */

interface Sent { sent: boolean; id?: string; reason?: string; detail?: string }

async function viaResend(to: string[], mail: Mail, from: string, replyTo?: string): Promise<Sent> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from, to, subject: mail.subject, text: mail.text, html: mail.html,
      ...(replyTo ? { reply_to: replyTo } : {})
    })
  });
  if (res.ok) {
    const body = await res.json().catch(() => ({}));
    return { sent: true, id: body?.id };
  }
  return { sent: false, reason: 'provider_rejected', detail: (await res.text()).slice(0, 300) };
}

async function viaSmtp(to: string[], mail: Mail, from: string, replyTo?: string): Promise<Sent> {
  /* Imported here rather than at the top so a deployment using Resend does not
     pay to load an SMTP client it will never call. */
  const { SMTPClient } = await import('https://deno.land/x/denomailer@1.6.0/mod.ts');
  const url = new URL(Deno.env.get('SMTP_URL')!);
  const client = new SMTPClient({
    connection: {
      hostname: url.hostname,
      port: Number(url.port || 465),
      tls: url.protocol === 'smtps:',
      auth: { username: decodeURIComponent(url.username), password: decodeURIComponent(url.password) }
    }
  });
  try {
    await client.send({
      from, to, subject: mail.subject, content: mail.text, html: mail.html,
      ...(replyTo ? { replyTo } : {})
    });
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: 'provider_rejected', detail: String(e).slice(0, 300) };
  } finally {
    await client.close().catch(() => {});
  }
}

function provider() {
  if (Deno.env.get('RESEND_API_KEY')) return viaResend;
  if (Deno.env.get('SMTP_URL')) return viaSmtp;
  return null;
}

/* ── who is allowed to ask ───────────────────────────────────────────────────
   The caller's own token, checked against the database as that caller. An
   anonymous token reads no profile and gets nothing, so this cannot be used as
   an open relay by anybody who finds the URL. */

async function callerIsStaff(authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith('Bearer ')) return false;
  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !anon) return false;
  const res = await fetch(`${url}/rest/v1/profiles?select=id,active&limit=1`, {
    headers: { apikey: anon, Authorization: authHeader }
  });
  if (!res.ok) return false;
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) && rows.length > 0 && rows[0]?.active !== false;
}

/* ── the handler ─────────────────────────────────────────────────────────── */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  if (!(await callerIsStaff(req.headers.get('Authorization')))) {
    return json({ error: 'Not authorised.' }, 403);
  }

  let body: { template?: string; to?: string | string[]; replyTo?: string; data?: Record<string, unknown> };
  try { body = await req.json(); } catch { return json({ error: 'Expected JSON.' }, 400); }

  const build = TEMPLATES[body.template as keyof typeof TEMPLATES];
  if (!build) {
    return json({ error: `Unknown template. One of: ${Object.keys(TEMPLATES).join(', ')}` }, 400);
  }

  const to = (Array.isArray(body.to) ? body.to : [body.to]).filter(Boolean) as string[];
  if (!to.length) return json({ error: 'No recipient.' }, 400);
  if (to.some((a) => !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(a))) {
    return json({ error: 'That is not an email address.' }, 400);
  }

  let mail: Mail;
  try { mail = build(body.data as never); }
  catch (e) { return json({ error: `That template needs more than it was given: ${e}` }, 400); }

  const send = provider();
  if (!send) {
    /* Honest, and deliberately not an error: the enquiry is already saved and
       the office already has it in the CRM. Only the courtesy email is
       missing, and the reason says exactly which secret would fix it. */
    console.warn('[kingson] no mail provider configured — set RESEND_API_KEY or SMTP_URL');
    return json({ sent: false, reason: 'not_configured',
                  needs: 'RESEND_API_KEY or SMTP_URL, plus MAIL_FROM',
                  preview: { subject: mail.subject, to } });
  }

  const from = Deno.env.get('MAIL_FROM');
  if (!from) return json({ sent: false, reason: 'not_configured', needs: 'MAIL_FROM' });

  const result = await send(to, mail, from, body.replyTo);
  return json(result, result.sent ? 200 : 502);
});
