/* ═══════════════════════════════════════════════════════════════════════════
   views/tasks.js — everything anybody has to do
   ═══════════════════════════════════════════════════════════════════════════

   The same rows the follow-up queue works from, with a different lens on
   them: filtered by owner and status rather than grouped by urgency. One
   table, two views, because two tables would be two places to forget things.
   ═══════════════════════════════════════════════════════════════════════════ */

import { api } from '../core/api.js';
import { daysUntil } from '../core/model.js';
import { date, relative, esc, pluralise } from '../core/fmt.js';
import { card, empty, avatar, priorityPill, dueCell } from '../ui/components.js';
import { icon } from '../ui/icons.js';
import { toast } from '../ui/form.js';
import { taskDialog } from '../ui/dialogs.js';

export const title = 'Tasks';

let rows = [];
let filter = { status: 'open', owner: 'all' };
let profiles = [];

export async function render(_arg, { me }) {
  [rows, profiles] = await Promise.all([api.tasks(), api.profiles()]);
  return body(me);
}

function body(me) {
  const shown = rows.filter((t) =>
    (filter.status === 'all' || t.status === filter.status) &&
    (filter.owner === 'all' || (filter.owner === 'mine' ? t.owner_id === me?.id : t.owner_id === filter.owner)));

  const controls = `
    <div class="filters">
      <label class="sr-only" for="f-status">Status</label>
      <select class="sel sel-inline" id="f-status" data-f="status">
        ${[['open', 'Open'], ['done', 'Completed'], ['all', 'All']].map(([v, l]) =>
          `<option value="${v}"${filter.status === v ? ' selected' : ''}>${l}</option>`).join('')}
      </select>
      <label class="sr-only" for="f-owner">Owner</label>
      <select class="sel sel-inline" id="f-owner" data-f="owner">
        <option value="all"${filter.owner === 'all' ? ' selected' : ''}>Everyone</option>
        <option value="mine"${filter.owner === 'mine' ? ' selected' : ''}>Mine</option>
        ${profiles.map((p) => `<option value="${esc(p.id)}"${filter.owner === p.id ? ' selected' : ''}>${esc(p.full_name)}</option>`).join('')}
      </select>
      <span class="filters-n">${esc(pluralise(shown.length, 'task'))}</span>
    </div>`;

  const list = shown.length ? `
    <ul class="fu-list">
      ${shown.sort(byDue).map((t) => `
        <li class="fu${t.status === 'done' ? ' is-done' : ''}">
          <span class="fu-when">${dueCell(t.due_date)}</span>
          <div class="fu-main">
            <span class="fu-title">${esc(t.title)}</span>
            <span class="fu-sub">
              ${t.opportunities ? `<a class="lnk" href="#/opportunity/${esc(t.opportunities.id)}">${esc(t.opportunities.ref)} · ${esc(t.opportunities.title)}</a>` : '<span class="dim">Not linked to an opportunity</span>'}
              ${t.channel ? ' · ' + esc(t.channel) : ''}
            </span>
            ${t.notes ? `<span class="fu-action">${esc(t.notes)}</span>` : ''}
          </div>
          <span class="fu-stage">${priorityPill(t.priority)}</span>
          <span class="fu-owner">${avatar(t.profiles, 26)}</span>
          <span class="fu-do">
            <button type="button" class="btn-ghost btn-xs" data-edit="${esc(t.id)}">${icon.edit(13)}<span>Edit</span></button>
            ${t.status === 'open'
              ? `<button type="button" class="btn-ghost btn-xs" data-done="${esc(t.id)}">${icon.check(13)}<span>Done</span></button>`
              : `<button type="button" class="btn-ghost btn-xs" data-reopen="${esc(t.id)}">${icon.refresh(13)}<span>Reopen</span></button>`}
          </span>
        </li>`).join('')}
    </ul>` : empty(
      filter.status === 'open' ? 'Nothing outstanding.' : 'No tasks match that filter.',
      filter.status === 'open' ? 'Every task on this filter is done.' : '', { tone: 'ok' });

  return controls + card('', list, { tight: true });
}

const byDue = (a, b) => {
  if (!a.due_date) return 1;
  if (!b.due_date) return -1;
  return a.due_date < b.due_date ? -1 : a.due_date > b.due_date ? 1 : 0;
};

export function mount(root, rerender, { me }) {
  root.addEventListener('change', (e) => {
    const sel = e.target.closest('[data-f]');
    if (!sel) return;
    filter[sel.dataset.f] = sel.value;
    /* Re-filter in place rather than refetching: the rows have not changed,
       only which of them is being looked at. */
    const view = document.getElementById('view');
    view.innerHTML = body(me);
  });

  root.addEventListener('click', async (e) => {
    const d = e.target.closest('[data-done]');
    const r = e.target.closest('[data-reopen]');
    const ed = e.target.closest('[data-edit]');
    try {
      if (d) { await api.completeTask(d.dataset.done); toast('Completed.'); return rerender(); }
      if (r) { await api.updateTask(r.dataset.reopen, { status: 'open' }); toast('Reopened.'); return rerender(); }
      if (ed) {
        const task = rows.find((t) => t.id === ed.dataset.edit);
        if (task) return taskDialog({ task, me, onDone: rerender });
      }
    } catch (err) { toast(err.message || 'That could not be saved.', 'bad'); }
  });
}

export function sub() {
  const open = rows.filter((t) => t.status === 'open');
  const late = open.filter((t) => t.due_date && daysUntil(t.due_date) < 0).length;
  return late
    ? `<span class="sub-alarm">${icon.alert(14)}${esc(pluralise(late, 'task'))} overdue</span>`
    : `${esc(pluralise(open.length, 'open task'))}`;
}

export const actions = () =>
  `<button type="button" class="btn btn-sm" data-new-task-global>${icon.plus(14)}<span>New task</span></button>`;
