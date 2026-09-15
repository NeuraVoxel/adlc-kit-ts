/**
 * Pure planning logic for the adlc-kit-ts installer: component selection,
 * copy exclusion, identity renames, and package-script merging. No I/O lives
 * here, so the acceptance paths are testable directly.
 */

/** Installable rule components, each mapping to repo-relative file paths. */
export const COMPONENTS = {
  rules: ['AGENTS.md', '.agents/notes/README.md'],
  gates: [
    'lefthook.yml',
    '.oxlintrc.json',
    'scripts/run-gates.ts',
    'scripts/run-gates.spec.ts',
    'scripts/verify-doc-pairing.ts',
    'scripts/verify-doc-pairing.spec.ts',
  ],
  docs: [
    'docs/architecture.md',
    'docs/architecture.zh.md',
    'docs/testing.md',
    'docs/testing.zh.md',
  ],
  ci: ['.github/workflows/ci.yml'],
} as const

export type ComponentName = keyof typeof COMPONENTS

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
 * @param content - file content.
 * @param identities - target name and scope.
 * @returns renamed content.
 */
export function applyRenames(content: string, identities: RenameIdentities): string {
  return content
    .replaceAll('@adlc-kit/', `${identities.scope}/`)
    .replaceAll('adlc-kit-ts', identities.name)
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
