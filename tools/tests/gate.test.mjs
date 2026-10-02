/* The quality gate must not be able to say PASS for something nobody checked. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const gate = (...args) => spawnSync('node', ['tools/quality-gate.mjs', ...args], { cwd: ROOT, encoding: 'utf8' });

test('the ledger only ever reports the four states', () => {
  const r = gate('status', '--json');
  const { rows, summary } = JSON.parse(r.stdout);
  for (const row of rows) assert.ok(['PASS', 'FAIL', 'UNKNOWN', 'NOT RUN'].includes(row.state), `${row.id}: ${row.state}`);
  assert.equal(summary.PASS + summary.FAIL + summary.UNKNOWN + summary['NOT RUN'], rows.length);
});

test('a measured check cannot be attested by hand', () => {
  const r = gate('record', 'a11y', 'pass', '--note', 'looked fine to me on my phone, honestly');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /measured, not attested/);
});

test('a judgement needs evidence', () => {
  const r = gate('record', 'visual-desktop', 'pass', '--note', 'ok');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /needs evidence/);
});

test('an unknown check is refused', () => {
  const r = gate('record', 'vibes', 'pass', '--note', 'this check does not exist anywhere in the gate');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /unknown check/);
});
