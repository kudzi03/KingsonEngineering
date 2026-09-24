/* ═══════════════════════════════════════════════════════════════════════════
   ui/dialogs.js — the write operations, in one place
   ═══════════════════════════════════════════════════════════════════════════

   These are the forms that create and change records. They live together
   because the same three of them are reachable from four different screens,
   and a "Book a follow-up" that behaves differently on the opportunity page
   than in the follow-up queue is two bugs waiting to be reported as one.

   Each returns a promise that resolves when the database has confirmed the
   write. Callers re-render on that, never before.
   ═══════════════════════════════════════════════════════════════════════════ */

import { api } from '../core/api.js';
import {
  PRIORITIES, SOURCES, SOURCE_LABEL, DRAWINGS, CONTACT_METHODS, TASK_TYPES,
  LOGGABLE, ACTIVITY_LABEL, PROJECT_STATUSES, PROJECT_LABEL,
  today, nextWorkingDay, addDays, normPhone, normEmail
} from '../core/model.js';
import { icon } from './icons.js';
import { isoDate, isoDateTime, fromLocalInput, esc } from '../core/fmt.js';
import { dialog, field, text, textarea, number, dateInput, dateTimeInput, select, nul, num, toast, fieldError, after } from './form.js';

const titleCase = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const people = (profiles, includeNone = true) =>
  (includeNone ? [['', 'Unassigned']] : []).concat(profiles.map((p) => [p.id, p.full_name]));

/* ── new enquiry ──────────────────────────────────────────────────────────────
   Built for a phone call: three things are required — who, how to reach
   them, and what they want — and everything else can wait. While the name,
   number, email or company is typed, the database is asked who is already on
   file (find_contact_matches). A strong match (same email, or the same number
   however it is written) is shown as "Existing customer found" and the
   secretary chooses: use them, or create a new customer. Nothing is merged
   silently. The save is one database call (create_enquiry), so a failure
   cannot leave a contact behind without its enquiry. */

