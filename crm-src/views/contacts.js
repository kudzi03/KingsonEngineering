/* ═══════════════════════════════════════════════════════════════════════════
   views/contacts.js — who Kingson knows
   ═══════════════════════════════════════════════════════════════════════════
   Search first, because the reason somebody opens this screen is almost
   always that a specific person is on the phone right now.
   ═══════════════════════════════════════════════════════════════════════════ */

import { api } from '../core/api.js';
import { esc, pluralise, tel, relative } from '../core/fmt.js';
import { card, empty, avatar, contactActions, tableWrap } from '../ui/components.js';
import { icon } from '../ui/icons.js';
import { contactDialog } from '../ui/dialogs.js';

export const title = 'Contacts';

let rows = [];
let term = '';

export async function render() {
  rows = await api.contacts();
  return `
    <div class="filters">
      <div class="search">
        ${icon.search(15)}
        <label class="sr-only" for="c-search">Search contacts</label>
        <input class="inp" id="c-search" type="search" placeholder="Name, company, phone or email"
               value="${esc(term)}" autocomplete="off">
      </div>
      <span class="filters-n" data-count>${esc(pluralise(rows.length, 'contact'))}</span>
    </div>
    <div data-list>${list(rows)}</div>`;
}

function list(items) {
  if (!items.length) {
    return card('', empty('No contacts match that.', 'Try part of a name, a company or a number.', { tone: 'quiet' }), { tight: true });
  }
  return card('', tableWrap(`
    <table class="tbl tbl-rows">
      <thead><tr>
        <th scope="col">Name</th><th scope="col">Company</th>
        <th scope="col">Phone</th><th scope="col">Email</th><th scope="col"></th>
      </tr></thead>
      <tbody>
        ${items.map((c) => `<tr>
          <td><a class="lnk lnk-strong" href="#/contact/${esc(c.id)}">
            ${avatar({ full_name: c.full_name }, 24)}<span>${esc(c.full_name)}</span></a>
            ${c.job_title ? `<span class="td-sub">${esc(c.job_title)}</span>` : ''}</td>
          <td>${esc(c.companies?.name || '—')}</td>
          <td class="num">${c.phone ? `<a class="lnk" href="${esc(tel(c.phone))}">${esc(c.phone)}</a>` : '—'}</td>
          <td>${esc(c.email || '—')}</td>
          <td class="ta-r">${contactActions(c, { size: 'xs' })}</td>
        </tr>`).join('')}
      </tbody>
    </table>`), { tight: true });
}

export function mount(root) {
  const input = root.querySelector('#c-search');
  const host = root.querySelector('[data-list]');
  const count = root.querySelector('[data-count]');
  let t = null;

  input?.addEventListener('input', () => {
    term = input.value.trim();
    clearTimeout(t);
    /* Filtered in the browser: a workshop's contact book is hundreds of rows,
       not millions, and a round trip per keystroke would feel worse. */
    t = setTimeout(() => {
      const q = term.toLowerCase();
      const hits = !q ? rows : rows.filter((c) =>
        [c.full_name, c.companies?.name, c.phone, c.whatsapp, c.email, c.job_title]
          .some((v) => String(v || '').toLowerCase().includes(q)));
      host.innerHTML = list(hits);
      count.textContent = pluralise(hits.length, 'contact');
    }, 120);
  });
}

export const sub = () => pluralise(rows.length, 'contact');

export const actions = () =>
  `<button type="button" class="btn btn-sm" data-new-contact>${icon.plus(14)}<span>New contact</span></button>`;
