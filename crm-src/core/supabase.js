/* ═══════════════════════════════════════════════════════════════════════════
   core/supabase.js — the client, written out rather than installed
   ═══════════════════════════════════════════════════════════════════════════

   This talks to PostgREST, GoTrue and Storage over `fetch`. There is no SDK
   and no bundler, for the same reason the public site has neither: the whole
   surface used here is four URL shapes and a bearer token, and a build step
   is a thing that can break between a workshop in Tynwald and a browser.

   It also keeps the Content-Security-Policy honest. `script-src 'self'` means
   exactly that — nothing is fetched from a CDN at runtime, so there is no
   third party who can change what this application does tomorrow.

   WHAT THIS FILE IS RESPONSIBLE FOR

     · attaching the session to every request
     · refreshing an expired session once, transparently, and retrying
     · turning PostgREST's error shapes into one Error a view can render
     · never letting a failed write look like a successful one
   ═══════════════════════════════════════════════════════════════════════════ */

import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

const STORE_KEY = 'kingson-crm/session/v1';

let session = null;      // { access_token, refresh_token, expires_at, user }
let refreshing = null;   // in-flight refresh, so ten parallel 401s cause one

/* ── session storage ──────────────────────────────────────────────────────── */

export function loadSession() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    session = raw ? JSON.parse(raw) : null;
  } catch { session = null; }
  return session;
}

export function getSession() { return session; }

export function setSession(s) {
  session = s;
  try {
    if (s) localStorage.setItem(STORE_KEY, JSON.stringify(s));
    else localStorage.removeItem(STORE_KEY);
  } catch { /* private mode: the session lives for this tab only */ }
  return s;
}

/* GoTrue returns `expires_in`; an absolute moment is what we can actually
   compare against later. Sixty seconds of slack so a request that is about to
   expire mid-flight refreshes first instead of failing. */
const stamp = (r) => ({
  access_token: r.access_token,
  refresh_token: r.refresh_token,
  expires_at: Date.now() + ((r.expires_in || 3600) - 60) * 1000,
  user: r.user || null
});

const expired = () => !session || !session.expires_at || Date.now() >= session.expires_at;

/* ── errors ───────────────────────────────────────────────────────────────── */

