/* ═══════════════════════════════════════════════════════════════════════════
   ui/form.js — fields, dialogs and the thing that tells you what happened
   ═══════════════════════════════════════════════════════════════════════════

   Every write in this application goes through `submit()` below, and that is
   deliberate. It disables the button, catches the failure, puts the reason on
   the screen next to the form, and re-enables so the work can be retried.

   The failure mode it exists to prevent is the one that loses data: a person
   fills in a quotation, presses Save, the request fails, the dialog closes
   anyway, and nobody finds out until the customer rings. Here the dialog
   stays open with the typed values still in it until the database has
   confirmed the write.
   ═══════════════════════════════════════════════════════════════════════════ */

import { esc } from '../core/fmt.js';
import { icon } from './icons.js';

/* ── fields ───────────────────────────────────────────────────────────────── */

export const field = (id, label, input, { hint = '', wide = false } = {}) => `
  <div class="field${wide ? ' field-wide' : ''}">
    <label for="${esc(id)}">${esc(label)}</label>
    ${input}
    ${hint ? `<p class="field-hint">${esc(hint)}</p>` : ''}
    <p class="field-err" data-err-for="${esc(id)}" hidden></p>
  </div>`;

export const text = (id, value = '', attrs = '') =>
  `<input class="inp" id="${esc(id)}" name="${esc(id)}" type="text" value="${esc(value)}" ${attrs}>`;

export const textarea = (id, value = '', rows = 3, attrs = '') =>
  `<textarea class="inp" id="${esc(id)}" name="${esc(id)}" rows="${rows}" ${attrs}>${esc(value)}</textarea>`;

export const number = (id, value = '', attrs = '') =>
  `<input class="inp" id="${esc(id)}" name="${esc(id)}" type="number" inputmode="decimal" value="${value ?? ''}" ${attrs}>`;

export const dateInput = (id, value = '', attrs = '') =>
  `<input class="inp" id="${esc(id)}" name="${esc(id)}" type="date" value="${esc(value)}" ${attrs}>`;

export const dateTimeInput = (id, value = '', attrs = '') =>
  `<input class="inp" id="${esc(id)}" name="${esc(id)}" type="datetime-local" value="${esc(value)}" ${attrs}>`;

export const select = (id, options, value = '', attrs = '') => `
  <select class="sel" id="${esc(id)}" name="${esc(id)}" ${attrs}>
    ${options.map((o) => {
      const [v, l] = Array.isArray(o) ? o : [o, o];
      return `<option value="${esc(v)}"${String(v) === String(value ?? '') ? ' selected' : ''}>${esc(l)}</option>`;
    }).join('')}
  </select>`;

/** Reads a whole form into a plain object, trimming as it goes. */
export function readForm(root) {
  const out = {};
  for (const el of root.querySelectorAll('input, select, textarea')) {
    if (!el.name) continue;
    out[el.name] = el.type === 'checkbox' ? el.checked : el.value.trim();
  }
  return out;
}

/** Empty string → null, so a blank optional field stores NULL, not ''. */
export const nul = (v) => (v === '' || v === undefined ? null : v);
export const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

export function setFieldError(root, id, message) {
  const el = root.querySelector(`[data-err-for="${id}"]`);
  const input = root.querySelector('#' + CSS.escape(id));
  if (el) { el.textContent = message || ''; el.hidden = !message; }
  if (input) {
    input.classList.toggle('is-bad', Boolean(message));
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }
}

export function clearErrors(root) {
  root.querySelectorAll('[data-err-for]').forEach((e) => { e.textContent = ''; e.hidden = true; });
  root.querySelectorAll('.is-bad').forEach((e) => { e.classList.remove('is-bad'); e.removeAttribute('aria-invalid'); });
}

/* ── toast ────────────────────────────────────────────────────────────────── */

let toastHost = null;

export function toast(message, tone = 'ok') {
  if (!toastHost) {
    toastHost = document.createElement('div');
    toastHost.className = 'toasts';
    /* polite, not assertive: a saved-confirmation should not interrupt a
       screen reader mid-sentence. Errors are announced by the form itself. */
    toastHost.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastHost);
  }
  const el = document.createElement('p');
  el.className = `toast toast-${tone}`;
  el.innerHTML = `${tone === 'bad' ? icon.alert(15) : icon.check(15)}<span>${esc(message)}</span>`;
  toastHost.appendChild(el);
  setTimeout(() => { el.classList.add('is-out'); setTimeout(() => el.remove(), 260); }, tone === 'bad' ? 5200 : 2800);
}

/* ── dialog ───────────────────────────────────────────────────────────────── */

let openDialog = null;

