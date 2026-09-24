/* ═══════════════════════════════════════════════════════════════════════════
   Database tests against a LOCAL copy of the live schema. Never production.

     PGLITE=file:///…/node_modules/@electric-sql/pglite/dist/index.js \
       node crm-src/supabase/tests/run-local.mjs

   PGlite is Postgres compiled to WebAssembly: an in-process database with
   real roles, RLS and triggers. The run:
     1. loads a stand-in for Supabase (00_supabase_shim.sql) and the live
        baseline (baseline/00_live_baseline.sql), plus a small seed;
     2. records how production behaves TODAY (section "live");
     3. applies migrations a and b;
     4. checks every behaviour the CRM relies on (section "after");
     5. applies b a second time and checks nothing moved.
   ═══════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(here, p), 'utf8');
const { PGlite } = await import(process.env.PGLITE || '@electric-sql/pglite');
const { pg_trgm } = await import((process.env.PGLITE || '@electric-sql/pglite').replace(/index\.js$/, 'contrib/pg_trgm.js'));
const db = new PGlite({ extensions: { pg_trgm } });

/* ── plumbing ──────────────────────────────────────────────────────────────── */
let pass = 0, fail = 0;
const ok = (cond, what, extra = '') => {
  if (cond) { pass++; console.log(`  PASS  ${what}`); }
  else { fail++; console.log(`  FAIL  ${what}${extra ? '  → ' + extra : ''}`); }
};
const q = async (sql, params) => (await db.query(sql, params)).rows;
const one = async (sql, params) => (await q(sql, params))[0];
const err = async (fn) => { try { await fn(); return null; } catch (e) { return e.message; } };

const ADMIN = '11111111-1111-1111-1111-111111111111';
const STAFF = '22222222-2222-2222-2222-222222222222';
const GONE  = '33333333-3333-3333-3333-333333333333';
const TESS  = '44444444-4444-4444-4444-444444444444';
const C1 = 'c1000000-0000-0000-0000-000000000001';
const C2 = 'c2000000-0000-0000-0000-000000000002';
const O1 = 'a1000000-0000-0000-0000-000000000001';
const O4 = 'a4000000-0000-0000-0000-000000000004';
const O5 = 'a5000000-0000-0000-0000-000000000005';

