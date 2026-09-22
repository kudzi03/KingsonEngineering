/* ═══════════════════════════════════════════════════════════════════════════
   ui/lifecycle.js — the moves that carry business rules
   ═══════════════════════════════════════════════════════════════════════════

   Record a quotation, mark it sent, log a follow-up, record a reply, and
   decide the job: won, lost or on hold. Each of these is a database function
   (see supabase/migrations/20260922_quote_lifecycle.sql), so the rules — the
   follow-up date, the stage it moves to, the tasks it closes, the line on the
   timeline — hold no matter which screen the button is on. These forms only
   collect what a person knows and hand it over.

   EMAIL
   The CRM does not send email. Until Kingson's own mailbox is connected, a
   quotation is sent from whatever mailbox or phone staff already use, and
   recorded here. Nothing on these forms implies otherwise.
   ═══════════════════════════════════════════════════════════════════════════ */

import { api } from '../core/api.js';
import { today, LOST_REASONS, CHANNELS, oppValue } from '../core/model.js';
import { isoDateTime, fromLocalInput, money, dateFull, esc } from '../core/fmt.js';
import {
  dialog, field, text, textarea, number, dateInput, dateTimeInput, select,
  nul, num, toast, fieldError, after
} from './form.js';

const CURRENCIES = ['USD', 'ZWG', 'ZAR'];

/** The next follow-up date from the central setting, computed by the database. */
async function defaultFollowUp(from = today()) {
  try {
    const s = await api.settings();
    return await api.addWorkingDays(from, s?.quote_followup_working_days ?? 3);
  } catch {
    return '';
  }
}

/* A datetime input holds whole minutes. When the person leaves the default
   ("now") alone, send nothing and let the database stamp the exact instant,
   so the timeline keeps the true order of things done in the same minute. */
const exactUnlessChanged = (value, initial) => (value === initial ? null : fromLocalInput(value));

const manualNote = `
  <p class="modal-message">The CRM does not send email. Send the quotation from your own
    mailbox or WhatsApp as usual, then record it here. The time, the value and your name are
    stamped on the record.</p>`;

/* ── record a quotation ───────────────────────────────────────────────────── */

export function recordQuoteDialog({ opp, quotes = [], onDone }) {
  const next = (quotes.reduce((m, q) => Math.max(m, q.version || 0), 0) || 0) + 1;
  const last = quotes.find((q) => q.version === next - 1);
  dialog({
    title: next > 1 ? `Record revision ${next}` : 'Record the quotation',
    sub: `${opp.ref} — ${opp.title}`,
    width: 580,
    submitLabel: 'Record quotation',
    body: `
      <div class="field-row">
        ${field('amount', 'Quoted amount', number('amount', last?.amount ?? '', 'required min="0" step="0.01"'),
          { hint: 'The figure on the quotation you are sending — not an estimate.' })}
        ${field('currency', 'Currency', select('currency', CURRENCIES, last?.currency || opp.currency || 'USD'))}
      </div>
      <div class="field-row">
        ${field('reference', 'Quotation number', text('reference', '', `placeholder="Leave blank for Q-${esc(String(opp.ref).replace(/\D/g, ''))}-${next}"`),
          { hint: 'Only if your quotation already carries its own number.' })}
        ${field('prepared_on', 'Date on the quotation', dateInput('prepared_on', today()))}
      </div>
      <div class="field-row">
        ${field('valid_until', 'Valid until', dateInput('valid_until', ''))}
        ${field('document_ref', 'Document / where it is filed', text('document_ref', '', 'placeholder="Q-2445-1.pdf in Quotes 2026"'))}
      </div>
      ${field('notes', next > 1 ? 'What changed in this revision' : 'Notes', textarea('notes', '', 2,
        next > 1 ? 'placeholder="Roof sheeting changed to IBR 0.47"' : ''), { wide: true })}
      <p class="modal-message">Recorded as a draft. Use <strong>Mark as sent</strong> once it has
        actually gone to the customer — that is what starts the follow-up clock.</p>`,
    onSubmit: async (v) => {
      const amount = num(v.amount);
      if (amount === null || Number.isNaN(amount)) throw fieldError('amount', 'Enter the quoted amount.');
      if (amount < 0) throw fieldError('amount', 'That cannot be negative.');
      const q = await api.recordQuote(opp.id, {
        amount, currency: v.currency, preparedOn: nul(v.prepared_on), validUntil: nul(v.valid_until),
        notes: nul(v.notes), reference: nul(v.reference), documentRef: nul(v.document_ref)
      });
      toast(`Quotation ${q?.reference || ''} recorded.`);
      after(onDone, q);
    }
  });
}

