/* ═══════════════════════════════════════════════════════════════════════════
   ui/shell.js — the rail, the top bar and the sign-in screen
   ═══════════════════════════════════════════════════════════════════════════

   The rail carries one live number: how many things are overdue. It is the
   only count in the navigation because it is the only one that means "stop
   what you are doing". Everything else is a destination.
   ═══════════════════════════════════════════════════════════════════════════ */

import { esc } from '../core/fmt.js';
import { icon } from './icons.js';

export const NAV = [
  { key: 'dashboard', href: '#/',            label: 'Dashboard',   ic: 'dashboard' },
  { key: 'pipeline',  href: '#/pipeline',    label: 'Enquiries',   ic: 'pipeline'  },
  { key: 'followups', href: '#/followups',   label: 'Follow-ups',  ic: 'bell', badge: true },
  { key: 'tasks',     href: '#/tasks',       label: 'Tasks',       ic: 'task'      },
  { key: 'contacts',  href: '#/contacts',    label: 'Contacts',    ic: 'users'     },
  { key: 'quotes',    href: '#/quotes',      label: 'Quotations',  ic: 'doc'       },
  { key: 'visits',    href: '#/visits',      label: 'Site visits', ic: 'pin'       },
  { key: 'projects',  href: '#/projects',    label: 'Projects',    ic: 'briefcase' },
  { key: 'settings',  href: '#/settings',    label: 'Settings',    ic: 'shield' }
];

export function railHtml(active, me, { overdue = 0 } = {}) {
  const items = NAV
    .filter((n) => !n.admin || me?.role === 'admin')
    .map((n) => `
      <a class="rail-link${active === n.key ? ' is-active' : ''}" href="${n.href}"
         ${active === n.key ? 'aria-current="page"' : ''}>
        ${icon[n.ic](17)}<span>${esc(n.label)}</span>
        ${n.badge && overdue ? `<span class="rail-count" title="${esc(overdue)} overdue">${esc(overdue)}</span>` : ''}
      </a>`).join('');

  return `
  <div class="rail-top">
    <a class="mark" href="#/">
      <span class="mark-name display">KINGSON</span>
      <span class="mark-sub">Enquiries &amp; Projects</span>
    </a>
  </div>

  <nav class="rail-nav" aria-label="Sections">${items}</nav>

  <div class="rail-foot">
    <div class="rail-me">
      <span class="avatar" style="--s:30px">${esc(me?.initials || '?')}</span>
      <span class="rail-me-body">
        <span class="rail-me-name">${esc(me?.full_name || '')}</span>
        <span class="rail-me-role">${esc(me?.role === 'admin' ? 'Administrator' : 'Staff')}</span>
      </span>
    </div>
    <a class="rail-signout" href="#/account">${icon.shield(14)}<span>My account</span></a>
    <button type="button" class="rail-signout" data-signout>${icon.logout(14)}<span>Sign out</span></button>
  </div>`;
}

/* Search and New enquiry are on every screen, in the same place, because the
   moment somebody needs them is the moment a customer is on the phone. On a
   phone the search collapses to an icon and New enquiry to a round button
   at the bottom right (.fab, in index.html: inside the top bar its blur
   would make the bar, not the screen, what it is fixed to). */
export const topbarHtml = (title, sub = '', actions = '') => `
  <div class="topbar-in">
    <button type="button" class="topbar-menu" data-rail-open aria-expanded="false" aria-controls="rail">
      ${icon.menu(18)}<span class="sr-only">Open navigation</span>
    </button>
    <div class="topbar-titles">
      <h1 class="topbar-title display">${esc(title)}</h1>
      ${sub ? `<p class="topbar-sub">${sub}</p>` : ''}
    </div>
    <div class="topbar-actions">
      <button type="button" class="topbar-search" data-search-open aria-haspopup="dialog">
        ${icon.search(15)}<span class="topbar-search-label">Search name, phone, ENQ or quote no.</span>
        <kbd class="topbar-kbd" aria-hidden="true">/</kbd>
      </button>
      ${actions}
      <button type="button" class="btn btn-sm topbar-new" data-new-opp>${icon.plus(14)}<span>New enquiry</span></button>
    </div>
  </div>`;

/* ── sign in ──────────────────────────────────────────────────────────────── */

export const loginHtml = (message = '') => `
  <div class="signin">
    <form class="signin-card" id="signin-form" novalidate>
      <p class="signin-mark display">KINGSON</p>
      <p class="signin-sub">Enquiries &amp; Projects</p>
      <h1 class="signin-title">Sign in</h1>

      <div class="field">
        <label for="si-email">Email</label>
        <input class="inp" id="si-email" name="email" type="email" autocomplete="username"
               inputmode="email" autocapitalize="none" spellcheck="false" required>
      </div>
      <div class="field">
        <label for="si-password">Password</label>
        <input class="inp" id="si-password" name="password" type="password"
               autocomplete="current-password" required>
      </div>

      <p class="signin-err" role="alert" ${message ? '' : 'hidden'}>${esc(message)}</p>
      <button type="submit" class="btn" data-signin>Sign in</button>
      <button type="button" class="signin-link" data-forgot>Forgot your password?</button>
      <p class="signin-foot">Kingson Engineering internal system. Access is by account only.</p>
    </form>
  </div>`;

/* ── forgot password ──────────────────────────────────────────────────────── */

export const forgotHtml = (email = '') => `
  <div class="signin">
    <form class="signin-card" id="forgot-form" novalidate>
      <p class="signin-mark display">KINGSON</p>
      <p class="signin-sub">Enquiries &amp; Projects</p>
      <h1 class="signin-title">Reset your password</h1>
      <p class="signin-note">Enter the email address you sign in with. If it has an account, a link to
        choose a new password will arrive in a few minutes. The link works once, for one hour.</p>
      <div class="field">
        <label for="fp-email">Email</label>
        <input class="inp" id="fp-email" name="email" type="email" autocomplete="username"
               inputmode="email" autocapitalize="none" spellcheck="false" value="${esc(email)}" required>
      </div>
      <p class="signin-err" role="alert" hidden></p>
      <p class="signin-ok" role="status" hidden></p>
      <button type="submit" class="btn" data-send>Send the link</button>
      <button type="button" class="signin-link" data-back>Back to sign in</button>
    </form>
  </div>`;

/* ── choose a new password (from the emailed link) ────────────────────────── */

export const resetHtml = ({ error = '' } = {}) => `
  <div class="signin">
    <form class="signin-card" id="reset-form" novalidate>
      <p class="signin-mark display">KINGSON</p>
      <p class="signin-sub">Enquiries &amp; Projects</p>
      <h1 class="signin-title">${error ? 'That link has not worked' : 'Choose a new password'}</h1>
      ${error ? `<p class="signin-note">${esc(error)}</p>
        <button type="button" class="btn" data-forgot>Send a new link</button>
        <button type="button" class="signin-link" data-back>Back to sign in</button>` : `
      <div class="field">
        <label for="np-1">New password</label>
        <input class="inp" id="np-1" type="password" autocomplete="new-password" minlength="8" required>
        <p class="field-hint">At least 8 characters. A short sentence is easier to remember than a code.</p>
      </div>
      <div class="field">
        <label for="np-2">The same again</label>
        <input class="inp" id="np-2" type="password" autocomplete="new-password" required>
      </div>
      <p class="signin-err" role="alert" hidden></p>
      <button type="submit" class="btn" data-save>Save and sign in</button>`}
    </form>
  </div>`;
