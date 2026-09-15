import { describe, expect, it } from 'vitest'
import { defaultConcurrency, gatesForMode, parseMode, planStages, type Gate } from './run-gates.ts'

const gate = (id: string, needs?: string[]): Gate => ({
  id,
  label: id,
  command: ['pnpm', 'run', id],
  needs,
})

describe('parseMode', () => {
  it('returns the known aggregates', () => {
    expect(parseMode('ci-primary')).toBe('ci-primary')
    expect(parseMode('doc-sync')).toBe('doc-sync')
    expect(parseMode('check-all')).toBe('check-all')
  })

  it('rejects unknown aggregates instead of defaulting', () => {
    expect(() => parseMode('nope')).toThrow(/expected mode/)
    expect(() => parseMode(undefined)).toThrow(/expected mode/)
  })
})

describe('planStages', () => {
  it('runs independent gates in one stage', () => {
    expect(planStages([gate('a'), gate('b')])).toEqual([['a', 'b']])
  })

  it('orders dependent gates into later stages', () => {
    expect(planStages([gate('b', ['a']), gate('a')])).toEqual([['a'], ['b']])
  })

  it('rejects a needs entry pointing at no gate', () => {
    expect(() => planStages([gate('a', ['ghost'])])).toThrow(/unknown gate/)
  })

  it('rejects duplicate ids', () => {
    expect(() => planStages([gate('a'), gate('a')])).toThrow(/duplicate/)
  })

  it('rejects a needs cycle', () => {
    expect(() => planStages([gate('a', ['b']), gate('b', ['a'])])).toThrow(/cycle/)
  })
})

describe('gatesForMode', () => {
  it('exposes the flat lint/typecheck/test graph for ci-primary', () => {
    expect(gatesForMode('ci-primary').map(entry => entry.id)).toEqual(['lint', 'typecheck', 'test'])
  })

  it('exposes the doc and notes gates for doc-sync', () => {
    expect(gatesForMode('doc-sync').map(entry => entry.id)).toEqual([
      'doc-pairing',
      'agent-note-tree',
      'agent-note-format',
      'archived-agent-notes',
    ])
  })

  it('unions both graphs for check-all', () => {
    expect(gatesForMode('check-all').map(entry => entry.id)).toEqual([
      'lint',
      'typecheck',
      'test',
      'doc-pairing',
      'agent-note-tree',
      'agent-note-format',
      'archived-agent-notes',
    ])
  })
})

describe('defaultConcurrency', () => {
  it('caps workers at available parallelism', () => {
    expect(defaultConcurrency(10, 4)).toBe(4)
    expect(defaultConcurrency(2, 8)).toBe(2)
  })
})