/* ── mark a quotation as sent ─────────────────────────────────────────────── */

export async function markSentDialog({ opp, quote, onDone }) {
  const fu = await defaultFollowUp();
  const now = isoDateTime(new Date());
  dialog({
    title: `Mark ${quote.reference} as sent`,
    sub: `${money(quote.amount, quote.currency)} · ${opp.title}`,
    width: 540,
    submitLabel: 'Mark as sent',
    body: `
      <div class="field-row">
        ${field('sent_at', 'Sent', dateTimeInput('sent_at', now, 'required'))}
        ${field('channel', 'How', select('channel', [
          ['email', 'Email'], ['whatsapp', 'WhatsApp'], ['hand', 'By hand'], ['meeting', 'At a meeting'], ['other', 'Other']
        ], 'email'))}
      </div>
      ${field('follow_up_on', 'Follow up on', dateInput('follow_up_on', fu, 'required'),
        { hint: 'Worked out from the working-day rule in Settings. Change it if the customer gave you a date.' })}
      ${field('notes', 'Notes', textarea('notes', '', 2, 'placeholder="Sent to Tendai and copied to accounts"'), { wide: true })}
      ${manualNote}`,
    onSubmit: async (v) => {
      if (!v.sent_at) throw fieldError('sent_at', 'When did it go?');
      const sentAt = exactUnlessChanged(v.sent_at, now);
      if (sentAt && Date.parse(sentAt) > Date.now() + 5 * 60e3) throw fieldError('sent_at', 'That is in the future.');
      await api.markQuoteSent(quote.id, {
        sentAt, followUpOn: nul(v.follow_up_on), channel: v.channel, notes: nul(v.notes)
      });
      toast(`${quote.reference} marked sent. Follow-up booked.`);
      after(onDone);
    }
  });
}

/* ── quotation detail ─────────────────────────────────────────────────────── */

export function quoteDetailDialog({ opp, quote, onDone }) {
  const draft = quote.status === 'draft';
  dialog({
    title: `Quotation ${quote.reference}`,
    sub: `${opp?.title || ''}${quote.version > 1 ? ` · revision ${quote.version}` : ''}`,
    width: 540,
    submitLabel: 'Save',
    body: `
      <dl class="kv">
        <div><dt>Amount</dt><dd class="num">${esc(money(quote.amount, quote.currency))}</dd></div>
        <div><dt>Prepared</dt><dd>${esc(dateFull(quote.prepared_on))}</dd></div>
        <div><dt>Sent</dt><dd>${quote.sent_at
          ? esc(new Date(quote.sent_at).toLocaleString('en-GB', { timeZone: 'Africa/Harare', dateStyle: 'medium', timeStyle: 'short' }))
            + (quote.profiles?.full_name ? ' · ' + esc(quote.profiles.full_name) : '')
          : 'Not sent'}</dd></div>
        <div><dt>Follow up</dt><dd>${esc(dateFull(quote.follow_up_on))}</dd></div>
      </dl>
      ${draft ? field('amount', 'Correct the amount', number('amount', quote.amount, 'min="0" step="0.01"'),
        { hint: 'Only while it is a draft. Once sent, a change is a new revision.' }) : ''}
      <div class="field-row">
        ${field('valid_until', 'Valid until', dateInput('valid_until', quote.valid_until || ''))}
        ${field('document_ref', 'Document / where it is filed', text('document_ref', quote.document_ref || ''))}
      </div>
      ${field('notes', 'Notes', textarea('notes', quote.notes || '', 3), { wide: true })}`,
    onSubmit: async (v) => {
      const patch = { valid_until: nul(v.valid_until), document_ref: nul(v.document_ref), notes: nul(v.notes) };
      if (draft) {
        const amount = num(v.amount);
        if (amount === null || Number.isNaN(amount) || amount < 0) throw fieldError('amount', 'Enter a valid amount.');
        patch.amount = amount;
      }
      await api.updateQuote(quote.id, patch);
      toast('Quotation saved.');
      after(onDone);
    }
  });
}

