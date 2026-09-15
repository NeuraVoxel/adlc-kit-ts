# Changelog

Notable changes to this repository are listed here by released semver. The version authority is root `package.json`; each released cut also carries an annotated git tag `v<version>`. Development accumulates under `## Unreleased`; a cut renames that heading (see [docs/release.md](docs/release.md)).

## Unreleased

## [0.2.0] — 2026-09-15

### Added

- Full Agent Notes gate coverage from the deepseek-harness comparison: the classification gate (`agent-note-tree.ts`, closed lifecycle/class sets including `archived/`), the format gate (`verify-agent-note-format.ts`, header block, per-lifecycle skeletons, alternatives mandate with the pre-format escape), and the frozen-archive gate (`verify-archived-agent-notes.ts`, append-only hash manifest). All join `doc-sync`; supersession, consolidation, archiving, and lifecycle-move rules are now written in the notes README.
- Per-subtree AGENTS.md supplements (`server/`, `apps/web/`, `packages/`, `scripts/`) with `CLAUDE.md` aliases: module-specific obligations (contract-first responses, bundle purity, seam ownership, gate-infrastructure rules) live beside the code they govern; scaffolds ship them, adopt mode does not.
- The explicit-approval standing order, migrated from ai-eng-kit: finishing a change ends with evidence and a report; `git commit` and `git push` run only on the user's explicit request, making the release cut a special case of the general rule.

## [0.1.0] — 2026-09-15

### Added

- Kit skeleton: React + Vite web face, Fastify server face, contracts seam package, the language-agnostic `run-gates` aggregate runner, lefthook hooks, the AGENTS.md instruction layer, the Agent Notes decision system, and the CI workflow.
- English-primary paired docs (`README`, `docs/*`, notes) with the `verify-doc-pairing` gate in the `doc-sync` aggregate; `AGENTS.md` stays English-only by exemption.
- `create-adlc-kit-ts` installer: `new` scaffolds a fresh project from the live checkout (identity renames, git init, `CLAUDE.md` alias); `adopt` installs rule components into an existing project, refusing overwrites without `--force`.
- Workflows migrated from ai-eng-kit: the inbox spark queue and learning-notes contracts, the `kit-*` skill family (`kit-inbox-capture`, `kit-inbox-promote`, `kit-learning-note`, `kit-release`), and this changelog with the release contract (`docs/release.md`).
