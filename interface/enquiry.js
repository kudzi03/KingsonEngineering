/* ═══════════════════════════════════════════════════════════════════════════
   interface/enquiry.js — a truthful local composer
   ═══════════════════════════════════════════════════════════════════════════

   Nothing here sends anything. The form validates locally, composes the
   message an estimator would want to receive, and hands it to an app the
   visitor already has. There is no upload, no persistence, no "sent", no
   ticket number.

   There is deliberately no file input. A static page cannot upload a drawing,
   and a picker that only collects filenames reads like an upload to the person
   using it. The form says which formats to attach to the message instead.

   RECIPIENT GATING: the handoff buttons exist only when company.js reports a
   verified recipient. If that ever stops being true, the honest state is
   "copy your enquiry" plus a plain explanation — not a dead Send button.

   When the enquiry pipeline in ARCHITECTURE.md is built, this module gains one
   more action — POST to /api/enquiry — and the WhatsApp and mail handoffs stay
   exactly as they are. It does not gain a fake one in the meantime.
   ═══════════════════════════════════════════════════════════════════════════ */

import { ENQUIRY } from '../content/copy.js';
import { hasVerifiedRecipient, recipients } from '../content/company.js';

/* Field id → the label the composed message uses. Order is the message's
   order, which is the order an estimator reads in. */
const LINES = [
  ['name',        'Name'],
  ['company',     'Company'],
  ['contact',     'Phone or email'],
  ['service',     'Needs'],
  ['location',    'Site'],
  ['drawings',    'Drawings']
];

const REQUIRED = ['name', 'contact', 'service'];

export function mountEnquiry() {
  const form = document.querySelector('[data-form]');
  if (!form) return;

  const summary = form.querySelector('[data-error-summary]');
  const draft = document.querySelector('[data-draft]');
  const draftBody = draft.querySelector('[data-draft-body]');
  const draftActions = draft.querySelector('[data-draft-actions]');
  const draftStatus = draft.querySelector('[data-draft-status]');

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
    return p;
  }

  function compose(p) {
    const L = ['Kingson Engineering — enquiry', ''];
    for (const [id, key] of LINES) if (p[id]) L.push(`${key}: ${p[id]}`);
    if (p.description) L.push('', p.description);
    return L.join('\n');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const p = payload();

    const missing = [];
    for (const id of REQUIRED) {
      if (p[id]) setError(id, null);
      else { setError(id, ENQUIRY.errors[id]); missing.push(id); }
    }

    if (missing.length) {
      /* Every entered value is preserved. The summary takes focus so a screen
         reader announces the problem, and the first bad field is scrolled to. */
      summary.textContent = ENQUIRY.errors.summary;
      summary.hidden = false;
      summary.focus();
      field(missing[0])?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      draft.dataset.open = 'false';
      return;
    }
    summary.hidden = true;

    const message = compose(p);
    draftBody.textContent = message;
    draft.dataset.open = 'true';
    buildActions(message, p);
    draft.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

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
        const subject = `Enquiry — ${p.service || p.name}`;
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
      field('name')?.focus();
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
