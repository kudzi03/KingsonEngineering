/* ═══════════════════════════════════════════════════════════════════════════
   views/account.js — your own sign-in: see it, change the password
   ═══════════════════════════════════════════════════════════════════════════

   The current password is asked for first (core/auth.changePassword checks
   it by signing in), so a session left open on a shared office computer is
   not enough to take the account over. Forgotten passwords go through the
   sign-in screen's "Forgot your password?" link instead.

   The email address itself is not editable here: it is the login, and a typo
   would lock the person out. An administrator changes it in Supabase.
   ═══════════════════════════════════════════════════════════════════════════ */

import { changePassword, currentEmail } from '../core/auth.js';
import { card } from '../ui/components.js';
import { field, setFieldError, clearErrors, toast } from '../ui/form.js';
import { esc } from '../core/fmt.js';

export const title = 'My account';

const pw = (id, auto) =>
  `<input class="inp" id="${id}" name="${id}" type="password" autocomplete="${auto}" required>`;

export async function render(_arg, { me }) {
  return card('Signed in as', `
      <p class="scope"><strong>${esc(me?.full_name || '')}</strong> · ${esc(currentEmail())}
        · ${me?.role === 'admin' ? 'Administrator' : 'Staff'}</p>
      <p class="field-hint">To change the email you sign in with, ask an administrator.</p>`) +
    card('Change password', `
      <form class="settings-grid" data-pw-form novalidate>
        ${field('pw-current', 'Current password', pw('pw-current', 'current-password'))}
        ${field('pw-new', 'New password', pw('pw-new', 'new-password'), { hint: 'At least 8 characters.' })}
        ${field('pw-again', 'New password again', pw('pw-again', 'new-password'))}
        <div class="field"><button type="submit" class="btn">Change password</button></div>
      </form>`,
    { note: 'Other devices stay signed in until their session ends' });
}

export function mount(root) {
  const form = root.querySelector('[data-pw-form]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors(form);
    const v = Object.fromEntries(new FormData(form));      // untrimmed: a password is exact
    if (!v['pw-current']) return setFieldError(form, 'pw-current', 'Enter your current password.');
    if (v['pw-new'].length < 8) return setFieldError(form, 'pw-new', 'Use at least 8 characters.');
    if (v['pw-new'] !== v['pw-again']) return setFieldError(form, 'pw-again', 'The two new passwords do not match.');
    if (v['pw-new'] === v['pw-current']) return setFieldError(form, 'pw-new', 'Choose a password you have not used here.');

    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    try {
      await changePassword(v['pw-current'], v['pw-new']);
      form.reset();
      toast('Password changed. Use the new one next time you sign in.');
    } catch (err) {
      if (err.field) setFieldError(form, err.field, err.message);
      else toast(err.message || 'The password could not be changed.', 'bad');
    } finally {
      btn.disabled = false;
    }
  });
}
