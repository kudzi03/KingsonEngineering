/* ═══════════════════════════════════════════════════════════════════════════
   core/auth.js — who is using this, and what they are allowed to do
   ═══════════════════════════════════════════════════════════════════════════

   `me.role` decides which buttons this application draws. It does NOT decide
   what the database will accept — that is row level security, and it is
   enforced in Postgres against the JWT whether this file exists or not.

   Hiding a delete button from a member of staff is a courtesy so they are not
   offered an action that will fail. If somebody opens the console and calls
   the API directly, Postgres still refuses. The two layers say the same thing
   and only one of them is load-bearing.
   ═══════════════════════════════════════════════════════════════════════════ */

import { loadSession, getSession, setSession, signIn, signOut, db } from './supabase.js';
import { assertStagesMatchDatabase } from './model.js';

let me = null;               // the profile row for the signed-in user
const listeners = new Set();

export const currentUser = () => me;
export const isAdmin = () => me?.role === 'admin';
export const isSignedIn = () => Boolean(getSession()?.access_token && me);

export function onAuthChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
const announce = () => listeners.forEach((fn) => fn(me));

/** The id inside the access token, without trusting anything else in it. */
function userIdFromToken(token) {
  try {
    const part = token.split('.')[1];
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json).sub || null;
  } catch { return null; }
}

/**
 * Turn a session into a profile. An account can authenticate and still not be
 * allowed in: `active = false` is how somebody who has left the company is
 * shut out without deleting the history of what they did.
 */
async function loadProfile() {
  const s = getSession();
  const id = s?.access_token ? userIdFromToken(s.access_token) : null;
  if (!id) { me = null; return null; }

  const rows = await db.select('profiles', `select=*&id=eq.${id}`);
  const row = rows[0] || null;

  if (!row) {
    /* Authenticated against GoTrue but no profile row. Either the trigger did
       not fire or an admin removed them. Either way this is not a usable
       session and pretending otherwise produces a CRM full of empty screens. */
    me = null;
    setSession(null);
    throw new Error('This account has no profile in the CRM. Ask an administrator to set one up.');
  }
  if (!row.active) {
    me = null;
    setSession(null);
    throw new Error('This account has been deactivated.');
  }
  me = row;
  return me;
}

/** Restore a session from storage on boot. Returns the profile, or null. */
export async function restore() {
  if (!loadSession()) { me = null; return null; }
  try {
    await loadProfile();
  } catch {
    me = null;                 // expired or revoked: show the sign-in screen
  }
  announce();
  return me;
}

export async function login(email, password) {
  await signIn(email, password);
  await loadProfile();
  announce();
  /* One integrity check per sign-in rather than per page: if the pipeline in
     Postgres and the pipeline in this bundle have diverged, say so in the
     console now, while somebody is watching. */
  assertStagesMatchDatabase(db).catch(() => {});
  return me;
}

export async function logout() {
  await signOut();
  me = null;
  announce();
}

export { signIn, signOut };
