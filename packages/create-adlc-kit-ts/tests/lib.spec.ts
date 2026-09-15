import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { collectReferences } from '../../../scripts/verify-doc-references.ts'
import {
  applyRenames,
  COMPONENT_REQUIRES,
  COMPONENTS,
  findMissingComponents,
  isExcluded,
  isRenamable,
  mergeScripts,
  pruneExcludedReferences,
  resolveComponents,
  RUNNER_SCRIPTS,
  type ComponentName,
} from '../lib.ts'

const kitRoot = resolve(import.meta.dirname, '..', '..', '..')

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

  it('preserves markdown link targets, which are paths rather than prose', () => {
    const renamed = applyRenames(
      'See [the installer note](../../.agents/notes/implemented/process/2026-09-15-create-adlc-kit-ts-installer.md) in adlc-kit-ts.',
      { name: 'my-app', scope: '@myco' },
    )
    expect(renamed).toContain('2026-09-15-create-adlc-kit-ts-installer.md')
    expect(renamed).toContain('in my-app.')
  })

  it('renames link text, which is prose', () => {
    expect(
      applyRenames('[adlc-kit-ts docs](docs/architecture.md)', { name: 'my-app', scope: '@myco' }),
    ).toBe('[my-app docs](docs/architecture.md)')
  })
})

describe('pruneExcludedReferences', () => {
  const resolve = (target: string): string | null =>
    /^[a-z]+:/i.test(target) ? null : target.replace(/^\//, '')

  it('unwraps a link into an excluded path and keeps its text', () => {
    expect(
      pruneExcludedReferences(
        'Details: [installer README](packages/create-adlc-kit-ts/README.md).',
        resolve,
      ),
    ).toBe('Details: installer README.')
  })

  it('unwraps an image into an excluded path', () => {
    expect(pruneExcludedReferences('![lock](pnpm-lock.yaml)', resolve)).toBe('lock')
  })

  it('keeps references the copy ships and references that are external', () => {
    const shipped = 'See [architecture](docs/architecture.md) and [web](https://example.com/x.md).'
    expect(pruneExcludedReferences(shipped, resolve)).toBe(shipped)
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

describe('findMissingComponents', () => {
  it('rejects a selection that omits an instruction-layer dependency', () => {
    expect(findMissingComponents(resolveComponents('rules,docs'))).toEqual([
      'rules needs workflows, ci',
    ])
  })

  it('accepts a complete selection and an independent component', () => {
    expect(findMissingComponents(resolveComponents(undefined))).toEqual([])
    expect(findMissingComponents(resolveComponents('gates'))).toEqual([])
  })

  it('declares exactly the components the shipped AGENTS.md links', () => {
    const owner = new Map<string, ComponentName>()
    for (const [name, files] of Object.entries(COMPONENTS) as [ComponentName, readonly string[]][]) {
      for (const file of files) owner.set(file, name)
    }
    const linked = new Set<ComponentName>()
    for (const { target } of collectReferences(
      new Map([['AGENTS.md', readFileSync(resolve(kitRoot, 'AGENTS.md'), 'utf8')]]),
    )) {
      const name = owner.get(target)
      if (name !== undefined && name !== 'rules') linked.add(name)
    }
    expect([...linked].sort()).toEqual([...COMPONENT_REQUIRES.rules].sort())
  })
})
