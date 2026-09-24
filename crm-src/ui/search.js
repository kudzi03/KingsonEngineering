/* ═══════════════════════════════════════════════════════════════════════════
   ui/search.js — one box for "who is this on the phone?"
   ═══════════════════════════════════════════════════════════════════════════

   Opened from the top bar on every screen, or with "/". Each keystroke (after
   a short pause) asks the database — public.global_search — which looks at
   contacts, enquiries, quotations and projects at once and returns a handful
   of each. Nothing is filtered in the browser, so it finds record 9 000 as
   quickly as record 9.

   Enter or a tap opens the record. Arrow keys move through the results.
   ═══════════════════════════════════════════════════════════════════════════ */

import { api } from '../core/api.js';
import { STAGE } from '../core/model.js';
import { esc } from '../core/fmt.js';
import { icon } from './icons.js';

const KIND = {
  contact: { label: 'Contact', href: (r) => `#/contact/${r.id}` },
  enquiry: { label: 'Enquiry', href: (r) => `#/opportunity/${r.id}` },
  quote:   { label: 'Quote',   href: (r) => `#/opportunity/${r.id}` },
  project: { label: 'Project', href: (r) => `#/project/${r.id}` }
};
const ORDER = ['enquiry', 'quote', 'contact', 'project'];

let host = null;

export function openSearch(initial = '') {
  if (host) { host.querySelector('input').focus(); return; }
  const opener = document.activeElement;

  host = document.createElement('div');
  host.className = 'modal search-modal';
  host.innerHTML = `
    <div class="modal-card search-card" role="dialog" aria-modal="true" aria-label="Search">
      <div class="search-bar">
        ${icon.search(17)}
        <label class="sr-only" for="gs-q">Search</label>
        <input class="search-input" id="gs-q" type="search" autocomplete="off" spellcheck="false"
               placeholder="Name, company, phone, email, ENQ-… or Q-…" value="${esc(initial)}"
               role="combobox" aria-expanded="false" aria-controls="gs-results" aria-autocomplete="list">
        <button type="button" class="btn-ghost btn-xs" data-close>Close</button>
      </div>
      <div class="search-results" id="gs-results" role="listbox" aria-label="Results">
        <p class="search-hint">Type at least two characters. Phone numbers match however they are written.</p>
      </div>
    </div>`;
  document.body.appendChild(host);
  document.body.classList.add('is-modal');

  const input = host.querySelector('input');
  const out = host.querySelector('#gs-results');
  let timer = 0, seq = 0, active = -1;

  const close = () => {
    host.remove(); host = null;
    document.body.classList.remove('is-modal');
    document.removeEventListener('keydown', onKey, true);
    if (opener && document.contains(opener)) opener.focus();
  };

  const items = () => [...out.querySelectorAll('.search-hit')];
  const highlight = (i) => {
    const list = items();
    if (!list.length) return;
    active = (i + list.length) % list.length;
    list.forEach((el, n) => el.setAttribute('aria-selected', String(n === active)));
    list[active].scrollIntoView({ block: 'nearest' });
    input.setAttribute('aria-activedescendant', list[active].id);
  };

  async function run() {
    const text = input.value.trim();
    const mine = ++seq;
    active = -1;
    if (text.length < 2) {
      out.innerHTML = '<p class="search-hint">Type at least two characters. Phone numbers match however they are written.</p>';
      input.setAttribute('aria-expanded', 'false');
      return;
    }
    out.innerHTML = '<p class="search-hint">Searching…</p>';
    try {
      const rows = await api.search(text, 8);
      if (mine !== seq) return;                    // a newer search has started
      if (!rows.length) {
        out.innerHTML = `<p class="search-hint">Nothing matches “${esc(text)}”.
          Check the spelling, or search by phone number or reference.</p>`;
        return;
      }
      let n = 0;
      out.innerHTML = ORDER.map((k) => {
        const group = rows.filter((r) => r.kind === k).sort((a, b) => a.rank - b.rank);
        if (!group.length) return '';
        return `<p class="search-group">${esc(KIND[k].label)}${group.length > 1 ? 's' : ''}</p>` +
          group.map((r) => `
            <a class="search-hit" id="gs-${n++}" role="option" aria-selected="false" href="${esc(KIND[k].href(r))}">
              <span class="search-kind search-kind-${esc(k)}">${esc(KIND[k].label)}</span>
              <span class="search-main">
                <span class="search-title">${r.ref && k === 'enquiry' ? `<span class="num">${esc(r.ref)}</span> · ` : ''}${esc(r.title || '')}</span>
                <span class="search-sub">${esc(r.subtitle || '')}${r.stage && STAGE[r.stage] ? ` · ${esc(STAGE[r.stage].short)}` : ''}</span>
              </span>
            </a>`).join('');
      }).join('');
      input.setAttribute('aria-expanded', 'true');
      highlight(0);
    } catch (e) {
      if (mine !== seq) return;
      out.innerHTML = `<p class="search-hint search-bad">${esc(e?.message || 'Search failed.')}</p>`;
    }
  }

  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); highlight(active + 1); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); highlight(active - 1); return; }
    if (e.key === 'Enter' && document.activeElement === input) {
      const el = items()[active];
      if (el) { e.preventDefault(); location.hash = el.getAttribute('href'); close(); }
    }
  }

  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(run, 180); });
  out.addEventListener('click', (e) => { if (e.target.closest('.search-hit')) close(); });
  host.querySelector('[data-close]').addEventListener('click', close);
  host.addEventListener('mousedown', (e) => { if (e.target === host) close(); });
  document.addEventListener('keydown', onKey, true);
  input.focus();
  if (initial) run();
}
