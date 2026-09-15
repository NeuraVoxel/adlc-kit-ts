# AGENTS.md

adlc-kit-ts — the TypeScript reference kit of the adlc-kit series: React + Vite web face, Fastify server face, pnpm workspaces, and a gate system orchestrated solely by `scripts/run-gates.ts`. Read [docs/architecture.md](docs/architecture.md) before changing source.

## Commands

```sh
pnpm install          # also installs lefthook hooks via postinstall
pnpm run check:ci     # gate aggregate: lint + typecheck + test (one entry for local and CI)
pnpm run check:all    # ci-primary + doc-sync; this is what CI runs
pnpm run doc-sync     # documentation gates (bilingual pairing)
pnpm run dev:server   # Fastify, http://127.0.0.1:3000/health
pnpm run dev:web      # Vite dev server (/api proxies to 127.0.0.1:3000)
```

Scaffold or adopt the rule set from a checkout of this kit:

```sh
pnpm run create -- new <dir> [--scope <scope>] [--name <name>]
pnpm run create -- adopt [dir] [--only rules,gates,docs,ci] [--force]
```

`typecheck` / `lint` / `test` run standalone. Select test evidence by change surface ([docs/testing.md](docs/testing.md)); never default to the full suite.

## Core conventions

- **English-primary, paired docs.** Human-facing docs (`README.md`, `docs/*.md`, `.agents/notes/**/*.md`) are written in English with a `.zh.md` Chinese counterpart updated in the same change; `AGENTS.md` is the only exemption, staying English-only to bound agent context ([pairing decision](.agents/notes/implemented/process/2026-09-15-bilingual-doc-pairing.md)). `pnpm run doc-sync` rejects missing, orphaned, or drifted counterparts.
- **ESM everywhere** (`"type": "module"`). Use package names `@adlc-kit/*` across packages and `.ts` extensions on local relative imports; tsx executes TS directly — no `lib/` exists until a build step is introduced.
- **Explicit over implicit**: defaulting is an explicit resolve step owned by the caller, never a hidden `?? default` inside `run()`; misconfiguration fails loud at load; never silently skip a missing referent.
- **Trust TypeScript at typed same-process boundaries**: no runtime validation or hostile-input tests for values the static interface requires; validate at wire, file, environment, and subprocess boundaries.
- **Hardened invariants become gates**: write `scripts/verify-*.ts` with a spec proving it rejects one invalid case, then wire it into the `run-gates.ts` graph. Promote a soft convention after its second violation.
- **Tests describe behavior.** Snapshot lanes for user-visible output and the real e2e lane arrive in phase 3 and self-skip without credentials.
- **Docs update in the same PR as code**; every fact has one home and everything else links there. Docs state current contracts, not reasoning transcripts or change history.
- **Every non-trivial change adds or updates one Agent Note in the same PR** ([.agents/notes/README.md](.agents/notes/README.md)); purely mechanical or local edits are exempt.
- **Sparks and retrospectives live outside the notes tree**: uncommitted sparks queue in `.agents/inbox/` ([README](.agents/inbox/README.md), `QUEUE.md` board); session retrospectives go to `.agents/learning/` ([README](.agents/learning/README.md)). Promotion to a proposed note is always an explicit request.
- **Workflow skills live flat in `.agents/skills/`** as `<name>/SKILL.md` direct children; the `kit-*` family (inbox capture/promote, learning note, release) ships in the installer's `workflows` component.
- **Releases are explicit cuts** ([docs/release.md](docs/release.md)): one commit bumps the version in root `package.json`, renames the `ChangeLog.md` `## Unreleased` heading, rewrites next-cut attributions, and tags `v<version>`; development commits never touch the version or released changelog headings.
- **Secrets never enter the repository**: real credentials come from environment variables or an uncommitted `.env`; credential-dependent tests self-skip without credentials.
- **Cross-stack adoption rule**: a new stack gets its own language root and lane and goes green before any cross-stack seam exists; seams pass through `packages/contracts` and committed fixtures only, and live-process verification lives only in the e2e lane ([roadmap decision](.agents/notes/implemented/architecture/2026-09-15-adlc-kit-three-phase-roadmap.md)).

## Git hooks and gate ownership

pre-commit runs fast staged-file checks only (oxlint --fix, trailing-whitespace check — files end with exactly one newline); pre-push runs typecheck only; CI owns the exhaustive matrix ([.github/workflows/ci.yml](.github/workflows/ci.yml)). Never bypass a failing gate: fix it or prove the failure is environmental. Do not repeat an already-passing check for commit or push.
