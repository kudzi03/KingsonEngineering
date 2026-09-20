/* ═══════════════════════════════════════════════════════════════════════════
   content/crm.js — where a website enquiry goes
   ═══════════════════════════════════════════════════════════════════════════

   Both values here are public by design. `PUBLISHABLE_KEY` identifies the
   project to PostgREST; it grants nothing on its own. What the anonymous role
   may actually do is decided by row-level security in the database, and on
   this project that is exactly one thing: INSERT a row into public.enquiries,
   subject to length checks written into the policy itself. It cannot read that
   row back, cannot read any other table, and cannot update or delete anything.

   Never put a service-role key (`sb_secret_…`, or a JWT whose role claim is
   `service_role`) in this file or anywhere else the browser can reach it. That
   one does bypass row-level security.
   ═══════════════════════════════════════════════════════════════════════════ */

export const CRM = {
  url: 'https://fgzwcxwmaohowryzdgui.supabase.co',
  publishableKey: 'sb_publishable_QYbHrEJ06GpGDMlIqf5tzw_ijJpdtTV'
};

export const canSubmit = () => Boolean(CRM.url && CRM.publishableKey);
