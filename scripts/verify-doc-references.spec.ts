import { describe, expect, it } from 'vitest'
import { collectReferences, findReferenceViolations, type Reference } from './verify-doc-references.ts'

const corpus = (entries: Record<string, string>): Map<string, string> => new Map(Object.entries(entries))

const existing = (...paths: string[]): ((target: string) => boolean) => {
  const known = new Set(paths)
  return target => known.has(target)
}

const parse = (entries: Record<string, string>): Reference[] => collectReferences(corpus(entries))

describe('collectReferences', () => {
  it('resolves a relative target against the linking file', () => {
    expect(parse({ 'docs/guide.md': 'See [architecture](architecture.md).' })).toEqual([
      { from: 'docs/guide.md', raw: 'architecture.md', target: 'docs/architecture.md' },
    ])
  })

  it('strips an anchor and a query from the target', () => {
    expect(parse({ 'docs/guide.md': '[a](other.md#section)' })[0]!.target).toBe('docs/other.md')
    expect(parse({ 'docs/guide.md': '[a](other.md?v=1)' })[0]!.target).toBe('docs/other.md')
  })

  it('treats a root-absolute target as repository-relative', () => {
    expect(parse({ 'docs/guide.md': '[a](/README.md)' })[0]!.target).toBe('README.md')
  })

  it('skips external targets and pure anchors', () => {
    const references = parse({
      'docs/guide.md': [
        '[web](https://example.com/x.md)',
        '[mail](mailto:someone@example.com)',
        '[proto](//example.com/x.md)',
        '[anchor](#local-heading)',
      ].join('\n'),
    })
    expect(references).toEqual([])
  })

  it('counts image targets as references', () => {
    expect(parse({ 'docs/guide.md': '![diagram](assets/flow.png)' })[0]!.target).toBe(
      'docs/assets/flow.png',
    )
  })

  it('ignores links inside code spans and fenced blocks', () => {
    const references = parse({
      'docs/guide.md': [
        'Prepend `- [ ] [title](./yyyy-mm-dd-slug.md)` to the board.',
        '',
        '```md',
        '[sample](missing.md)',
        '```',
        '',
        '[real](architecture.md)',
      ].join('\n'),
    })
    expect(references).toEqual([
      { from: 'docs/guide.md', raw: 'architecture.md', target: 'docs/architecture.md' },
    ])
  })
})

describe('findReferenceViolations', () => {
  it('accepts a corpus whose references all resolve', () => {
    const references = parse({
      'docs/guide.md': '[architecture](architecture.md) and [readme](/README.md)',
    })
    expect(findReferenceViolations(references, existing('docs/architecture.md', 'README.md'))).toEqual(
      [],
    )
  })

  it('rejects a dangling repository-relative reference', () => {
    const references = parse({ 'docs/guide.md': '[gone](missing.md)' })
    expect(findReferenceViolations(references, existing())).toEqual([
      expect.stringContaining('dangling reference: docs/guide.md → missing.md'),
    ])
  })

  it('rejects a reference escaping the repository', () => {
    const references = parse({ 'docs/guide.md': '[out](../../../etc/passwd)' })
    expect(findReferenceViolations(references, () => true)).toEqual([
      expect.stringContaining('reference escapes the repository'),
    ])
  })

  it('reports every violation, sorted', () => {
    const references = parse({ 'docs/guide.md': '[b](b.md)\n[a](a.md)' })
    const violations = findReferenceViolations(references, existing())
    expect(violations).toHaveLength(2)
    expect(violations[0]).toContain('a.md')
  })
})