export class ApiError extends Error {
  constructor(message, { status = 0, code = '', details = '', hint = '' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.hint = hint;
  }
}

/* Postgres speaks in constraint names. A person needs a sentence. Anything not
   translated here falls through with the database's own message, which is
   better than a generic apology that hides what went wrong. */
function humanise(status, body) {
  const code = body?.code || '';
  const msg = body?.message || body?.error_description || body?.msg || '';

  if (code === '23505') {
    if (/contacts_email_key/.test(msg)) return 'A contact with that email address already exists.';
    if (/companies_name_key/.test(msg)) return 'A company with that name already exists.';
    return 'That record already exists.';
  }
  if (code === '23514') {
    if (/lost_has_reason/.test(msg))  return 'A lost opportunity needs a reason.';
    if (/quotes_sent_has_date/.test(msg)) return 'A quotation marked sent needs the date it went out.';
    if (/contacts_reachable/.test(msg))   return 'A contact needs a phone number, a WhatsApp number or an email address.';
    if (/amount_sane|value_sane/.test(msg)) return 'That amount cannot be negative.';
    return 'That value is not allowed here.';
  }
  if (code === '23503') return 'That record is still attached to something else.';
  if (status === 401)   return 'Your session has expired. Sign in again.';
  if (status === 403 || code === '42501')
    return 'You do not have permission to do that.';
  if (status === 404)   return 'That record no longer exists.';
  if (status === 0)     return 'No connection. Check the network and try again.';
  return msg || `Request failed (${status}).`;
}

/* ── auth ─────────────────────────────────────────────────────────────────── */

async function gotrue(path, { method = 'POST', body, token } = {}) {
  let res;
  try {
    res = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
      method,
      headers: {
        apikey: SUPABASE_KEY,
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError(humanise(0), { status: 0 });
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(humanise(res.status, data), { status: res.status, code: data?.code || '' });
  return data;
}

export async function signIn(email, password) {
  const r = await gotrue('/token?grant_type=password', { body: { email: email.trim(), password } });
  return setSession(stamp(r));
}

export async function signOut() {
  const s = session;
  setSession(null);
  if (s?.access_token) {
    try { await gotrue('/logout', { token: s.access_token }); } catch { /* local sign-out stands */ }
  }
}

export async function requestPasswordReset(email) {
  return gotrue('/recover', { body: { email: email.trim() } });
}

async function refresh() {
  if (!session?.refresh_token) throw new ApiError('Your session has expired. Sign in again.', { status: 401 });
  if (!refreshing) {
    refreshing = gotrue('/token?grant_type=refresh_token', { body: { refresh_token: session.refresh_token } })
      .then((r) => setSession(stamp(r)))
      .catch((e) => { setSession(null); throw e; })
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

/* ── PostgREST ────────────────────────────────────────────────────────────── */

/* ── one read, however many callers ───────────────────────────────────────────
   Opening the dashboard fired the same v_opportunity_state query three times:
   once for the overdue badge at boot, once for the dashboard's own data, and
   once for the badge again after the view rendered. Three identical requests
   over a Harare connection is most of the three and a half seconds before the
   screen had anything on it.

   So a GET is held for a moment and handed to whoever else asks for the same
   path in that window. The window is short, and any write clears the whole
   cache, so nobody can be shown a row they have just changed. It is a render
   pass, not a cache layer — two seconds is deliberately too short to hide
   somebody else's edit for longer than it takes to notice.                 */

const READ_TTL = 2000;
const reads = new Map();

const cacheable = (method, headers) =>
  method === 'GET' && !headers.Prefer;      // a counted read is not the same read

function remember(key, promise) {
  reads.set(key, { at: Date.now(), promise });
  /* A failed read must not be served to the next caller. */
  promise.catch(() => reads.delete(key));
  return promise;
}

async function request(path, { method = 'GET', body, headers = {}, retry = true } = {}) {
  if (cacheable(method, headers)) {
    const hit = reads.get(path);
    if (hit && Date.now() - hit.at < READ_TTL) return hit.promise;
  } else {
    reads.clear();                          // anything written invalidates everything
  }
  if (cacheable(method, headers)) return remember(path, send(path, { method, headers, retry }));
  return send(path, { method, body, headers, retry });
}

async function send(path, { method = 'GET', body, headers = {}, retry = true } = {}) {
  if (session && expired()) {
    try { await refresh(); } catch { /* fall through; the 401 below is the truth */ }
  }

  let res;
  try {
    res = await fetch(`${SUPABASE_URL}${path}`, {
      method,
      headers: {
        apikey: SUPABASE_KEY,
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        ...headers
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    throw new ApiError(humanise(0), { status: 0 });
  }

  /* One transparent retry on a rejected token, and only one: a second 401
     after a fresh token means the session is genuinely finished. */
  if (res.status === 401 && retry && session?.refresh_token) {
    try {
      await refresh();
      return send(path, { method, body, headers, retry: false });
    } catch { /* fall through to the error below */ }
  }

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    throw new ApiError(humanise(res.status, data), {
      status: res.status,
      code: data?.code || '',
      details: data?.details || '',
      hint: data?.hint || ''
    });
  }
  return data;
}

/* `select` returns rows; the others return the row they wrote, because a
   caller that cannot see what it just saved cannot show it. */
export const db = {
  select: (table, query = '') =>
    request(`/rest/v1/${table}${query ? '?' + query : ''}`),

  insert: (table, row, query = '') =>
    request(`/rest/v1/${table}${query ? '?' + query : ''}`, {
      method: 'POST', body: row, headers: { Prefer: 'return=representation' }
    }),

  /* When row-level security filters a PATCH out, PostgREST answers 200 with
     an empty list — nothing was saved, and nothing says so. Every update in
     this application targets one row by id, so no rows back is a refusal. */
  update: async (table, query, patch) => {
    const rows = await request(`/rest/v1/${table}?${query}`, {
      method: 'PATCH', body: patch, headers: { Prefer: 'return=representation' }
    });
    if (Array.isArray(rows) && !rows.length) {
      throw new ApiError('Not saved — you may not have permission to change this, or it no longer exists.',
        { status: 403 });
    }
    return rows;
  },

  rpc: (fn, args = {}) =>
    request(`/rest/v1/rpc/${fn}`, { method: 'POST', body: args })
};

/* ── storage ──────────────────────────────────────────────────────────────── */

export const storage = {
  async upload(bucket, path, file) {
    if (session && expired()) { try { await refresh(); } catch { /* handled below */ } }
    let res;
    try {
      res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${encodeURI(path)}`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${session?.access_token || ''}`,
          'x-upsert': 'false',
          ...(file.type ? { 'Content-Type': file.type } : {})
        },
        body: file
      });
    } catch { throw new ApiError(humanise(0), { status: 0 }); }
    if (!res.ok) {
      let d = null; try { d = await res.json(); } catch { /* non-JSON error body */ }
      throw new ApiError(
        res.status === 413 ? 'That file is larger than the 25 MB limit.'
          : d?.message || `Upload failed (${res.status}).`, { status: res.status });
    }
    return path;
  },

  /* The bucket is private, so a download is a short-lived signed URL minted
     for this member of staff. A path on its own opens nothing. */
  async signedUrl(bucket, path, seconds = 120) {
    const r = await request(`/storage/v1/object/sign/${bucket}/${encodeURI(path)}`,
      { method: 'POST', body: { expiresIn: seconds } });
    return `${SUPABASE_URL}/storage/v1${r.signedURL || r.signedUrl}`;
  },

  async remove(bucket, paths) {
    return request(`/storage/v1/object/${bucket}`, { method: 'DELETE', body: { prefixes: paths } });
  }
};

/* ── query helpers ────────────────────────────────────────────────────────── */

/** PostgREST needs commas and parentheses inside a value escaped with quotes. */
export const q = (v) => {
  const s = String(v ?? '');
  return /[,.()"\s]/.test(s) ? `"${s.replace(/"/g, '\\"')}"` : s;
};

export const eq = (col, v) => `${col}=eq.${encodeURIComponent(v)}`;
export const order = (col, dir = 'asc', nullsLast = true) =>
  `order=${col}.${dir}${nullsLast ? '.nullslast' : ''}`;
