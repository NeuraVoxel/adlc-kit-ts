/**
 * Pure planning logic for the adlc-kit-ts installer: component selection,
 * copy exclusion, identity renames, and package-script merging. No I/O lives
 * here, so the acceptance paths are testable directly.
 */

/** Installable rule components, each mapping to repo-relative file paths. */
export const COMPONENTS = {
  rules: ['AGENTS.md', '.agents/notes/README.md', '.agents/notes/README.zh.md'],
  gates: [
    'lefthook.yml',
    '.oxlintrc.json',
    'scripts/run-gates.ts',
    'scripts/run-gates.spec.ts',
    'scripts/verify-doc-pairing.ts',
    'scripts/verify-doc-pairing.spec.ts',
    'scripts/agent-note-tree.ts',
    'scripts/agent-note-tree.spec.ts',
    'scripts/verify-agent-note-format.ts',
    'scripts/verify-agent-note-format.spec.ts',
    'scripts/verify-archived-agent-notes.ts',
    'scripts/verify-archived-agent-notes.spec.ts',
    'scripts/verify-doc-references.ts',
    'scripts/verify-doc-references.spec.ts',
    'scripts/archived-notes.manifest.json',
  ],
  docs: [
    'docs/architecture.md',
    'docs/architecture.zh.md',
    'docs/testing.md',
    'docs/testing.zh.md',
  ],
  workflows: [
    '.agents/inbox/README.md',
    '.agents/inbox/README.zh.md',
    '.agents/inbox/QUEUE.md',
    '.agents/learning/README.md',
    '.agents/learning/README.zh.md',
    '.agents/learning/.gitignore',
    '.agents/skills/kit-inbox-capture/SKILL.md',
    '.agents/skills/kit-inbox-promote/SKILL.md',
    '.agents/skills/kit-learning-note/SKILL.md',
    '.agents/skills/kit-release/SKILL.md',
    'ChangeLog.md',
    'docs/release.md',
    'docs/release.zh.md',
  ],
  ci: ['.github/workflows/ci.yml'],
} as const

export type ComponentName = keyof typeof COMPONENTS

/**
 * Components that carry the referents of the shipped instruction layer.
 *
 * `AGENTS.md` is the one file an agent is told to follow, so its links must
 * land: it points at the docs, the workflow contracts, and the CI workflow.
 * Installing `rules` without those writes standing orders that reference files
 * the target never received — a dangling referent, which the root standing
 * order forbids.
 *
 * Only the instruction layer is declared here. Cross-links *between* documents
 * are validated by `verify-doc-references` inside this repository, and the
 * kit-history links no component ships are pruned by adopters, as the CLI's
 * own next-steps message says.
 *
 * `lib.spec.ts` re-derives this map from `AGENTS.md`, so it cannot drift.
 */
export const COMPONENT_REQUIRES: Readonly<Record<ComponentName, readonly ComponentName[]>> = {
  rules: ['docs', 'workflows', 'ci'],
  gates: [],
  docs: [],
  workflows: [],
  ci: [],
}

/**
 * Find the component dependencies a selection omits.
 * @param names - the selected components.
 * @returns one message per component with missing dependencies; empty when the
 * selection is closed under `COMPONENT_REQUIRES`.
 */
export function findMissingComponents(names: readonly ComponentName[]): string[] {
  const selected = new Set(names)
  const missing: string[] = []
  for (const name of names) {
    const absent = COMPONENT_REQUIRES[name].filter(required => !selected.has(required))
    if (absent.length > 0) missing.push(`${name} needs ${absent.join(', ')}`)
  }
  return missing
}

/** Directory segments excluded from a whole-checkout copy. */
export const SEGMENT_EXCLUDES: readonly string[] = ['.git', 'node_modules', 'dist', 'coverage']

/** Exact repo-relative paths excluded from a whole-checkout copy. */
export const PATH_EXCLUDES: readonly string[] = ['pnpm-lock.yaml', 'packages/create-adlc-kit-ts']

/** Root scripts the gates invoke; adoption adds the ones the target lacks. */
export const RUNNER_SCRIPTS: Readonly<Record<string, string>> = {
  'check:ci': 'tsx scripts/run-gates.ts ci-primary',
  'doc-sync': 'tsx scripts/run-gates.ts doc-sync',
  'check:all': 'tsx scripts/run-gates.ts check-all',
}

/** File suffixes that receive identity renames during a fresh scaffold. */
const TEXT_SUFFIXES: readonly string[] = ['.md', '.json', '.ts', '.tsx', '.js', '.yaml', '.yml', '.html']