export async function newOpportunity({ me, contact = null, onDone }) {
  const profiles = await api.profiles();
  let matchTimer = 0, matchSeq = 0, strong = [];

  const destroy = dialog({
    title: 'New enquiry',
    sub: contact ? `For ${contact.full_name}` : 'Name, a phone number or email, and what they need. The rest can wait.',
    width: 640,
    submitLabel: 'Create enquiry',
    body: `
      <input type="hidden" name="contact_id" value="${esc(contact?.id || '')}">
      <input type="hidden" name="force_new" value="">
      <div class="qe-who"${contact ? ' hidden' : ''}>
        <div class="field-row">
          ${field('full_name', 'Who is it?', text('full_name', '', 'autocomplete="off" placeholder="Tendai Moyo"'))}
          ${field('phone', 'Phone / WhatsApp', text('phone', '', 'type="tel" inputmode="tel" autocomplete="off" placeholder="077 123 4567"'))}
        </div>
        <div class="field-row">
          ${field('email', 'Email', text('email', '', 'type="email" inputmode="email" autocomplete="off" placeholder="name@company.co.zw"'), { hint: 'Optional if you have a phone number.' })}
          ${field('company', 'Company', text('company', '', 'autocomplete="off" placeholder="Optional"'))}
        </div>
      </div>
      <div class="qe-match" data-match aria-live="polite">${contact ? chosenHtml(contact) : ''}</div>
      ${field('description', 'What do they need?', textarea('description', '', 2, 'placeholder="Structural steel for a warehouse in Msasa. Has drawings, wants a price."'), { wide: true })}
      <div class="field-row">
        ${field('source', 'How did it come in?', select('source', SOURCES.map((s) => [s, SOURCE_LABEL[s]]), 'phone'))}
        ${field('service', 'Service', select('service', [['', 'Not sure yet'], 'Structural steelwork', 'Roof steelwork and trusses',
          'Fiber laser cutting', 'Balustrades and gates', 'Stainless fabrication', 'Mobile cranage', 'Other']))}
      </div>
      <details class="qe-more">
        <summary>More detail (optional)</summary>
        <div class="field-row">
          ${field('location', 'Site / location', text('location', '', 'placeholder="Msasa, Harare"'))}
          ${field('drawings', 'Drawings?', select('drawings', DRAWINGS, 'unknown'))}
        </div>
        <div class="field-row">
          ${field('preferred', 'Best way to reach them', select('preferred', CONTACT_METHODS, ''))}
          ${field('owner_id', 'Who deals with it', select('owner_id', people(profiles), me?.id || ''))}
        </div>
        <div class="field-row">
          ${field('next_action', 'Next action', text('next_action', 'Call and qualify the enquiry'))}
          ${field('next_action_due', 'Due', dateInput('next_action_due', nextWorkingDay()))}
        </div>
        ${field('title', 'Job name', text('title', '', 'placeholder="Left blank, it is made from the service and site"'), { wide: true })}
      </details>`,
    onSubmit: async (v) => {
      const chosen = v.contact_id || null;
      if (!chosen) {
        if (!v.full_name) throw fieldError('full_name', 'Who is asking?');
        if (!v.phone && !v.email) throw fieldError('phone', 'A phone number or an email address is needed.');
        if (v.email && !normEmail(v.email)) throw fieldError('email', 'That email address does not look right.');
        if (strong.length && v.force_new !== '1') {
          throw new Error('This customer may already be on file. Choose “Use this customer”, or “create a new customer” if it is somebody else.');
        }
      }
      if (!v.description) throw fieldError('description', 'Write a line about what they need.');

      const r = await api.createEnquiry({
        fullName: v.full_name, phone: v.phone, email: v.email, company: v.company,
        contactId: chosen, forceNew: v.force_new === '1',
        description: v.description, title: v.title, service: v.service, location: v.location,
        source: v.source, preferredChannel: v.preferred, drawings: v.drawings,
        ownerId: nul(v.owner_id), nextAction: v.next_action, nextDue: nul(v.next_action_due)
      });
      toast(`${r.ref} created${r.contact_reused ? ' for an existing customer' : ''}.`);
      if (onDone) after(onDone, { id: r.opportunity_id, ref: r.ref });
      else location.hash = `#/opportunity/${r.opportunity_id}`;
    }
  });

  const root = [...document.querySelectorAll('.modal')].pop();
  if (!root || contact) return destroy;
  const box = root.querySelector('[data-match]');
  const idEl = root.querySelector('[name="contact_id"]');
  const newEl = root.querySelector('[name="force_new"]');
  const who = root.querySelector('.qe-who');
  const val = (n) => root.querySelector(`[name="${n}"]`).value.trim();

  async function lookup() {
    if (idEl.value) return;
    const q = { phone: normPhone(val('phone')) ? val('phone') : '', email: normEmail(val('email')),
                name: val('full_name'), company: val('company') };
    if (!q.phone && !q.email && q.name.length < 3 && q.company.length < 3) { strong = []; box.innerHTML = ''; return; }
    const mine = ++matchSeq;
    let rows = [];
    try { rows = await api.findMatches(q); } catch { return; }       // matching is a help, not a gate
    if (mine !== matchSeq || idEl.value) return;
    strong = rows.filter((r) => r.strength === 'strong');
    const soft = rows.filter((r) => r.strength !== 'strong');
    if (!rows.length) { box.innerHTML = ''; newEl.value = ''; return; }
    box.innerHTML = (strong.length ? `
        <div class="qe-found qe-strong">
          <p class="qe-found-h">${icon.alert(15)}<span>Existing customer found — same ${esc(strong[0].match === 'email' ? 'email address' : 'phone number')}</span></p>
          ${strong.map(matchRow).join('')}
          <button type="button" class="btn-ghost btn-xs" data-force-new aria-pressed="${newEl.value ? 'true' : 'false'}">
            ${newEl.value ? 'Creating a new customer — undo' : 'It is somebody else — create a new customer'}</button>
        </div>` : '') +
      (soft.length ? `
        <details class="qe-found qe-soft"${strong.length ? '' : ' open'}>
          <summary>${soft.length} similar name${soft.length === 1 ? '' : 's'} on file — is it one of them?</summary>
          ${soft.map(matchRow).join('')}
        </details>` : '');
  }

  const onType = () => { clearTimeout(matchTimer); newEl.value = ''; matchTimer = setTimeout(lookup, 250); };
  ['full_name', 'phone', 'email', 'company'].forEach((n) =>
    root.querySelector(`[name="${n}"]`).addEventListener('input', onType));

  box.addEventListener('click', (e) => {
    const use = e.target.closest('[data-use]');
    if (use) {
      const r = JSON.parse(use.dataset.use);
      idEl.value = r.contact_id;
      newEl.value = '';
      strong = [];
      who.hidden = true;
      box.innerHTML = chosenHtml({ full_name: r.full_name, companies: { name: r.company_name }, phone: r.phone, email: r.email }, true);
      root.querySelector('[name="description"]').focus();
      return;
    }
    if (e.target.closest('[data-change]')) {
      idEl.value = '';
      who.hidden = false;
      box.innerHTML = '';
      lookup();
      return;
    }
    if (e.target.closest('[data-force-new]')) {
      newEl.value = newEl.value ? '' : '1';
      const btn = e.target.closest('[data-force-new]');
      btn.setAttribute('aria-pressed', newEl.value ? 'true' : 'false');
      btn.textContent = newEl.value ? 'Creating a new customer — undo' : 'It is somebody else — create a new customer';
    }
  });
  return destroy;
}

