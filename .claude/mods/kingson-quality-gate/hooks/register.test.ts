import { describe, expect, test } from 'claude-code/testing'

const LEDGER = {
  summary: { fingerprint: 'abcdef1234567890', PASS: 3, FAIL: 1, UNKNOWN: 2, 'NOT RUN': 4 },
  rows: [{ id: 'build', state: 'PASS' }, { id: 'lint', state: 'FAIL' }, { id: 'a11y', state: 'UNKNOWN' }]
}

describe('kingson-quality-gate', () => {
  test('shows the four counts and names what fails, from the script\'s own ledger', async ($, on) => {
    const shown: (string | undefined)[] = []
    const asked: string[][] = []
    on('process.run', (_$, e) => {
      asked.push([...e.argv])
      return { value: { exitCode: 0, stdout: JSON.stringify(LEDGER), stderr: '' } }
    })
    on('ui.status', (_$, e) => { shown.push(e.text); return { value: undefined } })
    on('command.register', (_$, e) => ({ value: { command: e.name } }))
    on('session.start', (_$, e) => ({ cwd: e.cwd }))

    await $.session.start({ source: 'startup', cwd: '/repo' } as never)
    await new Promise((r) => setTimeout(r, 50))

    expect(asked[0]).toEqual(['node', 'tools/quality-gate.mjs', 'status', '--json'])
    expect(shown.at(-1)).toBe('Kingson gate abcdef1: 3 PASS · 1 FAIL · 2 UNKNOWN · 4 NOT RUN — failing: lint')
  })

  test('says there is no ledger rather than inventing one', async ($, on) => {
    const shown: (string | undefined)[] = []
    on('process.run', () => ({ value: { exitCode: 1, stdout: '', stderr: 'node: not found' } }))
    on('ui.status', (_$, e) => { shown.push(e.text); return { value: undefined } })
    on('command.register', (_$, e) => ({ value: { command: e.name } }))
    on('session.start', (_$, e) => ({ cwd: e.cwd }))

    await $.session.start({ source: 'startup', cwd: '/repo' } as never)
    await new Promise((r) => setTimeout(r, 50))

    expect(shown.at(-1)).toBe('Kingson gate: no ledger here')
  })
})
