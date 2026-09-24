/* ═══════════════════════════════════════════════════════════════════════════
   interface/enquiry.js — the enquiry form
   ═══════════════════════════════════════════════════════════════════════════

   The form validates locally, saves the enquiry to Kingson's database (see
   below), and composes the message an estimator would want to receive so the
   visitor can also hand it to an app they already have. No upload, no ticket
   number.

   There is deliberately no file input. A static page cannot upload a drawing,
   and a picker that only collects filenames reads like an upload to the person
   using it. The form says which formats to attach to the message instead.

   RECIPIENT GATING: the handoff buttons exist only when company.js reports a
   verified recipient. If that ever stops being true, the honest state is
   "copy your enquiry" plus a plain explanation — not a dead Send button.

   THE ENQUIRY IS NOW ACTUALLY SENT. Pressing the button writes the enquiry
   into Kingson's database, where a trigger turns it into an opportunity, a
   timeline entry and a dated follow-up task. Only when the database confirms
   the row does this module say anything was sent.

   The WhatsApp, mail and copy handoffs are unchanged and still shown, on both
   outcomes. They are the reason a failed save is never a lost enquiry: the
   visitor still has the text, still has the buttons, and is told plainly which
   of the two happened. Nothing here ever discards what somebody typed.
   ═══════════════════════════════════════════════════════════════════════════ */

import { ENQUIRY } from '../content/runtime-copy.js';
import { hasVerifiedRecipient, recipients } from '../content/company.js';
import { sendEnquiry } from './send-enquiry.js';
import { canSubmit } from '../content/crm.js';

/* Field id → the label the composed message uses. Order is the message's
   order, which is the order an estimator reads in. */
const LINES = [
  ['company',     'Organisation'],
  ['orgdetails',  'About the organisation'],
  ['contact',     'Business contact'],
  ['service',     'Needs'],
  ['location',    'Site'],
  ['drawings',    'Drawings']
];

const REQUIRED = ['company', 'contact', 'service'];

