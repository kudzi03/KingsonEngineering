/* ═══════════════════════════════════════════════════════════════════════════
   core/config.js — where the database is
   ═══════════════════════════════════════════════════════════════════════════

   Both values here are public by design and are meant to ship to the browser.
   The publishable key identifies the project; it grants nothing on its own.
   Every row this application can read or write is decided by Postgres row
   level security against the signed-in user's JWT, not by this key.

   The key that *would* matter — the service role key — is not in this
   repository, is not in this bundle, and must never be. If you ever find
   yourself pasting a key that starts `sb_secret_` or a JWT whose payload says
   `"role":"service_role"` into anything under this directory, stop.
   ═══════════════════════════════════════════════════════════════════════════ */

export const SUPABASE_URL = 'https://fgzwcxwmaohowryzdgui.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_QYbHrEJ06GpGDMlIqf5tzw_ijJpdtTV';

export const FILES_BUCKET = 'kingson-files';

/* Kingson works in Harare. Dates in this application are that day, not the
   browser's — an estimator in a different timezone must not see a follow-up
   fall due on the wrong morning. */
export const TZ = 'Africa/Harare';
