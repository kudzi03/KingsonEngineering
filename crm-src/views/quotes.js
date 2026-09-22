/* ═══════════════════════════════════════════════════════════════════════════
   views/quotes.js — every quotation and what happened to it
   ═══════════════════════════════════════════════════════════════════════════
   The default filter is the one that matters: quotations that are out and
   undecided. A quotation nobody is chasing is the most expensive record in
   this system, so those rows are flagged rather than merely listed.
   ═══════════════════════════════════════════════════════════════════════════ */

import { api } from '../core/api.js';
import { QUOTE_STATUSES, QUOTE_LABEL } from '../core/model.js';
import { money, moneyBy, date, stamp, relative, esc, pluralise } from '../core/fmt.js';
import { card, empty, quoteStatusPill, tableWrap } from '../ui/components.js';
import { icon } from '../ui/icons.js';
import { quoteDetailDialog, markSentDialog } from '../ui/lifecycle.js';

/* Per-currency total of a list of quotations. */
const total = (list) => {
  const by = {};
  for (const q of list) by[q.currency] = (by[q.currency] || 0) + Number(q.amount || 0);
  return moneyBy(by, { empty: '—' });
};

export const title = 'Quotations';

let rows = [];
let filter = 'live';

export async function render(_arg, { me }) {
  rows = await api.quotes();
  return body();
}

function body() {
  const shown = filter === 'all' ? rows
    : filter === 'live' ? rows.filter((q) => q.status === 'sent' || q.status === 'discussed')
    : rows.filter((q) => q.status === filter);

  const controls = `
    <div class="filters">
      <label class="sr-only" for="q-filter">Show</label>
      <select class="sel sel-inline" id="q-filter" data-f>
        <option value="live"${filter === 'live' ? ' selected' : ''}>Awaiting a decision</option>
        <option value="all"${filter === 'all' ? ' selected' : ''}>All quotations</option>
        ${QUOTE_STATUSES.map((s) => `<option value="${s}"${filter === s ? ' selected' : ''}>${esc(QUOTE_LABEL[s])}</option>`).join('')}
      </select>
      <span class="filters-n">${esc(pluralise(shown.length, 'quotation'))} · <span class="num">${esc(total(shown))}</span></span>
    </div>`;

  const list = shown.length ? tableWrap(`
    <table class="tbl tbl-rows">
      <thead><tr>
        <th scope="col">Reference</th><th scope="col">Opportunity</th>
        <th scope="col" class="ta-r">Amount</th><th scope="col">Status</th>
        <th scope="col">Sent</th><th scope="col">Chase</th><th scope="col"></th>
      </tr></thead>
      <tbody>
        ${shown.map((q) => {
          const o = q.opportunities;
          const live = q.status === 'sent' || q.status === 'discussed';
          const risk = live && o && !o.next_action_due;
          return `<tr${risk ? ' class="tr-risk"' : ''}>
            <td><span class="td-main num">${esc(q.reference)}</span>${q.version > 1 ? `<span class="td-sub">revision ${q.version}</span>` : ''}</td>
            <td><a class="lnk" href="#/opportunity/${esc(o?.id || '')}">${esc(o?.title || '—')}</a>
                <span class="td-sub">${esc(o?.companies?.name || '')}</span></td>
            <td class="ta-r num">${esc(money(q.amount, q.currency))}</td>
            <td>${quoteStatusPill(q.status)}</td>
            <td><span class="td-main num">${esc(q.sent_at ? stamp(q.sent_at) : date(q.sent_on))}</span><span class="td-sub">${q.sent_on ? esc(relative(q.sent_on)) + (q.profiles?.initials ? ' · ' + esc(q.profiles.initials) : '') : ''}</span></td>
            <td>${risk
              ? `<span class="pill pill-overdue">${icon.alert(13)}No chase booked</span>`
              : live ? `<span class="pill pill-quiet">${esc(date(o?.next_action_due))}</span>`
              : '<span class="dim">—</span>'}</td>
            <td class="ta-r">${q.status === 'draft'
              ? `<button type="button" class="btn-ghost btn-xs" data-send="${esc(q.id)}">${icon.doc(13)}<span>Mark sent</span></button>` : ''}
              <button type="button" class="btn-ghost btn-xs" data-edit="${esc(q.id)}">${icon.edit(13)}<span>Details</span></button></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`) : empty(filter === 'live' ? 'No quotations are out.' : 'Nothing matches that filter.',
      filter === 'live' ? 'Everything issued has been decided.' : '', { tone: 'ok' });

  return controls + card('', list, { tight: true });
}

export function mount(root, rerender, { me }) {
  root.addEventListener('change', (e) => {
    if (!e.target.closest('[data-f]')) return;
    filter = e.target.value;
    document.getElementById('view').innerHTML = body();
  });
  root.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-edit], [data-send]');
    if (!b) return;
    const quote = rows.find((q) => q.id === (b.dataset.edit || b.dataset.send));
    if (!quote) return;
    const opp = await api.opportunity(quote.opportunity_id);
    if (b.dataset.send) markSentDialog({ opp, quote, onDone: rerender });
    else quoteDetailDialog({ opp, quote, onDone: rerender });
  });
}

export function sub() {
  const live = rows.filter((q) => q.status === 'sent' || q.status === 'discussed');
  return `${esc(pluralise(live.length, 'quotation'))} awaiting a decision · <span class="num">${esc(total(live))}</span>`;
}