export function mountEnquiry() {
  const form = document.querySelector('[data-form]');
  if (!form) return;

  const summary = form.querySelector('[data-error-summary]');
  const draft = document.querySelector('[data-draft]');
  const draftBody = draft.querySelector('[data-draft-body]');
  const draftActions = draft.querySelector('[data-draft-actions]');
  const draftStatus = draft.querySelector('[data-draft-status]');
  const draftTitle = draft.querySelector('[data-draft-title]');
  const sent = document.querySelector('[data-sent]');
  const sentTitle = sent?.querySelector('[data-sent-title]');
  const sentBody = sent?.querySelector('[data-sent-body]');
  const submitBtn = form.querySelector('[data-review]');

  const field = (id) => form.querySelector('#f-' + id);
  const val = (id) => (field(id)?.value || '').trim();

  /* Clear a field's error the moment the visitor fixes it, rather than making
     them submit again to find out. */
  REQUIRED.forEach((id) => {
    const el = field(id);
    if (!el) return;
    const ev = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(ev, () => { if (el.value.trim()) setError(id, null); });
  });

  function setError(id, message) {
    const input = field(id);
    const out = form.querySelector(`[data-error-for="f-${id}"]`);
    if (!input || !out) return;
    if (message) {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', out.id || (out.id = `f-${id}-err`));
      out.textContent = message;
      out.hidden = false;
    } else {
      input.removeAttribute('aria-invalid');
      out.textContent = '';
      out.hidden = true;
    }
  }

  function payload() {
    const p = {};
    for (const [id] of LINES) p[id] = val(id);
    p.description = val('description');
    p.honeypot = (form.querySelector('#f-website')?.value || '').trim();
    return p;
  }

  function compose(p) {
    const L = ['Kingson Engineering — enquiry', ''];
    for (const [id, key] of LINES) if (p[id]) L.push(`${key}: ${p[id]}`);
    if (p.description) L.push('', p.description);
    return L.join('\n');
  }

  let inFlight = false;
  /* The text of the last enquiry the database confirmed. Pressing send again
     on the same words shows the same confirmation instead of creating a
     second record; change anything and it is a new enquiry. */
  let lastSaved = null;
  let lastRef = null;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (inFlight) return;                    // one enquiry per press
    const p = payload();

    const missing = [];
    for (const id of REQUIRED) {
      if (p[id]) setError(id, null);
      else { setError(id, ENQUIRY.errors[id]); missing.push(id); }
    }
    /* Something to reply to: an email address, or at least seven digits. The
       save refuses anything under five characters (send-enquiry.js), and
       "0772" would otherwise surface as a failed save, not a field to fix. */
    const empty = missing.length;
    if (p.contact && !/\S@\S+\.\S/.test(p.contact) && (p.contact.match(/\d/g) || []).length < 7) {
      setError('contact', ENQUIRY.errors.contactFormat);
      missing.push('contact');
    }

    if (missing.length) {
      /* Every entered value is preserved. The summary takes focus so a screen
         reader announces the problem, and the first bad field is scrolled to. */
      summary.textContent = empty ? ENQUIRY.errors.summary : ENQUIRY.errors.summaryFormat;
      summary.hidden = false;
      summary.focus();
      field(missing[0])?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      draft.dataset.open = 'false';
      if (sent) sent.hidden = true;
      return;
    }
    summary.hidden = true;

    /* The text is composed before the request, not after, so that whatever the
       network does the visitor still has their enquiry in front of them. */
    const message = compose(p);
    if (message === lastSaved) { showOutcome({ ok: true, ref: lastRef }, message, p); return; }

    inFlight = true;
    const label = submitBtn?.querySelector('span');
    const was = label?.textContent;
    if (label) label.textContent = ENQUIRY.sending;
    if (submitBtn) submitBtn.disabled = true;

    let result = { ok: false, reason: 'unconfigured' };
    if (canSubmit()) {
      try { result = await sendEnquiry(p); }
      catch { result = { ok: false, reason: 'network' }; }
    }

    inFlight = false;
    if (result.ok) { lastSaved = message; lastRef = result.ref || null; }
    if (submitBtn) submitBtn.disabled = false;
    if (label) label.textContent = was;

    showOutcome(result, message, p);
  });

  /* Both outcomes show the same message and the same buttons. What changes is
     the heading above them, and whether it is true that Kingson already has
     this enquiry. */
  function showOutcome(result, message, p) {
    if (sent) {
      sentTitle.textContent = result.ok ? ENQUIRY.sentTitle : ENQUIRY.failedTitle;
      sentBody.textContent  = result.ok
        ? (result.ref ? ENQUIRY.sentRef.replace('{ref}', result.ref) + ' ' : '') + ENQUIRY.sentBody
        : ENQUIRY.failedBody;
      sent.dataset.state = result.ok ? 'ok' : 'failed';
      sent.hidden = false;
    }
    if (draftTitle) draftTitle.textContent = result.ok ? ENQUIRY.draftAlsoTitle : ENQUIRY.draftTitle;

    draftBody.textContent = message;
    draft.dataset.open = 'true';
    buildActions(message, p);
    (sent && !sent.hidden ? sent : draft).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (sent && !sent.hidden) { sent.setAttribute('tabindex', '-1'); sent.focus({ preventScroll: true }); }
  }

  /* Kingson gave a second address for drawings and technical detail. If the
     visitor says they have a CAD file, the mail handoff goes there. */
  const drawingsAttached = (p) => /^Yes/i.test(p.drawings || '');

  function buildActions(message, p) {
    draftActions.innerHTML = '';
    draftStatus.textContent = '';

    /* Order matters. WhatsApp first, because it is the channel most customers
       here already have open; then mail; then copy, for anyone who wants
       neither. Each of these hands the message to an app the visitor already
       has, and the wording says so. */
    if (hasVerifiedRecipient()) {
      const r = recipients();
      if (r.whatsapp) {
        const url = `https://wa.me/${r.whatsapp}?text=${encodeURIComponent(message)}`;
        /* Long URLs are silently truncated by some WhatsApp clients, which
           would deliver half an enquiry. Below the limit or not at all. */
        if (url.length < 1800) draftActions.appendChild(link(ENQUIRY.actions.whatsapp, url, true));
      }
      if (r.email) {
        const subject = `Enquiry — ${p.company}${p.service ? ' — ' + p.service : ''}`;
        const to = drawingsAttached(p) && r.emailTechnical ? r.emailTechnical : r.email;
        const href = `mailto:${to}?subject=${encodeURIComponent(subject)}` +
                     `&body=${encodeURIComponent(message)}`;
        draftActions.appendChild(link(ENQUIRY.actions.email, href));
      }
    }

    draftActions.appendChild(button(ENQUIRY.actions.copy, async () => {
      try { await navigator.clipboard.writeText(message); }
      catch { fallbackCopy(message); }
      draftStatus.textContent = ENQUIRY.copied;   // copied — not sent
    }));

    if (!hasVerifiedRecipient()) {
      const gate = document.createElement('p');
      gate.className = 'draft-gate';
      gate.textContent = ENQUIRY.noRecipient;
      draftActions.appendChild(gate);
    }

    draftActions.appendChild(button(ENQUIRY.edit, () => {
      draft.dataset.open = 'false';
      field('company')?.focus();
    }));
  }

  function button(label, fn) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn-ghost';
    b.textContent = label;
    b.addEventListener('click', fn);
    return b;
  }

  function link(label, href, external) {
    const a = document.createElement('a');
    a.className = 'btn';
    a.href = href;
    a.textContent = label;
    if (external) { a.target = '_blank'; a.rel = 'noopener'; }
    a.addEventListener('click', () => { draftStatus.textContent = ENQUIRY.handedOff; });
    return a;
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-1000px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch { /* nothing to claim */ }
    document.body.removeChild(ta);
  }
}
