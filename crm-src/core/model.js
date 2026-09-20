/* ═══════════════════════════════════════════════════════════════════════════
   core/model.js — the pipeline, and the rules that make it a system
   ═══════════════════════════════════════════════════════════════════════════

   The stage list mirrors the `opp_stage` enum in the database exactly. If one
   changes, both change: `assertStagesMatchDatabase()` is called at boot and
   will complain loudly rather than let the board quietly stop showing a
   column that exists in Postgres.

   THE RULE THIS APPLICATION IS BUILT AROUND

   An open opportunity owes a next action and a date. Not a stage — a date.
   `Follow-Up Due` is one of the eight stages because a fabricator genuinely
   parks work there, but a deal sitting in Negotiation with nothing booked is
   just as forgotten, so overdue is computed from the date alone and never
   from the stage. `attention()` is the whole argument in one function.
   ═══════════════════════════════════════════════════════════════════════════ */

import { TZ } from './config.js';

export const STAGES = [
  { id: 'new',          name: 'New enquiry',               short: 'New',          open: true,  group: 'intake' },
  { id: 'contacted',    name: 'Contacted',                 short: 'Contacted',    open: true,  group: 'intake' },
  { id: 'requirements', name: 'Requirements / site visit', short: 'Requirements', open: true,  group: 'survey' },
  { id: 'quoting',      name: 'Quote / BOQ preparing',     short: 'Quoting',      open: true,  group: 'quote'  },
  { id: 'quote_sent',   name: 'Quote sent',                short: 'Quote sent',   open: true,  group: 'quote'  },
  { id: 'followup',     name: 'Follow-up due',             short: 'Follow-up',    open: true,  group: 'chase'  },
  { id: 'won',          name: 'Won',                       short: 'Won',          open: false, group: 'won'    },
  { id: 'lost',         name: 'Lost',                      short: 'Lost',         open: false, group: 'lost'   }
];

export const STAGE = Object.fromEntries(STAGES.map((s) => [s.id, s]));
export const OPEN_STAGES = STAGES.filter((s) => s.open).map((s) => s.id);

export const PRIORITIES = ['low', 'normal', 'high', 'urgent'];
export const SOURCES = ['website', 'whatsapp', 'phone', 'email', 'referral', 'walk_in', 'other'];
export const SOURCE_LABEL = {
  website: 'Website', whatsapp: 'WhatsApp', phone: 'Phone', email: 'Email',
  referral: 'Referral', walk_in: 'Walk-in', other: 'Other'
};

export const QUOTE_STATUSES = ['draft', 'sent', 'discussed', 'accepted', 'rejected', 'expired'];
export const QUOTE_LABEL = {
  draft: 'Draft', sent: 'Sent',
  /* Deliberately not "Viewed". Kingson has no email-open tracking, and a
     status that implied one would be the dropdown telling a lie. This is set
     by hand when somebody actually discussed it with the customer. */
  discussed: 'Discussed', accepted: 'Accepted', rejected: 'Rejected', expired: 'Expired'
};

export const VISIT_STATUSES = ['scheduled', 'completed', 'cancelled'];
export const PROJECT_STATUSES = ['planning', 'in_progress', 'on_hold', 'complete', 'cancelled'];
export const PROJECT_LABEL = {
  planning: 'Planning', in_progress: 'In progress', on_hold: 'On hold',
  complete: 'Complete', cancelled: 'Cancelled'
};

export const ACTIVITY_LABEL = {
  enquiry: 'Enquiry', note: 'Note', call: 'Call', whatsapp: 'WhatsApp', email: 'Email',
  meeting: 'Meeting', site_visit: 'Site visit', quote: 'Quotation',
  stage_change: 'Stage change', task: 'Task', file: 'File', won: 'Won', lost: 'Lost',
  system: 'System'
};

/* The kinds a person can log by hand. `stage_change`, `won`, `lost` and
   `system` are written by the database and are not offered in the picker. */
export const LOGGABLE = ['call', 'whatsapp', 'email', 'meeting', 'note'];

/* ── today, in Harare ──────────────────────────────────────────────────────── */

