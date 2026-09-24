/* ═══════════════════════════════════════════════════════════════════════════
   interface/send-enquiry.js — the one network call this website makes
   ═══════════════════════════════════════════════════════════════════════════

   One POST, straight to PostgREST, with the publishable key. There is no SDK
   and no bundler, so the page keeps its `script-src 'self'` and downloads
   nothing to do this.

   The row lands in `public.enquiries`. A BEFORE INSERT trigger in the database
   turns it into a company, a contact, an opportunity, a timeline entry and a
   dated follow-up task, inside the same transaction. That work is in Postgres
   rather than here precisely so that this file cannot get it wrong, and so no
   other way of inserting a row can skip it.

   `Prefer: return=minimal` is deliberate: the anonymous role has INSERT and
   nothing else, so asking for the row back would fail the read policy and turn
   a successful save into an error.
   ═══════════════════════════════════════════════════════════════════════════ */

import { CRM } from '../content/crm.js';

/* Long enough for a bad line, short enough that nobody gives up first. */
const TIMEOUT_MS = 12000;

/* The database policy enforces these too — this is the same rule stated early
   so somebody gets a useful message instead of a rejected request. */
const LIMITS = { name: 120, company: 160, contact: 200, service: 120,
                 location: 160, drawings: 120, message: 4000, page: 200 };

const clip = (v, n) => {
  const s = (v == null ? '' : String(v)).trim();
  return s ? s.slice(0, n) : null;
};

/**
 * Send one enquiry.
 *
 * Resolves `{ ok: true }` when the database has the row. Resolves
 * `{ ok: false, reason }` when it does not — never throws, because the caller
 * has to keep the WhatsApp and email handoffs working either way. An enquiry
 * that cannot be saved is still an enquiry the visitor must be able to send.
 *
 * @param {object} p       the form values
 * @param {string} p.honeypot  a field no human can see; the trigger flags it
 * @returns {Promise<{ok: boolean, reason?: string}>}
 */
export async function sendEnquiry(p) {
  /* The form asks about the business, not a person. The database's `name`
     column (which its insert policy requires) therefore carries the
     organisation's name, and what the organisation does leads the message. */
  const about = clip(p.orgdetails, 300);
  const body = {
    name:     clip(p.company, LIMITS.name),
    company:  clip(p.company, LIMITS.company),
    contact:  clip(p.contact, LIMITS.contact),
    service:  clip(p.service, LIMITS.service),
    location: clip(p.location, LIMITS.location),
    drawings: clip(p.drawings, LIMITS.drawings),
    message:  clip([about && `About the organisation: ${about}`, p.description].filter(Boolean).join('\n\n'), LIMITS.message),
    source:   'website',
    page:     clip(location.pathname, LIMITS.page),
    honeypot: clip(p.honeypot, 200)
    /* No user agent: the privacy notice says we collect the business, the
       contact and the job. Device details are not part of that. */
  };

  /* The two the policy requires. Caught here it is a field error; caught there
     it is a 403 with nothing useful to show anybody. */
  if (!body.name || body.name.length < 2)  return { ok: false, reason: 'company' };
  if (!body.contact || body.contact.length < 5) return { ok: false, reason: 'contact' };

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${CRM.url}/rest/v1/enquiries`, {
      method: 'POST',
      headers: {
        'apikey': CRM.publishableKey,
        'Authorization': `Bearer ${CRM.publishableKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(body),
      signal: ctl.signal
    });

    if (res.ok) return { ok: true };

    /* Keep the detail in the console for whoever is debugging, and hand the
       caller a word rather than a Postgres error to put in front of a
       customer. */
    const detail = await res.text().catch(() => '');
    console.warn('[kingson] enquiry not saved', res.status, detail.slice(0, 300));
    return { ok: false, reason: res.status === 403 || res.status === 400 ? 'rejected' : 'server' };
  } catch (err) {
    console.warn('[kingson] enquiry not sent', err?.name || err);
    return { ok: false, reason: err?.name === 'AbortError' ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}
