# adlc-kit-ts

English | [中文](README.zh.md)

The TypeScript reference kit of the adlc-kit series: React + Vite frontend, Fastify backend, pnpm workspaces, and a verified engineering-rule system (layered AGENTS.md instructions, a `run-gates` aggregate, lefthook hooks, Agent Notes decision records).

## Quick start

```sh
pnpm install
pnpm run check:ci     # lint + typecheck + test gate aggregate
pnpm run dev:server   # http://127.0.0.1:3000/health
pnpm run dev:web      # Vite dev server
```

## Using this kit in a new project

The checkout is the template. From a clone of this repository:

```sh
# Scaffold a fresh project: full copy, identities renamed, hooks wired
pnpm run create -- new ../my-app --scope @myco --name my-app

# Adopt only the verified rules into an existing project
pnpm run create -- adopt ../existing-app --only rules,gates,docs,workflows,ci
```

`new` copies everything except `.git`, `node_modules`, build output, and the lockfile, renames `@adlc-kit/*` and `adlc-kit-ts` to `--scope`/`--name`, and recreates the `CLAUDE.md` alias. `adopt` never overwrites without `--force`, merges the missing runner scripts into `package.json`, and prints the prerequisites the gates assume. Details: [installer README](packages/create-adlc-kit-ts/README.md).

## Layout

| Directory | Responsibility |
|---|---|
| `apps/web/` | React + Vite frontend (browser face) |
| `server/` | Fastify backend (Node face) |
| `packages/contracts/` | Cross-surface contract source; becomes the generated-artifact home in phase 3 |
| `packages/create-adlc-kit-ts/` | The installer: scaffold or adopt the rule set |
| `scripts/` | Gate orchestrator and verify scripts |
| `docs/` | Architecture map, testing strategy, release contract |
| `.agents/notes/` | Decision records (Agent Notes) |
| `.agents/inbox/`, `.agents/learning/` | Spark queue (`QUEUE.md` board) and session retrospectives |
| `.agents/skills/` | The `kit-*` workflow skills (inbox capture/promote, learning note, release) |
| `.codebuddy/skills/` | Symlink alias to `.agents/skills` — CodeBuddy Code discovers project skills only here |

Docs are English-primary with `.zh.md` Chinese counterparts; `pnpm run doc-sync` rejects drift. `AGENTS.md` (agent-facing) is English-only.

## Adopting checklist

1. Root `package.json` `name` and directory name: `adlc-kit-ts` → your project.
2. Placeholder scope `@adlc-kit/*` → your scope: the three package manifests plus `paths` in `tsconfig.base.json`.
3. Replace the sample `GET /health` endpoint and `apps/web/src/App.tsx`.
4. Add the git remote; `.github/workflows/ci.yml` is prewired for pnpm + Node 22.

The `new` command performs 1, 2, and 4's renaming automatically.

## The adlc-kit series

`adlc-kit-ts` (this repository, phase 1) → `adlc-kit-py` (Python single stack, phase 2) → `adlc-kit` (integrated shape, phase 3). Composition rules: [roadmap Agent Note](.agents/notes/implemented/architecture/2026-09-15-adlc-kit-three-phase-roadmap.md).
