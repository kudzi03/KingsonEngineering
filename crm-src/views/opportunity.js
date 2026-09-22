/* ═══════════════════════════════════════════════════════════════════════════
   views/opportunity.js — one enquiry, everything about it
   ═══════════════════════════════════════════════════════════════════════════

   The banner at the top answers the only question that matters when somebody
   opens this page: what happens next, who is doing it, and is it late. When
   nothing is booked it says so in plain words rather than leaving a blank,
   because a blank is what lets a job go quiet.
   ═══════════════════════════════════════════════════════════════════════════ */

import { api } from '../core/api.js';
import { STAGES, STAGE, attention, isOpen, isOverdue, quoteAtRisk, oppValue } from '../core/model.js';
import { money, date, dateFull, relative, stamp, overdueBy, esc, pluralise, tel, whatsapp, mailto } from '../core/fmt.js';
import {
  card, empty, avatar, stagePill, priorityPill, quoteStatusPill, sourceTag,
  timeline, contactActions, tableWrap, projectStatusPill
} from '../ui/components.js';
import { icon } from '../ui/icons.js';
import { toast, confirmDialog } from '../ui/form.js';
import {
  logActivity, bookFollowUp, visitDialog, taskDialog, convertDialog
} from '../ui/dialogs.js';
import {
  recordQuoteDialog, markSentDialog, quoteDetailDialog, followUpDialog, repliedDialog,
  wonDialog, lostDialog, holdDialog, decisionFor
} from '../ui/lifecycle.js';
import { filesCard, mountFiles } from './files.js';

let opp = null;
let data = {};

export const title = () => opp?.title || 'Opportunity';

