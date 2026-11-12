#!/usr/bin/env node
/* Tests for api/enquiry.js. Node only — no browser, no packages, no network.

   Google is replaced by an in-process fake: every outbound fetch is captured
   and answered here, so nothing can reach a real spreadsheet. The service
   account key is generated fresh for the run and thrown away.

     node tools/test-enquiry-api.mjs
*/
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { generateKeyPairSync, createVerify } from 'node:crypto';
import { Readable } from 'node:stream';
import { ENQUIRY } from '../content/runtime-copy.js';

const handler = createRequire(import.meta.url)('../api/enquiry.js');
const { internals } = handler;

/* ── a fake Google ───────────────────────────────────────────────────────── */
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const PEM = privateKey.export({ type: 'pkcs8', format: 'pem' });
const sheet = { rows: [], calls: [], failAppend: 0, failToken: false, failRead: false };

globalThis.fetch = async (url, init = {}) => {
  url = String(url);
  sheet.calls.push({ url, method: init.method || 'GET' });
  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  if (url === 'https://oauth2.googleapis.com/token') {
    if (sheet.failToken) return json(401, { error: 'invalid_grant', error_description: 'SECRET-GOOGLE-DETAIL' });
    const assertion = new URLSearchParams(init.body).get('assertion');
    const [h, c, s] = assertion.split('.');
    assert.ok(createVerify('RSA-SHA256').update(`${h}.${c}`).verify(publicKey, s, 'base64url'), 'JWT is signed with the service-account key');
    const claim = JSON.parse(Buffer.from(c, 'base64url'));
    assert.equal(claim.scope, 'https://www.googleapis.com/auth/spreadsheets');
    assert.equal(claim.iss, 'enquiries@test-project.iam.gserviceaccount.com');
    assert.ok(claim.exp - claim.iat <= 3600);
    return json(200, { access_token: 'fake-token', expires_in: 3600 });
  }
  assert.ok(url.startsWith('https://sheets.googleapis.com/v4/spreadsheets/SHEET123/'), 'only the configured spreadsheet is contacted: ' + url);
  assert.equal(init.headers.Authorization, 'Bearer fake-token');
  if (url.includes('values:batchGet')) {
    if (sheet.failRead) return json(500, {});
    const col = (i) => ({ values: [sheet.rows.map((r) => r[i])] });
    return json(200, { valueRanges: [col(0), col(1), col(13)] });
  }
  if (url.includes(':append')) {
    assert.ok(url.includes('valueInputOption=RAW'), 'values are written RAW, never parsed as formulas');
    if (sheet.failAppend > 0) { sheet.failAppend--; return json(503, { error: { message: 'SECRET-GOOGLE-DETAIL' } }); }
    sheet.rows.push(JSON.parse(init.body).values[0]);
    return json(200, { updates: { updatedRows: 1 } });
  }
  throw new Error('unexpected fetch ' + url);
};

function configure(on = true) {
  for (const k of ['GOOGLE_SHEET_ID', 'GOOGLE_SERVICE_ACCOUNT_EMAIL', 'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY', 'GOOGLE_SHEET_TAB']) delete process.env[k];
  if (!on) return;
  process.env.GOOGLE_SHEET_ID = 'SHEET123';
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'enquiries@test-project.iam.gserviceaccount.com';
  process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = PEM.replace(/\n/g, '\\n');   // as pasted into Vercel
}

/* ── a fake request / response ───────────────────────────────────────────── */
let ipCounter = 0;
async function call({ method = 'POST', body, headers = {}, raw, parsed = true, ip } = {}) {
  const text = raw !== undefined ? raw : JSON.stringify(body);
  const req = parsed && raw === undefined ? { body } : Readable.from([Buffer.from(text)]);
  req.method = method;
  req.headers = {
    'content-type': 'application/json', origin: 'https://www.kingsonengineering.co.zw',
    host: 'www.kingsonengineering.co.zw', 'sec-fetch-site': 'same-origin',
    'x-forwarded-for': ip || `198.51.100.${++ipCounter % 250}`, 'content-length': String(Buffer.byteLength(text || '')),
    ...headers
  };
  for (const k of Object.keys(req.headers)) if (req.headers[k] === null) delete req.headers[k];
  const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, end(b) { this.body = b; } };
  await handler(req, res);
  return { status: res.statusCode, headers: res.headers, json: JSON.parse(res.body) };
}
const good = (over = {}) => ({
  company: 'Local QA Builders', contact: 'qa@example.invalid', service: 'Fibre laser cutting',
  location: 'Msasa, Harare', drawings: 'Yes — DXF or DWG', orgdetails: 'building contractor',
  description: 'Twelve 6 mm mild steel plates to drawing.\nLocal test only.', page: '/fibre-laser-cutting-harare',
  website: '', elapsed: 9000, ...over
});