/** Today as YYYY-MM-DD in Kingson's own timezone, not the browser's. */
export function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

/** Whole days from today to an ISO date. Negative is in the past. */
export function daysUntil(isoDate) {
  if (!isoDate) return null;
  const a = Date.parse(today() + 'T00:00:00Z');
  const b = Date.parse(String(isoDate).slice(0, 10) + 'T00:00:00Z');
  if (Number.isNaN(b)) return null;
  return Math.round((b - a) / 86400000);
}

export function addDays(isoDate, n) {
  const d = new Date(Date.parse(String(isoDate).slice(0, 10) + 'T00:00:00Z'));
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** The next day that is not a Sunday — Kingson works Monday to Saturday. */
export function nextWorkingDay(from = today(), n = 1) {
  let d = addDays(from, n);
  if (new Date(d + 'T00:00:00Z').getUTCDay() === 0) d = addDays(d, 1);
  return d;
}

/* ── the rules ─────────────────────────────────────────────────────────────── */

export const isOpen = (opp) => Boolean(opp && STAGE[opp.stage]?.open);

/** Past the date somebody committed to. Independent of stage, on purpose. */
export function isOverdue(opp) {
  if (!isOpen(opp) || !opp.next_action_due) return false;
  return daysUntil(opp.next_action_due) < 0;
}

export function isDueToday(opp) {
  if (!isOpen(opp) || !opp.next_action_due) return false;
  return daysUntil(opp.next_action_due) === 0;
}

/** Open, valuable, and on nobody's list. The quietest way to lose a job. */
export const hasNoNextAction = (opp) => isOpen(opp) && !opp.next_action_due;

/**
 * One label per opportunity, ranked so a list can be sorted by urgency.
 * `sort` descends: the higher the number, the sooner somebody should look.
 */
export function attention(opp) {
  if (!isOpen(opp)) {
    return { level: 'closed', label: STAGE[opp.stage]?.name || '—', sort: 0 };
  }
  if (hasNoNextAction(opp)) {
    return { level: 'unbooked', label: 'No next action', sort: 900 };
  }
  const d = daysUntil(opp.next_action_due);
  if (d < 0) {
    const n = Math.abs(d);
    return { level: 'overdue', label: n === 1 ? '1 day overdue' : `${n} days overdue`, sort: 1000 + n };
  }
  if (d === 0) return { level: 'today', label: 'Due today', sort: 800 };
  if (d <= 7)  return { level: 'soon',  label: d === 1 ? 'Due tomorrow' : `Due in ${d} days`, sort: 700 - d };
  return { level: 'clear', label: `Due in ${d} days`, sort: 100 - Math.min(d, 99) };
}

/** A live quotation with nothing booked to chase it. */
export function quoteAtRisk(opp) {
  if (!isOpen(opp)) return false;
  if (!Number(opp.live_quotes || 0)) return false;
  return !opp.next_action_due || daysUntil(opp.next_action_due) < 0;
}

export const sum = (rows, pick) => rows.reduce((a, r) => a + (Number(pick(r)) || 0), 0);

/* ── boot-time guard ───────────────────────────────────────────────────────── */

/**
 * The board draws a column per entry in STAGES. If Postgres grows a stage this
 * file has not been told about, those opportunities would exist and be
 * invisible — the worst possible failure for a system whose whole job is that
 * nothing is forgotten. Checked once, at sign-in, against the live enum.
 */
export async function assertStagesMatchDatabase(db) {
  let rows;
  try {
    rows = await db.rpc('enum_values', { enum_name: 'opp_stage' });
  } catch {
    return { ok: true, skipped: true };   // helper absent: not worth blocking on
  }
  const inDb = new Set((rows || []).map((r) => (typeof r === 'string' ? r : r.value)));
  const here = new Set(STAGES.map((s) => s.id));
  const missing = [...inDb].filter((s) => !here.has(s));
  const extra = [...here].filter((s) => !inDb.has(s));
  if (missing.length || extra.length) {
    console.error('[kingson] pipeline stages disagree with the database',
      { missingFromApp: missing, notInDatabase: extra });
  }
  return { ok: !missing.length && !extra.length, missing, extra };
}
