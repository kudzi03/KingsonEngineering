/* ═══════════════════════════════════════════════════════════════════════════
   views/settings.js — people, and the raw intake log
   ═══════════════════════════════════════════════════════════════════════════

   Admin only, and the rail hides it for staff. That is a courtesy: the role
   change below is a normal PATCH, and Postgres refuses it for anybody whose
   own profile does not say `admin`. Hiding the screen and enforcing the rule
   are two different mechanisms and only the second one matters.

   The enquiry log is here rather than in the pipeline because it is an audit
   trail, not a work queue: every row the website has ever posted, including
   the ones the honeypot caught. If somebody says "I filled in your form and
   heard nothing", this is the screen that settles it.
   ═══════════════════════════════════════════════════════════════════════════ */

import { api, db, eq } from '../core/api.js';
import { stamp, date, esc, pluralise } from '../core/fmt.js';
import { card, empty, avatar, tableWrap } from '../ui/components.js';
import { icon } from '../ui/icons.js';
import { toast } from '../ui/form.js';

export const title = 'Settings';

let profiles = [];
let enquiries = [];

export async function render(_arg, { me }) {
  if (me?.role !== 'admin') {
    return card('', empty('This screen is for administrators.',
      'Ask Mr Murandu if you need access to it.', { tone: 'quiet' }), { tight: true });
  }

  [profiles, enquiries] = await Promise.all([api.profiles(), api.enquiries(60)]);

  const users = card('People', tableWrap(`
    <table class="tbl tbl-rows">
      <thead><tr><th scope="col">Name</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col"></th></tr></thead>
      <tbody>
        ${profiles.map((p) => `<tr>
          <td><span class="lnk-strong">${avatar(p, 24)}<span>${esc(p.full_name)}</span></span></td>
          <td>
            <label class="sr-only" for="r-${esc(p.id)}">Role for ${esc(p.full_name)}</label>
            <select class="sel sel-inline" id="r-${esc(p.id)}" data-role="${esc(p.id)}"${p.id === me.id ? ' disabled title="You cannot change your own role"' : ''}>
              <option value="staff"${p.role === 'staff' ? ' selected' : ''}>Staff</option>
              <option value="admin"${p.role === 'admin' ? ' selected' : ''}>Administrator</option>
            </select>
          </td>
          <td>${p.active
            ? '<span class="pill pill-won">Active</span>'
            : '<span class="pill pill-lost">Deactivated</span>'}</td>
          <td class="ta-r">${p.id === me.id ? '<span class="dim">you</span>'
            : `<button type="button" class="btn-ghost btn-xs" data-active="${esc(p.id)}" data-to="${p.active ? 'false' : 'true'}">
                 ${p.active ? 'Deactivate' : 'Reactivate'}</button>`}</td>
        </tr>`).join('')}
      </tbody>
    </table>`), {
      tight: true,
      note: 'Staff run the pipeline. Administrators can also delete records and change roles.'
    });

  const howTo = card('Adding somebody', `
    <p class="scope">New accounts are created in the Supabase dashboard under
      <strong>Authentication → Users</strong>. A profile row appears here automatically the
      moment the account is created, as Staff. Change the role above if they need it.</p>
    <p class="scope">Deactivating somebody keeps everything they did — their calls, their
      quotations, their site visits — and stops them signing in. Deleting the account would
      take the history with it, which is why this screen does not offer it.</p>`);

  const log = card('Website enquiry log', enquiries.length ? tableWrap(`
    <table class="tbl tbl-rows">
      <thead><tr>
        <th scope="col">Received</th><th scope="col">From</th><th scope="col">Contact</th>
        <th scope="col">Needs</th><th scope="col">Became</th>
      </tr></thead>
      <tbody>
        ${enquiries.map((e) => `<tr${e.spam ? ' class="is-done"' : ''}>
          <td><span class="td-main num">${esc(stamp(e.created_at))}</span></td>
          <td><span class="td-main">${esc(e.name)}</span><span class="td-sub">${esc(e.company || '')}</span></td>
          <td><span class="td-sub">${esc(e.contact)}</span></td>
          <td><span class="td-sub">${esc(e.service || '—')}${e.location ? ' · ' + esc(e.location) : ''}</span></td>
          <td>${e.spam
            ? '<span class="pill pill-lost">Blocked as spam</span>'
            : e.opportunity_id
              ? `<a class="lnk" href="#/opportunity/${esc(e.opportunity_id)}">opportunity</a>`
              : '<span class="pill pill-overdue">not converted</span>'}</td>
        </tr>`).join('')}
      </tbody>
    </table>`) : empty('No website enquiries yet.',
      'Everything submitted on kingson-engineering.vercel.app lands here and in the pipeline.', { tone: 'quiet' }),
    { tight: true, note: `${pluralise(enquiries.length, 'submission')} · the last sixty` });

  return `${users}${howTo}${log}`;
}

export function mount(root, rerender, { me }) {
  root.addEventListener('change', async (e) => {
    const sel = e.target.closest('[data-role]');
    if (!sel) return;
    try {
      await db.update('profiles', eq('id', sel.dataset.role), { role: sel.value });
      toast('Role updated.');
      await rerender();
    } catch (err) {
      toast(err.message || 'That could not be changed.', 'bad');
      await rerender();
    }
  });

  root.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-active]');
    if (!b) return;
    try {
      await db.update('profiles', eq('id', b.dataset.active), { active: b.dataset.to === 'true' });
      toast(b.dataset.to === 'true' ? 'Reactivated.' : 'Deactivated.');
      await rerender();
    } catch (err) { toast(err.message || 'That could not be changed.', 'bad'); }
  });
}

export function sub() {
  return `${esc(pluralise(profiles.length, 'person', 'people'))}`;
}
