/* ═══════════════════════════════════════════════════════════════════════════
   views/projects.js — what was won, and where it is now
   ═══════════════════════════════════════════════════════════════════════════
   The bridge from sales into delivery. Deliberately small — enough to answer
   "we won it, what is happening?" and no attempt at construction ERP.
   ═══════════════════════════════════════════════════════════════════════════ */

import { api } from '../core/api.js';
import { PROJECT_STATUSES, PROJECT_LABEL, sum, daysUntil } from '../core/model.js';
import { money, date, relative, esc, pluralise } from '../core/fmt.js';
import { card, empty, avatar, projectStatusPill, tableWrap } from '../ui/components.js';
import { icon } from '../ui/icons.js';

export const title = 'Projects';

let rows = [];

export async function render() {
  rows = await api.projects();
  if (!rows.length) {
    return card('', empty('No projects yet.',
      'When an opportunity is marked won, open a project from it and it appears here.', { tone: 'quiet' }), { tight: true });
  }
  const live = rows.filter((p) => ['planning', 'in_progress', 'on_hold'].includes(p.status));
  const done = rows.filter((p) => !['planning', 'in_progress', 'on_hold'].includes(p.status));
  return group('Active', live) + group('Finished', done);
}

function group(heading, list) {
  if (!list.length) return card(heading, empty('Nothing here.', '', { tone: 'quiet' }), { tight: true });
  return card(heading, tableWrap(`
    <table class="tbl tbl-rows">
      <thead><tr>
        <th scope="col">Project</th><th scope="col">Client</th>
        <th scope="col" class="ta-r">Value</th><th scope="col">Status</th>
        <th scope="col">Target</th><th scope="col">Responsible</th>
      </tr></thead>
      <tbody>
        ${list.map((p) => {
          const late = p.target_date && daysUntil(p.target_date) < 0 && p.status !== 'complete';
          return `<tr${late ? ' class="tr-risk"' : ''}>
            <td><a class="lnk lnk-strong" href="#/project/${esc(p.id)}">${esc(p.name)}</a>
                ${p.opportunities ? `<span class="td-sub">from ${esc(p.opportunities.ref)}</span>` : ''}</td>
            <td>${esc(p.companies?.name || p.contacts?.full_name || '—')}</td>
            <td class="ta-r num">${esc(money(p.value, p.currency))}</td>
            <td>${projectStatusPill(p.status)}</td>
            <td><span class="td-main num">${esc(date(p.target_date))}</span>
                <span class="td-sub${late ? ' is-late' : ''}">${p.target_date ? esc(relative(p.target_date)) : ''}</span></td>
            <td>${avatar(p.profiles, 24)}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`), { tight: true, note: `${pluralise(list.length, 'project')} · ${money(sum(list, (p) => p.value))}` });
}

export function sub() {
  const live = rows.filter((p) => ['planning', 'in_progress', 'on_hold'].includes(p.status));
  return `${esc(pluralise(live.length, 'active project'))} · <span class="num">${esc(money(sum(live, (p) => p.value)))}</span>`;
}
