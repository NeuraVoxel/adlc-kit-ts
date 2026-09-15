import { describe, expect, it } from 'vitest'
import {
  applyRenames,
  isExcluded,
  isRenamable,
  mergeScripts,
  resolveComponents,
  RUNNER_SCRIPTS,
} from '../lib.ts'

describe('resolveComponents', () => {
  it('selects every component when --only is absent', () => {
    expect(resolveComponents(undefined)).toEqual(['rules', 'gates', 'docs', 'workflows', 'ci'])
  })

  it('parses a comma-separated selection', () => {
    expect(resolveComponents('gates,docs')).toEqual(['gates', 'docs'])
  })

  it('rejects an unknown component instead of defaulting', () => {
    expect(() => resolveComponents('rules,nope')).toThrow(/unknown component/)
  })
})

describe('isExcluded', () => {
  it('excludes git, dependency, build-output, and installer paths', () => {
    expect(isExcluded('.git/config')).toBe(true)
    expect(isExcluded('apps/web/node_modules/react/index.js')).toBe(true)
    expect(isExcluded('apps/web/dist/index.html')).toBe(true)
    expect(isExcluded('apps/web/coverage/out.txt')).toBe(true)
    expect(isExcluded('pnpm-lock.yaml')).toBe(true)
    expect(isExcluded('packages/create-adlc-kit-ts/lib.ts')).toBe(true)
  })

  it('keeps source and rule files', () => {
    expect(isExcluded('server/src/app.ts')).toBe(false)
    expect(isExcluded('AGENTS.md')).toBe(false)
    expect(isExcluded('packages/contracts/src/index.ts')).toBe(false)
    expect(isExcluded('')).toBe(false)
  })
})

describe('isRenamable', () => {
  it('renames text surfaces only', () => {
    expect(isRenamable('package.json')).toBe(true)
    expect(isRenamable('README.md')).toBe(true)
    expect(isRenamable('pnpm-lock.yaml')).toBe(true)
    expect(isRenamable('.gitignore')).toBe(false)
  })
})

describe('applyRenames', () => {
  it('replaces the scope before the bare kit name', () => {
    const renamed = applyRenames(
      '"name": "adlc-kit-ts", imports "@adlc-kit/contracts" and "@adlc-kit/*"',
      { name: 'my-app', scope: '@myco' },
    )
    expect(renamed).toContain('"name": "my-app"')
    expect(renamed).toContain('@myco/contracts')
    expect(renamed).toContain('@myco/*')
    expect(renamed).not.toContain('adlc-kit')
  })
})

describe('mergeScripts', () => {
  it('adds only missing runner scripts and preserves existing ones', () => {
    const { scripts, added } = mergeScripts(
      { test: 'vitest', 'check:ci': 'custom' },
      RUNNER_SCRIPTS,
    )
    expect(scripts['test']).toBe('vitest')
    expect(scripts['check:ci']).toBe('custom')
    expect(scripts['doc-sync']).toBe(RUNNER_SCRIPTS['doc-sync'])
    expect(added).toEqual(['doc-sync', 'check:all'])
  })
})
