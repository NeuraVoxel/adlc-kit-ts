# create-adlc-kit-ts

Zero-dependency installer for the adlc-kit-ts rule set. The checkout is the template: files copy live from this repository, so a new project always receives exactly the rules the gates just verified — there is no template snapshot to drift.

## Usage (from a kit checkout)

```sh
# Scaffold a fresh project: full copy, identities renamed, hooks wired
pnpm run create -- new ../my-app --scope @myco --name my-app

# Adopt only the verified rules into an existing project
pnpm run create -- adopt ../existing-app --only rules,gates,docs,workflows,ci
```

## Components

| Component | Files |
|---|---|
| `rules` | `AGENTS.md`, `.agents/notes/README*.md` |
| `gates` | `lefthook.yml`, `.oxlintrc.json`, `scripts/run-gates.*`, `scripts/verify-doc-pairing.*` |
| `docs` | `docs/architecture*.md`, `docs/testing*.md` |
| `workflows` | inbox and learning contracts, the `kit-*` skills, `ChangeLog.md`, `docs/release*` |
| `ci` | `.github/workflows/ci.yml` |

`new` copies everything except `.git`, `node_modules`, `dist`, `coverage`, the lockfile, and this installer package, renames `@adlc-kit/*` and `adlc-kit-ts` to `--scope`/`--name` across text surfaces, recreates the `CLAUDE.md` alias, and initializes the git repository the postinstall hook requires.

`adopt` never overwrites an existing file without `--force`; it merges the missing runner scripts into the target `package.json` only when the `gates` component is installed, and prints the dev-dependency and script prerequisites the gate graph assumes.

npm distribution (bundling the checkout at publish time so `pnpm create adlc-kit-ts` works without a checkout) is deferred; the decision and its alternatives live in the [installer Agent Note](../../.agents/notes/implemented/process/2026-09-15-create-adlc-kit-ts-installer.md).
