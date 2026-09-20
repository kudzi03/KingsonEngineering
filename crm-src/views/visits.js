/* ═══════════════════════════════════════════════════════════════════════════
   views/visits.js — who is going where, and what they found
   ═══════════════════════════════════════════════════════════════════════════
   Upcoming first, because this screen gets opened the night before. Each row
   carries the address and the customer's number, so it is usable from a
   pickup on the way to Ruwa.
   ═══════════════════════════════════════════════════════════════════════════ */

import { api } from '../core/api.js';
import { daysUntil } from '../core/model.js';
import { stamp, date, relative, esc, pluralise } from '../core/fmt.js';
import { card, empty, avatar, contactActions } from '../ui/components.js';
import { icon } from '../ui/icons.js';
import { visitDialog } from '../ui/dialogs.js';

export const title = 'Site visits';

let rows = [];

export async function render(_arg, { me }) {
  rows = await api.visits();
  const upcoming = rows.filter((v) => v.status === 'scheduled' && daysUntil(v.scheduled_at) >= 0)
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  const missed = rows.filter((v) => v.status === 'scheduled' && daysUntil(v.scheduled_at) < 0)
    .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));
  const past = rows.filter((v) => v.status !== 'scheduled')
    .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at)).slice(0, 30);

  return `
    ${group('Booked', upcoming, 'Scheduled and still to happen.')}
    ${missed.length ? group('Past their date and still open', missed,
      'These were booked and never closed off. Either it happened and needs writing up, or it did not.', true) : ''}
    ${group('Completed and cancelled', past, 'The last thirty.')}`;
}

function group(heading, list, note, alarm = false) {
  if (!list.length) return card(heading, empty('Nothing here.', '', { tone: 'ok' }), { note, tight: true });
  return card(heading, `
    <ul class="fu-list">
      ${list.map((v) => {
        const late = v.status === 'scheduled' && daysUntil(v.scheduled_at) < 0;
        return `
        <li class="fu">
          <span class="fu-when">
            <span class="fu-date num">${esc(stamp(v.scheduled_at))}</span>
            <span class="fu-rel${late ? ' is-late' : ''}">${esc(relative(v.scheduled_at))}</span>
          </span>
          <div class="fu-main">
            <span class="fu-title">${esc(v.opportunities?.title || 'Site visit')}</span>
            <span class="fu-sub">${esc(v.opportunities?.companies?.name || '')}${v.location ? ' · ' + icon.pin(12) + esc(v.location) : ''}</span>
            <span class="fu-action">${esc(v.purpose || '')}</span>
            ${v.outcome ? `<span class="fu-action">${icon.check(12)}${esc(v.outcome)}</span>` : ''}
          </div>
          <span class="fu-stage"><span class="pill pill-${v.status === 'completed' ? 'won' : v.status === 'cancelled' ? 'lost' : late ? 'overdue' : 'quiet'}">${esc(v.status)}</span></span>
          <span class="fu-owner">${avatar(v.profiles, 26)}</span>
          <span class="fu-do">
            ${v.opportunities ? `<a class="btn-ghost btn-xs" href="#/opportunity/${esc(v.opportunities.id)}">${icon.arrowRight(13)}<span>Open</span></a>` : ''}
            <button type="button" class="btn-ghost btn-xs" data-visit="${esc(v.id)}">${icon.edit(13)}<span>Edit</span></button>
          </span>
        </li>`;
      }).join('')}
    </ul>`, { note, tight: true });
}

export function mount(root, rerender, { me }) {
  root.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-visit]');
    if (!b) return;
    const visit = rows.find((v) => v.id === b.dataset.visit);
    if (!visit) return;
    const opp = await api.opportunity(visit.opportunity_id);
    visitDialog({ opp, visit, me, onDone: rerender });
  });
}

export function sub() {
  const soon = rows.filter((v) => v.status === 'scheduled' && daysUntil(v.scheduled_at) >= 0).length;
  return `${esc(pluralise(soon, 'visit'))} booked`;
}
