/**
 * adlc-kit-ts installer CLI. The checkout is the template: `new` copies the
 * whole repository live (no snapshot to drift), `adopt` installs selected
 * rule components into an existing project. Planning logic lives in lib.ts
 * with its spec.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { cp, lstat, mkdir, readFile, readdir, readlink, rm, symlink, writeFile } from 'node:fs/promises'
import { basename, dirname, join, posix, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveReference } from '../../scripts/verify-doc-references.ts'
import {
  applyRenames,
  COMPONENTS,
  findMissingComponents,
  isExcluded,
  isRenamable,
  mergeScripts,
  pruneExcludedReferences,
  resolveComponents,
  RUNNER_SCRIPTS,
  type RenameIdentities,
} from './lib.ts'

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

const toPosix = (path: string): string => path.split('\\').join('/')

function usage(): never {
  console.error(`Usage:
  pnpm run create -- new <dir> [--scope <scope>] [--name <name>]
  pnpm run create -- adopt [dir] [--only rules,gates,docs,workflows,ci] [--force]`)
  process.exit(2)
}

function parseArgs(argv: string[]): {
  mode: 'new' | 'adopt'
  positional: string[]
  flags: Map<string, string | boolean>
} {
  // pnpm forwards the `pnpm run create --` separator itself; a leading `--`
  // selects nothing and is dropped rather than rejected.
  const effective = argv[0] === '--' ? argv.slice(1) : argv
  const [mode = '', ...rest] = effective
  if (mode !== 'new' && mode !== 'adopt') usage()
  const positional: string[] = []
  const flags = new Map<string, string | boolean>()
  for (let index = 0; index < rest.length; index++) {
    const arg = rest[index]!
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = rest[index + 1]
      if (next !== undefined && !next.startsWith('--')) {
        flags.set(key, next)
        index++
      } else {
        flags.set(key, true)
      }
    } else {
      positional.push(arg)
    }
  }
  return { mode, positional, flags }
}

function requireString(flags: Map<string, string | boolean>, key: string, fallback?: string): string {
  const value = flags.get(key)
  if (value === true) throw new Error(`create-adlc-kit-ts: --${key} needs a value.`)
  if (typeof value === 'string') return value
  if (fallback !== undefined) return fallback
  throw new Error(`create-adlc-kit-ts: --${key} is required.`)
}

function optionalString(flags: Map<string, string | boolean>, key: string): string | undefined {
  const value = flags.get(key)
  if (value === undefined || value === false) return undefined
  if (value === true) throw new Error(`create-adlc-kit-ts: --${key} needs a value.`)
  return value
}

/** Recreate the CLAUDE.md alias as a symlink; a real copy keeps it usable where symlinks are unavailable. */
async function ensureClaudeSymlink(dir: string): Promise<void> {
  const link = join(dir, 'CLAUDE.md')
  const stats = await lstat(link).catch(() => undefined)
  // node:fs cp materializes copied symlinks with absolute targets pointing
  // back at the source checkout; only a correct relative alias survives.
  if (stats?.isSymbolicLink() && (await readFile(link, 'utf8')) === 'AGENTS.md') return
  if (stats !== undefined) await rm(link)
  try {
    await symlink('AGENTS.md', link)
  } catch {
    // Windows without developer mode rejects symlinks; a plain copy keeps the alias usable.
    await cp(join(dir, 'AGENTS.md'), link)
    console.log('create-adlc-kit-ts: CLAUDE.md written as a copy (symlinks unavailable on this platform).')
  }
}

/**
 * Recreate `.codebuddy/skills` as a relative alias to `.agents/skills`.
 *
 * CodeBuddy Code discovers project skills only under `.codebuddy/skills/`, so
 * without the alias the `kit-*` skills this kit ships stay invisible to it.
 * The alias is recreated rather than trusted from the copy, for the same reason
 * as `CLAUDE.md`: a materialized symlink points back at the source checkout.
 * A target without `.agents/skills` gets no alias — a dangling link is worse
 * than none. An existing symlink is replaced (a copy can materialize one
 * pointing back at the source checkout); anything else is left alone, since it
 * may hold skills the target already owns.
 */
async function ensureCodebuddySkillsAlias(dir: string): Promise<void> {
  const source = join(dir, '.agents', 'skills')
  if (!existsSync(source)) return
  const link = join(dir, '.codebuddy', 'skills')
  const stats = await lstat(link).catch(() => undefined)
  if (stats?.isSymbolicLink()) {
    if ((await readlink(link)) === '../.agents/skills') return
    await rm(link)
  } else if (stats !== undefined) {
    console.log('create-adlc-kit-ts: .codebuddy/skills already exists and was left untouched; alias it to .agents/skills for CodeBuddy Code discovery.')
    return
  }
  await mkdir(dirname(link), { recursive: true })
  try {
    await symlink('../.agents/skills', link)
  } catch {
    // Windows without developer mode rejects symlinks; a copy keeps the skills discoverable.
    await cp(source, link, { recursive: true })
    console.log('create-adlc-kit-ts: .codebuddy/skills written as a copy (symlinks unavailable on this platform).')
  }
}

/**
 * Rename identities across a copied tree's text surfaces and unwrap links to
 * paths the copy excluded. Files keep their names; only content changes.
 * @param root - the copied tree's root, for repo-relative link resolution.
 * @param dir - the directory being walked.
 * @param identities - target name and scope.
 */
