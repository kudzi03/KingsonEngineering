/* ═══════════════════════════════════════════════════════════════════════════
   views/project.js — one won job in delivery
   ═══════════════════════════════════════════════════════════════════════════ */

import { api } from '../core/api.js';
import { PROJECT_LABEL, daysUntil } from '../core/model.js';
import { money, date, dateFull, relative, esc, pluralise, tel, mailto } from '../core/fmt.js';
import {
  card, empty, avatar, timeline, projectStatusPill, contactActions
} from '../ui/components.js';
import { icon } from '../ui/icons.js';
import { projectDialog } from '../ui/dialogs.js';
import { filesCard, mountFiles } from './files.js';

export const title = () => project?.name || 'Project';

let project = null;

export async function render(id, { me }) {
  project = await api.project(id);
  if (!project) return empty('That project no longer exists.', '', { tone: 'quiet' });

  const [activity, files] = await Promise.all([
    api.activityForProject(id), api.filesFor('project_id', id)
  ]);

  const late = project.target_date && daysUntil(project.target_date) < 0 && project.status !== 'complete';

  const head = `
    <section class="opp-head${late ? ' opp-head-alarm' : ''}">
      <div class="opp-head-top">
        <div class="opp-stage-set">
          ${projectStatusPill(project.status)}
          ${project.opportunities ? `<a class="lnk" href="#/opportunity/${esc(project.opportunities.id)}">from ${esc(project.opportunities.ref)}</a>` : ''}
        </div>
        <dl class="opp-figs">
          <div><dt>Value</dt><dd class="num">${esc(money(project.value, project.currency))}</dd></div>
          <div><dt>Start</dt><dd>${esc(date(project.start_date))}</dd></div>
          <div><dt>Target</dt><dd>${esc(date(project.target_date))}
            ${project.target_date ? `<span class="dim">(${esc(relative(project.target_date))})</span>` : ''}</dd></div>
          <div><dt>Responsible</dt><dd class="opp-owner">${avatar(project.profiles, 24)}${esc(project.profiles?.full_name || 'Unassigned')}</dd></div>
        </dl>
      </div>
    </section>`;

  const detail = card('The job', `
    ${project.description ? `<p class="scope">${esc(project.description)}</p>` : '<p class="scope dim">No description.</p>'}
    ${project.notes ? `<dl class="kv"><div class="kv-wide"><dt>Notes</dt><dd>${esc(project.notes)}</dd></div></dl>` : ''}`,
    { action: `<button type="button" class="btn-ghost btn-xs" data-edit-project>${icon.edit(13)}<span>Edit</span></button>` });

  const client = card('Client', `
    <p class="co-name">${esc(project.companies?.name || '—')}</p>
    ${project.contacts ? `
      <div class="contact">
        ${avatar({ full_name: project.contacts.full_name }, 34)}
        <div class="contact-body">
          <p class="contact-name"><a class="lnk" href="#/contact/${esc(project.contacts.id)}">${esc(project.contacts.full_name)}</a></p>
          <div class="contact-lines">
            ${project.contacts.phone ? `<a class="lnk" href="${esc(tel(project.contacts.phone))}">${icon.phone(13)}${esc(project.contacts.phone)}</a>` : ''}
            ${project.contacts.email ? `<a class="lnk" href="${esc(mailto(project.contacts.email))}">${icon.mail(13)}${esc(project.contacts.email)}</a>` : ''}
          </div>
        </div>
      </div>
      <div class="contact-acts">${contactActions(project.contacts, { text: `Good day, Kingson Engineering here regarding ${project.name}.` })}</div>`
    : '<p class="dim">No contact linked.</p>'}`);

  return `
    <a class="back lnk" href="#/projects">${icon.chevron(13)}<span>Back to projects</span></a>
    ${head}
    <div class="grid grid-opp">
      <div class="col-wide">${detail}${card('Activity', timeline(activity), { tight: true, note: pluralise(activity.length, 'entry', 'entries') })}</div>
      <div class="col-side">${client}${filesCard(files)}</div>
    </div>`;
}

export function mount(root, rerender, { me }) {
  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-edit-project]')) return projectDialog({ project, me, onDone: rerender });
  });
  mountFiles(root, { project_id: project.id }, me, rerender);
}

export function sub() {
  if (!project) return '';
  return [project.companies?.name, PROJECT_LABEL[project.status]].filter(Boolean).map(esc).join(' · ');
}
