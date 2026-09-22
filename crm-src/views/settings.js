/* ═══════════════════════════════════════════════════════════════════════════
   views/settings.js — working rules, people, and the raw intake log
   ═══════════════════════════════════════════════════════════════════════════

   Everybody sees the demonstration switch and the working rules (read-only
   for staff). People and the enquiry log are for administrators. Hiding them
   is a courtesy: the role change below is a normal PATCH, and Postgres
   refuses it — and any change to crm_settings — for anybody whose own
   profile does not say `admin`. Only that second mechanism matters.

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
import { showDemo, setShowDemo } from '../core/demo.js';

const DAY = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MODE = {
  manual: 'Manual — nothing is sent from the CRM. Staff send from their own mailbox or WhatsApp and record it here.',
  test: 'Test — the send function may only deliver to the test mailbox below, whatever address is asked for.',
  connected: 'Connected — Kingson’s own mailbox. Not available until the mailbox credentials exist.'
};

export const title = 'Settings';

let profiles = [];
let enquiries = [];
let settings = null;

/* Everybody sees this card. It changes only this browser. */
const demoCard = () => card('Demonstration records', `
  <p class="scope">Sample jobs and test submissions are flagged as demonstration data. They are
    left out of every list, count and total unless you switch them on here — and then only in
    this browser, with a warning strip across the top of every screen.</p>
  <label class="check"><input type="checkbox" data-demo ${showDemo() ? 'checked' : ''}>
    <span>Show demonstration records in this browser</span></label>`);

export async function render(_arg, { me }) {
  settings = await api.settings().catch(() => null);
  const rules = rulesCard(me);

  if (me?.role !== 'admin') {
    return `${demoCard()}${rules}`;
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

  return `${demoCard()}${rules}${users}${howTo}${log}`;
}

function rulesCard(me) {
  if (!settings) return card('Working rules', empty('The settings could not be read.', '', { tone: 'quiet' }));
  const admin = me?.role === 'admin';
  const days = (settings.working_weekdays || []).map((d) => DAY[d]).join(', ');
  return card('Working rules', `
    <div class="settings-grid">
      <div class="field">
        <label for="fu-days">Follow up a sent quotation after</label>
        <select class="sel" id="fu-days" data-fu-days ${admin ? '' : 'disabled'}>
          ${[1, 2, 3, 4, 5, 7, 10].map((n) => `<option value="${n}"${n === settings.quote_followup_working_days ? ' selected' : ''}>${n} working day${n === 1 ? '' : 's'}</option>`).join('')}
        </select>
        <p class="field-hint">Working days: ${esc(days)}. Applied when a quotation is marked sent.</p>
      </div>
      <div class="field">
        <label for="mail-mode">Email</label>
        <select class="sel" id="mail-mode" data-mail-mode ${admin ? '' : 'disabled'}>
          <option value="manual"${settings.email_mode === 'manual' ? ' selected' : ''}>Manual</option>
          <option value="test"${settings.email_mode === 'test' ? ' selected' : ''}>Test mailbox only</option>
          <option value="connected" disabled>Connected mailbox — needs Kingson’s credentials</option>
        </select>
        <p class="field-hint">${esc(MODE[settings.email_mode] || '')}</p>
      </div>
      ${settings.email_mode === 'test' || admin ? `<div class="field">
        <label for="test-box">Test mailbox</label>
        <input class="inp" id="test-box" type="email" data-test-box value="${esc(settings.test_mailbox || '')}"
          placeholder="a mailbox you control" ${admin ? '' : 'disabled'}>
        <p class="field-hint">Used only in test mode. Never a customer.</p>
      </div>` : ''}
    </div>
    <p class="field-hint">Customer replies are recorded by hand with “Customer replied”. The CRM cannot
      see any inbox, and does not claim to.</p>`,
    { note: admin ? 'Administrators can change these' : 'Set by an administrator' });
}

export function mount(root, rerender, { me }) {
  root.addEventListener('change', async (e) => {
    if (e.target.closest('[data-demo]')) {
      setShowDemo(e.target.checked);
      /* Every list is re-queried with or without the demo rows. */
      location.reload();
      return;
    }
    const patch = e.target.closest('[data-fu-days]') ? { quote_followup_working_days: Number(e.target.value) }
      : e.target.closest('[data-mail-mode]') ? { email_mode: e.target.value }
      : e.target.closest('[data-test-box]') ? { test_mailbox: e.target.value.trim() || null }
      : null;
    if (!patch) return;
    try {
      await api.updateSettings({ ...patch, updated_by: me?.id || null, updated_at: new Date().toISOString() });
      toast('Saved.');
      await rerender();
    } catch (err) {
      toast(err.message || 'That could not be saved.', 'bad');
      await rerender();
    }
  });

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
