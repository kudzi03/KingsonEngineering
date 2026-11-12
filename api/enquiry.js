'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   api/enquiry.js — the website enquiry endpoint (Vercel serverless function)
   ═══════════════════════════════════════════════════════════════════════════

   Website form  →  POST /api/enquiry (this file)  →  Google Sheets API
                 →  the spreadsheet Kingson Engineering owns.

   The browser never talks to Google and never holds a Google credential. The
   service-account key lives only in Vercel environment variables, and the
   service account can reach exactly one spreadsheet: the one Kingson shared
   with it. See docs/ENQUIRIES_GOOGLE_SHEETS.md for setup, rotation and recovery.

   No npm dependencies: the Google access token is a JWT signed here with
   node:crypto, and the Sheets REST API is called with the built-in fetch.

   Environment variables (all three required; placeholders in .env.example):
     GOOGLE_SHEET_ID                       the spreadsheet's ID, from its URL
     GOOGLE_SERVICE_ACCOUNT_EMAIL          …@….iam.gserviceaccount.com
     GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY    the PEM private key (\n escaped is fine)
   Optional:
     GOOGLE_SHEET_TAB                      worksheet (tab) name. Leave unset to use the
                                           first tab of the spreadsheet.

   What this function refuses, and why:
     · anything that is not a same-origin JSON POST (cross-site form posts and
       other people's pages cannot use it; this is abuse control, not
       authentication — a script can still forge headers, which is what the
       rate limits and the Vercel Firewall rule are for)
     · bodies over 16 KB, unknown services, missing or malformed required fields
     · a filled honeypot, or a form submitted faster than a person can type
     · more than a few submissions per address in a short window

   What it never does: log enquiry content, return Google's error text to the
   visitor, or report success before Google has confirmed the row.
   ═══════════════════════════════════════════════════════════════════════════ */

const crypto = require('node:crypto');

const MAX_BODY_BYTES = 16 * 1024;
const MIN_FILL_MS = 2500;

/* The same limits the form states. Kept here because the browser's copy is a
   courtesy; this one is the rule. */
const LIMITS = { company: 160, contact: 200, service: 120, location: 160,
                 drawings: 120, orgdetails: 300, description: 4000, page: 200 };

/* Must match ENQUIRY.serviceOptions and ENQUIRY.drawingOptions in
   content/runtime-copy.js. tools/test-enquiry-api.mjs fails if they drift. */
const SERVICES = [
  'Structural steelwork', 'Roof steelwork and trusses', 'Fibre laser cutting',
  'Balustrades and roller shutter doors', 'General metal fabrication', 'Mobile cranage',
  'More than one of these', 'Not sure yet'
];
const DRAWINGS = [
  'Yes — DXF or DWG', 'Yes — STEP', 'Yes — PDF or a drawing on paper',
  'No drawings, just measurements', 'No — I need help working it out'
];

/* Column order of the spreadsheet. Row 1 of the sheet carries these headings.
   If the sheet is completely empty the function writes the heading row itself
   with the first enquiry; after that it only appends and never rewrites a row. */
const COLUMNS = [
  'Submitted (Harare time)', 'Reference', 'Business name', 'Phone', 'Email',
  'Service requested', 'Site location', 'Drawings', 'About the organisation',
  'Enquiry message', 'Source page', 'Status', 'Notes', 'Submission ID (system)'
];

/* ── rate limiting ───────────────────────────────────────────────────────────
   Held in memory, so it is per running instance and resets on a cold start.
   That makes it a first line, not the only one: the durable limit is the
   Vercel Firewall rate-limit rule on /api/enquiry (see the setup guide). */
const PER_IP = { max: 5, windowMs: 10 * 60 * 1000 };
const GLOBAL = { max: 60, windowMs: 60 * 60 * 1000 };
const hits = new Map();
let globalHits = [];

