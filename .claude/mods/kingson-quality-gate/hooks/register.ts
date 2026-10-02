/* ═══════════════════════════════════════════════════════════════════════════
   kingson-quality-gate — the gate's ledger, where the person can see it
   ═══════════════════════════════════════════════════════════════════════════

   The gate itself is tools/quality-gate.mjs in the repository: that is where
   checks run and results are recorded, and it is what CI or any developer
   runs. This mod adds nothing to it. It asks the script for the ledger of the
   code as it stands (`status --json`) and shows the four counts in the status
   line, refreshed at session start and after every turn — so the moment an
   edit turns a PASS into UNKNOWN, the line says so.

   What it can do: run one read-only command, set the status line, answer
   /kingson-gate. What it cannot do: run a check, record a result, write a
   file, reach the network, or touch a tool call.
   ═══════════════════════════════════════════════════════════════════════════ */

import type { EngineInterface, Register } from 'claude-code'

type Summary = { PASS: number; FAIL: number; UNKNOWN: number; 'NOT RUN': number; fingerprint: string }
type Ledger = { summary: Summary; rows: { id: string; state: string }[] }

const STATUS = ['node', 'tools/quality-gate.mjs', 'status', '--json']

async function ledger($: EngineInterface): Promise<Ledger | null> {
  try {
    const r = await $.process.run(STATUS, { timeoutMs: 20000 })
    const at = r.stdout.indexOf('{')
    return at < 0 ? null : (JSON.parse(r.stdout.slice(at)) as Ledger)
  } catch {
    return null
  }
}

/** The status-line text for a ledger, or for having none. */
export function line(l: Ledger | null): string {
  if (!l) return 'Kingson gate: no ledger here'
  const s = l.summary
  const failing = l.rows.filter((r) => r.state === 'FAIL').map((r) => r.id)
  return `Kingson gate ${s.fingerprint.slice(0, 7)}: ${s.PASS} PASS · ${s.FAIL} FAIL · ${s.UNKNOWN} UNKNOWN · ${s['NOT RUN']} NOT RUN` +
    (failing.length ? ` — failing: ${failing.slice(0, 4).join(', ')}${failing.length > 4 ? '…' : ''}` : '')
}

async function refresh($: EngineInterface) {
  $.ui.status(line(await ledger($)))
}

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'kingson-gate',
      description: 'Show the Kingson quality gate ledger for the current code'
    })
    void refresh($)
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    void refresh($)
    return done
  })

  on('command.run', { command: 'kingson-gate' }, async ($) => {
    const r = await $.process.run(['node', 'tools/quality-gate.mjs', 'status'], { timeoutMs: 20000 })
    void refresh($)
    return { text: (r.stdout || r.stderr || 'The gate printed nothing.').trim() }
  })
}