export async function render(id, { me }) {
  opp = await api.opportunity(id);
  if (!opp) return empty('That opportunity no longer exists.', 'It may have been deleted.', { tone: 'quiet' });

  const [activity, quotes, visits, tasks, files, project] = await Promise.all([
    api.activityFor(id), api.quotesFor(id), api.visitsFor(id),
    api.tasksFor(id), api.filesFor('opportunity_id', id), api.projectForOpportunity(id)
  ]);
  data = { activity, quotes, visits, tasks, files, project, me };

  const a = attention(opp);
  const val = oppValue(opp);
  const draft = quotes.find((q) => q.status === 'draft');
  const anySent = quotes.some((q) => q.sent_on);
  const open = isOpen(opp);
  const alarm = a.level === 'overdue' || a.level === 'unbooked';
  const contact = {
    full_name: opp.contact_name, phone: opp.contact_phone,
    whatsapp: opp.contact_whatsapp, email: opp.contact_email
  };

  /* ── the banner ────────────────────────────────────────────────────────── */

  const head = `
  <section class="opp-head${alarm ? ' opp-head-alarm' : ''}">
    <div class="opp-head-top">
      <div class="opp-stage-set">
        <span class="opp-ref num">${esc(opp.ref)}</span>
        <label class="sr-only" for="opp-stage">Stage</label>
        <select class="sel sel-inline" id="opp-stage" data-stage>
          ${STAGES.map((s) => `<option value="${esc(s.id)}"${s.id === opp.stage ? ' selected' : ''}>${esc(s.name)}</option>`).join('')}
        </select>
        ${priorityPill(opp.priority)}
        ${sourceTag(opp.source)}
      </div>
      <dl class="opp-figs">
        <div><dt>${val.kind === 'won' ? 'Won value' : val.kind === 'draft' ? 'Draft quotation' : 'Quoted'}</dt>
          <dd class="num">${val.amount == null ? '<span class="dim">Not quoted yet</span>' : esc(money(val.amount, val.currency))}</dd></div>
        <div><dt>Enquiry</dt><dd>${esc(date(opp.created_at))} <span class="dim">(${esc(relative(opp.created_at))})</span></dd></div>
        <div><dt>Last contact</dt><dd>${esc(relative(opp.last_activity_at))}</dd></div>
        <div><dt>Owner</dt><dd class="opp-owner">
          ${avatar(opp.owner_name ? { full_name: opp.owner_name, initials: opp.owner_initials } : null, 24)}
          ${esc(opp.owner_name || 'Unassigned')}</dd></div>
      </dl>
    </div>

    <div class="opp-next${alarm ? ' is-alarm' : ''}">
      <span class="opp-next-ic">${alarm ? icon.alert(18) : icon.arrowRight(18)}</span>
      <div class="opp-next-body">
        <p class="opp-next-label">Next action</p>
        ${opp.next_action || opp.next_action_due ? `
          <p class="opp-next-text">${esc(opp.next_action || 'Follow up')}</p>
          <p class="opp-next-meta">
            ${esc(opp.owner_name || 'Unassigned')} ·
            ${esc(dateFull(opp.next_action_due))} ·
            <strong>${esc(a.level === 'held' ? 'on hold' : isOverdue(opp) ? overdueBy(opp.next_action_due) : relative(opp.next_action_due))}</strong>
          </p>
          ${opp.stage === 'on_hold' && opp.hold_reason ? `<p class="opp-next-meta">On hold: ${esc(opp.hold_reason)}</p>` : ''}
          ${opp.customer_replied_at ? `<p class="opp-next-meta">Customer replied ${esc(relative(opp.customer_replied_at))} · ${esc(stamp(opp.customer_replied_at))}</p>` : ''}`
        : isOpen(opp) ? `
          <p class="opp-next-text">Nobody has booked a next action on this opportunity.</p>
          <p class="opp-next-meta">It is open and it is on nobody's list.</p>`
        : `<p class="opp-next-text">${esc(STAGE[opp.stage].name)}${opp.decided_at ? ' on ' + esc(dateFull(opp.decided_at)) : ''}.</p>
           ${opp.lost_reason ? `<p class="opp-next-meta">${esc(opp.lost_reason)}</p>` : ''}
           ${opp.stage === 'won' && opp.won_value != null ? `<p class="opp-next-meta">Accepted value ${esc(money(opp.won_value, opp.currency))}</p>` : ''}`}
      </div>
      ${isOpen(opp) ? `<button type="button" class="btn btn-sm" data-followup>
        ${icon.calendar(14)}<span>${opp.next_action_due ? 'Change' : 'Book a follow-up'}</span></button>` : ''}
    </div>

    ${open ? `<div class="opp-acts" role="group" aria-label="Move this job on">
      ${draft
        ? `<button type="button" class="btn btn-sm" data-mark-sent="${esc(draft.id)}">${icon.doc(14)}<span>Mark ${esc(draft.reference)} as sent</span></button>`
        : `<button type="button" class="btn btn-sm" data-record-quote>${icon.doc(14)}<span>${quotes.length ? 'Record a revision' : 'Record quotation'}</span></button>`}
      <button type="button" class="btn-ghost btn-sm" data-log-followup>${icon.phone(14)}<span>Log follow-up</span></button>
      ${anySent ? `<button type="button" class="btn-ghost btn-sm" data-replied>${icon.note(14)}<span>Customer replied</span></button>` : ''}
      <span class="opp-acts-gap" aria-hidden="true"></span>
      <button type="button" class="btn-ghost btn-sm" data-won>${icon.check(14)}<span>Won</span></button>
      <button type="button" class="btn-ghost btn-sm" data-lost>${icon.cross(14)}<span>Lost</span></button>
      ${opp.stage !== 'on_hold' ? `<button type="button" class="btn-ghost btn-sm" data-hold>${icon.clock(14)}<span>On hold</span></button>` : ''}
    </div>` : ''}
  </section>`;

  const demoStrip = opp.is_demo ? `<p class="demo-strip" role="note">${icon.alert(14)}
    <span><strong>Demonstration record.</strong> Not counted in any total or report.</span></p>` : '';

  /* ── the job ───────────────────────────────────────────────────────────── */

  const job = card('The job', `
    ${opp.description ? `<p class="scope">${esc(opp.description)}</p>` : '<p class="scope dim">No description recorded.</p>'}
    <dl class="kv">
      <div><dt>Service</dt><dd>${esc(opp.service || '—')}</dd></div>
      <div><dt>Location</dt><dd>${opp.location ? icon.pin(13) + esc(opp.location) : '—'}</dd></div>
      <div><dt>Site visit</dt><dd>${opp.site_visit_required
        ? `<span class="warn-inline">${icon.alert(13)}Needed</span>` : 'Not required'}</dd></div>
      <div><dt>Came in by</dt><dd>${sourceTag(opp.source)}</dd></div>
      ${opp.lost_reason ? `<div class="kv-wide"><dt>Reason lost</dt><dd>${esc(opp.lost_reason)}</dd></div>` : ''}
    </dl>`, { action: `<button type="button" class="btn-ghost btn-xs" data-edit-opp>${icon.edit(13)}<span>Edit</span></button>` });

  /* ── the customer ──────────────────────────────────────────────────────── */

  const customer = card('Customer', opp.contact_name ? `
    <p class="co-name">${esc(opp.company_name || '—')}</p>
    <div class="contact">
      ${avatar({ full_name: opp.contact_name }, 34)}
      <div class="contact-body">
        <p class="contact-name">${esc(opp.contact_name)}</p>
        <div class="contact-lines">
          ${opp.contact_phone ? `<a class="lnk" href="${esc(tel(opp.contact_phone))}">${icon.phone(13)}${esc(opp.contact_phone)}</a>` : ''}
          ${opp.contact_email ? `<a class="lnk" href="${esc(mailto(opp.contact_email))}">${icon.mail(13)}${esc(opp.contact_email)}</a>` : ''}
        </div>
      </div>
    </div>
    <div class="contact-acts">${contactActions(contact, {
      text: `Good day ${opp.contact_name.split(' ')[0]}, Kingson Engineering here regarding ${opp.title}.`
    })}</div>
    ${opp.contact_id ? `<p class="co-also"><a class="lnk" href="#/contact/${esc(opp.contact_id)}">
      ${icon.users(13)}Full history for this contact</a></p>` : ''}`
    : empty('No contact on this opportunity.', '', { tone: 'quiet' }), { tight: false });

  /* ── site visits ───────────────────────────────────────────────────────── */

  const visitsCard = card('Site visits', visits.length ? `
    <ul class="mini">
      ${visits.map((v) => `<li>
        <button type="button" class="mini-btn" data-visit="${esc(v.id)}">
          <span class="mini-main">${esc(stamp(v.scheduled_at))}
            <span class="pill pill-${v.status === 'completed' ? 'won' : v.status === 'cancelled' ? 'lost' : 'quiet'}">${esc(v.status)}</span></span>
          <span class="mini-sub">${esc(v.purpose || 'Site visit')}${v.location ? ' · ' + esc(v.location) : ''}</span>
          ${v.outcome ? `<span class="mini-sub">${esc(v.outcome)}</span>` : ''}
        </button>
        <span class="mini-side">${avatar(v.profiles, 24)}</span>
      </li>`).join('')}
    </ul>` : empty('No site visit booked.', opp.site_visit_required
        ? 'This job cannot be priced properly until somebody has been out.' : '', { tone: opp.site_visit_required ? 'quiet' : 'ok' }),
    { tight: true, action: `<button type="button" class="btn-ghost btn-xs" data-new-visit>${icon.plus(13)}<span>Book</span></button>` });

  /* ── quotations ────────────────────────────────────────────────────────── */

  const quotesCard = card('Quotations', quotes.length ? `
    <ul class="quotes">
      ${quotes.map((qt) => `<li class="quote">
        <button type="button" class="quote-btn" data-quote="${esc(qt.id)}">
          <span class="quote-ref">${esc(qt.reference)}${qt.version > 1 ? ` <span class="rev">rev ${qt.version}</span>` : ''}</span>
          <span class="quote-val num">${esc(money(qt.amount, qt.currency))}</span>
          <span class="quote-status">${quoteStatusPill(qt.status)}</span>
          <span class="quote-when">${qt.sent_at ? 'sent ' + esc(stamp(qt.sent_at)) + ' · ' + esc(relative(qt.sent_at))
            : qt.sent_on ? 'sent ' + esc(date(qt.sent_on)) + ' · ' + esc(relative(qt.sent_on)) : 'not sent yet'}</span>
        </button>
      </li>`).join('')}
    </ul>
    ${quoteAtRisk(opp) ? `<p class="risk">${icon.alert(14)}
      <span><strong>A quotation is out with no chase booked.</strong>
      A quotation nobody is following up is the most expensive thing in this pipeline.</span></p>` : ''}`
    : empty('Not quoted yet.', 'The value of this job is the quotation. Record it when it is ready.', { tone: 'quiet' }),
    { tight: true, action: open ? `<button type="button" class="btn-ghost btn-xs" data-record-quote>${icon.plus(13)}<span>${quotes.length ? 'Revision' : 'Record'}</span></button>` : '' });

  /* ── tasks ─────────────────────────────────────────────────────────────── */

  const openTasks = tasks.filter((t) => t.status === 'open');
  const tasksCard = card('Tasks', openTasks.length ? `
    <ul class="mini">
      ${openTasks.map((t) => `<li>
        <span class="mini-main">${esc(t.title)}</span>
        <span class="mini-sub${t.due_date && new Date(t.due_date) < new Date() ? ' is-late' : ''}">
          ${esc(date(t.due_date))} · ${esc(relative(t.due_date))}${t.channel ? ' · ' + esc(t.channel) : ''}</span>
        <span class="mini-side">
          ${avatar(t.profiles, 24)}
          <button type="button" class="btn-ghost btn-xs" data-done="${esc(t.id)}">${icon.check(13)}<span>Done</span></button>
        </span>
      </li>`).join('')}
    </ul>` : empty('No open tasks.', '', { tone: 'ok' }),
    { tight: true, action: `<button type="button" class="btn-ghost btn-xs" data-new-task>${icon.plus(13)}<span>Add</span></button>` });

  /* ── won ───────────────────────────────────────────────────────────────── */

  const wonCard = opp.stage !== 'won' ? '' : card('Project', project
    ? `<p class="co-name"><a class="lnk" href="#/project/${esc(project.id)}">${esc(project.name)}</a></p>
       <p class="co-kind">${projectStatusPill(project.status)}</p>`
    : `<p class="modal-message">This opportunity is won and has no project yet.</p>
       <button type="button" class="btn btn-sm" data-convert>${icon.briefcase(14)}<span>Open a project</span></button>`);

  /* ── activity ──────────────────────────────────────────────────────────── */

  const activityCard = card('Activity', `
    <div class="log-add">
      <button type="button" class="btn-ghost btn-sm" data-log>${icon.note(14)}<span>Log a call, message or note</span></button>
    </div>
    ${timeline(activity)}`, { note: pluralise(activity.length, 'entry', 'entries'), tight: true });

  return `
    <a class="back lnk" href="#/pipeline">${icon.chevron(13)}<span>Back to the pipeline</span></a>
    ${demoStrip}
    ${head}
    <div class="grid grid-opp">
      <div class="col-wide">${job}${activityCard}</div>
      <div class="col-side">${customer}${wonCard}${visitsCard}${quotesCard}${tasksCard}${filesCard(data.files)}</div>
    </div>`;
}

export function mount(root, rerender, { me }) {
  const done = () => rerender();

  root.addEventListener('change', async (e) => {
    const sel = e.target.closest('[data-stage]');
    if (!sel) return;
    const next = sel.value;
    if (next === opp.stage) return;
    /* Won, lost and on hold are decisions with their own data. The dialog
       collects it; the database refuses the move without it. */
    if (decisionFor(next, { opp, onDone: done, onCancel: () => { sel.value = opp.stage; } })) return;
    try {
      await api.setStage(opp.id, next);
      toast(`Moved to ${STAGE[next].name}.`);
      await done();
    } catch (err) {
      toast(err.message || 'That could not be saved.', 'bad');
      sel.value = opp.stage;
    }
  });

  root.addEventListener('click', async (e) => {
    const t = (s) => e.target.closest(s);

    if (t('[data-followup]')) return bookFollowUp({ opp, me, onDone: done });
    if (t('[data-log]'))      return logActivity({ opportunityId: opp.id, contactId: opp.contact_id, me, onDone: done });
    if (t('[data-record-quote]')) return recordQuoteDialog({ opp, quotes: data.quotes, onDone: done });
    if (t('[data-log-followup]')) return followUpDialog({ opp, onDone: done });
    if (t('[data-replied]')) return repliedDialog({ opp, onDone: done });
    if (t('[data-won]'))  return wonDialog({ opp, onDone: done });
    if (t('[data-lost]')) return lostDialog({ opp, onDone: done });
    if (t('[data-hold]')) return holdDialog({ opp, onDone: done });
    const ms = t('[data-mark-sent]');
    if (ms) return markSentDialog({ opp, quote: data.quotes.find((x) => x.id === ms.dataset.markSent), onDone: done });
    if (t('[data-new-visit]'))return visitDialog({ opp, me, onDone: done });
    if (t('[data-new-task]')) return taskDialog({ opp, me, onDone: done });
    /* No onDone: the dialog navigates to the project it just opened. Opening
       a project is a deliberate act, and the first thing anybody does next is
       set it up — leaving them on the enquiry makes them go and find it. */
    if (t('[data-convert]'))  return convertDialog({ opp });

    const q = t('[data-quote]');
    if (q) return quoteDetailDialog({ opp, quote: data.quotes.find((x) => x.id === q.dataset.quote), onDone: done });

    const v = t('[data-visit]');
    if (v) return visitDialog({ opp, visit: data.visits.find((x) => x.id === v.dataset.visit), me, onDone: done });

    const d = t('[data-done]');
    if (d) {
      try { await api.completeTask(d.dataset.done); toast('Task completed.'); await done(); }
      catch (err) { toast(err.message, 'bad'); }
      return;
    }

    if (t('[data-edit-opp]')) {
      const { editOpportunity } = await import('../ui/edit-opportunity.js');
      return editOpportunity({ opp, me, onDone: done });
    }
  });

  mountFiles(root, { opportunity_id: opp.id }, me, done);
}

export function sub() {
  if (!opp) return '';
  return `${esc(opp.company_name || opp.contact_name || '')} · ${esc(opp.service || STAGE[opp.stage].name)}`;
}
