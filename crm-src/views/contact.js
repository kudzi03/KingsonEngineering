/* ═══════════════════════════════════════════════════════════════════════════
   views/contact.js — one person, and everything Kingson has done with them
   ═══════════════════════════════════════════════════════════════════════════
   Enquiries, quotations, visits, files and the whole timeline in one place,
   so the question "what happened with this customer?" has one answer rather
   than four screens.
   ═══════════════════════════════════════════════════════════════════════════ */

import { api } from '../core/api.js';
import { money, date, relative, esc, pluralise, tel, mailto } from '../core/fmt.js';
import {
  card, empty, avatar, timeline, contactActions, attentionPill, quoteStatusPill
} from '../ui/components.js';
import { icon } from '../ui/icons.js';
import { contactDialog, newOpportunity } from '../ui/dialogs.js';
import { filesCard, mountFiles } from './files.js';

export const title = () => person?.full_name || 'Contact';

let person = null;

export async function render(id, { me }) {
  person = await api.contact(id);
  if (!person) return empty('That contact no longer exists.', '', { tone: 'quiet' });

  const [opps, activity, files] = await Promise.all([
    api.opportunities(`contact_id=eq.${id}`),
    api.activityForContact(id),
    api.filesFor('contact_id', id)
  ]);

  const quotes = opps.length
    ? await api.quotes(`opportunity_id=in.(${opps.map((o) => o.id).join(',')})`)
    : [];

  const details = card('Details', `
    <div class="contact">
      ${avatar({ full_name: person.full_name }, 40)}
      <div class="contact-body">
        <p class="contact-name">${esc(person.full_name)}</p>
        ${person.job_title ? `<p class="contact-role">${esc(person.job_title)}</p>` : ''}
        ${person.companies ? `<p class="contact-role">${esc(person.companies.name)}${person.companies.town ? ' · ' + esc(person.companies.town) : ''}</p>` : ''}
        <div class="contact-lines">
          ${person.phone ? `<a class="lnk" href="${esc(tel(person.phone))}">${icon.phone(13)}${esc(person.phone)}</a>` : ''}
          ${person.whatsapp && person.whatsapp !== person.phone ? `<span class="lnk-plain">${icon.whatsapp(13)}${esc(person.whatsapp)}</span>` : ''}
          ${person.email ? `<a class="lnk" href="${esc(mailto(person.email))}">${icon.mail(13)}${esc(person.email)}</a>` : ''}
        </div>
        ${person.preferred_channel ? `<p class="contact-pref">Prefers ${esc(person.preferred_channel)}</p>` : ''}
      </div>
    </div>
    <div class="contact-acts">${contactActions(person, {
      text: `Good day ${person.full_name.split(' ')[0]}, Kingson Engineering here.` })}</div>
    ${person.notes ? `<p class="scope">${esc(person.notes)}</p>` : ''}`,
    { action: `<button type="button" class="btn-ghost btn-xs" data-edit-contact>${icon.edit(13)}<span>Edit</span></button>` });

  const oppsCard = card('Enquiries', opps.length ? `
    <ul class="mini">
      ${opps.map((o) => `<li>
        <a href="#/opportunity/${esc(o.id)}">
          <span class="mini-main">${esc(o.title)} ${attentionPill(o)}</span>
          <span class="mini-sub">${esc(o.ref)} · ${esc(o.stage_name)}${o.estimated_value ? ' · ' + esc(money(o.estimated_value, o.currency)) : ''}</span>
        </a>
        <span class="mini-side">${avatar(o.owner_name ? { full_name: o.owner_name, initials: o.owner_initials } : null, 24)}</span>
      </li>`).join('')}
    </ul>` : empty('No enquiries recorded.', '', { tone: 'quiet' }),
    { tight: true, note: pluralise(opps.length, 'enquiry', 'enquiries'),
      action: `<button type="button" class="btn-ghost btn-xs" data-new-opp-for>${icon.plus(13)}<span>New</span></button>` });

  const quotesCard = card('Quotations', quotes.length ? `
    <ul class="quotes">
      ${quotes.map((q) => `<li class="quote">
        <a class="quote-btn" href="#/opportunity/${esc(q.opportunities?.id || '')}">
          <span class="quote-ref">${esc(q.reference)}</span>
          <span class="quote-val num">${esc(money(q.amount, q.currency))}</span>
          <span class="quote-status">${quoteStatusPill(q.status)}</span>
          <span class="quote-when">${q.sent_on ? 'sent ' + esc(date(q.sent_on)) : 'not issued'}</span>
        </a>
      </li>`).join('')}
    </ul>` : empty('No quotations yet.', '', { tone: 'quiet' }), { tight: true });

  return `
    <a class="back lnk" href="#/contacts">${icon.chevron(13)}<span>Back to contacts</span></a>
    <div class="grid grid-opp">
      <div class="col-wide">${card('History', timeline(activity), { tight: true, note: pluralise(activity.length, 'entry', 'entries') })}</div>
      <div class="col-side">${details}${oppsCard}${quotesCard}${filesCard(files)}</div>
    </div>`;
}

export function mount(root, rerender, { me }) {
  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-edit-contact]')) {
      return contactDialog({ contact: person, onDone: rerender });
    }
    if (e.target.closest('[data-new-opp-for]')) {
      return newOpportunity({ me, contact: person, onDone: rerender });
    }
  });
  mountFiles(root, { contact_id: person.id }, me, rerender);
}

export function sub() {
  if (!person) return '';
  return [person.companies?.name, person.job_title].filter(Boolean).map(esc).join(' · ');
}