function matchRow(r) {
  const payload = esc(JSON.stringify({ contact_id: r.contact_id, full_name: r.full_name,
    company_name: r.company_name, phone: r.phone, email: r.email }));
  return `<div class="qe-hit">
      <span class="qe-hit-main">
        <strong>${esc(r.full_name)}</strong>${r.company_name ? ` · ${esc(r.company_name)}` : ''}
        <span class="qe-hit-sub">${esc([r.phone, r.email].filter(Boolean).join(' · '))}${
          r.open_enquiries ? ` · ${r.open_enquiries} open enquir${r.open_enquiries === 1 ? 'y' : 'ies'}` : ''}${
          r.last_ref ? ` · last ${esc(r.last_ref)}` : ''}</span>
      </span>
      <button type="button" class="btn btn-xs" data-use="${payload}">Use this customer</button>
    </div>`;
}

function chosenHtml(c, changeable = false) {
  return `<div class="qe-chosen">
      ${icon.check(15)}
      <span><strong>${esc(c.full_name)}</strong>${c.companies?.name ? ` · ${esc(c.companies.name)}` : ''}
        <span class="qe-hit-sub">${esc([c.phone, c.email].filter(Boolean).join(' · '))}</span></span>
      ${changeable ? '<button type="button" class="btn-ghost btn-xs" data-change>Change</button>' : ''}
    </div>`;
}

/* ── log an interaction ───────────────────────────────────────────────────── */

export function logActivity({ opportunityId, contactId, me, onDone }) {
  dialog({
    title: 'Log an interaction',
    sub: 'Goes on the timeline exactly as written',
    width: 520,
    submitLabel: 'Log it',
    body: `
      ${field('kind', 'What happened?', select('kind', LOGGABLE.map((k) => [k, ACTIVITY_LABEL[k]]), 'call'))}
      ${field('body', 'Notes', textarea('body', '', 4, 'required placeholder="Spoke to Tendai. Wants the quotation by Friday."'), { wide: true })}
      ${field('occurred_at', 'When', dateTimeInput('occurred_at', isoDateTime(new Date())),
        { hint: 'Change this if you are catching up on something from earlier.' })}`,
    onSubmit: async (v) => {
      if (!v.body) throw fieldError('body', 'Write what happened.');
      await api.logActivity({
        opportunity_id: opportunityId || null, contact_id: contactId || null,
        kind: v.kind, body: v.body, actor_id: me?.id || null,
        occurred_at: fromLocalInput(v.occurred_at) || new Date().toISOString()
      });
      toast('Logged.');
      after(onDone);
    }
  });
}

/* ── book the next action ─────────────────────────────────────────────────── */

