/* ═══════════════════════════════════════════════════════════════════════════
   content/enquiry-endpoint.js — where a website enquiry goes
   ═══════════════════════════════════════════════════════════════════════════

   The form posts to this path on the website's own domain. The serverless
   function behind it (api/enquiry.js) validates the enquiry and writes it to
   the Google Sheet that Kingson Engineering owns.

   There is deliberately nothing else in this file. No Google address, no key,
   no spreadsheet ID: those live in Vercel environment variables, on the
   server, and must never be written into anything the browser downloads.

   Set the path to '' to switch automatic saving off. The form then goes
   straight to the WhatsApp and email handoff, which keeps working either way.
   ═══════════════════════════════════════════════════════════════════════════ */

export const ENQUIRY_ENDPOINT = '/api/enquiry';

export const canSubmit = () => Boolean(ENQUIRY_ENDPOINT);