function allow(ip, now) {
  globalHits = globalHits.filter((t) => now - t < GLOBAL.windowMs);
  const mine = (hits.get(ip) || []).filter((t) => now - t < PER_IP.windowMs);
  if (mine.length >= PER_IP.max || globalHits.length >= GLOBAL.max) {
    hits.set(ip, mine);
    return false;
  }
  mine.push(now);
  globalHits.push(now);
  hits.set(ip, mine);
  if (hits.size > 5000) {                    // bounded memory under a flood
    for (const [k, v] of hits) if (!v.some((t) => now - t < PER_IP.windowMs)) hits.delete(k);
  }
  return true;
}

/* ── input handling ──────────────────────────────────────────────────────── */

/* Control characters removed; newlines kept only where a paragraph is
   expected. Everything is a trimmed string of bounded length or ''. */
function clean(value, max, multiline) {
  if (typeof value !== 'string') return '';
  let s = value.normalize('NFC').replace(/\r\n?/g, '\n');
  s = multiline ? s.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '')
                : s.replace(/[\u0000-\u001F\u007F]+/g, ' ');
  return s.trim().slice(0, max);
}

/* Spreadsheet formula injection. Values are written with valueInputOption=RAW
   so Google Sheets stores them as text and never evaluates them. The leading
   apostrophe is for the day somebody exports the sheet to CSV and opens it in
   a program that would otherwise run a cell beginning with = + - or @. */
function inert(value) {
  return /^[=+\-@\t\r]/.test(value) ? "'" + value : value;
}

const EMAIL = /[^\s@<>()[\],;:"']+@[^\s@<>()[\],;:"']+\.[^\s@<>()[\],;:"']{2,}/;

/* The form has one contact box. The sheet has a phone column and an email
   column, so staff can sort and dial. The phone cell is reduced to the
   characters a phone number can contain, which also makes it formula-safe
   without an apostrophe in front of every +263. */
function splitContact(contact) {
  const email = (contact.match(EMAIL) || [''])[0];
  const rest = email ? contact.replace(email, ' ') : contact;
  const digits = (rest.match(/\d/g) || []).length;
  const phone = digits >= 7 ? rest.replace(/[^0-9+()\- ]/g, '').replace(/\s+/g, ' ').trim() : '';
  return { email, phone };
}

function validate(body) {
  const f = {
    company:     clean(body.company, LIMITS.company),
    contact:     clean(body.contact, LIMITS.contact),
    service:     clean(body.service, LIMITS.service),
    location:    clean(body.location, LIMITS.location),
    drawings:    clean(body.drawings, LIMITS.drawings),
    orgdetails:  clean(body.orgdetails, LIMITS.orgdetails),
    description: clean(body.description, LIMITS.description, true),
    page:        clean(body.page, LIMITS.page)
  };
  const bad = [];
  if (f.company.length < 2) bad.push('company');
  const { email, phone } = splitContact(f.contact);
  if (!email && !phone) bad.push('contact');
  if (!f.description) bad.push('description');
  if (f.service && !SERVICES.includes(f.service)) bad.push('service');
  if (f.drawings && !DRAWINGS.includes(f.drawings)) bad.push('drawings');
  if (!/^\/[a-z0-9\-/]*$/.test(f.page)) f.page = '/';
  return { fields: f, email, phone, bad };
}

/* ── Google ──────────────────────────────────────────────────────────────── */

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SHEETS_URL = 'https://sheets.googleapis.com/v4/spreadsheets';
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

function config() {
  const sheetId = (process.env.GOOGLE_SHEET_ID || '').trim();
  const email = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim();
  let key = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').trim();
  if (key.startsWith('"') && key.endsWith('"')) key = key.slice(1, -1);
  key = key.replace(/\\n/g, '\n');
  const tab = (process.env.GOOGLE_SHEET_TAB || '').trim();
  if (!sheetId || !email || !key.includes('PRIVATE KEY')) return null;
  return { sheetId, email, key, tab };
}

const b64url = (input) => Buffer.from(input).toString('base64url');

