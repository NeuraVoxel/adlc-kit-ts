/**
 * Verify bilingual doc pairing: every primary English doc carries a `.zh.md`
 * counterpart with the same section and fenced-block skeleton. English is the
 * source of truth; counterparts follow it section-for-section.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { relative, resolve } from 'node:path'

const repoRoot = resolve(import.meta.dirname, '..')

/** Directories relative to the repo root, scanned recursively for pairs. */
export const pairedDirs: readonly string[] = ['docs', '.agents/notes']

/** Root-level files participating in pairing, counterparts included. */
export const pairedRootFiles: readonly string[] = ['README.md', 'README.zh.md']

/**
 * Explicit, justified exemptions from pairing. Kept here so the
 * English-only policy is machine-checkable the day the corpus grows.
 */
export const pairingExemptions: Readonly<Record<string, string>> = {
  'AGENTS.md': 'agent-facing standing orders; English-only bounds model context',
}

const toCounterpart = (path: string): string => path.replace(/\.md$/, '.zh.md')

function isExempt(path: string): boolean {
  return path in pairingExemptions
}

function countHeadingLines(content: string): number {
  return content.split('\n').filter(line => line.startsWith('## ')).length
}

function countFenceLines(content: string): number {
  return content.split('\n').filter(line => line.startsWith('```')).length
}

/**
 * Collect pairing violations across a markdown corpus.
 * @param files - repo-relative posix paths of `.md` files mapped to content.
 * @returns one human-readable violation per problem; empty when fully paired.
 */
export function findPairingViolations(files: ReadonlyMap<string, string>): string[] {
  const violations: string[] = []
  for (const [path, content] of files) {
    if (path.endsWith('.zh.md')) {
      const primary = path.replace(/\.zh\.md$/, '.md')
      if (!files.has(primary)) violations.push(`orphan counterpart: ${path} has no primary English file`)
      continue
    }
    if (isExempt(path)) continue
    const translated = files.get(toCounterpart(path))
    if (translated === undefined) {
      violations.push(`missing counterpart: ${path} has no ${toCounterpart(path)}`)
      continue
    }
    const sections = countHeadingLines(content)
    const translatedSections = countHeadingLines(translated)
    if (sections !== translatedSections) {
      violations.push(
        `section drift: ${path} has ${sections} '## ' headings, ${toCounterpart(path)} has ${translatedSections}`,
      )
    }
    const fences = countFenceLines(content)
    const translatedFences = countFenceLines(translated)
    if (fences !== translatedFences) {
      violations.push(
        `fence drift: ${path} has ${fences} fence lines, ${toCounterpart(path)} has ${translatedFences}`,
      )
    }
  }
  return violations.sort()
}

function collectCorpus(): Map<string, string> {
  const files = new Map<string, string>()
  const readInto = (absPath: string, relPosixPath: string): void => {
    files.set(relPosixPath, readFileSync(absPath, 'utf8'))
  }
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = resolve(dir, entry.name)
      const rel = relative(repoRoot, abs).split('\\').join('/')
      if (entry.isDirectory()) walk(abs)
      else if (entry.isFile() && entry.name.endsWith('.md')) readInto(abs, rel)
    }
  }
  for (const file of pairedRootFiles) readInto(resolve(repoRoot, file), file)
  for (const dir of pairedDirs) walk(resolve(repoRoot, dir))
  return files
}

if (import.meta.main) {
  const files = collectCorpus()
  const violations = findPairingViolations(files)
  if (violations.length > 0) {
    console.error(
      `verify-doc-pairing: ${violations.length} violation(s):\n${violations.map(line => `  - ${line}`).join('\n')}`,
    )
    process.exitCode = 1
  } else {
    const pairs = [...files.keys()].filter(
      path => !path.endsWith('.zh.md') && !isExempt(path) && files.has(toCounterpart(path)),
    ).length
    console.log(`verify-doc-pairing: ${pairs} pair(s) verified.`)
  }
}
