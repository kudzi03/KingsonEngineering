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
  manual: 'Off. The CRM sends no email. Alerts and acknowledgements are recorded in the outbox as not sent.',
  test: 'Test. Every email the CRM would send goes to the test mailbox below, and nowhere else.',
  live: 'Live. Office alerts, the morning digest and website acknowledgements go to their real recipients.'
};
const OUTBOX_KIND = { new_enquiry: 'Office alert', acknowledgement: 'Acknowledgement', digest: 'Morning digest' };
const OUTBOX_PILL = { sent: 'pill-won', failed: 'pill-lost', skipped: 'pill-overdue', pending: '', sending: '' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* What the dispatcher last reported. It is the only thing allowed to say an
   email provider exists: the screen never guesses. */
function mailState(s) {
  const at = s.mail_checked_at ? ` Checked ${stamp(s.mail_checked_at)}.` : '';
  if (s.mail_status?.startsWith('configured:')) {
    return { ok: true, tone: 'status-ok', text: `Email provider set up (${s.mail_status.slice(11)}).${at}` };
  }
  if (s.mail_status === 'not_configured') {
    return { ok: false, tone: 'status-off', text: `No email provider is set up, so the CRM cannot send email.${at}` };
  }
  return { ok: false, tone: 'status-bad', text: 'Not checked yet. The notification service has not run.' };
}

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
  const rules = rulesCard(me) + notifyCard(me);

  if (me?.role !== 'admin') {
    return `${demoCard()}${rules}`;
  }

  let outbox;
  [profiles, enquiries, outbox] = await Promise.all([api.profiles(), api.enquiries(60),
    api.outbox(20).catch(() => null)]);

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
      note: 'Staff handle the enquiries. Administrators can also change roles, deactivate people and set how email is sent.'
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
              ? `<a class="lnk" href="#/opportunity/${esc(e.opportunity_id)}">enquiry</a>`
              : '<span class="pill pill-overdue">not converted</span>'}</td>
        </tr>`).join('')}
      </tbody>
    </table>`) : empty('No website enquiries yet.',
      'Everything submitted on the website form lands here and in Enquiries.', { tone: 'quiet' }),
    { tight: true, note: `${pluralise(enquiries.length, 'submission')} · the last sixty` });

  return `${demoCard()}${rules}${outboxCard(outbox)}${users}${howTo}${log}`;
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
    </div>
    <p class="field-hint">Customer replies are recorded by hand with “Customer replied”. The CRM cannot
      see any inbox, and does not claim to.</p>`,
    { note: admin ? 'Administrators can change these' : 'Set by an administrator' });
}

/* Email notifications. What the CRM sends by itself is deliberately small:
   an office alert for each new website enquiry, one acknowledgement to the
   customer (website enquiries with an email address), and a morning digest
   for staff. It never follows a customer up on its own. */
function notifyCard(me) {
  if (!settings) return '';
  if (!('mail_status' in settings)) {
    return card('Email notifications', empty('Waiting for the database update.',
      'Notifications need the 2026-09-25 migrations. Until then nothing is sent.', { tone: 'quiet' }));
  }
  const admin = me?.role === 'admin';
  const off = admin ? '' : 'disabled';
  const st = mailState(settings);
  const mode = settings.email_mode;
  const box = (key, label) => `<label class="check"><input type="checkbox" data-set="${key}" data-type="bool"
      ${settings[key] ? 'checked' : ''} ${off}><span>${esc(label)}</span></label>`;
  const list = (key, id, label) => `<div class="field">
      <label for="${id}">${esc(label)}</label>
      <input class="inp" id="${id}" type="text" inputmode="email" data-set="${key}" data-type="emails"
        value="${esc((settings[key] || []).join(', '))}" placeholder="Every active administrator" ${off}>
      <p class="field-hint">Separate addresses with commas. Left blank, it goes to every active administrator.</p>
    </div>`;

  return card('Email notifications', `
    <p class="status-line ${st.tone}"><span class="status-dot" aria-hidden="true"></span><span>${esc(st.text)}</span></p>
    <div class="settings-grid">
      <div class="field">
        <label for="mail-mode">Sending</label>
        <select class="sel" id="mail-mode" data-set="email_mode" ${off}>
          <option value="manual"${mode === 'manual' ? ' selected' : ''}>Off</option>
          <option value="test"${mode === 'test' ? ' selected' : ''}>Test mailbox only</option>
          <option value="live"${mode === 'live' ? ' selected' : ''}${st.ok || mode === 'live' ? '' : ' disabled'}>Live${st.ok ? '' : ' (needs an email provider)'}</option>
        </select>
        <p class="field-hint">${esc(MODE[mode] || '')}</p>
      </div>
      <div class="field">
        <label for="test-box">Test mailbox</label>
        <input class="inp" id="test-box" type="email" data-set="test_mailbox" data-type="email"
          value="${esc(settings.test_mailbox || '')}" placeholder="A mailbox you control" ${off}>
        <p class="field-hint">Used only in test mode. Never a customer.</p>
      </div>
      ${list('alert_recipients', 'alert-to', 'New enquiry alerts go to')}
      ${list('digest_recipients', 'digest-to', 'The full morning digest goes to')}
      <div class="field">
        <label for="digest-hour">Morning digest at</label>
        <select class="sel" id="digest-hour" data-set="digest_hour" data-type="int" ${off}>
          ${[5, 6, 7, 8, 9, 10, 11].map((h) => `<option value="${h}"${h === settings.digest_hour ? ' selected' : ''}>${String(h).padStart(2, '0')}:00 Harare time</option>`).join('')}
        </select>
        <p class="field-hint">Working days only. Each owner also gets their own items.</p>
      </div>
      <div class="field">
        <label for="crm-url">CRM address in emails</label>
        <input class="inp" id="crm-url" type="url" data-set="crm_url" data-type="url"
          value="${esc(settings.crm_url || '')}" placeholder="https://kingson-engineering.vercel.app/crm/" ${off}>
        <p class="field-hint">Links in alerts and the digest open this address.</p>
      </div>
    </div>
    <div class="check-list">
      ${box('notify_new_enquiry', 'Email the office when a website enquiry arrives')}
      ${box('send_acknowledgement', 'Send the customer one acknowledgement with their reference (website enquiries with an email address)')}
      ${box('digest_enabled', 'Send the morning digest of overdue and due-today follow-ups')}
    </div>
    <p class="field-hint">The CRM never chases a customer by itself. Follow-ups to customers are written and sent by a person.</p>`,
    { note: admin ? 'Administrators can change these' : 'Set by an administrator' });
}

function outboxCard(rows) {
  if (!rows) return '';
  return card('Sent and waiting email', rows.length ? tableWrap(`
    <table class="tbl tbl-rows">
      <thead><tr><th scope="col">Queued</th><th scope="col">What</th><th scope="col">To</th><th scope="col">Status</th></tr></thead>
      <tbody>
        ${rows.map((r) => `<tr>
          <td><span class="td-main num">${esc(stamp(r.created_at))}</span></td>
          <td><span class="td-main">${esc(OUTBOX_KIND[r.kind] || r.kind)}</span>${r.opportunity_id
            ? `<a class="td-sub lnk" href="#/opportunity/${esc(r.opportunity_id)}">open the enquiry</a>` : ''}</td>
          <td><span class="td-sub">${esc(r.recipient || '—')}</span></td>
          <td><span class="pill ${OUTBOX_PILL[r.status] || ''}">${esc(r.status)}</span>${r.last_error
            ? `<span class="td-sub">${esc(r.last_error)}</span>` : ''}</td>
        </tr>`).join('')}
      </tbody>
    </table>`) : empty('Nothing queued yet.', 'Office alerts, acknowledgements and digests appear here.', { tone: 'quiet' }),
    { tight: true, note: 'The last twenty' });
}

/* One change handler for every notification field. Throws a readable error
   for a bad value, so nothing half-valid is saved. */
function settingPatch(el) {
  if (el.closest('[data-fu-days]')) return { quote_followup_working_days: Number(el.value) };
  const key = el.dataset?.set;
  if (!key) return null;
  const v = el.value.trim();
  switch (el.dataset.type) {
    case 'bool': return { [key]: el.checked };
    case 'int': return { [key]: Number(v) };
    case 'email':
      if (v && !EMAIL_RE.test(v)) throw new Error('That email address does not look right.');
      return { [key]: v || null };
    case 'emails': {
      const list = v.split(/[\s,;]+/).filter(Boolean).map((x) => x.toLowerCase());
      const bad = list.find((x) => !EMAIL_RE.test(x));
      if (bad) throw new Error(`“${bad}” is not an email address.`);
      return { [key]: [...new Set(list)] };
    }
    case 'url':
      if (v && !/^https:\/\/\S+$/.test(v)) throw new Error('Use the full https:// address.');
      return { [key]: v || null };
    default: return { [key]: v };
  }
}

export function mount(root, rerender, { me }) {
  root.addEventListener('change', async (e) => {
    if (e.target.closest('[data-demo]')) {
      setShowDemo(e.target.checked);
      /* Every list is re-queried with or without the demo rows. */
      location.reload();
      return;
    }
    let patch;
    try { patch = settingPatch(e.target); } catch (err) { toast(err.message, 'bad'); return; }
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