/**
 * A modal with a focus trap, Escape to close, and focus returned to whatever
 * opened it. `onSubmit` receives the form values; throwing from it keeps the
 * dialog open and shows the message.
 */
export function dialog({ title, sub = '', body, submitLabel = 'Save', onSubmit, width = 520 }) {
  if (openDialog) openDialog();        // never two stacked dialogs
  const opener = document.activeElement;

  const wrap = document.createElement('div');
  wrap.className = 'modal';
  wrap.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="dlg-h" style="--w:${width}px">
      <form novalidate>
        <h2 class="modal-title display" id="dlg-h">${esc(title)}</h2>
        ${sub ? `<p class="modal-sub">${esc(sub)}</p>` : ''}
        <div class="modal-body">${body}</div>
        <p class="modal-err" role="alert" hidden></p>
        <div class="modal-foot">
          <button type="button" class="btn-ghost btn-sm" data-cancel>Cancel</button>
          <button type="submit" class="btn btn-sm" data-save>${esc(submitLabel)}</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(wrap);
  document.body.classList.add('is-modal');

  const form = wrap.querySelector('form');
  const errEl = wrap.querySelector('.modal-err');
  const saveBtn = wrap.querySelector('[data-save]');

  const first = wrap.querySelector('input:not([type=hidden]), select, textarea');
  (first || saveBtn).focus();

  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); destroy(); return; }
    if (e.key !== 'Tab') return;
    const f = [...wrap.querySelectorAll('input, select, textarea, button, [href]')]
      .filter((x) => !x.disabled && x.offsetParent !== null);
    if (!f.length) return;
    const [a, z] = [f[0], f[f.length - 1]];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  };

  function destroy() {
    document.removeEventListener('keydown', onKey, true);
    wrap.remove();
    document.body.classList.remove('is-modal');
    openDialog = null;
    if (opener && document.contains(opener)) opener.focus();
  }

  document.addEventListener('keydown', onKey, true);
  wrap.querySelector('[data-cancel]').addEventListener('click', destroy);
  wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) destroy(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors(wrap);
    errEl.hidden = true;
    saveBtn.disabled = true;
    const label = saveBtn.textContent;
    saveBtn.textContent = 'Saving…';
    try {
      await onSubmit(readForm(form), wrap);
      destroy();
    } catch (err) {
      /* The dialog stays open with everything the person typed still in it. */
      if (err?.field) {
        setFieldError(wrap, err.field, err.message);
        wrap.querySelector('#' + CSS.escape(err.field))?.focus();
      } else {
        errEl.textContent = err?.message || 'That could not be saved.';
        errEl.hidden = false;
      }
      saveBtn.disabled = false;
      saveBtn.textContent = label;
    }
  });

  openDialog = destroy;
  return destroy;
}

export function closeDialog() { if (openDialog) openDialog(); }

/**
 * Run a view's refresh *after* the dialog has closed.
 *
 * A dialog closes when `onSubmit` resolves. If `onSubmit` awaits the screen
 * refresh as well, the dialog sits there reading "Saving…" for as long as the
 * re-query takes — on a slow connection that is several seconds after the row
 * is already in the database, and it invites a second press of Save.
 *
 * The write landing is the receipt. Hand the refresh to `after()` and it runs
 * on the next macrotask, by which time `destroy()` has torn the dialog down.
 * A refresh that fails is a stale screen, not a lost record, so it is logged
 * rather than shown as a save failure.
 */
export function after(fn, ...args) {
  if (typeof fn !== 'function') return;
  setTimeout(() => {
    Promise.resolve(fn(...args)).catch((e) => console.error('[kingson] refresh after save failed', e));
  }, 0);
}

/** A yes/no that returns a promise, for destructive things. */
export function confirmDialog({ title, message, confirmLabel = 'Confirm', tone = 'danger' }) {
  return new Promise((resolve) => {
    const destroy = dialog({
      title,
      body: `<p class="modal-message">${esc(message)}</p>`,
      submitLabel: confirmLabel,
      width: 420,
      onSubmit: async () => { resolve(true); }
    });
    /* Cancel and Escape both resolve false rather than hanging the caller. */
    const host = document.querySelector('.modal');
    host?.addEventListener('click', (e) => {
      if (e.target.closest('[data-cancel]')) resolve(false);
    });
    const saveBtn = host?.querySelector('[data-save]');
    if (saveBtn && tone === 'danger') saveBtn.classList.add('btn-danger');
    const obs = new MutationObserver(() => {
      if (!document.body.contains(host)) { resolve(false); obs.disconnect(); }
    });
    obs.observe(document.body, { childList: true });
    void destroy;
  });
}

/** A validation failure attached to one field. */
export const fieldError = (field, message) => Object.assign(new Error(message), { field });
