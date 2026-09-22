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
  { key: 'pipeline',  href: '#/pipeline',    label: 'Pipeline',    ic: 'pipeline'  },
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
    <button type="button" class="rail-signout" data-signout>${icon.logout(14)}<span>Sign out</span></button>
  </div>`;
}

export const topbarHtml = (title, sub = '', actions = '') => `
  <div class="topbar-in">
    <button type="button" class="topbar-menu" data-rail-open aria-expanded="false" aria-controls="rail">
      ${icon.menu(18)}<span class="sr-only">Open navigation</span>
    </button>
    <div class="topbar-titles">
      <h1 class="topbar-title display">${esc(title)}</h1>
      ${sub ? `<p class="topbar-sub">${sub}</p>` : ''}
    </div>
    ${actions ? `<div class="topbar-actions">${actions}</div>` : ''}
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
      <p class="signin-foot">Kingson Engineering internal system. Access is by account only.</p>
    </form>
  </div>`;