/**
 * Resolve the component list from the `--only` argument.
 * @param only - raw comma-separated argument; undefined selects every component.
 * @returns component names in selection order.
 * @throws on an unknown component name — selection fails loud instead of defaulting.
 */
export function resolveComponents(only: string | undefined): ComponentName[] {
  const names = only === undefined ? Object.keys(COMPONENTS) : only.split(',')
  for (const name of names) {
    if (!(name in COMPONENTS)) {
      throw new Error(
        `create-adlc-kit-ts: unknown component ${JSON.stringify(name)}; expected one of ${Object.keys(COMPONENTS).join(', ')}.`,
      )
    }
  }
  return names as ComponentName[]
}

/**
 * Whether a repo-relative path is excluded from a whole-checkout copy.
 * @param relPosixPath - repo-relative posix path; empty means the copy root.
 * @returns true when the file or its directory subtree is excluded.
 */
export function isExcluded(relPosixPath: string): boolean {
  if (relPosixPath === '') return false
  const segments = relPosixPath.split('/')
  return (
    segments.some(segment => SEGMENT_EXCLUDES.includes(segment)) ||
    PATH_EXCLUDES.some(
      exclude => relPosixPath === exclude || relPosixPath.startsWith(`${exclude}/`),
    )
  )
}

/**
 * Whether a file receives identity renames during a fresh scaffold.
 * @param relPosixPath - repo-relative posix path of the file.
 * @returns true for text surfaces carrying kit identity strings.
 */
export function isRenamable(relPosixPath: string): boolean {
  return TEXT_SUFFIXES.some(suffix => relPosixPath.endsWith(suffix))
}

/** The target identities a fresh scaffold renames the kit's placeholders to. */
export interface RenameIdentities {
  /** New root package/project name replacing `adlc-kit-ts`. */
  name: string
  /** New npm scope replacing `@adlc-kit/`. */
  scope: string
}

/**
 * Apply the kit's placeholder identities to file content: scope first, then
 * the bare kit name.
 *
 * Markdown link targets are repository paths, not prose. Renaming one would
 * break the reference, because a scaffold renames file *contents* and leaves
 * file *names* alone — so `[…](…/2026-09-15-create-adlc-kit-ts-installer.md)`
 * must keep pointing at the file that is actually on disk. Link text is prose
 * and is renamed.
 * @param content - file content.
 * @param identities - target name and scope.
 * @returns renamed content.
 */
export function applyRenames(content: string, identities: RenameIdentities): string {
  const renameProse = (text: string): string =>
    text.replaceAll('@adlc-kit/', `${identities.scope}/`).replaceAll('adlc-kit-ts', identities.name)
  let renamed = ''
  let cursor = 0
  for (const match of content.matchAll(/(!?\[[^\]]*\]\()([^)\s]+)(\))/g)) {
    renamed += renameProse(content.slice(cursor, match.index!))
    renamed += `${renameProse(match[1]!)}${match[2]!}${match[3]!}`
    cursor = match.index! + match[0].length
  }
  return renamed + renameProse(content.slice(cursor))
}

/**
 * Unwrap Markdown links whose target the copy excludes.
 *
 * A scaffold omits the installer package and the lockfile, so a shipped
 * document that links them would reference a path the target never received.
 * Unwrapping keeps the link text as prose and drops only the reference; the
 * link target itself is left alone, so kit-history links to files the scaffold
 * does ship keep working.
 * @param content - file content.
 * @param resolveTarget - maps a link target to a repo-relative path; null when external.
 * @returns the content with excluded references unwrapped.
 */
export function pruneExcludedReferences(
  content: string,
  resolveTarget: (target: string) => string | null,
): string {
  return content.replace(
    /!?\[([^\]]*)\]\(([^)\s]+)\)/g,
    (match, text: string, target: string) => {
      const resolved = resolveTarget(target)
      return resolved !== null && isExcluded(resolved) ? text : match
    },
  )
}

/**
 * Merge the runner scripts an adoption target lacks into its package scripts.
 * @param existing - the target's current scripts.
 * @param defaults - runner scripts to add.
 * @returns the merged scripts and the names that were added.
 */
export function mergeScripts(
  existing: Readonly<Record<string, string>>,
  defaults: Readonly<Record<string, string>>,
): { scripts: Record<string, string>; added: string[] } {
  const scripts = { ...existing }
  const added: string[] = []
  for (const [name, command] of Object.entries(defaults)) {
    if (!(name in scripts)) {
      scripts[name] = command
      added.push(name)
    }
  }
  return { scripts, added }
}
