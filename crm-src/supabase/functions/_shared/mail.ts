/* ═══════════════════════════════════════════════════════════════════════════
   _shared/mail.ts — the provider abstraction, used by send-email and notify
   ═══════════════════════════════════════════════════════════════════════════

   Set exactly one provider in the function secrets:

     RESEND_API_KEY   resend.com — needs the sending domain verified (DNS)
     SMTP_URL         smtps://user:pass@host:465 — Kingson's own mailbox

   and MAIL_FROM, e.g. "Kingson Engineering <admin1@kingsonengineering.co.zw>".
   With none set, send() returns { sent:false, reason:'not_configured' } and
   the caller records that — nothing ever reports a send that did not happen.
   ═══════════════════════════════════════════════════════════════════════════ */

import type { Mail } from './templates.ts';

export interface Sent { sent: boolean; id?: string; reason?: string; detail?: string }

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

/** Which provider is configured, if any. Never returns a secret. */
export function providerName(): 'resend' | 'smtp' | null {
  if (Deno.env.get('RESEND_API_KEY')) return 'resend';
  if (Deno.env.get('SMTP_URL')) return 'smtp';
  return null;
}

export function mailConfigured(): boolean {
  return Boolean(providerName() && Deno.env.get('MAIL_FROM'));
}

export async function send(to: string[], mail: Mail, replyTo?: string): Promise<Sent> {
  const p = providerName();
  const from = Deno.env.get('MAIL_FROM');
  if (!p || !from) {
    return { sent: false, reason: 'not_configured', detail: 'Set RESEND_API_KEY or SMTP_URL, and MAIL_FROM.' };
  }
  return p === 'resend' ? viaResend(to, mail, from, replyTo) : viaSmtp(to, mail, from, replyTo);
}

export const isEmail = (a: string) => /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(String(a || '').trim());
