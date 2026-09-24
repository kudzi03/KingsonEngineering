/* ═══════════════════════════════════════════════════════════════════════════
   templates.ts — every email the system can send
   ═══════════════════════════════════════════════════════════════════════════

   Plain text beside the HTML, always. A message that arrives blank because
   somebody's client strips HTML is a lost job.

   Two kinds, never blurred:
     to staff     officeAlert (new enquiry), digest (morning follow-up list)
     to customers acknowledgement — a receipt with the reference, sent once,
                  only for a website enquiry that gave an email address.
                  quoteFollowUp exists for a person to send deliberately; no
                  automatic process sends it.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface Mail { subject: string; text: string; html: string }

const esc = (s: string) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

const OFFICE = {
  name:    'Kingson Engineering',
  tagline: 'Steelwork Specialists',
  address: 'No. 1262 Tynwald Industries, Harare',
  phone:   '+263 772 262 869',
  office:  '+263 242 304 341',
  email:   'admin1@kingsonengineering.co.zw',
  site:    'https://kingson-engineering.vercel.app'
};

/* One frame for all three, so a change to the footer cannot reach two emails
   and miss the third. Inline styles only — every mail client strips <style>. */
const frame = (heading: string, body: string) => `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0a0a0a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px">
    <tr><td style="padding:28px 30px 0">
      <p style="margin:0;font-size:15px;font-weight:700;letter-spacing:.02em;color:#E21E25">${esc(OFFICE.name)}</p>
      <p style="margin:2px 0 0;font-size:12px;color:#039647">${esc(OFFICE.tagline)}</p>
    </td></tr>
    <tr><td style="padding:22px 30px 0">
      <h1 style="margin:0 0 14px;font-size:19px;line-height:1.35;font-weight:700">${esc(heading)}</h1>
      ${body}
    </td></tr>
    <tr><td style="padding:24px 30px 28px">
      <hr style="border:none;border-top:1px solid #e4e4e7;margin:0 0 16px">
      <p style="margin:0;font-size:12px;line-height:1.7;color:#71717a">
        ${esc(OFFICE.address)}<br>
        ${esc(OFFICE.phone)} &nbsp;·&nbsp; ${esc(OFFICE.office)}<br>
        <a href="mailto:${esc(OFFICE.email)}" style="color:#C4181E">${esc(OFFICE.email)}</a>
      </p>
    </td></tr>
  </table>
</body></html>`;

const p = (s: string) => `<p style="margin:0 0 12px;font-size:14.5px;line-height:1.65;color:#3f3f46">${s}</p>`;

/* ── 1. to the customer, the moment their enquiry lands ───────────────────── */

/* A receipt, not a reply. It says the enquiry arrived and gives the reference.
   It does not say anybody has read it yet, and it does not promise a price —
   neither is true at the moment it is sent. The hours are the confirmed
   opening hours. */
export function acknowledgement(v: {
  name: string; ref: string; service?: string | null; location?: string | null;
}): Mail {
  const what = [v.service, v.location].filter(Boolean).join(' — ');
  const subject = `Enquiry received — ${v.ref}`;

  const text = [
    `Good day${v.name ? ' ' + v.name : ''},`, '',
    `Thank you. Your enquiry has been received.`,
    '',
    `Reference: ${v.ref}${what ? `\nAbout: ${what}` : ''}`,
    '',
    `Kingson Engineering will review it during working hours (Monday to Saturday, 07:30 – 17:00). Please quote the reference if you get in touch about it.`,
    '',
    `Drawings (DXF, DWG, STEP or PDF) can be sent by replying to this email.`,
    '',
    `Kingson Engineering`,
    OFFICE.address,
    `${OFFICE.phone} · ${OFFICE.office}`
  ].join('\n');

  return {
    subject,
    text,
    html: frame('Your enquiry has been received.',
      p(`Good day${v.name ? ' ' + esc(v.name) : ''},`) +
      p('Thank you. Your enquiry has been received.') +
      p(`Reference: <strong>${esc(v.ref)}</strong>${what ? `<br>About: ${esc(what)}` : ''}`) +
      p('Kingson Engineering will review it during working hours (Monday to Saturday, 07:30 – 17:00). Please quote the reference if you get in touch about it.') +
      p('Drawings (DXF, DWG, STEP or PDF) can be sent by replying to this email.'))
  };
}