export async function bookFollowUp({ opp, me, onDone }) {
  const profiles = await api.profiles();
  dialog({
    title: opp.next_action_due ? 'Change the next action' : 'Book the next action',
    sub: 'Every open enquiry should have one. This is what puts it on the follow-up list.',
    width: 540,
    submitLabel: 'Save',
    body: `
      ${field('next_action', 'What needs to happen', text('next_action', opp.next_action || '', 'required placeholder="Chase the quotation"'), { wide: true })}
      <div class="field-row">
        ${field('next_action_due', 'When', dateInput('next_action_due', isoDate(opp.next_action_due) || nextWorkingDay(), 'required'))}
        ${field('owner_id', 'Owner', select('owner_id', people(profiles), opp.owner_id || me?.id || ''))}
      </div>
      ${field('channel', 'How', select('channel', ['Phone', 'WhatsApp', 'Email', 'Site visit', 'In person'], 'Phone'))}
      ${field('also_task', 'Also add it to the task list', `<label class="check"><input type="checkbox" id="also_task" name="also_task" checked> <span>Create a task as well</span></label>`, { wide: true })}`,
    onSubmit: async (v) => {
      if (!v.next_action) throw fieldError('next_action', 'Say what needs to happen.');
      if (!v.next_action_due) throw fieldError('next_action_due', 'Give it a date.');
      await api.updateOpportunity(opp.id, {
        next_action: v.next_action, next_action_due: v.next_action_due, owner_id: nul(v.owner_id)
      });
      if (v.also_task) {
        /* A next action is a sales follow-up: chasing a live quotation, or
           getting back to the enquiry before there is one. Won and Lost
           close it by this type (decide_opportunity). */
        await api.createTask({
          title: v.next_action, opportunity_id: opp.id, contact_id: opp.contact_id,
          owner_id: nul(v.owner_id), due_date: v.next_action_due, channel: v.channel, priority: opp.priority,
          task_type: Number(opp.live_quotes || 0) ? 'quote_followup' : 'enquiry_response'
        });
      }
      await api.logActivity({
        opportunity_id: opp.id, contact_id: opp.contact_id, kind: 'task',
        body: `Next action booked for ${v.next_action_due}: ${v.next_action} (${v.channel})`,
        actor_id: me?.id || null
      });
      toast('Booked.');
      after(onDone);
    }
  });
}

/* ── site visits ──────────────────────────────────────────────────────────── */

export async function visitDialog({ opp, visit = null, me, onDone }) {
  const profiles = await api.profiles();
  const editing = Boolean(visit);
  dialog({
    title: editing ? 'Site visit' : 'Book a site visit',
    sub: opp?.title || '',
    width: 560,
    submitLabel: editing ? 'Save' : 'Book',
    body: `
      <div class="field-row">
        ${field('scheduled_at', 'When', dateTimeInput('scheduled_at', isoDateTime(visit?.scheduled_at) || isoDateTime(new Date(Date.now() + 864e5)), 'required'))}
        ${field('owner_id', 'Who is going', select('owner_id', people(profiles), visit?.owner_id || me?.id || ''))}
      </div>
      ${field('location', 'Where', text('location', visit?.location || opp?.location || '', 'placeholder="Msasa, Harare"'), { wide: true })}
      ${field('purpose', 'Purpose', text('purpose', visit?.purpose || 'Measure up and assess access', ''), { wide: true })}
      ${editing ? `
        ${field('status', 'Status', select('status', ['scheduled', 'completed', 'cancelled'].map((s) => [s, titleCase(s)]), visit.status))}
        ${field('outcome', 'Outcome', textarea('outcome', visit.outcome || '', 3,
          'placeholder="Existing purlins sound. Access good from the north gate."'), { wide: true })}` : ''}
      ${field('notes', 'Notes', textarea('notes', visit?.notes || '', 2), { wide: true })}`,
    onSubmit: async (v) => {
      if (!v.scheduled_at) throw fieldError('scheduled_at', 'Give a date and time.');
      const row = {
        scheduled_at: fromLocalInput(v.scheduled_at),
        owner_id: nul(v.owner_id), location: nul(v.location),
        purpose: nul(v.purpose), notes: nul(v.notes)
      };
      if (editing) {
        row.status = v.status;
        row.outcome = nul(v.outcome);
        await api.updateVisit(visit.id, row);
      } else {
        await api.createVisit({ ...row, opportunity_id: opp.id, status: 'scheduled' });
        /* Booking a visit is the requirements stage by definition. The visit
           is already saved, so a refused stage move must not reopen the
           dialog — a second submit would book the visit twice. */
        if (['new', 'contacted'].includes(opp.stage)) {
          try { await api.updateOpportunity(opp.id, { stage: 'requirements' }); }
          catch (e) { toast(`Visit booked. The stage was not moved: ${e.message}`, 'bad'); after(onDone); return; }
        }
      }
      toast(editing ? 'Visit saved.' : 'Visit booked.');
      after(onDone);
    }
  });
}

