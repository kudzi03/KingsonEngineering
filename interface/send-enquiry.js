/* ═══════════════════════════════════════════════════════════════════════════
   interface/send-enquiry.js — the one network call this website makes
   ═══════════════════════════════════════════════════════════════════════════

   One POST, to /api/enquiry on the website's own domain. The serverless
   function there (api/enquiry.js) checks the enquiry again, writes one row to
   the Google Sheet Kingson Engineering owns, and hands back a reference
   (KE-…) the visitor can quote.

   The browser holds no credential of any kind and never contacts Google. That
   is also why the page's Content-Security-Policy can stay at
   `connect-src 'self'` for this call.

   Before November 2026 this file posted straight to the developer-hosted CRM
   database. It no longer does: new public enquiries go to Kingson's own sheet.
   ═══════════════════════════════════════════════════════════════════════════ */

import { ENQUIRY_ENDPOINT } from '../content/enquiry-endpoint.js';

/* Long enough for a bad line, short enough that nobody gives up first. */
const TIMEOUT_MS = 12000;

/* The server enforces these too — this is the same rule stated early so
   somebody gets a useful message instead of a rejected request. */
const LIMITS = { company: 160, contact: 200, service: 120, location: 160,
                 drawings: 120, orgdetails: 300, description: 4000, page: 200 };

const clip = (v, n) => (v == null ? '' : String(v)).trim().slice(0, n);

/* When this script started. The server refuses a form completed faster than a
   person can type, which costs a real visitor nothing and a bot a retry. */
const startedAt = Date.now();

/**
 * Send one enquiry.
 *
 * Resolves `{ ok: true, ref }` when the sheet has the row (ref may be null).
 * Resolves `{ ok: false, reason }` when it does not — never throws, because
 * the caller has to keep the WhatsApp and email handoffs working either way.
 * An enquiry that cannot be saved is still an enquiry the visitor must be able
 * to send.
 *
 * @param {object} p       the form values
 * @param {string} p.honeypot  a field no human can see
 * @returns {Promise<{ok: boolean, ref?: string|null, reason?: string}>}
 */
export async function sendEnquiry(p) {
  const body = {
    company:     clip(p.company, LIMITS.company),
    contact:     clip(p.contact, LIMITS.contact),
    service:     clip(p.service, LIMITS.service),
    location:    clip(p.location, LIMITS.location),
    drawings:    clip(p.drawings, LIMITS.drawings),
    orgdetails:  clip(p.orgdetails, LIMITS.orgdetails),
    description: clip(p.description, LIMITS.description),
    page:        clip(location.pathname, LIMITS.page),
    website:     clip(p.honeypot, 200),
    elapsed:     Date.now() - startedAt
    /* No user agent: the privacy notice says we collect the business, the
       contact and the job. Device details are not part of that. */
  };

  /* The two the server requires. Caught here it is a field error; caught there
     it is a refusal with nothing useful to show anybody. */
  if (body.company.length < 2) return { ok: false, reason: 'company' };
  if (body.contact.length < 5) return { ok: false, reason: 'contact' };

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(ENQUIRY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'omit',
      signal: ctl.signal
    });
    const out = await res.json().catch(() => ({}));
    if (res.ok && out && out.ok === true) {
      return { ok: true, ref: typeof out.ref === 'string' ? out.ref : null };
    }
    /* A word for whoever is debugging, and a word rather than a server error
       for the caller to act on. Nothing the visitor typed is logged. */
    console.warn('[kingson] enquiry not saved', res.status, out && out.reason);
    return { ok: false, reason: res.status === 400 || res.status === 403 ? 'rejected'
                               : res.status === 429 ? 'busy' : 'server' };
  } catch (err) {
    console.warn('[kingson] enquiry not sent', err?.name || 'error');
    return { ok: false, reason: err?.name === 'AbortError' ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}
