/* ═══════════════════════════════════════════════════════════════════════════
   views/followups.js — the actionable queue
   ═══════════════════════════════════════════════════════════════════════════

   Four groups, in the order somebody should work them. The second group is
   the one this application exists for: open opportunities with nothing
   booked. They appear on no list of things to do, so nobody ever does them,
   and they are where enquiries are lost. They sit above the merely late.
   ═══════════════════════════════════════════════════════════════════════════ */

import { api } from '../core/api.js';
import { isOverdue, isDueToday, hasNoNextAction, daysUntil, oppValue, sumValues } from '../core/model.js';
import { money, moneyBy, relative, esc, pluralise } from '../core/fmt.js';
import { card, empty, avatar, attentionPill, dueCell, contactActions } from '../ui/components.js';
import { icon } from '../ui/icons.js';
import { toast } from '../ui/form.js';
import { followUpDialog } from '../ui/lifecycle.js';

export const title = 'Follow-ups';

/* Quoted value in a group, with unquoted jobs counted rather than summed. */
function quotedText(rows) {
  const v = sumValues(rows);
  if (!v.valued) return rows.length ? 'not quoted yet' : '';
  return moneyBy(v.by) + ' quoted' + (v.unvalued ? ` · ${v.unvalued} unquoted` : '');
}

let open = [];

export async function render(_arg, { me }) {
  open = await api.openOpportunities();

  const overdue  = open.filter(isOverdue).sort((a, b) => daysUntil(a.next_action_due) - daysUntil(b.next_action_due));
  const unbooked = open.filter(hasNoNextAction).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const dueToday = open.filter(isDueToday);
  const soon = open.filter((o) => {
    const d = daysUntil(o.next_action_due);
    return d !== null && d > 0 && d <= 14;
  }).sort((a, b) => daysUntil(a.next_action_due) - daysUntil(b.next_action_due));

  const summary = `
    <div class="fu-summary">
      <span class="fu-sum fu-sum-danger">
        ${icon.alert(16)}<b class="num">${overdue.length}</b><span>overdue</span>
        <em class="num">${esc(quotedText(overdue))}</em>
      </span>
      <span class="fu-sum${unbooked.length ? ' fu-sum-danger' : ''}">
        ${icon.alert(16)}<b class="num">${unbooked.length}</b><span>nothing booked</span>
        <em class="num">${esc(quotedText(unbooked))}</em>
      </span>
      <span class="fu-sum">
        ${icon.clock(16)}<b class="num">${dueToday.length}</b><span>due today</span>
        <em class="num">${esc(quotedText(dueToday))}</em>
      </span>
      <span class="fu-sum">
        ${icon.calendar(16)}<b class="num">${soon.length}</b><span>next 14 days</span>
        <em class="num">${esc(quotedText(soon))}</em>
      </span>
    </div>`;

  return `
    ${summary}
    ${group('Overdue', overdue, 'Past the date somebody committed to. Every one of these is a customer waiting.')}
    ${group('Open, with nothing booked', unbooked, 'These appear on no list and are on nobody’s day. This is where enquiries are lost.')}
    ${group('Due today', dueToday, 'Booked for today.')}
    ${group('Next fourteen days', soon, 'Booked and not yet due.')}`;
}

function group(heading, rows, note) {
  if (!rows.length) {
    return card(heading, empty(
      heading === 'Overdue' || heading.startsWith('Open,')
        ? 'Nothing in this group. Good.' : 'Nothing booked in this window.'), { note, tight: true });
  }
  return card(heading, `
    <ul class="fu-list">
      ${rows.map((o) => `
        <li class="fu">
          <span class="fu-when">${dueCell(o.next_action_due)}</span>
          <a class="fu-main" href="#/opportunity/${esc(o.id)}">
            <span class="fu-title">${esc(o.title)}</span>
            <span class="fu-sub">${esc(o.company_name || o.contact_name || '—')} · ${esc(o.ref)}${(() => { const v = oppValue(o); return v.amount == null ? ' · not quoted yet' : ` · <span class="num">${esc(money(v.amount, v.currency))}</span>`; })()}</span>
            <span class="fu-action">${o.next_action
              ? `${icon.arrowRight(13)}${esc(o.next_action)}`
              : `${icon.alert(13)}No next action recorded`}</span>
            ${Number(o.live_quotes) ? `<span class="fu-quote">${icon.doc(12)}${esc(pluralise(Number(o.live_quotes), 'quotation'))} out${o.last_quote_sent ? ' · ' + esc(relative(o.last_quote_sent)) : ''}</span>` : ''}
          </a>
          <span class="fu-stage">${attentionPill(o)}</span>
          <span class="fu-owner">${avatar(o.owner_name ? { full_name: o.owner_name, initials: o.owner_initials } : null, 26)}</span>
          <span class="fu-do">
            ${contactActions({ phone: o.contact_phone, whatsapp: o.contact_whatsapp, email: o.contact_email },
              { text: `Good day, Kingson Engineering here regarding ${o.title}.`, size: 'xs' })}
            <button type="button" class="btn-ghost btn-xs" data-chase="${esc(o.id)}">${icon.check(13)}<span>Log follow-up</span></button>
          </span>
        </li>`).join('')}
    </ul>`, { note, tight: true });
}

export function mount(root, rerender) {
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-chase]');
    if (!b) return;
    const opp = open.find((o) => o.id === b.dataset.chase);
    /* One step: the interaction goes on the timeline and the next date is
       booked in the same write, so a chase can never be logged without one. */
    if (opp) followUpDialog({ opp, onDone: rerender });
  });
}

export function sub() {
  const overdue = open.filter(isOverdue).length;
  const unbooked = open.filter(hasNoNextAction).length;
  const bits = [];
  if (overdue) bits.push(`${overdue} overdue`);
  if (unbooked) bits.push(`${unbooked} with nothing booked`);
  return bits.length
    ? `<span class="sub-alarm">${icon.alert(14)}${esc(bits.join(' · '))}</span>`
    : 'Nothing is late';
}