/* ── tasks ────────────────────────────────────────────────────────────────── */

export async function taskDialog({ task = null, opp = null, me, onDone }) {
  const profiles = await api.profiles();
  const editing = Boolean(task);
  dialog({
    title: editing ? 'Task' : 'New task',
    sub: opp?.title || task?.opportunities?.title || '',
    width: 520,
    submitLabel: editing ? 'Save' : 'Create',
    body: `
      ${field('title', 'What needs doing', text('title', task?.title || '', 'required'), { wide: true })}
      <div class="field-row">
        ${field('due_date', 'Due', dateInput('due_date', isoDate(task?.due_date) || nextWorkingDay()))}
        ${field('owner_id', 'Owner', select('owner_id', people(profiles), task?.owner_id || me?.id || ''))}
      </div>
      <div class="field-row">
        ${field('priority', 'Priority', select('priority', PRIORITIES.map((p) => [p, titleCase(p)]), task?.priority || 'normal'))}
        ${field('channel', 'How', select('channel', ['', 'Phone', 'WhatsApp', 'Email', 'Site visit', 'In person'], task?.channel || ''))}
      </div>
      ${opp || task?.opportunity_id ? field('task_type', 'Kind of task', select('task_type', TASK_TYPES, task?.task_type || 'general'),
        { wide: true, hint: 'Sales follow-ups close by themselves when the enquiry is won or lost. General tasks stay open.' }) : ''}
      ${field('notes', 'Notes', textarea('notes', task?.notes || '', 2), { wide: true })}`,
    onSubmit: async (v) => {
      if (!v.title) throw fieldError('title', 'Say what needs doing.');
      const row = {
        title: v.title, due_date: nul(v.due_date), owner_id: nul(v.owner_id),
        priority: v.priority, channel: nul(v.channel), notes: nul(v.notes),
        ...(v.task_type ? { task_type: v.task_type } : {})
      };
      if (editing) await api.updateTask(task.id, row);
      else await api.createTask({
        ...row,
        opportunity_id: opp?.id || null,
        contact_id: opp?.contact_id || null
      });
      toast(editing ? 'Task saved.' : 'Task created.');
      after(onDone);
    }
  });
}

/* ── contacts ─────────────────────────────────────────────────────────────── */