/* ── log a follow-up ──────────────────────────────────────────────────────── */

export async function followUpDialog({ opp, onDone }) {
  const fu = await defaultFollowUp();
  const now = isoDateTime(new Date());
  dialog({
    title: 'Log a follow-up',
    sub: `${opp.ref} — ${opp.title}`,
    width: 560,
    submitLabel: 'Log follow-up',
    body: `
      <div class="field-row">
        ${field('channel', 'How', select('channel', CHANNELS, 'phone'))}
        ${field('at', 'When', dateTimeInput('at', now))}
      </div>
      ${field('notes', 'What happened', textarea('notes', '', 3, 'required placeholder="Spoke to Tendai. Board meets Thursday."'), { wide: true })}
      <div class="field-row">
        ${field('next_action', 'Next action', text('next_action', opp.next_action || '', 'placeholder="Follow up quotation"'))}
        ${field('next_due', 'Next follow-up', dateInput('next_due', fu, 'required'))}
      </div>
      <p class="modal-message">If the customer answered, use <strong>Customer replied</strong>
        instead — that stops the chase and puts the next move on us.</p>`,
    onSubmit: async (v) => {
      if (!v.notes) throw fieldError('notes', 'Say what happened.');
      if (!v.next_due) throw fieldError('next_due', 'Give the next date.');
      await api.logFollowUp(opp.id, {
        channel: v.channel, notes: v.notes, at: exactUnlessChanged(v.at, now),
        nextAction: nul(v.next_action), nextDue: v.next_due
      });
      toast('Follow-up logged.');
      after(onDone);
    }
  });
}

/* ── customer replied ─────────────────────────────────────────────────────── */

export function repliedDialog({ opp, onDone }) {
  const now = isoDateTime(new Date());
  dialog({
    title: 'Customer replied',
    sub: `${opp.ref} — ${opp.title}`,
    width: 520,
    submitLabel: 'Record reply',
    body: `
      <div class="field-row">
        ${field('channel', 'How', select('channel', CHANNELS, 'whatsapp'))}
        ${field('at', 'When', dateTimeInput('at', now))}
      </div>
      ${field('notes', 'What they said', textarea('notes', '', 3, 'placeholder="Happy with the scope, asking about payment terms"'), { wide: true })}
      <p class="modal-message">Recorded by hand — the CRM cannot see Kingson's inbox. The
        chase stops and the next action becomes "Respond to customer reply", due today.</p>`,
    onSubmit: async (v) => {
      await api.customerReplied(opp.id, { channel: v.channel, notes: nul(v.notes), at: exactUnlessChanged(v.at, now) });
      toast('Reply recorded.');
      after(onDone);
    }
  });
}

/* ── won ──────────────────────────────────────────────────────────────────── */

export function wonDialog({ opp, onDone, onCancel }) {
  const v0 = oppValue(opp);
  dialog({
    title: 'Mark as won',
    sub: `${opp.ref} — ${opp.title}`,
    width: 500,
    submitLabel: 'Mark won',
    body: `
      <div class="field-row">
        ${field('value', `Accepted value (${esc(v0.currency)})`, number('value', v0.amount ?? '', 'required min="0" step="0.01"'),
          { hint: v0.amount != null ? 'Prefilled from the latest quotation. Change it if the customer accepted a different figure.' : 'No quotation is recorded. Enter the value the customer accepted.' })}
        ${field('on', 'Decided on', dateInput('on', today()))}
      </div>
      ${field('notes', 'Notes', textarea('notes', '', 2, 'placeholder="Order number, deposit terms"'), { wide: true })}
      <p class="modal-message">Follow-ups stop. The latest quotation is marked accepted.</p>`,
    onSubmit: async (v) => {
      const value = num(v.value);
      if (value === null || Number.isNaN(value)) throw fieldError('value', 'Enter the accepted value.');
      if (value < 0) throw fieldError('value', 'That cannot be negative.');
      await api.decide(opp.id, 'won', { value, on: nul(v.on), notes: nul(v.notes) });
      toast('Marked won.');
      after(onDone);
    }
  });
  watchCancel(onCancel);
}

