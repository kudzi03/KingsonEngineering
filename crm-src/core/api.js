/* ═══════════════════════════════════════════════════════════════════════════
   core/api.js — every query this application makes, in one place
   ═══════════════════════════════════════════════════════════════════════════

   Views call these; views do not build URLs. Two reasons: a `select=` list
   that drifts between three screens is how a field silently stops loading on
   one of them, and having the whole data surface in one file makes it
   possible to read what the application actually asks the database for.

   Writes that a person would expect to leave a trace go through the functions
   at the bottom rather than through `db.update` directly — `logActivity` and
   friends exist so the timeline is a consequence of the work, not a thing
   somebody has to remember to add.
   ═══════════════════════════════════════════════════════════════════════════ */

import { db, storage, eq, order, q } from './supabase.js';
import { FILES_BUCKET } from './config.js';
import { OPEN_STAGES } from './model.js';
import { withDemo, showDemo } from './demo.js';

/* Columns pulled with an opportunity everywhere it is shown as a row. The
   view already flattens company, contact and owner, so a board of sixty cards
   is one request rather than sixty. */
const OPP_LIST = '*';
const OPP_ORDER = order('next_action_due', 'asc');

const openFilter = `stage=in.(${OPEN_STAGES.join(',')})`;

/* Every list below goes through `withDemo`, so demonstration rows are left
   out unless this browser has asked for them in Settings. Single-record
   fetches by id are not filtered: a link to a demo record still opens, and
   the record says what it is. */

/* ── reference data ────────────────────────────────────────────────────────── */

