/* ═══════════════════════════════════════════════════════════════════════════
   app.js — boot, routing, and the authentication gate
   ═══════════════════════════════════════════════════════════════════════════

   Nothing renders until `restore()` has decided whether there is a usable
   session. Views are loaded on demand, so the screen a person opens first is
   the only code their phone downloads to see it.

   Every view exports the same three things — `title`, `sub` and `render` —
   and optionally `mount(root, rerender)` for its own events. The router owns
   the chrome; a view owns nothing outside `#view`.
   ═══════════════════════════════════════════════════════════════════════════ */

import { restore, login, logout, currentUser, isSignedIn, requestPasswordReset, updatePassword, takeRecoveryFromUrl } from './core/auth.js';
import { api } from './core/api.js';
import { isOverdue } from './core/model.js';
import { showDemo } from './core/demo.js';
import { railHtml, topbarHtml, loginHtml, forgotHtml, resetHtml } from './ui/shell.js';
import { loading, errorState } from './ui/components.js';
import { toast } from './ui/form.js';
import { esc } from './core/fmt.js';

const app     = document.getElementById('app');
const railEl  = document.getElementById('rail');
const barEl   = document.getElementById('topbar');
let   viewEl  = document.getElementById('view');
const scrim   = document.getElementById('scrim');
const gate    = document.getElementById('gate');

/* While this browser is showing demonstration records, every screen says so.
   The strip sits above the top bar so it cannot be scrolled out of sight. */
if (showDemo()) {
  const strip = document.createElement('p');
  strip.className = 'demo-banner';
  strip.setAttribute('role', 'note');
  strip.innerHTML = '<strong>Demonstration records are showing.</strong>&nbsp;Totals include sample data. Switch off in Settings.';
  barEl.before(strip);
}

/* Lazily imported so the dashboard does not pay for the projects screen. */
const ROUTES = {
  dashboard:   () => import('./views/dashboard.js'),
  pipeline:    () => import('./views/pipeline.js'),
  followups:   () => import('./views/followups.js'),
  tasks:       () => import('./views/tasks.js'),
  contacts:    () => import('./views/contacts.js'),
  contact:     () => import('./views/contact.js'),
  opportunity: () => import('./views/opportunity.js'),
  quotes:      () => import('./views/quotes.js'),
  visits:      () => import('./views/visits.js'),
  projects:    () => import('./views/projects.js'),
  project:     () => import('./views/project.js'),
  settings:    () => import('./views/settings.js'),
  account:     () => import('./views/account.js')
};

/* Which rail item lights up for a detail screen. */
const RAIL_OF = { opportunity: 'pipeline', contact: 'contacts', project: 'projects' };

let route = parseHash();
let overdueCount = 0;

