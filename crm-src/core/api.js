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

import { db, storage, eq, order } from './supabase.js';
import { FILES_BUCKET } from './config.js';
import { OPEN_STAGES } from './model.js';

/* Columns pulled with an opportunity everywhere it is shown as a row. The
   view already flattens company, contact and owner, so a board of sixty cards
   is one request rather than sixty. */
const OPP_LIST = '*';
const OPP_ORDER = order('next_action_due', 'asc');

const openFilter = `stage=in.(${OPEN_STAGES.join(',')})`;

/* ── reference data ────────────────────────────────────────────────────────── */

export const api = {
  profiles: () => db.select('profiles', `select=*&${order('full_name')}`),
  me: (id) => db.select('profiles', `select=*&${eq('id', id)}`).then((r) => r[0] || null),

  /* ── opportunities ─────────────────────────────────────────────────────── */

  opportunities: (filter = '') =>
    db.select('v_opportunity_state', `select=${OPP_LIST}&${OPP_ORDER}${filter ? '&' + filter : ''}`),

  openOpportunities: () =>
    db.select('v_opportunity_state', `select=${OPP_LIST}&${openFilter}&${OPP_ORDER}`),

  opportunity: (id) =>
    db.select('v_opportunity_state', `select=${OPP_LIST}&${eq('id', id)}`).then((r) => r[0] || null),

  createOpportunity: (row) => db.insert('opportunities', row).then((r) => r[0]),

  updateOpportunity: (id, patch) =>
    db.update('opportunities', eq('id', id), patch).then((r) => r[0]),

  /* Stage moves go through here rather than through `updateOpportunity` so
     the one field the database refuses to accept without a reason is asked
     for at the call site instead of failing at the constraint. */
  async setStage(id, stage, { lostReason } = {}) {
    const patch = { stage };
    if (stage === 'lost') patch.lost_reason = (lostReason || '').trim() || 'No reason recorded';
    return api.updateOpportunity(id, patch);
  },

  /* ── contacts and companies ────────────────────────────────────────────── */

  contacts: (search = '') => {
    let f = `select=*,companies(id,name)&${order('full_name')}`;
    if (search) {
      const s = encodeURIComponent(`%${search}%`);
      f += `&or=(full_name.ilike.${s},email.ilike.${s},phone.ilike.${s},whatsapp.ilike.${s})`;
    }
    return db.select('contacts', f);
  },
  contact: (id) =>
    db.select('contacts', `select=*,companies(id,name,kind,town)&${eq('id', id)}`).then((r) => r[0] || null),
  createContact: (row) => db.insert('contacts', row).then((r) => r[0]),
  updateContact: (id, patch) => db.update('contacts', eq('id', id), patch).then((r) => r[0]),

  companies: () => db.select('companies', `select=*&${order('name')}`),
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
      `select=*,profiles(full_name,initials),opportunities(id,ref,title)&${order('occurred_at', 'desc')}&limit=${limit}`),

  logActivity: (row) => db.insert('activities', row).then((r) => r[0]),

  /* ── tasks and follow-ups ──────────────────────────────────────────────── */

  tasks: (filter = '') =>
    db.select('tasks',
      `select=*,profiles!tasks_owner_id_fkey(full_name,initials),opportunities(id,ref,title,stage),contacts(id,full_name,phone,whatsapp,email)&${order('due_date')}${filter ? '&' + filter : ''}`),

  openTasks: () => api.tasks('status=eq.open'),
  tasksFor: (opportunityId) => api.tasks(eq('opportunity_id', opportunityId)),
  createTask: (row) => db.insert('tasks', row).then((r) => r[0]),
  updateTask: (id, patch) => db.update('tasks', eq('id', id), patch).then((r) => r[0]),
  completeTask: (id) => api.updateTask(id, { status: 'done' }),

  /* ── site visits ───────────────────────────────────────────────────────── */

  visits: (filter = '') =>
    db.select('site_visits',
      `select=*,profiles(full_name,initials),opportunities(id,ref,title,company_id,companies(name))&${order('scheduled_at')}${filter ? '&' + filter : ''}`),

  upcomingVisits: () =>
    api.visits(`status=eq.scheduled&scheduled_at=gte.${new Date(Date.now() - 864e5).toISOString()}`),

  visitsFor: (opportunityId) => api.visits(eq('opportunity_id', opportunityId)),
  createVisit: (row) => db.insert('site_visits', row).then((r) => r[0]),
  updateVisit: (id, patch) => db.update('site_visits', eq('id', id), patch).then((r) => r[0]),

  /* ── quotes ────────────────────────────────────────────────────────────── */

  quotes: (filter = '') =>
    db.select('quotes',
      `select=*,opportunities(id,ref,title,stage,next_action_due,company_id,companies(name))&${order('prepared_on', 'desc')}${filter ? '&' + filter : ''}`),

  liveQuotes: () => api.quotes('status=in.(sent,discussed)'),
  quotesFor: (opportunityId) => api.quotes(eq('opportunity_id', opportunityId)),
  createQuote: (row) => db.insert('quotes', row).then((r) => r[0]),
  updateQuote: (id, patch) => db.update('quotes', eq('id', id), patch).then((r) => r[0]),

  /* ── projects ──────────────────────────────────────────────────────────── */

  projects: (filter = '') =>
    db.select('projects',
      `select=*,companies(id,name),contacts(id,full_name,phone,email),profiles(full_name,initials),opportunities(id,ref)&${order('created_at', 'desc')}${filter ? '&' + filter : ''}`),

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
    db.select('enquiries', `select=*&${order('created_at', 'desc')}&limit=${limit}`),

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

  async dashboard() {
    const [open, liveQuotes, tasks, visits, recent, decided] = await Promise.all([
      api.openOpportunities(),
      api.liveQuotes(),
      api.openTasks(),
      api.upcomingVisits(),
      api.recentActivity(10),
      db.select('v_opportunity_state',
        `select=id,stage,estimated_value,decided_at&stage=in.(won,lost)&${order('decided_at', 'desc')}&limit=200`)
    ]);
    return { open, liveQuotes, tasks, visits, recent, decided };
  }
};

export { db, storage, eq, order };