export function contactDialog({ contact = null, onDone }) {
  const editing = Boolean(contact);
  dialog({
    title: editing ? 'Edit contact' : 'New contact',
    width: 560,
    submitLabel: editing ? 'Save' : 'Create',
    body: `
      <div class="field-row">
        ${field('full_name', 'Name', text('full_name', contact?.full_name || '', 'required'))}
        ${field('job_title', 'Role', text('job_title', contact?.job_title || '', 'placeholder="Operations Manager"'))}
      </div>
      ${field('company', 'Company', text('company', contact?.companies?.name || '', 'placeholder="Msasa Park Logistics"'), { wide: true })}
      <div class="field-row">
        ${field('phone', 'Phone', text('phone', contact?.phone || '', 'placeholder="+263 77 000 0000"'))}
        ${field('whatsapp', 'WhatsApp', text('whatsapp', contact?.whatsapp || '', 'placeholder="+263 77 000 0000"'),
          { hint: 'Often not the same as the office line.' })}
      </div>
      ${field('email', 'Email', text('email', contact?.email || '', 'type="email"'), { wide: true })}
      ${field('preferred_channel', 'Prefers', select('preferred_channel', ['', 'Phone', 'WhatsApp', 'Email'], contact?.preferred_channel || ''))}
      ${field('notes', 'Notes', textarea('notes', contact?.notes || '', 2), { wide: true })}`,
    onSubmit: async (v) => {
      if (!v.full_name) throw fieldError('full_name', 'A name is needed.');
      if (!v.phone && !v.whatsapp && !v.email) {
        throw fieldError('phone', 'A phone number, a WhatsApp number or an email address is needed.');
      }
      const companyId = v.company ? (await api.findOrCreateCompany(v.company))?.id || null : null;
      const row = {
        full_name: v.full_name, job_title: nul(v.job_title), phone: nul(v.phone),
        whatsapp: nul(v.whatsapp), email: nul(v.email) && v.email.toLowerCase(),
        preferred_channel: nul(v.preferred_channel), notes: nul(v.notes)
      };
      if (companyId) row.company_id = companyId;
      const saved = editing ? await api.updateContact(contact.id, row) : await api.createContact(row);
      toast(editing ? 'Contact saved.' : 'Contact created.');
      after(onDone, saved);
    }
  });
}

/* ── won → project ────────────────────────────────────────────────────────── */

export function convertDialog({ opp, onDone }) {
  dialog({
    title: 'Open a project',
    sub: `${opp.ref} — ${opp.title}`,
    width: 520,
    submitLabel: 'Open project',
    body: `
      ${field('name', 'Project name', text('name', opp.title, 'required'), { wide: true })}
      <div class="field-row">
        ${field('start_date', 'Start', dateInput('start_date', today()))}
        ${field('target_date', 'Target completion', dateInput('target_date', addDays(today(), 56)))}
      </div>
      <p class="modal-message">The client, contact, value and description come across from the
        enquiry. The enquiry stays on record and links to the project.</p>`,
    onSubmit: async (v) => {
      const id = await api.convertToProject(opp.id, {
        name: v.name, startDate: nul(v.start_date), targetDate: nul(v.target_date)
      });
      toast('Project opened.');
      if (onDone) after(onDone, id);
      else location.hash = `#/project/${id}`;
    }
  });
}

/* ── projects ─────────────────────────────────────────────────────────────── */

export async function projectDialog({ project, me, onDone }) {
  const profiles = await api.profiles();
  dialog({
    title: 'Edit project',
    sub: project.name,
    width: 560,
    submitLabel: 'Save',
    body: `
      ${field('name', 'Name', text('name', project.name, 'required'), { wide: true })}
      <div class="field-row">
        ${field('status', 'Status', select('status', PROJECT_STATUSES.map((s) => [s, PROJECT_LABEL[s]]), project.status))}
        ${field('owner_id', 'Responsible', select('owner_id', people(profiles), project.owner_id || ''))}
      </div>
      <div class="field-row">
        ${field('start_date', 'Start', dateInput('start_date', isoDate(project.start_date)))}
        ${field('target_date', 'Target', dateInput('target_date', isoDate(project.target_date)))}
      </div>
      <div class="field-row">
        ${field('value', 'Value (USD)', number('value', project.value ?? '', 'min="0" step="100"'))}
        ${field('completed_on', 'Completed', dateInput('completed_on', isoDate(project.completed_on)))}
      </div>
      ${field('description', 'Description', textarea('description', project.description || '', 3), { wide: true })}
      ${field('notes', 'Notes', textarea('notes', project.notes || '', 2), { wide: true })}`,
    onSubmit: async (v) => {
      if (!v.name) throw fieldError('name', 'A project needs a name.');
      await api.updateProject(project.id, {
        name: v.name, status: v.status, owner_id: nul(v.owner_id),
        start_date: nul(v.start_date), target_date: nul(v.target_date),
        completed_on: nul(v.completed_on), value: num(v.value),
        description: nul(v.description), notes: nul(v.notes)
      });
      toast('Project saved.');
      after(onDone);
    }
  });
}