function parseHash() {
  const raw = (location.hash || '#/').replace(/^#\/?/, '');
  const [key, arg] = raw.split('/');
  if (!key) return { key: 'dashboard', arg: null };
  return ROUTES[key] ? { key, arg: arg || null } : { key: 'dashboard', arg: null };
}

/* ── the overdue badge ────────────────────────────────────────────────────── */

async function refreshOverdue() {
  try {
    const open = await api.openOpportunities();
    overdueCount = open.filter(isOverdue).length;
  } catch { /* the badge is not worth an error screen */ }
}

/* ── rendering ────────────────────────────────────────────────────────────── */

let renderToken = 0;

/**
 * Hand back an empty #view that carries no listeners.
 *
 * A view's `mount()` binds its handlers to the container itself, because the
 * content inside it is replaced wholesale on every write. Setting innerHTML
 * leaves the container — and therefore every handler ever bound to it — in
 * place, so the fourth visit to a screen runs its click handler four times.
 * For the pipeline that is four stage writes from one drop.
 *
 * Replacing the node instead lets the old listeners go with it, which is the
 * one thing innerHTML cannot do.
 */
function freshView() {
  const next = viewEl.cloneNode(false);   // same tag, id, class and tabindex
  delete next.dataset.view;
  viewEl.replaceWith(next);
  viewEl = next;
  return next;
}

async function render() {
  if (!isSignedIn()) return showLogin();

  const token = ++renderToken;
  const me = currentUser();
  const railKey = RAIL_OF[route.key] || route.key;

  railEl.innerHTML = railHtml(railKey, me, { overdue: overdueCount });
  closeRail();

  let mod;
  try {
    mod = await (ROUTES[route.key] || ROUTES.dashboard)();
  } catch (e) {
    barEl.innerHTML = topbarHtml('Kingson');
    viewEl.innerHTML = errorState('That screen could not be loaded. Check the connection and try again.');
    return;
  }
  if (token !== renderToken) return;            // a newer navigation won

  /* Chrome first with a skeleton under it, so a slow query looks like work in
     progress rather than a broken screen. */
  barEl.innerHTML = topbarHtml(
    typeof mod.title === 'function' ? mod.title(route.arg) : mod.title, '');
  freshView();
  viewEl.innerHTML = loading(4);
  viewEl.dataset.view = route.key;

  try {
    const html = await mod.render(route.arg, { me, rerender: softRender });
    if (token !== renderToken) return;
    viewEl.innerHTML = html;
    barEl.innerHTML = topbarHtml(
      typeof mod.title === 'function' ? mod.title(route.arg) : mod.title,
      typeof mod.sub === 'function' ? await mod.sub(route.arg) : (mod.sub || ''),
      typeof mod.actions === 'function' ? mod.actions(route.arg, me) : '');
    mod.mount?.(viewEl, softRender, { me, arg: route.arg });
  } catch (e) {
    if (token !== renderToken) return;
    console.error('[kingson] view failed', route.key, e);
    viewEl.innerHTML = errorState(e?.message || 'That screen could not be loaded.');
  }

  refreshOverdue().then(() => {
    if (token === renderToken) railEl.innerHTML = railHtml(railKey, currentUser(), { overdue: overdueCount });
  });
}

/** Re-run the current view without resetting scroll — used after a write. */
async function softRender() {
  const y = window.scrollY;
  await render();
  window.scrollTo(0, y);
}

/* ── sign-in ──────────────────────────────────────────────────────────────── */

function showLogin(message = '') {
  app.hidden = true;
  gate.hidden = false;
  gate.innerHTML = loginHtml(message);
  const form = gate.querySelector('#signin-form');
  const btn = form.querySelector('[data-signin]');
  const err = form.querySelector('.signin-err');
  form.querySelector('#si-email').focus();
  form.querySelector('[data-forgot]').addEventListener('click', () =>
    showForgot(form.querySelector('#si-email').value.trim()));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.querySelector('#si-email').value.trim();
    const password = form.querySelector('#si-password').value;
    err.hidden = true;
    if (!email || !password) {
      err.textContent = 'Enter your email address and password.';
      err.hidden = false;
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Signing in…';
    try {
      await login(email, password);
      gate.hidden = true;
      gate.innerHTML = '';
      app.hidden = false;
      await refreshOverdue();
      await render();
    } catch (ex) {
      err.textContent = ex?.status === 400
        ? 'That email address and password do not match an account.'
        : (ex?.message || 'Sign-in failed.');
      err.hidden = false;
      btn.disabled = false;
      btn.textContent = 'Sign in';
      form.querySelector('#si-password').select();
    }
  });
}

/* ── the mobile rail ──────────────────────────────────────────────────────── */

const openRail = () => {
  app.classList.add('rail-open');
  scrim.hidden = false;
  railEl.querySelector('.rail-link')?.focus();
  barEl.querySelector('[data-rail-open]')?.setAttribute('aria-expanded', 'true');
};
const closeRail = () => {
  app.classList.remove('rail-open');
  scrim.hidden = true;
  barEl.querySelector('[data-rail-open]')?.setAttribute('aria-expanded', 'false');
};

/* ── events ───────────────────────────────────────────────────────────────── */

document.addEventListener('click', async (e) => {
  if (e.target.closest('[data-rail-open]')) return openRail();
  if (e.target === scrim || e.target.closest('.rail-link')) return closeRail();
  if (e.target.closest('[data-signout]')) {
    await logout();
    location.hash = '#/';
    showLogin();
    return;
  }
  if (e.target.closest('[data-retry]')) return render();

  /* The top bar lives outside #view, so the "New …" buttons a view declares
     in `actions()` cannot be handled by that view's own mount(). They are
     handled here, against the same dialogs the views use. */
  const me = currentUser();
  if (e.target.closest('[data-search-open]')) {
    const { openSearch } = await import('./ui/search.js');
    return openSearch();
  }
  if (e.target.closest('[data-new-opp]')) {
    const { newOpportunity } = await import('./ui/dialogs.js');
    /* No onDone: the dialog navigates to the opportunity it just created.
       Somebody who has typed a job in almost always wants to keep going on
       it, and dropping them back on the board makes them hunt for it. */
    return newOpportunity({ me });
  }
  if (e.target.closest('[data-new-contact]')) {
    const { contactDialog } = await import('./ui/dialogs.js');
    return contactDialog({ onDone: (c) => { location.hash = `#/contact/${c.id}`; } });
  }
  if (e.target.closest('[data-new-task-global]')) {
    const { taskDialog } = await import('./ui/dialogs.js');
    return taskDialog({ me, onDone: softRender });
  }
});

