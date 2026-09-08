/* ═══════════════════════════════════════════════════════════════════════════
   interface/enquiry.js — a truthful local composer
   ═══════════════════════════════════════════════════════════════════════════

   V2 §10 Scene 8 and §15.

   Nothing here sends anything. The form validates locally, composes a message,
   and offers to hand it to an app the visitor already has. There is no upload,
   no persistence, no "sent", no ticket number and no response-time claim.

   File contents are never read, encoded or transmitted — only the names are
   listed, so the message can say which drawings the visitor means to attach.

   RECIPIENT GATING: the handoff buttons exist only when company.js reports a
   verified recipient. Until Kingson confirms where enquiries should go, the
   honest state is Copy enquiry plus a plain explanation — not a dead Submit.
   ═══════════════════════════════════════════════════════════════════════════ */

import { ENQUIRY } from '../content/copy.js';
import { hasVerifiedRecipient, recipients } from '../content/company.js';

const MAX_FILES = 12;   // a readability limit, not an upload allowance

export function mountEnquiry() {
  const form = document.querySelector('[data-form]');
  if (!form) return;

  const summary = form.querySelector('[data-error-summary]');
  const fileInput = form.querySelector('#f-files');
  const fileList = form.querySelector('[data-files-list]');
  const disclosure = form.querySelector('[data-disclosure]');
  const more = form.querySelector('[data-more]');
  const draft = document.querySelector('[data-draft]');
  const draftBody = draft.querySelector('[data-draft-body]');
  const draftActions = draft.querySelector('[data-draft-actions]');
  const draftStatus = draft.querySelector('[data-draft-status]');

  /* In-memory only, for this page session. No localStorage of personal data. */
  let files = [];

  disclosure.addEventListener('click', () => {
    const open = disclosure.getAttribute('aria-expanded') === 'true';
    disclosure.setAttribute('aria-expanded', String(!open));
    more.hidden = open;
  });

  fileInput.addEventListener('change', () => {
    Array.from(fileInput.files).forEach((f) => {
      if (files.length >= MAX_FILES) return;
      if (files.some((x) => x.name === f.name && x.size === f.size)) return;
      files.push(f);
    });
    fileInput.value = '';
    renderFiles();
  });

  function renderFiles() {
    fileList.innerHTML = '';
    files.forEach((f, i) => {
      const li = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = `${f.name} · ${Math.max(1, Math.round(f.size / 1024))} KB`;
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.textContent = ENQUIRY.files.remove;
      rm.setAttribute('aria-label', `${ENQUIRY.files.remove} ${f.name}`);
      rm.addEventListener('click', () => { files.splice(i, 1); renderFiles(); });
      li.append(name, rm);
      fileList.appendChild(li);
    });
  }

  const val = (id) => (form.querySelector('#' + id)?.value || '').trim();

  function setError(id, message) {
    const input = form.querySelector('#' + id);
    const out = form.querySelector(`[data-error-for="${id}"]`);
    if (!input || !out) return;
    if (message) {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', out.id || (out.id = id + '-err'));
      out.textContent = message; out.hidden = false;
    } else {
      input.removeAttribute('aria-invalid');
      out.textContent = ''; out.hidden = true;
    }
  }

  function payload() {
    return {
      name: val('f-name'), contact: val('f-contact'), scope: val('f-scope'),
      description: val('f-description'), location: val('f-location'),
      timing: val('f-timing'),
      attachments: files.map((f) => f.name)
    };
  }

  function compose(p) {
    const L = ['Kingson Engineering — enquiry', ''];
    const line = (k, v) => { if (v) L.push(`${k}: ${v}`); };
    line('Name', p.name);
    line('Email or phone', p.contact);
    line('Requirement', p.scope);
    line('Location', p.location);
    line('Timing', p.timing);
    if (p.description) L.push('', p.description);
    if (p.attachments.length) {
      L.push('', `Reference files to attach (${p.attachments.length}):`);
      p.attachments.forEach((n) => L.push(`  ${n}`));
    }
    return L.join('\n');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const p = payload();

    const errors = [];
    if (!p.name) { setError('f-name', ENQUIRY.errors.name); errors.push('f-name'); }
    else setError('f-name', null);
    if (!p.contact) { setError('f-contact', ENQUIRY.errors.contact); errors.push('f-contact'); }
    else setError('f-contact', null);
    if (!p.scope) { setError('f-scope', ENQUIRY.errors.scope); errors.push('f-scope'); }
    else setError('f-scope', null);

    if (errors.length) {
      /* Every entered value is preserved; the summary takes focus. */
      summary.textContent = ENQUIRY.errors.summary;
      summary.hidden = false;
      summary.focus();
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

  function buildActions(message, p) {
    draftActions.innerHTML = '';
    draftStatus.textContent = '';

    const copy = button(ENQUIRY.actions.copy, 'btn', async () => {
      try { await navigator.clipboard.writeText(message); }
      catch { fallbackCopy(message); }
      draftStatus.textContent = ENQUIRY.copied;   // copied — not sent
    });
    draftActions.appendChild(copy);

    if (hasVerifiedRecipient()) {
      const r = recipients();
      if (r.email) {
        const subject = `Enquiry — ${p.name}`;
        const href = `mailto:${r.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        draftActions.appendChild(link(ENQUIRY.actions.email, href));
      }
      if (r.whatsapp) {
        /* Long content falls back to Copy rather than a silently truncated URL. */
        const url = `https://wa.me/${r.whatsapp}?text=${encodeURIComponent(message)}`;
        if (url.length < 1800) draftActions.appendChild(link(ENQUIRY.actions.whatsapp, url, true));
      }
      draftStatus.textContent = ENQUIRY.handedOff;
    } else {
      const gate = document.createElement('p');
      gate.className = 'draft-gate';
      gate.textContent = ENQUIRY.noRecipient;
      draftActions.appendChild(gate);
    }

    draftActions.appendChild(button(ENQUIRY.edit, 'btn-quiet', () => {
      draft.dataset.open = 'false';
      form.querySelector('#f-name').focus();
    }));
  }

  function button(label, cls, fn) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = cls === 'btn' ? 'btn' : 'btn btn-quiet';
    b.textContent = label;
    b.addEventListener('click', fn);
    return b;
  }

  function link(label, href, external) {
    const a = document.createElement('a');
    a.className = 'btn'; a.href = href; a.textContent = label;
    if (external) { a.target = '_blank'; a.rel = 'noopener'; }
    a.addEventListener('click', () => { draftStatus.textContent = ENQUIRY.handedOff; });
    return a;
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-1000px';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch { /* nothing to claim */ }
    document.body.removeChild(ta);
  }
}
