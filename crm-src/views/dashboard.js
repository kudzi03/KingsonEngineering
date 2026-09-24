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
  STAGES, isOverdue, isDueToday, hasNoNextAction, quoteAtRisk,
  attention, today, daysUntil, sumValues, addDays, SOURCE_LABEL, LOST_REASONS
} from '../core/model.js';
import { money, moneyBy, moneyByShort, date, relative, stamp, esc, pluralise } from '../core/fmt.js';
import {
  card, stat, empty, avatar, oppRow, feedRow, tableWrap, quoteStatusPill, sourceTag
} from '../ui/components.js';
import { icon } from '../ui/icons.js';

export const title = 'Dashboard';

export async function render() {
  const { metrics: m, open, liveQuotes, tasks, visits, recent } = await api.dashboard();

  const overdue  = open.filter(isOverdue);
  const dueToday = open.filter(isDueToday);
  const unbooked = open.filter(hasNoNextAction);
  const newEnq   = open.filter((o) => o.stage === 'new');
  const atRisk   = open.filter(quoteAtRisk);

  const decidedN = m.won_count + m.lost_count;
  const rate = decidedN ? Math.round((m.won_count / decidedN) * 100) : null;

  const tasksToday = tasks.filter((t) => t.due_date && daysUntil(t.due_date) <= 0);
  const visitsSoon = visits.filter((v) => {
    const d = daysUntil(v.scheduled_at);
    return d !== null && d >= 0 && d <= 7;
  });

  /* ── the four figures ──────────────────────────────────────────────────
     All from dashboard_metrics(), which sums only recorded quotation and
     won values, per currency. A job with no quotation is counted as "not
     quoted yet" and never added in as zero. */

  const tiles = `
    <div class="stats">
      ${stat({
        label: 'Open enquiries', value: String(m.open_count),
        foot: m.quoted_pipeline_count
          ? `<span class="num">${esc(moneyBy(m.quoted_pipeline))}</span> quoted and awaiting a decision`
          : '<span class="dim">No quotation out</span>',
        href: '#/pipeline'
      })}
      ${stat({
        label: 'Not quoted yet', value: String(m.unquoted_count),
        tone: m.unquoted_count ? 'warn' : '',
        foot: m.unquoted_count ? 'Open, with no quotation recorded'
          : m.open_count ? 'Every open job has a quotation' : 'No open jobs',
        href: '#/pipeline'
      })}
      ${stat({
        label: 'Follow-ups due', value: String(m.follow_ups_due_count),
        tone: m.overdue_count ? 'danger' : '',
        foot: m.overdue_count
          ? `${esc(pluralise(m.overdue_count, 'overdue'))}${m.overdue_quoted_count
              ? ` · <span class="num">${esc(moneyBy(m.overdue_quoted_value))}</span> quoted value overdue` : ''}`
          : m.follow_ups_due_count ? 'Due today, none overdue' : 'Nothing past its date',
        href: '#/followups'
      })}
      ${stat({
        label: 'Quotes awaiting a decision', value: String(m.awaiting_decision_count),
        foot: m.quoted_pipeline_count
          ? `<span class="num">${esc(moneyBy(m.quoted_pipeline))}</span> out`
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
              'Every open enquiry has a next action with a date on it.'),
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
    const v = sumValues(rows);
    return { s, n: rows.length, value: v.by.USD || 0, label: moneyByShort(v.by) };
  });
  const peak = Math.max(1, ...byStage.map((b) => b.value));

  /* One hue, sorted by the pipeline's own order rather than by size: the
     reader is looking for a bulge in a known sequence, and eight categorical
     colours could not be told apart by anybody. Values are direct-labelled so
     the chart reads with no axis and no colour at all. */
  const funnel = card('Open enquiries by stage', `
    <ul class="funnel">
      ${byStage.map((b) => `
        <li class="funnel-row${b.n ? '' : ' is-empty'}">
          <a class="funnel-label" href="#/pipeline">${esc(b.s.name)}</a>
          <span class="funnel-track"><span class="funnel-bar" style="--w:${((b.value / peak) * 100).toFixed(1)}%"></span></span>
          <span class="funnel-n num">${b.n || '—'}</span>
          <span class="funnel-v num">${b.label ? esc(b.label) : '—'}</span>
        </li>`).join('')}
    </ul>
    <p class="funnel-key">Bar length is quoted value (USD). The number beside it is the count, quoted or not.</p>`,
    { note: 'Open stages only' });

  const decidedCard = card('Decided', `
    <div class="won-lost">
      <div><p class="wl-n num">${m.won_count}</p><p class="wl-l">${icon.check(13)} Won</p>
        <p class="wl-v num">${esc(moneyBy(m.won_value))}</p></div>
      <div><p class="wl-n num">${m.lost_count}</p><p class="wl-l">${icon.cross(13)} Lost</p>
        <p class="wl-v">&nbsp;</p></div>
      <div><p class="wl-n num">${rate === null ? '—' : rate + '%'}</p><p class="wl-l">Win rate</p>
        <p class="wl-v">of ${decidedN} decided</p></div>
    </div>
    <p class="funnel-key">Won this month: <span class="num">${esc(moneyBy(m.won_value_this_month, { empty: 'nothing yet' }))}</span>${m.on_hold_count ? ` · ${esc(pluralise(m.on_hold_count, 'job'))} on hold` : ''}</p>`,
    { note: 'Accepted values, as recorded when each job was won' });

  /* ── quotations out ────────────────────────────────────────────────────── */

  const quotesCard = card('Quotations awaiting a decision', liveQuotes.length ? tableWrap(`
    <table class="tbl">
      <thead><tr>
        <th scope="col">Quotation</th><th scope="col">Enquiry</th>
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
              : daysUntil(o?.next_action_due) < 0
                ? `<span class="pill pill-overdue">${icon.alert(13)}${esc(date(o?.next_action_due))}</span>`
                : `<span class="pill pill-quiet">${esc(date(o?.next_action_due))}</span>`}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`) : empty('No quotations are out.'),
    { note: atRisk.length ? `${pluralise(atRisk.length, 'quotation')} overdue for a follow-up` : 'Every one has a follow-up booked' });

  /* ── where enquiries come from ─────────────────────────────────────────── */

  const bySource = {};
  for (const o of open) bySource[o.source] = (bySource[o.source] || 0) + 1;
  const sourceCard = card('Where enquiries arrive', Object.keys(bySource).length ? `
    <ul class="srcs">
      ${Object.entries(bySource).sort((a, b) => b[1] - a[1]).map(([k, v]) =>
        `<li class="srcs-row">${sourceTag(k)}<span class="srcs-n num">${v}</span></li>`).join('')}
    </ul>
    <p class="funnel-key">Open enquiries only. Website enquiries arrive here by themselves.</p>`
    : empty('No open enquiries yet.', '', { tone: 'quiet' }));

  const activityCard = card('Recent activity',
    recent.length ? `<ul class="feed">${recent.map(feedRow).join('')}</ul>`
                  : empty('Nothing logged yet.', '', { tone: 'quiet' }), { tight: true });

  return `
    ${tiles}
    <div class="grid grid-main">
      <div class="col-wide">${attentionCard}${todayCard}${quotesCard}${mgmtShell()}</div>
      <div class="col-side">${funnel}${decidedCard}${sourceCard}${activityCard}</div>
    </div>`;
}

/* ── management summary ──────────────────────────────────────────────────
   Counted in the database (management_summary) for a date range, so it is
   the same figure whoever asks and however many enquiries there are. It is
   loaded after the rest of the screen: the morning list must never wait for
   a report. */

const LOST_LABEL = Object.fromEntries(LOST_REASONS);
const PERIODS = {
  week:  { label: 'Last 7 days',  from: () => addDays(today(), -6) },
  month: { label: 'This month',   from: () => today().slice(0, 8) + '01' },
  q:     { label: 'Last 90 days', from: () => addDays(today(), -89) }
};
let period = 'month';

const mgmtShell = () => card('How the business is doing', `
    <div class="period-tabs" role="group" aria-label="Period">
      ${Object.entries(PERIODS).map(([k, p]) =>
        `<button type="button" data-period="${k}" aria-pressed="${k === period}">${esc(p.label)}</button>`).join('')}
    </div>
    <div data-mgmt aria-live="polite"><p class="mini-none">Counting…</p></div>`,
  { note: 'Demonstration records are left out' });

const tally = (obj, label = (k) => k) => {
  const rows = Object.entries(obj || {}).sort((a, b) => b[1] - a[1]);
  return rows.length ? `<ul class="mgmt-list">${rows.map(([k, n]) =>
    `<li><span>${esc(label(k))}</span><span class="num">${n}</span></li>`).join('')}</ul>`
    : '<p class="mini-none">None</p>';
};

function mgmtHtml(r) {
  const hrs = r.avg_hours_to_first_response;
  const fig = (v, l) => `<div class="mgmt-fig"><b class="num">${v}</b><span>${l}</span></div>`;
  return `
    <div class="mgmt-grid" style="margin-top:12px">
      ${fig(r.enquiries, 'enquiries received')}
      ${fig(r.quotes_sent, `quotations sent · <span class="num">${esc(moneyBy(r.quoted_value, { empty: '—' }))}</span>`)}
      ${fig(r.won, `won · <span class="num">${esc(moneyBy(r.won_value, { empty: '—' }))}</span>`)}
      ${fig(r.lost, 'lost')}
      ${fig(r.win_rate_quoted == null ? '—' : r.win_rate_quoted + '%', 'win rate of quoted jobs decided')}
      ${fig(hrs == null ? '—' : hrs < 48 ? hrs + ' h' : (hrs / 24).toFixed(1) + ' days', 'average time to first response')}
      ${fig(r.avg_days_to_quote == null ? '—' : r.avg_days_to_quote + ' days', 'average time to a quotation')}
    </div>
    <div class="mgmt-cols">
      <div><p class="mgmt-h">Where they came from</p>${tally(r.by_source, (k) => SOURCE_LABEL[k] || k)}</div>
      <div><p class="mgmt-h">What they asked for</p>${tally(r.by_service)}</div>
      <div><p class="mgmt-h">Why jobs were lost</p>${tally(r.lost_reasons, (k) => LOST_LABEL[k] || k)}</div>
    </div>`;
}

async function loadMgmt(root) {
  const host = root.querySelector('[data-mgmt]');
  if (!host) return;
  const mine = period;
  try {
    const r = await api.managementSummary(PERIODS[period].from(), today());
    if (mine === period) host.innerHTML = mgmtHtml(r);
  } catch {
    host.innerHTML = '<p class="mini-none">The summary is not available yet. It needs the 2026-09-25 database update.</p>';
  }
}

export function mount(root) {
  loadMgmt(root);
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-period]');
    if (!b || b.dataset.period === period) return;
    period = b.dataset.period;
    root.querySelectorAll('[data-period]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    loadMgmt(root);
  });
}

export function sub() {
  return `<span class="sub-quiet">${esc(date(today()))}</span>`;
}
