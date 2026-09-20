/* ═══════════════════════════════════════════════════════════════════════════
   templates.ts — the three emails Kingson actually sends
   ═══════════════════════════════════════════════════════════════════════════

   Plain text beside the HTML, always. A quotation follow-up that arrives as a
   blank message because somebody's client strips HTML is a lost job.

   The wording is Kingson's, not a template vendor's: the acknowledgement makes
   the same promise the website makes — a reply the same working day — because
   the two must not disagree.
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

export function acknowledgement(v: {
  name: string; ref: string; service?: string | null; location?: string | null;
}): Mail {
  const what = [v.service, v.location].filter(Boolean).join(' — ');
  const subject = `We have your enquiry — ${v.ref}`;

  const text = [
    `Good day ${v.name},`, '',
    `Thank you for your enquiry. It is with our estimating team and we will come back to you the same working day.`,
    '',
    `Your reference is ${v.ref}.${what ? `\nWhat you asked about: ${what}` : ''}`,
    '',
    `If you have drawings — DXF, DWG, STEP or PDF — reply to this message with them attached and it will speed things up.`,
    '',
    `Kingson Engineering`,
    OFFICE.address,
    `${OFFICE.phone} · ${OFFICE.office}`
  ].join('\n');

  return {
    subject,
    text,
    html: frame('We have your enquiry.',
      p(`Good day ${esc(v.name)},`) +
      p('Thank you for your enquiry. It is with our estimating team and we will come back to you the same working day.') +
      p(`Your reference is <strong>${esc(v.ref)}</strong>.${what ? `<br>What you asked about: ${esc(what)}` : ''}`) +
      p('If you have drawings — DXF, DWG, STEP or PDF — reply to this message with them attached and it will speed things up.'))
  };
}

/* ── 2. to the office, so nobody has to be watching a screen ──────────────── */

export function officeAlert(v: {
  ref: string; name: string; company?: string | null; contact: string;
  service?: string | null; location?: string | null; message?: string | null;
  dueOn: string; crmUrl: string;
}): Mail {
  const rows: [string, string][] = [
    ['Reference', v.ref],
    ['Name', v.name],
    ['Company', v.company || '—'],
    ['Phone or email', v.contact],
    ['Needs', v.service || '—'],
    ['Site', v.location || '—'],
    ['Reply by', v.dueOn]
  ];

  const text = [
    `New website enquiry — ${v.ref}`, '',
    ...rows.map(([k, val]) => `${k}: ${val}`),
    v.message ? `\n${v.message}` : '',
    '', `Open it: ${v.crmUrl}`
  ].join('\n');

  return {
    subject: `New enquiry — ${v.name}${v.company ? ` (${v.company})` : ''} — ${v.ref}`,
    text,
    html: frame('New website enquiry.',
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

export const TEMPLATES = { acknowledgement, officeAlert, quoteFollowUp };
