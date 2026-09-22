/* ═══════════════════════════════════════════════════════════════════════════
   core/demo.js — demonstration records stay out of the real numbers
   ═══════════════════════════════════════════════════════════════════════════

   Every table carries `is_demo`. The seed data that shows how the system
   works, and anybody's test submissions, are flagged true. By default every
   list, count and total in this application asks the database for
   `is_demo = false` only, so a demonstration quotation can never be added to
   Kingson's real pipeline value.

   Showing them is a per-browser choice in Settings, and while it is on the
   whole application says so in a strip across the top. It is never stored on
   the server and never changes what anybody else sees.
   ═══════════════════════════════════════════════════════════════════════════ */

const KEY = 'kingson.showDemo';

export function showDemo() {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}

export function setShowDemo(on) {
  try {
    if (on) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
  } catch { /* private mode: stays off, which is the safe default */ }
}

/** The PostgREST filter to add to a list query, or '' when demo rows are shown. */
export const demoFilter = () => (showDemo() ? '' : 'is_demo=eq.false');

/** Append the demo filter to an existing query string. */
export const withDemo = (q) => {
  const f = demoFilter();
  return f ? (q ? `${q}&${f}` : f) : q;
};