const errors = [];
const realError = console.error;
console.error = (...a) => errors.push(a.join(' '));
const results = [];
const test = async (name, fn) => {
  internals.reset(); sheet.rows = []; sheet.calls = []; sheet.failAppend = 0; sheet.failToken = false; sheet.failRead = false; errors.length = 0;
  configure(true);
  try { await fn(); results.push(['PASS', name]); }
  catch (e) { results.push(['FAIL', name + ' — ' + e.message]); }
};

/* ── the tests ───────────────────────────────────────────────────────────── */

await test('option lists match the form copy', async () => {
  assert.deepEqual(internals.SERVICES, ENQUIRY.serviceOptions);
  assert.deepEqual(internals.DRAWINGS, ENQUIRY.drawingOptions);
});

await test('a valid enquiry writes exactly one row with the documented columns', async () => {
  const r = await call({ body: good() });
  assert.equal(r.status, 200); assert.equal(r.json.ok, true);
  assert.match(r.json.ref, /^KE-\d{6}-[A-HJ-NP-Z2-9]{4}$/);
  assert.equal(sheet.rows.length, 1);
  const row = sheet.rows[0];
  assert.equal(row.length, internals.COLUMNS.length);
  assert.match(row[0], /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  assert.equal(row[1], r.json.ref);
  assert.deepEqual(row.slice(2, 13), ['Local QA Builders', '', 'qa@example.invalid', 'Fibre laser cutting', 'Msasa, Harare',
    'Yes — DXF or DWG', 'building contractor', 'Twelve 6 mm mild steel plates to drawing.\nLocal test only.', '/fibre-laser-cutting-harare', 'New', '']);
  assert.equal(r.headers['cache-control'], 'no-store');
});

await test('a phone contact goes to the phone column; both are kept when both are given', async () => {
  await call({ body: good({ contact: '+263 77 000 0000' }) });
  assert.deepEqual(sheet.rows[0].slice(3, 5), ['+263 77 000 0000', '']);
  await call({ body: good({ contact: 'Call 0770000000 or mail qa@example.invalid', description: 'second' }) });
  assert.deepEqual(sheet.rows[1].slice(3, 5), ['0770000000', 'qa@example.invalid']);
});

await test('spreadsheet formula injection is neutralised in every text column', async () => {
  const r = await call({ body: good({ company: '=HYPERLINK("http://evil.example","x")', location: '+cmd|calc', orgdetails: '@SUM(A1)',
    description: '-2+3\n=IMPORTXML("http://evil.example")', contact: '=1+1@evil.example.invalid' }) });
  assert.equal(r.status, 200);
  const row = sheet.rows[0];
  for (const i of [2, 4, 6, 8, 9]) assert.ok(!/^[=+\-@]/.test(row[i]), `column ${i} is inert: ${row[i]}`);
  assert.equal(row[2][0], "'");
  assert.ok(!/[^0-9+()\- ]/.test(row[3]), 'phone column holds phone characters only');
});

await test('control characters are stripped and lengths are capped', async () => {
  await call({ body: good({ company: 'A\u0000B\u0007C\nD', description: 'x'.repeat(6000) }) });
  assert.equal(sheet.rows[0][2], 'A B C D');
  assert.equal(sheet.rows[0][9].length, 4000);
});

await test('missing and malformed required fields are refused with field names', async () => {
  for (const [over, field] of [[{ company: 'A' }, 'company'], [{ contact: '0772' }, 'contact'], [{ description: '  ' }, 'description'],
    [{ service: 'Free pizza' }, 'service'], [{ drawings: '<script>' }, 'drawings'], [{ company: 42 }, 'company']]) {
    const r = await call({ body: good(over) });
    assert.equal(r.status, 400, field); assert.ok(r.json.fields.includes(field), field);
  }
  assert.equal(sheet.rows.length, 0);
  assert.equal(sheet.calls.length, 0, 'Google is not contacted for an invalid enquiry');
});

await test('an unknown source page is replaced, never trusted', async () => {
  await call({ body: good({ page: 'https://evil.example/=cmd' }) });
  assert.equal(sheet.rows[0][10], '/');
});

await test('honeypot and too-fast submissions are refused without contacting Google', async () => {
  assert.equal((await call({ body: good({ website: 'http://spam.example' }) })).status, 400);
  assert.equal((await call({ body: good({ elapsed: 300 }) })).status, 400);
  assert.equal((await call({ body: good({ elapsed: undefined }) })).status, 400);
  assert.equal(sheet.calls.length, 0);
});

await test('only same-origin JSON POSTs are accepted', async () => {
  assert.equal((await call({ method: 'GET' })).status, 405);
  assert.equal((await call({ method: 'OPTIONS' })).status, 405);
  assert.equal((await call({ body: good(), headers: { 'content-type': 'text/plain' } })).status, 415);
  assert.equal((await call({ body: good(), headers: { 'content-type': 'application/x-www-form-urlencoded' } })).status, 415);
  assert.equal((await call({ body: good(), headers: { origin: 'https://evil.example' } })).status, 403);
  assert.equal((await call({ body: good(), headers: { origin: null } })).status, 403);
  assert.equal((await call({ body: good(), headers: { 'sec-fetch-site': 'cross-site' } })).status, 403);
  const preview = await call({ body: good(), headers: { origin: 'https://kingson-preview.vercel.app', host: 'internal', 'x-forwarded-host': 'kingson-preview.vercel.app' } });
  assert.equal(preview.status, 200, 'a preview deployment is same-origin with itself');
  const r = await call({ body: good({ description: 'cors check' }) });
  assert.ok(!Object.keys(r.headers).some((k) => k.startsWith('access-control')), 'no CORS headers are ever sent');
});

await test('oversized and unparseable bodies are refused', async () => {
  assert.equal((await call({ body: good({ description: 'x'.repeat(20000) }) })).status, 413);
  assert.equal((await call({ raw: '{"company":', parsed: false })).status, 400);
  assert.equal((await call({ raw: JSON.stringify(good({ orgdetails: 'y'.repeat(40000) })), parsed: false, headers: { 'content-length': '10' } })).status, 413);
  assert.equal((await call({ body: ['not', 'an', 'object'] })).status, 400);
  assert.equal(sheet.rows.length, 0);
});

await test('an unparsed (streamed) body is read and accepted', async () => {
  const r = await call({ raw: JSON.stringify(good()), parsed: false });
  assert.equal(r.status, 200); assert.equal(sheet.rows.length, 1);
});

await test('the same enquiry twice returns the first reference and one row', async () => {
  const a = await call({ body: good(), ip: '203.0.113.9' });
  const b = await call({ body: good({ company: 'LOCAL QA BUILDERS' }), ip: '203.0.113.9' });
  assert.equal(b.status, 200); assert.equal(b.json.ref, a.json.ref); assert.equal(b.json.duplicate, true);
  assert.equal(sheet.rows.length, 1);
  const c = await call({ body: good({ description: 'A different job entirely.' }), ip: '203.0.113.9' });
  assert.notEqual(c.json.ref, a.json.ref); assert.equal(sheet.rows.length, 2);
});

await test('if the duplicate check cannot read the sheet the enquiry is still written', async () => {
  sheet.failRead = true;
  assert.equal((await call({ body: good() })).status, 200);
  assert.equal(sheet.rows.length, 1);
});

await test('per-address rate limit: the sixth submission in the window is refused', async () => {
  for (let i = 0; i < 5; i++) assert.equal((await call({ body: good({ description: 'job ' + i }), ip: '203.0.113.50' })).status, 200);
  const r = await call({ body: good({ description: 'job 6' }), ip: '203.0.113.50' });
  assert.equal(r.status, 429); assert.equal(r.headers['retry-after'], '600');
  assert.equal((await call({ body: good({ description: 'someone else' }), ip: '203.0.113.51' })).status, 200);
  assert.equal(sheet.rows.length, 6);
});

await test('a Google failure is retried once, then reported without leaking detail', async () => {
  sheet.failAppend = 1;
  assert.equal((await call({ body: good() })).status, 200, 'one transient failure is retried');
  assert.equal(sheet.rows.length, 1);
  sheet.failAppend = 2;
  const r = await call({ body: good({ description: 'will fail' }) });
  assert.equal(r.status, 502); assert.deepEqual(r.json, { ok: false, reason: 'upstream' });
  assert.equal(sheet.rows.length, 1, 'a failed save is never reported as saved');
  sheet.failToken = true; internals.reset();
  const t = await call({ body: good({ description: 'token fails' }) });
  assert.equal(t.status, 502);
  const logged = errors.join('\n');
  assert.ok(!/SECRET-GOOGLE-DETAIL|qa@example|Local QA|will fail|PRIVATE KEY|fake-token/.test(logged), 'logs carry no enquiry content, secret or upstream body: ' + logged);
  assert.ok(/\[enquiry\] not saved (append 503|token 401)/.test(logged));
});

await test('without configuration the endpoint answers 503 and contacts nobody', async () => {
  configure(false);
  const r = await call({ body: good() });
  assert.equal(r.status, 503); assert.equal(r.json.reason, 'unconfigured');
  assert.equal(sheet.calls.length, 0);
});

await test('the access token is cached between enquiries', async () => {
  await call({ body: good() }); await call({ body: good({ description: 'another' }) });
  assert.equal(sheet.calls.filter((c) => c.url.includes('oauth2')).length, 1);
});

console.error = realError;
for (const [state, name] of results) console.log(state, name);
const failed = results.filter((r) => r[0] === 'FAIL').length;
console.log(`${results.length - failed}/${results.length} enquiry API tests passed. Google was faked; no network request left this process.`);
process.exit(failed ? 1 : 0);