async function renameTree(root: string, dir: string, identities: RenameIdentities): Promise<void> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name)
    if (entry.isDirectory()) {
      await renameTree(root, abs, identities)
    } else if (entry.isFile() && isRenamable(toPosix(entry.name))) {
      const from = toPosix(relative(root, abs))
      const content = await readFile(abs, 'utf8')
      const renamed = applyRenames(content, identities)
      await writeFile(
        abs,
        pruneExcludedReferences(renamed, target => {
          const resolved = resolveReference(from, target)
          return resolved === null ? null : toPosix(posix.normalize(resolved))
        }),
      )
    }
  }
}

async function runNew(target: string, identities: RenameIdentities): Promise<void> {
  const targetRoot = resolve(target)
  if (existsSync(targetRoot) && readdirSync(targetRoot).length > 0) {
    throw new Error(`create-adlc-kit-ts: target ${target} exists and is not empty.`)
  }
  await mkdir(targetRoot, { recursive: true })
  await cp(kitRoot, targetRoot, {
    recursive: true,
    // cp's filter includes on true; keep everything the excludes do not match.
    filter: src => !isExcluded(toPosix(relative(kitRoot, src))),
  })
  await renameTree(targetRoot, targetRoot, identities)
  await ensureClaudeSymlink(targetRoot)
  await ensureCodebuddySkillsAlias(targetRoot)
  // The postinstall hook (`lefthook install`) requires a git repository;
  // a fresh scaffold owns its initialization.
  const gitInit = spawnSync('git', ['init', '-b', 'main'], { cwd: targetRoot })
  if (gitInit.status !== 0) {
    console.log('create-adlc-kit-ts: git unavailable — run `git init` before pnpm install.')
  }
  console.log(`create-adlc-kit-ts: scaffolded ${identities.name} (scope ${identities.scope}) at ${targetRoot}.`)
  console.log('Next steps:')
  console.log(`  cd ${relative(process.cwd(), targetRoot) || '.'}`)
  console.log('  pnpm install')
  console.log('  pnpm run check:all')
  console.log('  Adapt AGENTS.md and docs/*.md to the project; keep .zh.md counterparts in sync (doc-sync gate).')
}

async function mergePackageScripts(targetRoot: string): Promise<void> {
  const pkgPath = join(targetRoot, 'package.json')
  if (!existsSync(pkgPath)) return
  const pkg = JSON.parse(await readFile(pkgPath, 'utf8')) as { scripts?: Record<string, string> }
  const { scripts, added } = mergeScripts(pkg.scripts ?? {}, RUNNER_SCRIPTS)
  if (added.length === 0) return
  pkg.scripts = scripts
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
  console.log(`create-adlc-kit-ts: added package scripts: ${added.join(', ')}.`)
}

async function runAdopt(
  target: string,
  options: { only: string | undefined; force: boolean },
): Promise<void> {
  const targetRoot = resolve(target)
  if (!existsSync(targetRoot)) {
    throw new Error(`create-adlc-kit-ts: adopt target ${target} does not exist.`)
  }
  const components = resolveComponents(options.only)
  // The instruction layer links files other components carry; refuse before any
  // write rather than shipping standing orders that point at absent files.
  const missing = findMissingComponents(components)
  if (missing.length > 0) {
    throw new Error(
      `create-adlc-kit-ts: incomplete component selection (the shipped AGENTS.md links parts these components carry):\n${missing.map(line => `  - ${line}`).join('\n')}\nAdd the missing components to --only, or drop --only to install every component.`,
    )
  }
  const planned = components.flatMap(name => [...COMPONENTS[name]])
  const conflicts = planned.filter(file => existsSync(join(targetRoot, file)))
  if (conflicts.length > 0 && !options.force) {
    throw new Error(
      `create-adlc-kit-ts: refusing to overwrite existing files (use --force):\n${conflicts.map(file => `  - ${file}`).join('\n')}`,
    )
  }
  for (const file of planned) {
    const dest = join(targetRoot, file)
    await mkdir(dirname(dest), { recursive: true })
    await cp(join(kitRoot, file), dest)
  }
  await ensureClaudeSymlink(targetRoot)
  await ensureCodebuddySkillsAlias(targetRoot)
  // The runner scripts point at scripts/run-gates.ts; merging them without the
  // gates component would advertise commands the target cannot run.
  if (components.includes('gates')) await mergePackageScripts(targetRoot)
  console.log(`create-adlc-kit-ts: installed components [${components.join(', ')}] into ${targetRoot}.`)
  console.log('Next steps:')
  console.log('  pnpm add -D typescript tsx vitest oxlint lefthook vite-tsconfig-paths jsdom @types/node')
  console.log('  add "postinstall": "lefthook install" to package.json scripts')
  console.log('  provide lint / typecheck / test scripts — the gate graph invokes them')
  console.log('  prune framework-specific lines from AGENTS.md and docs/*.md; keep .zh.md counterparts in sync')
  console.log('  doc-references stays red on the kit-history links those lines carry until they are pruned')
}

try {
  const { mode, positional, flags } = parseArgs(process.argv.slice(2))
  if (mode === 'new') {
    const dir = positional[0]
    if (dir === undefined) usage()
    await runNew(dir, {
      name: requireString(flags, 'name', basename(dir)),
      scope: requireString(flags, 'scope', '@adlc-kit'),
    })
  } else {
    await runAdopt(positional[0] ?? '.', {
      only: optionalString(flags, 'only'),
      force: flags.get('force') === true,
    })
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
