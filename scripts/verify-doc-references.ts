/**
 * Documentation reference integrity: every repo-relative Markdown link in the
 * paired documentation corpus must resolve to a path that exists. External
 * URLs, protocol-relative targets, and pure anchors are out of scope.
 *
 * The corpus is imported from the pairing gate rather than re-derived, so the
 * two gates cannot disagree about what "the documentation corpus" is. The
 * agent-facing instruction layer (`AGENTS.md`, `SKILL.md`) is deliberately not
 * scanned here: its referents are a component-packaging property, owned by the
 * installer's component-completeness check.
 */
import { existsSync } from 'node:fs'
import { posix, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { collectCorpus } from './verify-doc-pairing.ts'

const repoRoot = resolve(import.meta.dirname, '..')

/** Markdown inline link or image target: `](target)` with no whitespace. */
const LINK = /\[[^\]]*\]\(([^)\s]+)\)/g

/** One parsed in-repository reference. */
export interface Reference {
  /** Repo-relative posix path of the file carrying the link. */
  readonly from: string
  /** The target exactly as written. */
  readonly raw: string
  /** The normalized repo-relative posix target, anchor and query removed. */
  readonly target: string
}

/**
 * Whether a link target is outside the repository's path space.
 * @param target - the target as written.
 * @returns true for absolute URLs, protocol-relative targets, and pure anchors.
 */
function isExternal(target: string): boolean {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(target)
}

/**
 * Resolve one Markdown link target to a repo-relative posix path. The single
 * home for the rule; the installer imports it to prune references it cannot
 * ship, so both agree on what a target means.
 * @param from - repo-relative posix path of the linking file.
 * @param target - the target as written.
 * @returns the normalized repo-relative path, or null when the target is
 * external or empty.
 */
export function resolveReference(from: string, target: string): string | null {
  if (isExternal(target)) return null
  const bare = target.split('#')[0]!.split('?')[0]!
  if (bare === '') return null
  return bare.startsWith('/')
    ? posix.normalize(bare.slice(1))
    : posix.normalize(posix.join(posix.dirname(from), bare))
}

/**
 * Blank out fenced blocks and inline code spans.
 *
 * A path written inside code is illustrative — a template filename, a command
 * the reader is meant to type, a quoted link — not a referent this repository
 * promises to keep resolvable. Scanning raw text would report those as
 * dangling references. Markdown links inside code are not links.
 * @param content - raw file content.
 * @returns the content with code regions replaced by a space.
 */
function stripCode(content: string): string {
  return content.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`\n]*`/g, ' ')
}

/**
 * Collect every in-repository reference in a markdown corpus.
 * @param files - repo-relative posix path → file content.
 * @returns one entry per reference, in corpus order.
 */
export function collectReferences(files: ReadonlyMap<string, string>): Reference[] {
  const references: Reference[] = []
  for (const [from, content] of files) {
    for (const match of stripCode(content).matchAll(LINK)) {
      const raw = match[1]!
      const target = resolveReference(from, raw)
      if (target !== null) references.push({ from, raw, target })
    }
  }
  return references
}

/**
 * Collect reference violations for one corpus.
 * @param references - parsed references, as returned by `collectReferences`.
 * @param exists - predicate over repo-relative posix paths.
 * @returns one human-readable violation per problem; empty when every
 * reference resolves inside the repository.
 */
export function findReferenceViolations(
  references: readonly Reference[],
  exists: (repoRelativePath: string) => boolean,
): string[] {
  const violations: string[] = []
  for (const { from, raw, target } of references) {
    if (target.startsWith('..')) {
      violations.push(`reference escapes the repository: ${from} → ${raw}`)
    } else if (!exists(target)) {
      violations.push(`dangling reference: ${from} → ${raw}`)
    }
  }
  return violations.sort()
}

// import.meta.main is unreliable under loader-based TS execution (tsx reports
// undefined for entry paths outside the invoking project), so compare URLs.
const isEntry =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href
if (isEntry) {
  const files = collectCorpus()
  const references = collectReferences(files)
  const violations = findReferenceViolations(references, target =>
    existsSync(resolve(repoRoot, target)),
  )
  if (violations.length > 0) {
    console.error(
      `verify-doc-references: ${violations.length} violation(s):\n${violations.map(line => `  - ${line}`).join('\n')}`,
    )
    process.exitCode = 1
  } else {
    // Report the references actually checked, not the corpus size: the green
    // number should be the denominator an operator would assume.
    console.log(
      `verify-doc-references: ${references.length} reference(s) resolved across ${files.size} file(s).`,
    )
  }
}
