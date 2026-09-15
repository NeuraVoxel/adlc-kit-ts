# Changelog

Notable changes to this repository are listed here by released semver. The version authority is root `package.json`; each released cut also carries an annotated git tag `v<version>`. Development accumulates under `## Unreleased`; a cut renames that heading (see [docs/release.md](docs/release.md)).

## Unreleased

### Added

- Kit skeleton: React + Vite web face, Fastify server face, contracts seam package, the language-agnostic `run-gates` aggregate runner, lefthook hooks, the AGENTS.md instruction layer, the Agent Notes decision system, and the CI workflow.
- English-primary paired docs (`README`, `docs/*`, notes) with the `verify-doc-pairing` gate in the `doc-sync` aggregate; `AGENTS.md` stays English-only by exemption.
- `create-adlc-kit-ts` installer: `new` scaffolds a fresh project from the live checkout (identity renames, git init, `CLAUDE.md` alias); `adopt` installs rule components into an existing project, refusing overwrites without `--force`.
- Workflows migrated from ai-eng-kit: the inbox spark queue and learning-notes contracts, the `kit-*` skill family (`kit-inbox-capture`, `kit-inbox-promote`, `kit-learning-note`, `kit-release`), and this changelog with the release contract (`docs/release.md`).