let cachedToken = null;   // { value, expires, email }

async function accessToken(cfg) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.email === cfg.email && cachedToken.expires - 60 > now) {
    return cachedToken.value;
  }
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({ iss: cfg.email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }));
  const signature = crypto.createSign('RSA-SHA256').update(`${head}.${claim}`).sign(cfg.key).toString('base64url');
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${head}.${claim}.${signature}`
    }),
    signal: AbortSignal.timeout(4000)
  });
  if (!res.ok) throw Object.assign(new Error('token'), { stage: 'token', status: res.status });
  const out = await res.json();
  cachedToken = { value: out.access_token, expires: now + (out.expires_in || 3600), email: cfg.email };
  return cachedToken.value;
}

/* With no tab name the range addresses the first tab of the spreadsheet. */
const range = (cfg, a1) => encodeURIComponent(cfg.tab ? `'${cfg.tab.replace(/'/g, "''")}'!${a1}` : a1);

/* Harare is UTC+2 all year. Written as text, in a form that sorts correctly. */
function harareStamp(date) {
  return new Date(date.getTime() + 2 * 3600 * 1000).toISOString().slice(0, 16).replace('T', ' ');
}
const parseStamp = (s) => Date.parse(String(s).replace(' ', 'T') + ':00+02:00');

/* The same enquiry sent twice — a second press after a slow first one, or a
   retry after a timeout that had in fact succeeded — gets the first row's
   reference back instead of a second row. Best effort: if this read fails the
   enquiry is still written, because a duplicate is cheaper than a loss. */