/** Run fn as a Supabase caller: role anon / authenticated / service_role. */
async function as(user, role, fn) {
  await db.exec(`select set_config('request.jwt.claim.sub', '${user || ''}', false),
                        set_config('request.jwt.claim.role', '${role}', false);
                 set role ${role};`);
  try { return await fn(); }
  finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false),
                                      set_config('request.jwt.claim.role', '', false);`);
  }
}
/** Try something and undo it, whatever happens. */
async function probe(fn) {
  await db.exec('begin');
  try { return await fn(); } finally { await db.exec('rollback'); }
}
const website = (row) => as(null, 'anon', () => q(
  `insert into public.enquiries (${Object.keys(row)}) values (${Object.keys(row).map((_, i) => '$' + (i + 1))})`,
  Object.values(row)));
const COUNTED = ['activities', 'companies', 'contacts', 'crm_settings', 'enquiries', 'files', 'opportunities',
                 'profiles', 'projects', 'quotes', 'site_visits', 'tasks'];
const counts = async () => Object.fromEntries(await Promise.all(COUNTED.map(async (t) =>
  [t, Number((await one(`select count(*) n from public.${t}`)).n)])));

/* ── load ─────────────────────────────────────────────────────────────────── */
await db.exec(read('00_supabase_shim.sql'));
const baseline = read('../baseline/00_live_baseline.sql')
  .split('\n').filter((l) => !/^create extension if not exists "(pg_stat_statements|pgcrypto|supabase_vault|uuid-ossp)"/.test(l))
  .join('\n');
await db.exec(baseline);
console.log('Loaded the live baseline.');

await db.exec(`
  insert into auth.users (id, email, raw_user_meta_data) values
    ('${ADMIN}', 'admin@k.test', '{"full_name":"Ada Admin"}'),
    ('${STAFF}', 'staff@k.test', '{"full_name":"Sam Staff"}'),
    ('${GONE}',  'gone@k.test',  '{"full_name":"Gil Gone"}'),
    ('${TESS}',  'tess@k.test',  '{"full_name":"Tess Two"}');
  update public.profiles set role = 'admin' where id = '${ADMIN}';
  update public.profiles set active = false where id = '${GONE}';
  insert into public.companies (id, name) values ('c0000000-0000-0000-0000-000000000001', 'Acme Steel');
  insert into public.contacts (id, company_id, full_name, phone, email) values
    ('${C1}', 'c0000000-0000-0000-0000-000000000001', 'Tendai Moyo', '0771234567', 'tendai@acme.co.zw'),
    ('${C2}', null, 'Rudo Banda', '+263 71 999 8888', null);
  insert into public.contacts (full_name, phone) values ('Office Line A', '0242 700 100'), ('Office Line B', '0242700100');
  insert into public.opportunities (id, title, company_id, contact_id, stage, source, owner_id, next_action, next_action_due) values
    ('${O1}', 'Warehouse roof', 'c0000000-0000-0000-0000-000000000001', '${C1}', 'quoting', 'phone', '${STAFF}', 'Send quotation', current_date),
    ('${O4}', 'Gates for Borrowdale', null, '${C2}', 'quoting', 'phone', '${STAFF}', 'Send quotation', current_date),
    ('${O5}', 'Mezzanine', null, '${C2}', 'contacted', 'referral', '${STAFF}', 'Call back', current_date);
  insert into public.opportunities (title, contact_id, stage, source, is_demo) values ('Demo job', '${C2}', 'new', 'phone', true);
  insert into public.quotes (opportunity_id, amount, currency, status) values ('${O1}', 12000, 'USD', 'sent'), ('${O4}', 3400, 'USD', 'sent');
  insert into public.tasks (title, opportunity_id, status) values
    ('Follow up quotation', '${O1}', 'open'), ('Return the drawings', '${O1}', 'open'),
    ('Chase deposit', '${O4}', 'open'), ('Return the drawings', '${O4}', 'open'),
    ('Book the site visit', '${O5}', 'open');
