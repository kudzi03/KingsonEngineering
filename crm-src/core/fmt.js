/* ═══════════════════════════════════════════════════════════════════════════
   core/fmt.js — money, dates, and escaping
   ═══════════════════════════════════════════════════════════════════════════
   Every view builds HTML from strings, so `esc` is not optional anywhere a
   value came from the database. A customer is entitled to be called
   "Smith & Sons <Pvt> Ltd" without breaking the page.
   ═══════════════════════════════════════════════════════════════════════════ */

import { TZ } from './config.js';
import { daysUntil, today } from './model.js';

const MONEY = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0
});

export const money = (n, currency = 'USD') => {
  if (n === null || n === undefined || n === '') return '—';
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  if (currency === 'USD') return MONEY.format(v);
  return `${currency} ${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

/**
 * Per-currency totals from sumValues() or dashboard_metrics(). An empty
 * object means nothing has been recorded, which reads as a dash — never as
 * "$0", because nothing recorded is not the same as zero.
 */
export function moneyBy(by, { empty = '—' } = {}) {
  const parts = Object.entries(by || {}).filter(([, v]) => v != null);
  if (!parts.length) return empty;
  return parts.map(([c, v]) => money(v, c)).join(' · ');
}

/** Short money for dense places: $48.6k, $1.2m. */
export function moneyShort(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v === 0) return n === 0 ? '$0' : '—';
  const a = Math.abs(v);
  if (a >= 1e6) return '$' + (v / 1e6).toFixed(a % 1e6 ? 1 : 0) + 'm';
  if (a >= 1e3) return '$' + (v / 1e3).toFixed(a % 1e3 && a < 1e4 ? 1 : 0) + 'k';
  return '$' + Math.round(v);
}

/** moneyBy() for dense places: "$48.6k", or "$48.6k · ZAR 12k". */
export function moneyByShort(by) {
  const parts = Object.entries(by || {}).filter(([, v]) => v != null);
  if (!parts.length) return '';
  return parts.map(([c, v]) => (c === 'USD' ? moneyShort(v) : `${c} ${moneyShort(v).slice(1)}`)).join(' · ');
}

const DATE  = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: TZ });
const FULL  = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ });
const STAMP = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  hour12: false, timeZone: TZ
});

/* A date column is a plain calendar day and must not be shifted by a timezone
   on the way to the screen — a follow-up booked for the 21st is the 21st. */
const asDate = (v) => (typeof v === 'string' && v.length === 10
  ? new Date(v + 'T12:00:00Z') : new Date(v));

export const date     = (v) => (v ? DATE.format(asDate(v)) : '—');
export const dateFull = (v) => (v ? FULL.format(asDate(v)) : '—');
export const stamp    = (v) => (v ? STAMP.format(new Date(v)) : '—');

/** For <input type="date">, in Harare's day. */
export const isoDate = (v) => {
  if (!v) return '';
  if (typeof v === 'string' && v.length === 10) return v;
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(v));
};

/** For <input type="datetime-local">. */
export function isoDateTime(v) {
  if (!v) return '';
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(new Date(v)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** Harare wall-clock from a datetime-local input, back to an instant. */
export function fromLocalInput(s) {
  if (!s) return null;
  /* Africa/Harare is UTC+2 all year — no daylight saving — so the offset is
     a constant rather than something to look up. */
  return new Date(s + ':00+02:00').toISOString();
}

export function relative(v) {
  if (!v) return '—';
  const d = daysUntil(isoDate(v));
  if (d === null) return '—';
  if (d === 0) return 'today';
  if (d === 1) return 'tomorrow';
  if (d === -1) return 'yesterday';
  return d > 0 ? `in ${d} days` : `${-d} days ago`;
}

export function overdueBy(v) {
  const d = daysUntil(isoDate(v));
  if (d === null || d >= 0) return '';
  const n = Math.abs(d);
  return n === 1 ? '1 day overdue' : `${n} days overdue`;
}

export const initials = (name) => String(name || '')
  .split(/[\s.]+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

export const pluralise = (n, one, many) => `${n} ${n === 1 ? one : (many || one + 's')}`;

export const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** A tel: href — strip everything a dialler cannot use. */
export const tel = (v) => 'tel:' + String(v || '').replace(/[^\d+]/g, '');

/**
 * A wa.me link. WhatsApp wants digits only, no plus, no spaces. Returns ''
 * when there is nothing dialable, so callers render no button rather than a
 * dead one.
 */
export function whatsapp(number, text = '') {
  const n = String(number || '').replace(/\D/g, '');
  if (n.length < 9) return '';
  return `https://wa.me/${n}${text ? '?text=' + encodeURIComponent(text) : ''}`;
}

export const mailto = (addr, subject = '', body = '') => {
  if (!addr) return '';
  const p = [];
  if (subject) p.push('subject=' + encodeURIComponent(subject));
  if (body) p.push('body=' + encodeURIComponent(body));
  return `mailto:${addr}${p.length ? '?' + p.join('&') : ''}`;
};

export { today };