export const api = {
  profiles: () => db.select('profiles', `select=*&${order('full_name')}`),
  me: (id) => db.select('profiles', `select=*&${eq('id', id)}`).then((r) => r[0] || null),

  /* ── opportunities ─────────────────────────────────────────────────────── */

  opportunities: (filter = '') =>
    db.select('v_opportunity_state', withDemo(
      `select=${OPP_LIST}${/(^|&)order=/.test(filter) ? '' : '&' + OPP_ORDER}${filter ? '&' + filter : ''}`)),

  openOpportunities: () =>
    db.select('v_opportunity_state', withDemo(`select=${OPP_LIST}&${openFilter}&${OPP_ORDER}`)),

  opportunity: (id) =>
    db.select('v_opportunity_state', `select=${OPP_LIST}&${eq('id', id)}`).then((r) => r[0] || null),

  createOpportunity: (row) => db.insert('opportunities', row).then((r) => r[0]),

  updateOpportunity: (id, patch) =>
    db.update('opportunities', eq('id', id), patch).then((r) => r[0]),

  /* Plain stage moves between the working stages. Won, lost and on hold are
     decisions with their own data and go through `decide` instead; the
     database refuses them without it. */
  setStage: (id, stage) => api.updateOpportunity(id, { stage }),

  /* ── the quote lifecycle (database functions — see
       supabase/migrations/20260922_quote_lifecycle.sql) ─────────────────── */

  recordQuote: (oppId, { amount, currency, preparedOn, validUntil, notes, reference, documentRef }) =>
    db.rpc('record_quote', {
      p_opportunity_id: oppId, p_amount: amount, p_currency: currency || 'USD',
      p_prepared_on: preparedOn || null, p_valid_until: validUntil || null,
      p_notes: notes || null, p_reference: reference || null, p_document_ref: documentRef || null
    }),

  markQuoteSent: (quoteId, { sentAt, followUpOn, channel, notes }) =>
    db.rpc('mark_quote_sent', {
      p_quote_id: quoteId, p_sent_at: sentAt || null, p_follow_up_on: followUpOn || null,
      p_channel: channel || 'email', p_notes: notes || null
    }),

  logFollowUp: (oppId, { channel, notes, at, nextAction, nextDue }) =>
    db.rpc('log_follow_up', {
      p_opportunity_id: oppId, p_channel: channel, p_notes: notes,
      p_at: at || null, p_next_action: nextAction || null, p_next_due: nextDue || null
    }),

  customerReplied: (oppId, { channel, notes, at }) =>
    db.rpc('mark_customer_replied', {
      p_opportunity_id: oppId, p_channel: channel, p_notes: notes || null, p_at: at || null
    }),

  decide: (oppId, outcome, { on, value, reason, notes, reviewOn } = {}) =>
    db.rpc('decide_opportunity', {
      p_opportunity_id: oppId, p_outcome: outcome, p_on: on || null,
      p_value: value ?? null, p_reason: reason || null, p_notes: notes || null,
      p_review_on: reviewOn || null
    }),

  /** Working-day arithmetic, done where the settings live. */
  addWorkingDays: (date, n) => db.rpc('add_working_days', { d: date, n }),

  settings: () => db.select('crm_settings', 'select=*&limit=1').then((r) => r[0] || null),
  updateSettings: (patch) => db.update('crm_settings', 'id=eq.true', patch).then((r) => r[0]),

  /* ── contacts and companies ────────────────────────────────────────────── */

  contacts: (search = '') => {
    let f = withDemo(`select=*,companies(id,name)&${order('full_name')}`);
    if (search) {
      /* Quoted, so a comma or bracket in the search is text, not filter syntax. */
      const s = encodeURIComponent(q(`%${search}%`));
      f += `&or=(full_name.ilike.${s},email.ilike.${s},phone.ilike.${s},whatsapp.ilike.${s})`;
    }
    return db.select('contacts', f);
  },
  contact: (id) =>
    db.select('contacts', `select=*,companies(id,name,kind,town)&${eq('id', id)}`).then((r) => r[0] || null),
  createContact: (row) => db.insert('contacts', row).then((r) => r[0]),
  updateContact: (id, patch) => db.update('contacts', eq('id', id), patch).then((r) => r[0]),

  companies: () => db.select('companies', withDemo(`select=*&${order('name')}`)),
  company: (id) => db.select('companies', `select=*&${eq('id', id)}`).then((r) => r[0] || null),
  createCompany: (row) => db.insert('companies', row).then((r) => r[0]),
  updateCompany: (id, patch) => db.update('companies', eq('id', id), patch).then((r) => r[0]),

  /** Find a company by name or make one. Used by the quick-add forms. */
  async findOrCreateCompany(name) {
    const n = (name || '').trim();
    if (!n) return null;
    const hit = await db.select('companies',
      `select=id,name&name=ilike.${encodeURIComponent(n)}&limit=1`);
    if (hit[0]) return hit[0];
    return api.createCompany({ name: n });
  },

  /* ── activities ────────────────────────────────────────────────────────── */

  activityFor: (opportunityId) =>
    db.select('activities',
      `select=*,profiles(full_name,initials)&${eq('opportunity_id', opportunityId)}&${order('occurred_at', 'desc')}`),

  activityForContact: (contactId) =>
    db.select('activities',
      `select=*,profiles(full_name,initials),opportunities(id,ref,title)&${eq('contact_id', contactId)}&${order('occurred_at', 'desc')}`),

  activityForProject: (projectId) =>
    db.select('activities',
      `select=*,profiles(full_name,initials)&${eq('project_id', projectId)}&${order('occurred_at', 'desc')}`),

  recentActivity: (limit = 12) =>
    db.select('activities',
      withDemo(`select=*,profiles(full_name,initials),opportunities(id,ref,title)&${order('occurred_at', 'desc')}&limit=${limit}`)),

  logActivity: (row) => db.insert('activities', row).then((r) => r[0]),

  /* ── tasks and follow-ups ──────────────────────────────────────────────── */

  tasks: (filter = '') =>
    db.select('tasks',
      withDemo(`select=*,profiles!tasks_owner_id_fkey(full_name,initials),opportunities(id,ref,title,stage),contacts(id,full_name,phone,whatsapp,email)&${order('due_date')}${filter ? '&' + filter : ''}`)),

  openTasks: () => api.tasks('status=eq.open'),
  tasksFor: (opportunityId) => api.tasks(eq('opportunity_id', opportunityId)),
  createTask: (row) => db.insert('tasks', row).then((r) => r[0]),
  updateTask: (id, patch) => db.update('tasks', eq('id', id), patch).then((r) => r[0]),
  completeTask: (id) => api.updateTask(id, { status: 'done' }),

  /* ── site visits ───────────────────────────────────────────────────────── */

  visits: (filter = '') =>
    db.select('site_visits',
      withDemo(`select=*,profiles(full_name,initials),opportunities(id,ref,title,company_id,companies(name))&${order('scheduled_at')}${filter ? '&' + filter : ''}`)),

  upcomingVisits: () =>
    api.visits(`status=eq.scheduled&scheduled_at=gte.${new Date(Date.now() - 864e5).toISOString()}`),

  visitsFor: (opportunityId) => api.visits(eq('opportunity_id', opportunityId)),
  createVisit: (row) => db.insert('site_visits', row).then((r) => r[0]),
  updateVisit: (id, patch) => db.update('site_visits', eq('id', id), patch).then((r) => r[0]),

  /* ── quotes ────────────────────────────────────────────────────────────── */

  quotes: (filter = '') =>
    db.select('quotes',
      withDemo(`select=*,profiles:sent_by(full_name,initials),opportunities(id,ref,title,stage,next_action_due,company_id,companies(name))&order=prepared_on.desc,version.desc${filter ? '&' + filter : ''}`)),

  liveQuotes: () => api.quotes('status=in.(sent,discussed)'),
  quotesFor: (opportunityId) => api.quotes(eq('opportunity_id', opportunityId)),
  createQuote: (row) => db.insert('quotes', row).then((r) => r[0]),
  updateQuote: (id, patch) => db.update('quotes', eq('id', id), patch).then((r) => r[0]),

  /* ── projects ──────────────────────────────────────────────────────────── */

  projects: (filter = '') =>
    db.select('projects',
      withDemo(`select=*,companies(id,name),contacts(id,full_name,phone,email),profiles(full_name,initials),opportunities(id,ref)&${order('created_at', 'desc')}${filter ? '&' + filter : ''}`)),

  project: (id) =>
    db.select('projects',
      `select=*,companies(id,name),contacts(id,full_name,phone,email,whatsapp),profiles(full_name,initials),opportunities(id,ref,title)&${eq('id', id)}`)
      .then((r) => r[0] || null),

  updateProject: (id, patch) => db.update('projects', eq('id', id), patch).then((r) => r[0]),

  /** Won → project. The database does the copying so it cannot half-happen. */
  convertToProject: (opportunityId, { name, startDate, targetDate } = {}) =>
    db.rpc('convert_to_project', {
      p_opportunity_id: opportunityId,
      p_name: name || null,
      p_start_date: startDate || null,
      p_target_date: targetDate || null
    }),

  projectForOpportunity: (opportunityId) =>
    db.select('projects', `select=id,name,status&${eq('opportunity_id', opportunityId)}`).then((r) => r[0] || null),

  /* ── enquiries (the raw website intake, for audit) ─────────────────────── */

  enquiries: (limit = 50) =>
    db.select('enquiries', withDemo(`select=*&${order('created_at', 'desc')}&limit=${limit}`)),

  /* ── files ─────────────────────────────────────────────────────────────── */

  filesFor: (column, id) =>
    db.select('files', `select=*,profiles(full_name,initials)&${eq(column, id)}&${order('created_at', 'desc')}`),

  async uploadFile(file, link, uploadedBy) {
    /* A path that cannot collide and cannot be guessed, keeping the original
       name for the download and for the list. */
    const safe = file.name.replace(/[^\w.\-]+/g, '_').slice(-80);
    const path = `${Object.keys(link)[0].replace('_id', '')}/${Object.values(link)[0]}/${Date.now()}-${safe}`;
    await storage.upload(FILES_BUCKET, path, file);
    try {
      return await db.insert('files', {
        bucket: FILES_BUCKET, path, name: file.name,
        mime: file.type || null, size_bytes: file.size,
        uploaded_by: uploadedBy || null, ...link
      }).then((r) => r[0]);
    } catch (e) {
      /* The bytes landed but the index row did not. Leaving the object behind
         would be a file nobody can find and nobody can delete. */
      try { await storage.remove(FILES_BUCKET, [path]); } catch { /* nothing more to try */ }
      throw e;
    }
  },

  downloadUrl: (path) => storage.signedUrl(FILES_BUCKET, path, 120),

  /* ── dashboard ─────────────────────────────────────────────────────────── */

  /* The headline numbers come from one database function so that the
     dashboard, a report and anybody querying by hand all get the same answer
     to "what is the pipeline worth". */
  metrics: () => db.rpc('dashboard_metrics', { p_include_demo: showDemo() }),

  async dashboard() {
    const [metrics, open, liveQuotes, tasks, visits, recent] = await Promise.all([
      api.metrics(),
      api.openOpportunities(),
      api.liveQuotes(),
      api.openTasks(),
      api.upcomingVisits(),
      api.recentActivity(10)
    ]);
    return { metrics, open, liveQuotes, tasks, visits, recent };
  }
};

export { db, storage, eq, order };
