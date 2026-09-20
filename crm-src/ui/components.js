/* ═══════════════════════════════════════════════════════════════════════════
   ui/components.js — the pieces every screen is built from
   ═══════════════════════════════════════════════════════════════════════════

   Plain functions returning HTML strings. No framework, no virtual DOM: a
   screen here is at most a few hundred rows, and `innerHTML` with delegated
   events is both faster to paint and far less to go wrong than a runtime.

   COLOUR IS A STATE SIGNAL

   Only two things are ever coloured by meaning — overdue/lost in red, won/on
   track in green. That pair fails a deuteranopia separation check, which is
   exactly why neither is ever used alone: every status below carries an icon
   and a word as well as a colour, so it survives being printed in grey or
   read by somebody who cannot tell the two hues apart.
   ═══════════════════════════════════════════════════════════════════════════ */

import { esc, initials as mkInitials, money, date, relative, overdueBy, tel, whatsapp, mailto } from '../core/fmt.js';
import { attention, STAGE, SOURCE_LABEL, QUOTE_LABEL, PROJECT_LABEL,
         ACTIVITY_LABEL as ACT_LABEL } from '../core/model.js';
import { icon } from './icons.js';

/* ── containers ───────────────────────────────────────────────────────────── */

export const card = (title, body, { note = '', action = '', tight = false, id = '' } = {}) => `
  <section class="card${tight ? ' card-tight' : ''}"${id ? ` id="${esc(id)}"` : ''}>
    ${title ? `<header class="card-head">
      <h2 class="card-title">${esc(title)}</h2>
      ${note ? `<p class="card-note">${esc(note)}</p>` : ''}
      ${action}
    </header>` : ''}
    ${body}
  </section>`;

export const stat = ({ label, value, unit = '', foot = '', tone = '', href = '' }) => {
  const inner = `
    <p class="stat-label">${esc(label)}</p>
    <p class="stat-value num">${esc(value)}${unit ? `<span class="stat-unit">${esc(unit)}</span>` : ''}</p>
    ${foot ? `<p class="stat-foot">${foot}</p>` : ''}`;
  return href
    ? `<a class="stat${tone ? ' stat-' + tone : ''}" href="${esc(href)}">${inner}
         <span class="stat-go" aria-hidden="true">${icon.arrowRight(15)}</span></a>`
    : `<div class="stat${tone ? ' stat-' + tone : ''}">${inner}</div>`;
};

export const empty = (text, sub = '', { tone = 'ok' } = {}) => `
  <div class="empty">
    <span class="empty-mark empty-${esc(tone)}" aria-hidden="true">${tone === 'ok' ? icon.check(20) : icon.note(20)}</span>
    <p class="empty-text">${esc(text)}</p>
    ${sub ? `<p class="empty-sub">${esc(sub)}</p>` : ''}
  </div>`;

/** Shown while a screen's first request is in flight. */
export const loading = (rows = 3) => `
  <div class="skel" role="status" aria-live="polite">
    <span class="sr-only">Loading…</span>
    ${Array.from({ length: rows }, () => '<span class="skel-row"></span>').join('')}
  </div>`;

/** Shown when it fails. Always with the reason and always with a way back. */
export const errorState = (message, { retry = true } = {}) => `
  <div class="err" role="alert">
    <span class="err-mark" aria-hidden="true">${icon.alert(20)}</span>
    <p class="err-text">${esc(message)}</p>
    ${retry ? '<button type="button" class="btn-ghost btn-sm" data-retry>Try again</button>' : ''}
  </div>`;

export const tableWrap = (inner) => `<div class="tbl-wrap">${inner}</div>`;

/* ── status ───────────────────────────────────────────────────────────────── */

export function attentionPill(opp) {
  const a = attention(opp);
  if (a.level === 'closed') return stagePill(opp.stage);
  if (a.level === 'clear') return `<span class="pill pill-quiet">${esc(a.label)}</span>`;
  const ic = { overdue: icon.alert(13), unbooked: icon.alert(13), today: icon.clock(13), soon: icon.clock(13) }[a.level];
  return `<span class="pill pill-${esc(a.level)}">${ic}${esc(a.label)}</span>`;
}

export const stagePill = (stage) =>
  stage === 'won'  ? `<span class="pill pill-won">${icon.check(13)}Won</span>`
: stage === 'lost' ? `<span class="pill pill-lost">${icon.cross(13)}Lost</span>`
: `<span class="pill pill-quiet">${esc(STAGE[stage]?.name || stage)}</span>`;

export const stageChip = (stage) => `
  <span class="stage-chip" data-group="${esc(STAGE[stage]?.group || 'intake')}">
    <i class="stage-dot" aria-hidden="true"></i>${esc(STAGE[stage]?.name || stage)}</span>`;

export const sourceTag = (s) => `<span class="src">${(icon[SRC_ICON[s]] || icon.globe)(13)}${esc(SOURCE_LABEL[s] || s)}</span>`;
const SRC_ICON = { website: 'globe', whatsapp: 'whatsapp', phone: 'phone', email: 'mail', referral: 'users', walk_in: 'pin', other: 'note' };

export const quoteStatusPill = (s) => {
  const tone = s === 'accepted' ? 'won' : (s === 'rejected' || s === 'expired') ? 'lost' : 'quiet';
  const ic = s === 'accepted' ? icon.check(13) : (s === 'rejected' || s === 'expired') ? icon.cross(13) : icon.doc(13);
  return `<span class="pill pill-${tone}">${ic}${esc(QUOTE_LABEL[s] || s)}</span>`;
};

export const projectStatusPill = (s) => {
  const tone = s === 'complete' ? 'won' : s === 'cancelled' ? 'lost' : s === 'on_hold' ? 'today' : 'quiet';
  return `<span class="pill pill-${tone}">${esc(PROJECT_LABEL[s] || s)}</span>`;
};