/* ── lost ─────────────────────────────────────────────────────────────────── */

export function lostDialog({ opp, onDone, onCancel }) {
  dialog({
    title: 'Mark as lost',
    sub: `${opp.ref} — ${opp.title}`,
    width: 500,
    submitLabel: 'Mark lost',
    body: `
      <div class="field-row">
        ${field('reason', 'Why', select('reason', [['', 'Choose…'], ...LOST_REASONS], ''))}
        ${field('on', 'Decided on', dateInput('on', today()))}
      </div>
      ${field('notes', 'Notes', textarea('notes', '', 3, 'placeholder="Competitor came in 14% lower"'),
        { wide: true, hint: 'Required for "Other". This is what somebody reads back in six months.' })}
      <p class="modal-message">Follow-ups stop and open tasks on this job are cancelled.</p>`,
    onSubmit: async (v) => {
      if (!v.reason) throw fieldError('reason', 'Choose a reason.');
      if (v.reason === 'other' && !v.notes) throw fieldError('notes', 'Say why.');
      await api.decide(opp.id, 'lost', { reason: v.reason, on: nul(v.on), notes: nul(v.notes) });
      toast('Marked lost.');
      after(onDone);
    }
  });
  watchCancel(onCancel);
}

/* ── on hold ──────────────────────────────────────────────────────────────── */

export function holdDialog({ opp, onDone, onCancel }) {
  dialog({
    title: 'Put on hold',
    sub: `${opp.ref} — ${opp.title}`,
    width: 500,
    submitLabel: 'Put on hold',
    body: `
      ${field('reason', 'Why', text('reason', '', 'required placeholder="Waiting for funding approval"'), { wide: true })}
      ${field('review_on', 'Review on', dateInput('review_on', '', 'required'),
        { hint: 'It comes back onto the follow-up list on this date.' })}
      ${field('notes', 'Notes', textarea('notes', '', 2), { wide: true })}
      <p class="modal-message">Everything on the record is kept. Nothing is chased until the review date.</p>`,
    onSubmit: async (v) => {
      if (!v.reason) throw fieldError('reason', 'Give a reason.');
      if (!v.review_on) throw fieldError('review_on', 'Choose a review date.');
      if (v.review_on < today()) throw fieldError('review_on', 'That date has passed.');
      await api.decide(opp.id, 'on_hold', { reason: v.reason, reviewOn: v.review_on, notes: nul(v.notes) });
      toast('On hold.');
      after(onDone);
    }
  });
  watchCancel(onCancel);
}

/** Route a stage choice to the dialog it needs, or return false for a plain move. */
export function decisionFor(stage, { opp, onDone, onCancel }) {
  if (stage === 'won') { wonDialog({ opp, onDone, onCancel }); return true; }
  if (stage === 'lost') { lostDialog({ opp, onDone, onCancel }); return true; }
  if (stage === 'on_hold') { holdDialog({ opp, onDone, onCancel }); return true; }
  return false;
}

/* A select that opened a decision dialog must go back if the dialog is
   abandoned, or the board shows a move that never happened. */
function watchCancel(onCancel) {
  if (typeof onCancel !== 'function') return;
  const host = document.querySelector('.modal');
  if (!host) return;
  /* Called on every close. After a save the refresh that follows redraws
     the control from the database anyway, so resetting it first is harmless. */
  const obs = new MutationObserver(() => {
    if (!document.body.contains(host)) {
      obs.disconnect();
      onCancel();
    }
  });
  obs.observe(document.body, { childList: true });
}