`);
await website({ name: 'Farai Chikwanha', contact: 'farai@example.co.zw', service: 'Roof steelwork',
                location: 'Msasa', source: 'website' });
console.log('Seeded.\n');

/* ── 1. production as it is today ──────────────────────────────────────────── */
console.log('live (before any migration):');
ok(/permission denied/.test(await err(() => as(null, 'anon', () => q('select * from public.enquiries')))),
   'anon cannot read enquiries');
ok(/permission denied/.test(await err(() => as(null, 'anon', () => q('select * from public.contacts')))),
   'anon cannot read contacts');
ok((await as(GONE, 'authenticated', () => q('select id from public.opportunities'))).length === 0,
   'a deactivated user reads no enquiries');
ok((await one(`select count(*) n from public.opportunities where title = 'Roof steelwork — Msasa'`)).n == 1,
   'a website enquiry becomes an enquiry (live conversion works)');

const selfPromote = await probe(async () => {
  await as(STAFF, 'authenticated', () => q(`update public.profiles set role = 'admin' where id = '${STAFF}'`));
  return (await one(`select role from public.profiles where id = '${STAFF}'`)).role;
});
ok(selfPromote === 'admin', 'CONFIRMED HOLE: staff can make themselves admin', selfPromote);
const selfRevive = await probe(async () => {
  await as(GONE, 'authenticated', () => q(`update public.profiles set active = true where id = '${GONE}'`));
  return (await one(`select active from public.profiles where id = '${GONE}'`)).active;
});
ok(selfRevive === false, 'a deactivated user cannot reactivate themselves (their own row is hidden from them)', String(selfRevive));
ok((await probe(() => as(STAFF, 'authenticated', () =>
   q(`update public.activities set body = 'rewritten' where opportunity_id = '${O1}' returning id`)))).length > 0,
   'CONFIRMED: staff can rewrite timeline entries today');
const demoInsert = await probe(async () => err(() =>
  website({ name: 'Bot', contact: 'bot@spam.test', is_demo: true, source: 'website' })));
ok(demoInsert === null, 'CONFIRMED: the public form may set internal columns (is_demo)', demoInsert);
const dupe = await probe(async () => {
  await website({ name: 'Tendai M', contact: '+263 77 123 4567', source: 'website' });
  return Number((await one(`select count(*) n from public.contacts where full_name like 'Tendai%'`)).n);
});
ok(dupe === 2, 'CONFIRMED: "+263 77 123 4567" makes a duplicate of 0771234567 today', String(dupe));

/* ── 2. migrate ────────────────────────────────────────────────────────────── */
const before = await counts();
await db.exec(read('../migrations/20260925_a_sources.sql'));
await db.exec(read('../migrations/20260925_b_production_readiness.sql'));
const after = await counts();
console.log('\nmigrations a and b applied.\n\nafter:');
ok(JSON.stringify(before) === JSON.stringify(after), 'no row added or removed by the migration', JSON.stringify({ before, after }));
ok((await one(`select phone_norm from public.contacts where id = '${C1}'`)).phone_norm === '263771234567',
   'phones are normalised (0771234567 → 263771234567)');
ok((await one(`select phone_norm from public.contacts where id = '${C2}'`)).phone_norm === '263719998888',
   'and so is +263 71 999 8888');

// security
ok(/cannot change your own role/.test(await err(() => as(STAFF, 'authenticated', () =>
   q(`update public.profiles set role = 'admin' where id = '${STAFF}'`)))), 'staff can no longer promote themselves');
ok(/cannot change your own role/.test(await err(() => as(GONE, 'authenticated', () =>
   q(`update public.profiles set active = true where id = '${GONE}'`)))),
   'a deactivated user still cannot reactivate themselves, now that they can see their own row');
ok((await as(STAFF, 'authenticated', () => q(`update public.profiles set role = 'admin' where id = '${TESS}' returning id`))).length === 0,
   'staff cannot change somebody else');
ok((await probe(() => as(ADMIN, 'authenticated', () =>
   q(`update public.profiles set role = 'admin', active = false where id = '${TESS}' returning role, active`))))[0]?.active === false,
   'an administrator can change somebody else');
ok(/cannot change your own role/.test(await err(() => as(ADMIN, 'authenticated', () =>
   q(`update public.profiles set active = false where id = '${ADMIN}'`)))), 'an administrator cannot lock themselves out');
ok((await probe(() => as(STAFF, 'authenticated', () =>
   q(`update public.profiles set full_name = 'Samuel Staff' where id = '${STAFF}' returning id`)))).length === 1,
   'people can still edit their own name');
const selfRow = await as(GONE, 'authenticated', () => q('select id, active from public.profiles'));
ok(selfRow.length === 1 && selfRow[0].active === false, 'a deactivated user sees only their own profile, marked inactive');
ok(/permission denied/.test(await err(() =>
   website({ name: 'Bot', contact: 'bot@spam.test', is_demo: true, source: 'website' }))),
   'the public form can no longer set internal columns');
ok(await err(() => probe(() => website({ name: 'Old path', contact: 'old@path.test', service: 'Gates',
   location: 'Avondale', drawings: 'No', message: 'hi', page: '/', honeypot: null, source: 'website' }))) === null,
   'the website\'s current insert (every column it sends) still works');
for (const [fn, args] of [['create_enquiry', "p_full_name => 'x', p_phone => '0771000000', p_description => 'x'"],
                          ['global_search', "'acme'"], ['find_contact_matches', "'0771234567'"],
                          ['management_summary', 'current_date, current_date'], ['claim_outbox', '5']]) {
  ok(/permission denied/.test(await err(() => as(null, 'anon', () => q(`select * from public.${fn}(${args})`)))),
     `anon cannot run ${fn}`);
}
ok(/permission denied/.test(await err(() => as(STAFF, 'authenticated', () => q('select * from public.claim_outbox(5)')))),
   'staff cannot run claim_outbox');
ok((await as(STAFF, 'authenticated', () =>
   q(`update public.activities set body = 'rewritten' where opportunity_id = '${O1}' returning id`))).length === 0,
   'staff can no longer rewrite the timeline');
ok((await probe(() => as(ADMIN, 'authenticated', () =>
   q(`update public.activities set body = body where opportunity_id = '${O1}' returning id`)))).length > 0,
   'an administrator can still correct it');
ok((await as(STAFF, 'authenticated', () => q(`insert into public.activities (opportunity_id, kind, body, actor_id)
   values ('${O1}', 'note', 'Called, no answer', '${STAFF}') returning id`))).length === 1, 'staff still add to the timeline');
ok((await one(`select has_table_privilege('authenticated', 'public.crm_settings', 'truncate') t`)).t === false,
   'authenticated can no longer truncate crm_settings');
ok((await one(`select has_table_privilege('authenticated', 'public.v_opportunity_state', 'insert') t`)).t === false,
   'the view is read-only');

// website intake
const sub = await as(null, 'anon', () => one(`select public.submit_enquiry($1::jsonb) r`,
  [JSON.stringify({ name: 'Chipo Ncube', company: 'Ncube Farms', contact: 'chipo@ncube.co.zw',
                    service: 'Structural steelwork', location: 'Norton', message: 'Barn frame', page: '/' })]));
ok(/^ENQ-\d{4}$/.test(sub.r.ref || ''), `submit_enquiry returns the reference (${sub.r.ref})`);
const conv = await one(`select e.opportunity_id, o.stage, o.title, t.task_type, t.title tt
  from public.enquiries e join public.opportunities o on o.id = e.opportunity_id
  join public.tasks t on t.opportunity_id = o.id where o.ref = $1`, [sub.r.ref]);
ok(conv?.stage === 'new' && conv.title === 'Structural steelwork — Norton', 'the enquiry is created, titled as before');
ok(conv?.task_type === 'enquiry_response' && /^Respond to website enquiry from Chipo/.test(conv.tt),
   'its follow-up task is typed enquiry_response');
const outbox = await q(`select kind, recipient from public.notification_outbox where opportunity_id = $1 order by kind`, [conv.opportunity_id]);
ok(outbox.length === 2 && outbox[0].kind === 'acknowledgement' && outbox[0].recipient === 'chipo@ncube.co.zw'
   && outbox[1].kind === 'new_enquiry', 'one office alert and one acknowledgement are queued', JSON.stringify(outbox));
await q(`select public.queue_new_enquiry_alert($1)`, [conv.opportunity_id]);
ok((await one(`select count(*) n from public.notification_outbox where opportunity_id = $1`, [conv.opportunity_id])).n == 2,
   'queuing the alert again does not duplicate it');
const phoneSub = await as(null, 'anon', () => one(`select public.submit_enquiry($1::jsonb) r`,
  [JSON.stringify({ name: 'Tendai M', contact: '+263 77 123 4567', service: 'Gates' })]));
const reused = await one(`select e.contact_id from public.enquiries e join public.opportunities o on o.id = e.opportunity_id where o.ref = $1`, [phoneSub.r.ref]);
ok(reused?.contact_id === C1, 'a "+263 77 123 4567" website enquiry now finds the existing 0771234567 customer');
ok((await q(`select kind from public.notification_outbox o join public.opportunities p on p.id = o.opportunity_id where p.ref = $1`, [phoneSub.r.ref])).map((r) => r.kind).join() === 'new_enquiry',
   'a phone-only enquiry gets an office alert and no acknowledgement');
const spam = await as(null, 'anon', () => one(`select public.submit_enquiry($1::jsonb) r`,
  [JSON.stringify({ name: 'Spam Bot', contact: 'spam@bot.test', honeypot: 'http://x' })]));
ok(spam.r.ok === true && !spam.r.ref, 'a honeypot submission is accepted silently, with no reference');
ok((await one(`select count(*) n from public.enquiries where name = 'Spam Bot' and spam and opportunity_id is null`)).n == 1
   && (await one(`select count(*) n from public.notification_outbox where recipient = 'spam@bot.test'`)).n == 0,
   'and it creates no enquiry and queues nothing');
ok(/name/.test(await err(() => as(null, 'anon', () => q(`select public.submit_enquiry('{"name":"x","contact":"12345"}'::jsonb)`)))),
   'submit_enquiry refuses a one-letter name');

// claiming work
const claimed = await as(null, 'service_role', () => q('select id from public.claim_outbox(50)'));
const again = await as(null, 'service_role', () => q('select id from public.claim_outbox(50)'));
ok(claimed.length >= 3 && again.length === 0, `each outbox row is claimed exactly once (${claimed.length} then ${again.length})`);
ok((await as(STAFF, 'authenticated', () => q('select id from public.notification_outbox'))).length === 0
   && (await as(ADMIN, 'authenticated', () => q('select id from public.notification_outbox'))).length >= 3,
   'only administrators can read the outbox');

// quick capture
const ce = (user, args) => as(user, 'authenticated', () => one(`select * from public.create_enquiry(${args})`));
const n1 = await ce(STAFF, `p_full_name => 'Nyasha Dube', p_phone => '0772000111', p_description => 'Gate repair'`);
ok(n1.contact_reused === false && /^ENQ-/.test(n1.ref), 'a new caller becomes a new contact and enquiry');
const o1 = await one(`select stage, owner_id, next_action, next_action_due = public.add_working_days(public.harare_today(), 1) due_ok,
  (select count(*) from public.activities a where a.opportunity_id = o.id and a.kind = 'enquiry') acts,
  (select count(*) from public.notification_outbox x where x.opportunity_id = o.id) queued
  from public.opportunities o where id = $1`, [n1.opportunity_id]);
ok(o1.stage === 'new' && o1.owner_id === STAFF && o1.due_ok && o1.acts == 1 && o1.queued == 0,
   'it is New, owned by the person who took the call, due next working day, logged, and alerts nobody');
const n2 = await ce(STAFF, `p_full_name => 'N Dube', p_phone => '+263 77 200 0111', p_description => 'Second job'`);
ok(n2.contact_reused === true && n2.contact_id === n1.contact_id, 'the same number in another format reuses the contact');
ok(/More than one contact/.test(await err(() => ce(STAFF, `p_full_name => 'Who', p_phone => '0242700100', p_description => 'x'`))),
   'a number two contacts share is refused until a person chooses');
const n3 = await ce(STAFF, `p_full_name => 'Tendai''s colleague', p_phone => '0771234567', p_description => 'x', p_force_new => true`);
ok(n3.contact_reused === false && n3.contact_id !== C1, '"create a new customer" makes a new contact even on a shared phone');
ok(/already has that email/.test(await err(() => ce(STAFF, `p_full_name => 'Imposter', p_email => 'Tendai@Acme.co.zw', p_description => 'x', p_force_new => true`))),
   'but never a second contact with the same email');
const n4 = await ce(STAFF, `p_contact_id => '${C2}', p_email => 'tendai@acme.co.zw', p_description => 'Chosen by hand'`);
ok(n4.contact_id === C2 && (await one(`select email from public.contacts where id = '${C2}'`)).email === null,
   'choosing a customer by hand uses them, and never takes another contact\'s email');
ok(/Who is asking/.test(await err(() => ce(STAFF, `p_phone => '0771111111', p_description => 'x'`))), 'a name is required');
ok(/phone number or an email/.test(await err(() => ce(STAFF, `p_full_name => 'Anon', p_description => 'x'`))), 'a phone or email is required');
ok(/not authorised/.test(await err(() => ce(GONE, `p_full_name => 'x', p_phone => '0771000000'`))), 'a deactivated user cannot create enquiries');
const ec = await ce(STAFF, `p_full_name => 'Old Client', p_phone => '0773333444', p_description => 'Repeat work', p_source => 'existing_customer'`);
ok((await one(`select source from public.opportunities where id = $1`, [ec.opportunity_id])).source === 'existing_customer',
   'the new sources (existing customer, social media) are accepted');
const w1 = await as(null, 'service_role', () => one(`select * from public.create_enquiry(p_full_name => 'WA Caller', p_phone => '0774444555',
  p_description => 'via WhatsApp', p_source => 'whatsapp', p_external_ref => 'wa:msg-1', p_notify => true)`));
const w2 = await as(null, 'service_role', () => one(`select * from public.create_enquiry(p_full_name => 'WA Caller', p_phone => '0774444555',
  p_description => 'via WhatsApp', p_source => 'whatsapp', p_external_ref => 'wa:msg-1', p_notify => true)`));
ok(w1.opportunity_id === w2.opportunity_id, 'a channel retry with the same external reference returns the same enquiry');
ok((await one(`select count(*) n from public.notification_outbox where opportunity_id = $1`, [w1.opportunity_id])).n == 1,
   'and alerts the office once');

// matching and search
const fm = (user, args) => as(user, 'authenticated', () => q(`select * from public.find_contact_matches(${args})`));
const m1 = await fm(STAFF, `p_phone => '+263771234567'`);
ok(m1.some((r) => r.contact_id === C1 && r.strength === 'strong' && r.match === 'phone'), '+263771234567 is a strong match for 0771234567');
ok((await fm(STAFF, `p_email => ' TENDAI@acme.co.zw '`)).some((r) => r.contact_id === C1 && r.match === 'email'), 'email matches ignore case and spaces');
ok((await fm(STAFF, `p_name => 'Rudo'`)).some((r) => r.contact_id === C2 && r.strength === 'soft'), 'a similar name is only a soft suggestion');
ok((await fm(GONE, `p_phone => '0771234567'`)).length === 0, 'a deactivated user finds nobody');
const gs = (user, text, demo = false) => as(user, 'authenticated', () => q(`select * from public.global_search($1, $2, 8)`, [text, demo]));
ok((await gs(STAFF, '0771 234')).some((r) => r.kind === 'contact' && r.id === C1), 'search finds a contact by part of a phone number');
const ref1 = (await one(`select ref from public.opportunities where id = '${O1}'`)).ref;
const byRef = await gs(STAFF, ref1.toLowerCase());
ok(byRef[0]?.kind === 'enquiry' && byRef[0].id === O1 && byRef[0].rank === 0, `an exact ENQ reference (${ref1}) ranks first`);
const qref = (await one(`select reference from public.quotes where opportunity_id = '${O1}'`)).reference;
ok((await gs(STAFF, qref)).some((r) => r.kind === 'quote' && r.id === O1), `a quotation number (${qref}) finds its enquiry`);
ok(!(await gs(STAFF, 'Demo job')).length && (await gs(STAFF, 'Demo job', true)).length === 1, 'demonstration records only appear when asked for');
ok((await gs(GONE, 'Tendai')).length === 0, 'a deactivated user searches nothing');

// tasks and the lifecycle
const types = Object.fromEntries((await q(`select title || '@' || coalesce(opportunity_id::text, '') k, task_type from public.tasks`)).map((r) => [r.k, r.task_type]));
ok(types[`Follow up quotation@${O1}`] === 'quote_followup' && types[`Chase deposit@${O4}`] === 'quote_followup'
   && types[`Return the drawings@${O1}`] === 'general' && types[`Book the site visit@${O5}`] === 'general',
   'existing tasks are typed from their titles, exactly as the old rules read them');
ok(Object.entries(types).some(([k, v]) => k.startsWith('Respond to website enquiry from Farai') && v === 'enquiry_response'),
   'the enquiry that arrived before the migration has its task typed too');
const farai = (await one(`select opportunity_id from public.enquiries where name = 'Farai Chikwanha'`)).opportunity_id;
await as(STAFF, 'authenticated', () => q(`update public.opportunities set stage = 'contacted' where id = $1`, [farai]));
ok((await one(`select status from public.tasks where opportunity_id = $1 and task_type = 'enquiry_response'`, [farai])).status === 'done',
   'moving an enquiry out of New completes its response task');
await as(STAFF, 'authenticated', () => q(`select public.mark_customer_replied($1, 'phone', 'Wants a revision')`, [O1]));
const afterReply = await one(`select o.next_action, o.stage,
  (select status from public.quotes where opportunity_id = o.id) qs,
  (select string_agg(title || ':' || status, ',' order by title) from public.tasks where opportunity_id = o.id) ts
  from public.opportunities o where id = '${O1}'`);
ok(afterReply.next_action === 'Respond to customer reply' && afterReply.qs === 'discussed', 'a reply puts the next move on Kingson');
ok(afterReply.ts === 'Follow up quotation:cancelled,Return the drawings:open',
   'and stops the chase: the follow-up task is cancelled, other work is left alone', afterReply.ts);
ok(/not authorised/.test(await err(() => as(GONE, 'authenticated', () => q(`select public.decide_opportunity('${O1}', 'won')`)))),
   'a deactivated user cannot decide an enquiry');
await as(STAFF, 'authenticated', () => q(`select public.decide_opportunity('${O1}', 'won')`));
const won = await one(`select o.stage, o.won_value, (select string_agg(title || ':' || status, ',' order by title) from public.tasks where opportunity_id = o.id) ts
  from public.opportunities o where id = '${O1}'`);
ok(won.stage === 'won' && Number(won.won_value) === 12000, 'Won takes the quoted value when none is typed');
ok(won.ts === 'Follow up quotation:cancelled,Return the drawings:open', 'Won cancels sales tasks and keeps real work', won.ts);
ok(/Choose why/.test(await err(() => as(STAFF, 'authenticated', () => q(`select public.decide_opportunity('${O4}', 'lost')`)))),
   'Lost needs a reason');
ok(/Say why/.test(await err(() => as(STAFF, 'authenticated', () => q(`select public.decide_opportunity('${O4}', 'lost', null, null, 'other')`)))),
   '"Other" needs a note');
await as(STAFF, 'authenticated', () => q(`select public.decide_opportunity('${O4}', 'lost', null, null, 'price')`));
ok((await one(`select count(*) n from public.tasks where opportunity_id = '${O4}' and status = 'open'`)).n == 0,
   'Lost cancels every open task, as it did before');

// settings and reporting
ok((await as(STAFF, 'authenticated', () => q(`update public.crm_settings set email_mode = 'live' returning id`))).length === 0,
   'staff cannot change settings');
const st = await one(`select email_mode, digest_hour, mail_status, notify_new_enquiry from public.crm_settings`);
ok(st.email_mode === 'manual' && st.digest_hour === 7 && st.mail_status === 'unknown' && st.notify_new_enquiry,
   'settings start with email off and honest status');
ok(/check/.test(await err(() => as(ADMIN, 'authenticated', () => q(`update public.crm_settings set email_mode = 'connected'`)))),
   'the old "connected" mode no longer exists');
const ms = await as(STAFF, 'authenticated', () => one(`select public.management_summary(current_date - 30, current_date) r`));
const msDemo = await as(STAFF, 'authenticated', () => one(`select public.management_summary(current_date - 30, current_date, true) r`));
ok(ms.r.enquiries >= 8 && msDemo.r.enquiries === ms.r.enquiries + 1 && ms.r.won === 1 && ms.r.lost === 1,
   `management summary counts the period and leaves demo out (${ms.r.enquiries} vs ${msDemo.r.enquiries})`);

/* ── 3. the migration can run twice ────────────────────────────────────────── */
const mid = await counts();
const pol = (await one(`select count(*) n from pg_policies`)).n;
const e2 = await err(() => db.exec(read('../migrations/20260925_b_production_readiness.sql')));
ok(e2 === null, 'migration b runs a second time without error', e2);
ok(JSON.stringify(mid) === JSON.stringify(await counts()) && (await one(`select count(*) n from pg_policies`)).n === pol,
   'and changes nothing the second time');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