export const priorityPill = (p) =>
  p === 'urgent' ? `<span class="pill pill-overdue">${icon.alert(13)}Urgent</span>`
: p === 'high'   ? `<span class="pill pill-today">High</span>`
: p === 'low'    ? `<span class="pill pill-quiet">Low</span>` : '';

/* ── people ───────────────────────────────────────────────────────────────── */

export const avatar = (person, size = 26) => person
  ? `<span class="avatar" style="--s:${size}px" title="${esc(person.full_name || '')}">${esc(person.initials || mkInitials(person.full_name))}</span>`
  : `<span class="avatar avatar-none" style="--s:${size}px" title="Unassigned">?</span>`;

/**
 * Call, WhatsApp and email, as links that work on the phone in somebody's
 * pocket. Each one is rendered only when there is actually a number or an
 * address behind it — a dead "WhatsApp" button on a site visit is worse than
 * no button at all.
 */
export function contactActions(c, { text = '', size = 'sm' } = {}) {
  if (!c) return '';
  const out = [];
  if (c.phone) out.push(`<a class="btn-ghost btn-${size}" href="${esc(tel(c.phone))}">${icon.phone(14)}<span>Call</span></a>`);
  const wa = whatsapp(c.whatsapp || c.phone, text);
  if (wa) out.push(`<a class="btn-ghost btn-${size}" href="${esc(wa)}" target="_blank" rel="noopener">${icon.whatsapp(14)}<span>WhatsApp</span></a>`);
  if (c.email) out.push(`<a class="btn-ghost btn-${size}" href="${esc(mailto(c.email))}">${icon.mail(14)}<span>Email</span></a>`);
  return out.join('');
}

/* ── rows ─────────────────────────────────────────────────────────────────── */

/** The opportunity row used by the dashboard, the follow-up queue and search. */
export function oppRow(o, { showStage = true } = {}) {
  return `
    <li class="att">
      <a class="att-link" href="#/opportunity/${esc(o.id)}">
        <span class="att-head">
          <span class="att-title">${esc(o.title)}</span>
          ${attentionPill(o)}
          ${priorityPill(o.priority)}
        </span>
        <span class="att-meta">
          ${esc(o.company_name || o.contact_name || 'No company')} · ${esc(o.ref)}
          ${o.estimated_value ? ` · <span class="num">${esc(money(o.estimated_value, o.currency))}</span>` : ''}
          ${showStage ? ` · ${esc(STAGE[o.stage]?.name || o.stage)}` : ''}
        </span>
        <span class="att-action">
          ${o.next_action
            ? `${icon.arrowRight(14)}<span>${esc(o.next_action)}</span>${o.next_action_due ? `<span class="att-when">${esc(date(o.next_action_due))}</span>` : ''}`
            : `${icon.alert(14)}<span>Nobody has booked a next action</span>`}
        </span>
      </a>
      <span class="att-owner">${avatar(o.owner_name ? { full_name: o.owner_name, initials: o.owner_initials } : null, 28)}</span>
    </li>`;
}

export const feedRow = (a) => `
  <li class="feed-row">
    <span class="feed-ic">${(icon[ACT_ICON[a.kind]] || icon.note)(14)}</span>
    <span class="feed-body">
      ${a.opportunities ? `<a class="feed-link" href="#/opportunity/${esc(a.opportunities.id)}">${esc(a.opportunities.title)}</a>` : ''}
      <span class="feed-text">${esc(a.body)}</span>
    </span>
    <span class="feed-when">${esc(a.profiles?.initials || '—')} · ${esc(relative(a.occurred_at))}</span>
  </li>`;

export const ACT_ICON = {
  enquiry: 'bell', note: 'note', call: 'phone', whatsapp: 'whatsapp', email: 'mail',
  meeting: 'users', site_visit: 'pin', quote: 'doc', stage_change: 'move',
  task: 'clock', file: 'file', won: 'check', lost: 'cross', system: 'refresh'
};

/** The chronological history shown on an opportunity, contact or project. */
export const timeline = (rows) => rows.length ? `
  <ol class="timeline">
    ${rows.map((a) => `
      <li class="tl">
        <span class="tl-ic tl-${esc(a.kind)}">${(icon[ACT_ICON[a.kind]] || icon.note)(14)}</span>
        <span class="tl-body">
          <span class="tl-kind">${esc(ACT_LABEL[a.kind] || a.kind)}</span>
          <span class="tl-text">${esc(a.body)}</span>
          ${a.opportunities ? `<a class="tl-ref" href="#/opportunity/${esc(a.opportunities.id)}">${esc(a.opportunities.ref)} · ${esc(a.opportunities.title)}</a>` : ''}
        </span>
        <span class="tl-when">
          <span class="tl-date num">${esc(date(a.occurred_at))}</span>
          <span class="tl-rel">${esc(relative(a.occurred_at))}${a.profiles?.initials ? ' · ' + esc(a.profiles.initials) : ''}</span>
        </span>
      </li>`).join('')}
  </ol>` : empty('Nothing logged yet.', 'Calls, visits and quotations appear here as they happen.', { tone: 'quiet' });


/* ── the overdue figure, used in three places ─────────────────────────────── */

export const dueCell = (iso) => {
  if (!iso) return '<span class="fu-date fu-none">—</span><span class="fu-rel is-late">not booked</span>';
  const late = overdueBy(iso);
  return `<span class="fu-date num">${esc(date(iso))}</span>
          <span class="fu-rel${late ? ' is-late' : ''}">${esc(late || relative(iso))}</span>`;
};

export { esc, money, date, relative };
