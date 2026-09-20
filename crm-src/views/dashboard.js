/* ═══════════════════════════════════════════════════════════════════════════
   views/dashboard.js — the ten-second screen
   ═══════════════════════════════════════════════════════════════════════════

   Somebody opens this cold at half past seven and needs to know, before they
   have put their tea down, what is on fire. So the order is:

     1  four figures, one of which is red only when something is wrong
     2  WHAT NEEDS ATTENTION — the actual list, named, owned, dated
     3  today: the visits booked and the calls due
     4  where the money is sitting, by stage
     5  quotations out and how long they have been out
     6  what happened lately

   Nothing here is decorative. Every tile is a link to the list behind it.
   ═══════════════════════════════════════════════════════════════════════════ */

import { api } from '../core/api.js';
import {
  STAGES, STAGE, isOverdue, isDueToday, hasNoNextAction, quoteAtRisk,
  attention, sum, today, daysUntil
} from '../core/model.js';
import { money, moneyShort, date, relative, stamp, esc, pluralise } from '../core/fmt.js';
import {
  card, stat, empty, avatar, oppRow, feedRow, tableWrap, quoteStatusPill, sourceTag
} from '../ui/components.js';
import { icon } from '../ui/icons.js';

export const title = 'Dashboard';

export async function render() {
  const { open, liveQuotes, tasks, visits, recent, decided } = await api.dashboard();

  const overdue  = open.filter(isOverdue);
  const dueToday = open.filter(isDueToday);
  const unbooked = open.filter(hasNoNextAction);
  const newEnq   = open.filter((o) => o.stage === 'new');
  const atRisk   = open.filter(quoteAtRisk);

  const won  = decided.filter((o) => o.stage === 'won');
  const lost = decided.filter((o) => o.stage === 'lost');
  const rate = (won.length + lost.length)
    ? Math.round((won.length / (won.length + lost.length)) * 100) : 0;

  const tasksToday = tasks.filter((t) => t.due_date && daysUntil(t.due_date) <= 0);
  const visitsSoon = visits.filter((v) => {
    const d = daysUntil(v.scheduled_at);
    return d !== null && d >= 0 && d <= 7;
  });

  /* ── the four figures ──────────────────────────────────────────────────── */

  const tiles = `
    <div class="stats">
      ${stat({
        label: 'Open opportunities', value: String(open.length),
        foot: `<span class="num">${esc(money(sum(open, (o) => o.estimated_value)))}</span> in the pipeline`,
        href: '#/pipeline'
      })}
      ${stat({
        label: 'New enquiries', value: String(newEnq.length),
        tone: newEnq.length ? 'warn' : '',
        foot: newEnq.length ? 'Not yet responded to' : 'All answered',
        href: '#/pipeline'
      })}
      ${stat({
        label: 'Overdue follow-ups', value: String(overdue.length),
        tone: overdue.length ? 'danger' : '',
        foot: overdue.length
          ? `<span class="num">${esc(money(sum(overdue, (o) => o.estimated_value)))}</span> at risk of going quiet`
          : 'Nothing past its date',
        href: '#/followups'
      })}
      ${stat({
        label: 'Quotes awaiting a decision', value: String(liveQuotes.length),
        foot: liveQuotes.length
          ? `<span class="num">${esc(money(sum(liveQuotes, (q) => q.amount)))}</span> out`
          : 'None out at the moment',
        href: '#/quotes'
      })}
    </div>`;

  /* ── what needs attention ──────────────────────────────────────────────── */

  const needs = [...overdue, ...unbooked, ...dueToday, ...newEnq]
    .filter((o, i, a) => a.findIndex((x) => x.id === o.id) === i)
    .sort((a, b) => attention(b).sort - attention(a).sort)
    .slice(0, 12);

  const attentionCard = card('Needs attention',
    needs.length
      ? `<ul class="att-list">${needs.map((o) => oppRow(o)).join('')}</ul>`
      : empty('Nothing is overdue and nothing is unbooked.',
              'Every open opportunity has a next action with a date on it.'),
    { note: 'Overdue, unbooked, due today or unanswered — in any stage', tight: true });

  /* ── today ─────────────────────────────────────────────────────────────── */

  const todayCard = card('Today and the week ahead', `
    <div class="two-up">
      <div>
        <p class="sub-h">${icon.pin(14)} Site visits</p>
        ${visitsSoon.length ? `<ul class="mini">${visitsSoon.slice(0, 5).map((v) => `
          <li><a href="#/opportunity/${esc(v.opportunities?.id || '')}">
            <span class="mini-main">${esc(v.opportunities?.title || 'Visit')}</span>
            <span class="mini-sub">${esc(stamp(v.scheduled_at))}${v.location ? ' · ' + esc(v.location) : ''}</span>
          </a><span class="mini-side">${avatar(v.profiles, 24)}</span></li>`).join('')}</ul>`
          : '<p class="mini-none">No visits booked in the next seven days.</p>'}
      </div>
      <div>
        <p class="sub-h">${icon.clock(14)} Calls and follow-ups due</p>
        ${tasksToday.length ? `<ul class="mini">${tasksToday.slice(0, 5).map((t) => `
          <li><a href="${t.opportunities ? '#/opportunity/' + esc(t.opportunities.id) : '#/tasks'}">
            <span class="mini-main">${esc(t.title)}</span>
            <span class="mini-sub${daysUntil(t.due_date) < 0 ? ' is-late' : ''}">${esc(relative(t.due_date))}${t.channel ? ' · ' + esc(t.channel) : ''}</span>
          </a><span class="mini-side">${avatar(t.profiles, 24)}</span></li>`).join('')}</ul>`
          : '<p class="mini-none">Nothing due today.</p>'}
      </div>
    </div>`, { note: `${pluralise(visitsSoon.length, 'visit')} · ${pluralise(tasksToday.length, 'task')}` });

  /* ── where the money is sitting ────────────────────────────────────────── */

  const byStage = STAGES.filter((s) => s.open).map((s) => {
    const rows = open.filter((o) => o.stage === s.id);
    return { s, n: rows.length, value: sum(rows, (o) => o.estimated_value) };
  });
  const peak = Math.max(1, ...byStage.map((b) => b.value));

  /* One hue, sorted by the pipeline's own order rather than by size: the
     reader is looking for a bulge in a known sequence, and eight categorical
     colours could not be told apart by anybody. Values are direct-labelled so
     the chart reads with no axis and no colour at all. */
  const funnel = card('Pipeline by stage', `
    <ul class="funnel">
      ${byStage.map((b) => `
        <li class="funnel-row${b.n ? '' : ' is-empty'}">
          <a class="funnel-label" href="#/pipeline">${esc(b.s.name)}</a>
          <span class="funnel-track"><span class="funnel-bar" style="--w:${((b.value / peak) * 100).toFixed(1)}%"></span></span>
          <span class="funnel-n num">${b.n || '—'}</span>
          <span class="funnel-v num">${b.value ? esc(moneyShort(b.value)) : '—'}</span>
        </li>`).join('')}
    </ul>
    <p class="funnel-key">Bar length is value. The number beside it is the count.</p>`,
    { note: 'Open stages only' });

  const decidedCard = card('Decided', `
    <div class="won-lost">
      <div><p class="wl-n num">${won.length}</p><p class="wl-l">${icon.check(13)} Won</p>
        <p class="wl-v num">${esc(money(sum(won, (o) => o.estimated_value)))}</p></div>
      <div><p class="wl-n num">${lost.length}</p><p class="wl-l">${icon.cross(13)} Lost</p>
        <p class="wl-v num">${esc(money(sum(lost, (o) => o.estimated_value)))}</p></div>
      <div><p class="wl-n num">${rate}%</p><p class="wl-l">Win rate</p>
        <p class="wl-v">of ${won.length + lost.length} decided</p></div>
    </div>`, { note: 'Every decided opportunity on record' });

  /* ── quotations out ────────────────────────────────────────────────────── */

  const quotesCard = card('Quotations awaiting a decision', liveQuotes.length ? tableWrap(`
    <table class="tbl">
      <thead><tr>
        <th scope="col">Quotation</th><th scope="col">Opportunity</th>
        <th scope="col" class="ta-r">Amount</th><th scope="col">Sent</th><th scope="col">Chase</th>
      </tr></thead>
      <tbody>
        ${liveQuotes.map((qt) => {
          const o = qt.opportunities;
          const risk = o && !o.next_action_due;
          return `<tr${risk ? ' class="tr-risk"' : ''}>
            <td><a class="lnk" href="#/opportunity/${esc(o?.id || '')}">${esc(qt.reference)}${qt.version > 1 ? ` <span class="rev">rev ${qt.version}</span>` : ''}</a></td>
            <td><span class="td-main">${esc(o?.title || '—')}</span><span class="td-sub">${esc(o?.companies?.name || '')}</span></td>
            <td class="ta-r num">${esc(money(qt.amount, qt.currency))}</td>
            <td><span class="td-main num">${esc(date(qt.sent_on))}</span><span class="td-sub">${esc(relative(qt.sent_on))}</span></td>
            <td>${risk
              ? `<span class="pill pill-overdue">${icon.alert(13)}No chase booked</span>`
              : `<span class="pill pill-quiet">${esc(date(o?.next_action_due))}</span>`}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`) : empty('No quotations are out.'),
    { note: atRisk.length ? `${pluralise(atRisk.length, 'quotation')} with no follow-up booked` : 'All of them have a chase date' });

  /* ── where enquiries come from ─────────────────────────────────────────── */

  const bySource = {};
  for (const o of open) bySource[o.source] = (bySource[o.source] || 0) + 1;
  const sourceCard = card('Where enquiries arrive', Object.keys(bySource).length ? `
    <ul class="srcs">
      ${Object.entries(bySource).sort((a, b) => b[1] - a[1]).map(([k, v]) =>
        `<li class="srcs-row">${sourceTag(k)}<span class="srcs-n num">${v}</span></li>`).join('')}
    </ul>
    <p class="funnel-key">Open opportunities only. The website writes straight into this pipeline.</p>`
    : empty('No open enquiries yet.', '', { tone: 'quiet' }), { tight: true });

  const activityCard = card('Recent activity',
    recent.length ? `<ul class="feed">${recent.map(feedRow).join('')}</ul>`
                  : empty('Nothing logged yet.', '', { tone: 'quiet' }), { tight: true });

  return `
    ${tiles}
    <div class="grid grid-main">
      <div class="col-wide">${attentionCard}${todayCard}${quotesCard}</div>
      <div class="col-side">${funnel}${decidedCard}${sourceCard}${activityCard}</div>
    </div>`;
}

export function sub() {
  return `<span class="sub-quiet">${esc(date(today()))}</span>`;
}
