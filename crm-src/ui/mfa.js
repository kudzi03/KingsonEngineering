/* Password-only sessions can enroll an authenticator, but cannot read CRM data. */
import { authUser, enrollTotp, removeFactor, verifyTotp } from '../core/supabase.js';
import { esc } from '../core/fmt.js';

export async function mfaGate(gate, onComplete, onCancel) {
  const user = await authUser();
  const verified = (user.factors || []).filter((f) => f.factor_type === 'totp' && f.status === 'verified');
  // A successful MFA token need not ask for the same code again on reload.
  const { getSession } = await import('../core/supabase.js');
  let claims;
  try { claims = JSON.parse(atob(getSession().access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); }
  catch { throw new Error('The sign-in session could not be read. Sign in again.'); }
  if (claims.aal === 'aal2' && verified.length) return onComplete();

  let factor = verified[0];
  let setup = null;
  if (!factor) {
    // An abandoned enrollment is not a verified device. Clear it before retrying.
    for (const f of user.factors || []) {
      if (f.factor_type === 'totp' && f.status === 'unverified') await removeFactor(f.id);
    }
    setup = await enrollTotp();
    factor = setup;
  }
  gate.innerHTML = `<div class="signin"><form class="signin-card" data-mfa-form novalidate>
    <p class="signin-mark display">KINGSON</p><p class="signin-sub">Enquiries &amp; Projects</p>
    <h1 class="signin-title">${setup ? 'Set up two-step sign-in' : 'Authenticator code'}</h1>
    ${setup ? `<p class="signin-note">Add this key to your authenticator app. Keep a secure copy in your password manager so you can recover access if your phone is lost.</p>
      <div data-qr></div><p class="field-hint">Setup key</p><code class="mfa-secret">${esc(setup.totp.secret)}</code>`
      : '<p class="signin-note">Enter the current six-digit code from your authenticator app. If you have lost your device, ask the account owner to follow the documented recovery procedure.</p>'}
    ${verified.length > 1 ? `<div class="field"><label for="mfa-device">Authenticator</label><select class="sel" id="mfa-device">${verified.map(f=>`<option value="${esc(f.id)}">${esc(f.friendly_name || 'Authenticator')}</option>`).join('')}</select></div>` : ''}
    <div class="field"><label for="mfa-code">Six-digit code</label>
      <input class="inp" id="mfa-code" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required></div>
    <p class="signin-err" role="alert" hidden></p>
    <button class="btn" type="submit">Verify and continue</button>
    <button class="signin-link" type="button" data-cancel>Sign out</button></form></div>`;
  if (setup?.totp?.qr_code) {
    const image = document.createElement('img');
    image.alt = 'Scan with your authenticator app to secure your Kingson CRM account';
    image.width = 200; image.height = 200;
    // Treat the returned SVG as an image, never executable inline HTML.
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(setup.totp.qr_code)}`;
    gate.querySelector('[data-qr]').append(image);
  }
  gate.querySelector('[data-cancel]').addEventListener('click', onCancel);
  const form = gate.querySelector('form');
  form.querySelector('input').focus();
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const error = form.querySelector('[role="alert"]');
    const code = form.querySelector('input').value.trim();
    error.hidden = true;
    if (!/^\d{6}$/.test(code)) { error.textContent = 'Enter the six digits from your authenticator.'; error.hidden = false; return; }
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      await verifyTotp(form.querySelector('select')?.value || factor.id, code);
      // Remove the enrollment secret from the DOM before loading customer data.
      gate.replaceChildren();
      await onComplete();
    } catch (e) {
      if (!gate.contains(error)) throw e;
      error.textContent = e.message || 'The code could not be verified. Try the next code.';
      error.hidden = false;
      button.disabled = false;
    }
  });
}