/* ── 2. to the office, so nobody has to be watching a screen ──────────────── */

export function officeAlert(v: {
  ref: string; name: string; company?: string | null; contact: string;
  phone?: string | null; email?: string | null;
  service?: string | null; location?: string | null; message?: string | null;
  received: string; source?: string; dueOn: string; crmUrl: string;
}): Mail {
  const rows: [string, string][] = [
    ['Reference', v.ref],
    ['From', v.name],
    ['Company', v.company || '—'],
    ['Phone', v.phone || '—'],
    ['Email', v.email || '—'],
    ...(!v.phone && !v.email ? [['Contact', v.contact] as [string, string]] : []),
    ['Needs', v.service || '—'],
    ['Site', v.location || '—'],
    ['Received', v.received],
    ['Respond by', v.dueOn]
  ];

  const text = [
    `New ${v.source || 'website'} enquiry — ${v.ref}`, '',
    ...rows.map(([k, val]) => `${k}: ${val}`),
    v.message ? `\n${v.message}` : '',
    '', `Open it: ${v.crmUrl}`
  ].join('\n');

  return {
    subject: `New enquiry — ${v.name}${v.company ? ` (${v.company})` : ''} — ${v.ref}`,
    text,
    html: frame(`New ${v.source || 'website'} enquiry.`,
      `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;margin-bottom:14px">
        ${rows.map(([k, val]) => `<tr>
          <td style="padding:6px 12px 6px 0;color:#71717a;white-space:nowrap;vertical-align:top">${esc(k)}</td>
          <td style="padding:6px 0;color:#0a0a0a">${esc(val)}</td></tr>`).join('')}
      </table>` +
      (v.message ? p(`<em>${esc(v.message)}</em>`) : '') +
      `<p style="margin:18px 0 0"><a href="${esc(v.crmUrl)}"
         style="display:inline-block;background:#E21E25;color:#ffffff;text-decoration:none;
                padding:11px 20px;border-radius:8px;font-size:14px;font-weight:600">Open in the CRM</a></p>`)
  };
}

/* ── 3. chasing a quotation that has gone quiet ───────────────────────────── */

export function quoteFollowUp(v: {
  name: string; ref: string; quoteRef: string; amount: string;
  sentOn: string; validUntil?: string | null;
}): Mail {
  const text = [
    `Good day ${v.name},`, '',
    `We sent you quotation ${v.quoteRef} on ${v.sentOn} for ${v.amount}, against enquiry ${v.ref}.`,
    v.validUntil ? `It holds until ${v.validUntil}.` : '',
    '',
    `Is there anything on it you would like us to go through, or anything that needs changing? A phone call is usually quicker than an email — ${OFFICE.phone}.`,
    '',
    `Kingson Engineering`,
    OFFICE.address
  ].filter(Boolean).join('\n');

  return {
    subject: `Quotation ${v.quoteRef} — anything you need from us?`,
    text,
    html: frame('About your quotation.',
      p(`Good day ${esc(v.name)},`) +
      p(`We sent you quotation <strong>${esc(v.quoteRef)}</strong> on ${esc(v.sentOn)} for <strong>${esc(v.amount)}</strong>, against enquiry ${esc(v.ref)}.` +
        (v.validUntil ? ` It holds until ${esc(v.validUntil)}.` : '')) +
      p(`Is there anything on it you would like us to go through, or anything that needs changing? A phone call is usually quicker than an email — ${esc(OFFICE.phone)}.`))
  };
}

/* ── 4. the morning list, to the people who own the work ──────────────────
   Internal only. It tells Kingson staff what to chase; it never writes to a
   customer. One section each for overdue and due today, most overdue first. */