document.addEventListener('keydown', async (e) => {
  if (e.key === 'Escape' && app.classList.contains('rail-open')) closeRail();
  /* "/" opens search from anywhere that is not already a text field. */
  if (e.key === '/' && !app.hidden && !document.body.classList.contains('is-modal')
      && !e.target.closest?.('input, textarea, select, [contenteditable]')) {
    e.preventDefault();
    const { openSearch } = await import('./ui/search.js');
    openSearch();
  }
});

/* ── forgot password ──────────────────────────────────────────────────────── */

function showForgot(email = '') {
  app.hidden = true;
  gate.hidden = false;
  gate.innerHTML = forgotHtml(email);
  const form = gate.querySelector('#forgot-form');
  const err = form.querySelector('.signin-err');
  const ok = form.querySelector('.signin-ok');
  const btn = form.querySelector('[data-send]');
  form.querySelector('#fp-email').focus();
  form.querySelector('[data-back]').addEventListener('click', () => showLogin());
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const address = form.querySelector('#fp-email').value.trim();
    err.hidden = true; ok.hidden = true;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address)) {
      err.textContent = 'Enter the email address you sign in with.';
      err.hidden = false;
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Sending…';
    try {
      await requestPasswordReset(address);
      /* The same words whether or not the address has an account. */
      ok.textContent = 'If that address has an account, the link is on its way. Check the inbox, and the spam folder.';
      ok.hidden = false;
      btn.textContent = 'Send again';
    } catch (ex) {
      err.textContent = ex?.message || 'The link could not be sent. Try again in a few minutes.';
      err.hidden = false;
      btn.textContent = 'Send the link';
    }
    btn.disabled = false;
  });
}

/* ── choose a new password, from the emailed link ─────────────────────────── */

const LINK_ERRORS = {
  otp_expired: 'The link has expired or has already been used. Links last one hour and work once.',
  access_denied: 'The link could not be accepted. It may have expired or already been used.'
};

function showReset(outcome) {
  app.hidden = true;
  gate.hidden = false;
  if (outcome.error) {
    gate.innerHTML = resetHtml({ error: LINK_ERRORS[outcome.error] || outcome.description || 'The link could not be accepted.' });
    gate.querySelector('[data-forgot]').addEventListener('click', () => showForgot());
    gate.querySelector('[data-back]').addEventListener('click', () => showLogin());
    return;
  }
  gate.innerHTML = resetHtml();
  const form = gate.querySelector('#reset-form');
  const err = form.querySelector('.signin-err');
  const btn = form.querySelector('[data-save]');
  form.querySelector('#np-1').focus();
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const a = form.querySelector('#np-1').value;
    const b = form.querySelector('#np-2').value;
    err.hidden = true;
    if (a.length < 8) { err.textContent = 'Use at least 8 characters.'; err.hidden = false; return; }
    if (a !== b) { err.textContent = 'The two passwords are not the same.'; err.hidden = false; return; }
    btn.disabled = true;
    btn.textContent = 'Saving…';
    try {
      await updatePassword(a);
      const me = await restore();
      if (!me) throw new Error('Your password was changed, but this account cannot use the CRM. Ask an administrator.');
      gate.hidden = true;
      gate.innerHTML = '';
      app.hidden = false;
      location.hash = '#/';
      await refreshOverdue();
      await render();
      toast('Password changed. You are signed in.');
    } catch (ex) {
      err.textContent = ex?.status === 401
        ? 'The link has expired. Ask for a new one.'
        : (ex?.message || 'The password could not be saved.');
      err.hidden = false;
      btn.disabled = false;
      btn.textContent = 'Save and sign in';
    }
  });
}

addEventListener('hashchange', () => {
  /* A reset link opened in a tab that already had the CRM loaded. */
  const recovery = takeRecoveryFromUrl();
  if (recovery) return showReset(recovery);
  route = parseHash();
  render().then(() => { viewEl.focus({ preventScroll: true }); scrollTo(0, 0); });
});

/* A session that expires in another tab should not leave this one showing a
   dashboard it can no longer refresh. */
addEventListener('storage', (e) => {
  if (e.key === 'kingson-crm/session/v1' && !e.newValue) showLogin('Signed out in another tab.');
});

/* ── boot ─────────────────────────────────────────────────────────────────── */

(async function boot() {
  document.getElementById('boot')?.remove();
  /* Arriving from a password-reset email: the link's tokens are in the
     address. Handle them before anything else reads the hash as a route. */
  const recovery = takeRecoveryFromUrl();
  if (recovery) return showReset(recovery);
  const me = await restore();
  if (!me) return showLogin();
  gate.hidden = true;
  app.hidden = false;
  await refreshOverdue();
  await render();
})().catch((e) => {
  console.error('[kingson] boot failed', e);
  showLogin('Something went wrong starting the application. Reload the page.');
});

export { softRender, toast, esc };