async function inspectSheet(cfg, token, fingerprint, now) {
  try {
    const url = `${SHEETS_URL}/${cfg.sheetId}/values:batchGet?majorDimension=COLUMNS` +
      `&ranges=${range(cfg, 'A1:A')}&ranges=${range(cfg, 'B1:B')}&ranges=${range(cfg, 'N1:N')}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { duplicate: null, empty: false };
    const [stamps, refs, ids] = (await res.json()).valueRanges.map((r) => (r.values && r.values[0]) || []);
    /* Nothing in column A at all: a brand-new sheet with no heading row yet. */
    if (!stamps.length) return { duplicate: null, empty: true };
    for (let i = ids.length - 1; i >= Math.max(1, ids.length - 100); i--) {
      if (ids[i] === fingerprint && now - parseStamp(stamps[i]) < 24 * 3600 * 1000) return { duplicate: refs[i] || null, empty: false };
    }
  } catch { /* fall through to writing the row */ }
  return { duplicate: null, empty: false };
}

async function appendRow(cfg, token, rows) {
  const url = `${SHEETS_URL}/${cfg.sheetId}/values/${range(cfg, 'A:N')}:append` +
    '?valueInputOption=RAW&insertDataOption=INSERT_ROWS';
  const send = () => fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: rows }),
    signal: AbortSignal.timeout(5000)
  });
  let res = await send();
  /* One retry, and only when Google answered that it did not take the row.
     A timeout is not retried: the row may be in, and a retry would double it. */
  if (res.status === 429 || res.status >= 500) {
    await new Promise((r) => setTimeout(r, 400));
    res = await send();
  }
  if (!res.ok) throw Object.assign(new Error('append'), { stage: 'append', status: res.status });
}

const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // no 0/O, 1/I
function reference(date) {
  const day = harareStamp(date).slice(2, 10).replace(/-/g, '');
  let tail = '';
  for (let i = 0; i < 4; i++) tail += REF_ALPHABET[crypto.randomInt(REF_ALPHABET.length)];
  return `KE-${day}-${tail}`;
}

/* ── the handler ─────────────────────────────────────────────────────────── */

function reply(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
    const text = req.body.toString();
    if (Buffer.byteLength(text) > MAX_BODY_BYTES) throw Object.assign(new Error('large'), { tooLarge: true });
    return JSON.parse(text);
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error('large'), { tooLarge: true });
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

const header = (req, name) => {
  const v = req.headers[name];
  return (Array.isArray(v) ? v[0] : v) || '';
};

function sameOrigin(req) {
  const origin = header(req, 'origin');
  const host = header(req, 'x-forwarded-host') || header(req, 'host');
  if (!origin || !host) return false;
  let originHost;
  try { originHost = new URL(origin).host; } catch { return false; }
  if (originHost.toLowerCase() !== host.toLowerCase()) return false;
  const site = header(req, 'sec-fetch-site');
  return !site || site === 'same-origin';
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return reply(res, 405, { ok: false, reason: 'method' });
  }
  if (!/^application\/json\b/i.test(header(req, 'content-type'))) {
    return reply(res, 415, { ok: false, reason: 'type' });
  }
  if (!sameOrigin(req)) return reply(res, 403, { ok: false, reason: 'origin' });
  if (Number(header(req, 'content-length')) > MAX_BODY_BYTES) {
    return reply(res, 413, { ok: false, reason: 'large' });
  }

  let body;
  try { body = await readBody(req); }
  catch (err) { return reply(res, err && err.tooLarge ? 413 : 400, { ok: false, reason: err && err.tooLarge ? 'large' : 'invalid' }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return reply(res, 400, { ok: false, reason: 'invalid' });
  if (Buffer.byteLength(JSON.stringify(body)) > MAX_BODY_BYTES) return reply(res, 413, { ok: false, reason: 'large' });

  /* A real visitor who trips either of these is told the automatic save did
     not work and is shown the WhatsApp and email handoff, so nothing a person
     typed is ever silently dropped. */
  if (clean(body.website, 200) || !(Number(body.elapsed) >= MIN_FILL_MS)) {
    return reply(res, 400, { ok: false, reason: 'rejected' });
  }

  const { fields, email, phone, bad } = validate(body);
  if (bad.length) return reply(res, 400, { ok: false, reason: 'invalid', fields: bad });

  const now = Date.now();
  const ip = (header(req, 'x-forwarded-for').split(',')[0] || header(req, 'x-real-ip') || 'unknown').trim();
  if (!allow(ip, now)) {
    res.setHeader('Retry-After', '600');
    return reply(res, 429, { ok: false, reason: 'busy' });
  }

  const cfg = config();
  if (!cfg) {
    console.error('[enquiry] not configured: Google Sheets environment variables are missing');
    return reply(res, 503, { ok: false, reason: 'unconfigured' });
  }

  const fingerprint = crypto.createHash('sha256')
    .update([fields.company, fields.contact, fields.description].join('\u0000').toLowerCase())
    .digest('hex').slice(0, 20);

  try {
    const token = await accessToken(cfg);
    const sheet = await inspectSheet(cfg, token, fingerprint, now);
    if (sheet.duplicate) return reply(res, 200, { ok: true, ref: sheet.duplicate, duplicate: true });

    const date = new Date(now);
    const ref = reference(date);
    const row = [
      harareStamp(date), ref, inert(fields.company), phone, inert(email),
      inert(fields.service), inert(fields.location), inert(fields.drawings),
      inert(fields.orgdetails), inert(fields.description), fields.page,
      'New', '', fingerprint
    ];
    await appendRow(cfg, token, sheet.empty ? [COLUMNS, row] : [row]);
    return reply(res, 200, { ok: true, ref });
  } catch (err) {
    /* Stage and status only. Never the enquiry, never Google's response body. */
    console.error('[enquiry] not saved', (err && err.stage) || (err && err.name) || 'error', (err && err.status) || '');
    if (err && err.stage === 'token') cachedToken = null;
    return reply(res, 502, { ok: false, reason: 'upstream' });
  }
}

module.exports = handler;
module.exports.internals = { validate, splitContact, inert, clean, harareStamp, reference, COLUMNS, SERVICES, DRAWINGS, LIMITS,
  reset() { hits.clear(); globalHits = []; cachedToken = null; } };
