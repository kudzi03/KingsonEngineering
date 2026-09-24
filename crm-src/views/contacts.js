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
import { toast } from '../ui/form.js';

export const title = 'Contacts';

const PAGE = 50;
let rows = [];
let term = '';
let more = false;

/* Counted as "50+" rather than exactly: an exact count of a large table on
   every keystroke costs more than it tells the person on the phone. */
const countText = () => more ? `${rows.length}+ contacts` : pluralise(rows.length, 'contact');
const moreRow = () => more
  ? '<div class="more-row"><button type="button" class="btn-ghost btn-sm" data-more>Show more contacts</button></div>' : '';

async function fetchPage(offset) {
  const page = await api.contacts(term, { offset, limit: PAGE + 1 });
  more = page.length > PAGE;
  return page.slice(0, PAGE);
}

export async function render() {
  rows = await fetchPage(0);
  return `
    <div class="filters">
      <div class="search">
        ${icon.search(15)}
        <label class="sr-only" for="c-search">Search contacts</label>
        <input class="inp" id="c-search" type="search" placeholder="Name, phone or email"
               value="${esc(term)}" autocomplete="off">
      </div>
      <span class="filters-n" data-count>${esc(countText())}</span>
    </div>
    <div data-list>${list(rows)}${moreRow()}</div>`;
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
  let t = null, seq = 0;
  const paint = () => { host.innerHTML = list(rows) + moreRow(); count.textContent = countText(); };

  /* Searched in the database, a page at a time: the contact book is never
     pulled into the browser, so it stays quick at ten thousand people. */
  input?.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(async () => {
      term = input.value.trim();
      const mine = ++seq;
      try {
        const page = await fetchPage(0);
        if (mine !== seq) return;                  // a newer search has started
        rows = page;
        paint();
      } catch (e) { toast(e.message || 'Search failed.', 'bad'); }
    }, 200);
  });

  host.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-more]');
    if (!b) return;
    b.disabled = true;
    const mine = seq;
    try {
      const page = await fetchPage(rows.length);
      if (mine !== seq) return;
      rows = rows.concat(page);
      paint();
    } catch (err) { b.disabled = false; toast(err.message || 'Could not load more.', 'bad'); }
  });
}

export const sub = () => countText();

export const actions = () =>
  `<button type="button" class="btn btn-sm" data-new-contact>${icon.plus(14)}<span>New contact</span></button>`;