export interface DigestRow {
  ref: string; title: string; company?: string | null; contact?: string | null;
  quote?: string | null; quoteSent?: string | null; due: string; late: number;
  action?: string | null; owner?: string | null; url: string;
}

export function digest(v: {
  date: string; forName?: string | null; overdue: DigestRow[]; today: DigestRow[];
  awaiting: string; crmUrl: string;
}): Mail {
  const n = v.overdue.length + v.today.length;
  const line = (r: DigestRow) => [
    `${r.company || r.contact || r.title} — ${r.ref}`,
    r.quote ? `  Quote: ${r.quote}${r.quoteSent ? ` · sent ${r.quoteSent}` : ''}` : '',
    `  ${r.action || 'Next action'} — ${r.late > 0 ? `${r.late} day${r.late === 1 ? '' : 's'} overdue` : 'due today'}`,
    r.owner ? `  Owner: ${r.owner}` : '',
    `  ${r.url}`
  ].filter(Boolean).join('\n');

  const text = [
    `KINGSON CRM — FOLLOW-UP SUMMARY — ${v.date}`, '',
    `${v.today.length} due today · ${v.overdue.length} overdue · ${v.awaiting} awaiting a customer decision`, '',
    ...(v.overdue.length ? ['OVERDUE', ...v.overdue.map(line), ''] : []),
    ...(v.today.length ? ['DUE TODAY', ...v.today.map(line), ''] : []),
    `Open the follow-up list: ${v.crmUrl}#/followups`,
    '', 'This is an internal reminder. Nothing has been sent to any customer.'
  ].join('\n');

  const rowHtml = (r: DigestRow) => `<tr><td style="padding:10px 0;border-top:1px solid #e4e4e7">
      <a href="${esc(r.url)}" style="color:#0a0a0a;font-weight:600;text-decoration:none">${esc(r.company || r.contact || r.title)}</a>
      <span style="color:#71717a"> · ${esc(r.ref)}</span><br>
      ${r.quote ? `<span style="color:#3f3f46">Quote ${esc(r.quote)}${r.quoteSent ? ` · sent ${esc(r.quoteSent)}` : ''}</span><br>` : ''}
      <span style="color:${r.late > 0 ? '#C4181E' : '#0a0a0a'}">${esc(r.action || 'Next action')} — ${r.late > 0 ? `${r.late} day${r.late === 1 ? '' : 's'} overdue` : 'due today'}</span>
      ${r.owner ? `<span style="color:#71717a"> · ${esc(r.owner)}</span>` : ''}
    </td></tr>`;
  const section = (h: string, rows: DigestRow[]) => rows.length
    ? `<p style="margin:16px 0 4px;font-size:12px;font-weight:700;letter-spacing:.08em;color:#71717a">${esc(h)}</p>
       <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${rows.map(rowHtml).join('')}</table>`
    : '';

  return {
    subject: `Follow-ups: ${v.today.length} due today, ${v.overdue.length} overdue — ${v.date}`,
    text,
    html: frame(`${n} follow-up${n === 1 ? '' : 's'} need${n === 1 ? 's' : ''} attention.`,
      p(`${v.forName ? `Good morning ${esc(v.forName)}. ` : ''}<strong>${v.today.length}</strong> due today · <strong>${v.overdue.length}</strong> overdue · <strong>${esc(v.awaiting)}</strong> awaiting a customer decision.`) +
      section('OVERDUE', v.overdue) + section('DUE TODAY', v.today) +
      `<p style="margin:18px 0 0"><a href="${esc(v.crmUrl)}#/followups"
         style="display:inline-block;background:#E21E25;color:#ffffff;text-decoration:none;
                padding:11px 20px;border-radius:8px;font-size:14px;font-weight:600">Open the follow-up list</a></p>` +
      p('<span style="font-size:12px;color:#71717a">An internal reminder. Nothing has been sent to any customer.</span>'))
  };
}

export const TEMPLATES = { acknowledgement, officeAlert, quoteFollowUp, digest };
