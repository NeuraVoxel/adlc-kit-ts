# Agent Note: Gate the reference integrity of the documentation and instruction layers

Status: implemented

## Problem

The repository enforced the *structure* of its documentation but never the *existence or currency of its referents*. Two instances had shipped green through `pnpm run check:all`:

- **Fact drift.** `docs/architecture.md` and `docs/architecture.zh.md` described `doc-sync` as bilingual pairings alone, while `gatesForMode('doc-sync')` returned four gates; the three Agent Note gates added in v0.2.0 reached `ChangeLog.md` and never the architecture map. `verify-doc-pairing` compares only `## ` heading counts and fence counts, so both languages drifting together stayed green.
- **Dangling reference.** `COMPONENTS` filed `docs/release.md` and `ChangeLog.md` under `workflows` rather than `docs`, so `adopt --only rules,docs` installed the root `AGENTS.md` — which links `docs/release.md` — without the file it points at.

Both contradict the root standing order never to silently skip a missing referent; the violations sat in the document and distribution layers instead of the code layer. The class had recurred twice, which is this repository's threshold for turning a soft convention into a gate.

Promoted from the inbox spark [doc-reference-integrity-not-gated](../../../inbox/2026-09-15-doc-reference-integrity-not-gated.md); the walkthrough that surfaced it is [AI engineering capabilities](../../../learning/2026-09-15-ai-engineering-capabilities.md), gaps 9 and 10.

## Decision

`scripts/verify-doc-references.ts` joins `doc-sync` as the gate for one invariant: every repository-relative Markdown link in the paired corpus resolves to a path that exists, and none escapes the repository. The corpus and the exemption rule are imported from `verify-doc-pairing` rather than re-derived, so the two gates cannot disagree about what "the documentation corpus" is. External URLs, protocol-relative targets, pure anchors, and paths written inside code spans or fenced blocks are out of scope — a path inside code is illustrative, not a referent. The success line reports the references actually checked, not the corpus size.

The same change repairs what the gate found:

- The architecture map lists all five `doc-sync` gates in both languages.
- The notes README pair's gate links, which pointed one directory level above the repository root, now resolve.

The shipped instruction layer is made self-contained per component set: `COMPONENT_REQUIRES` declares that `rules` carries referents in `docs`, `workflows`, and `ci`, and `adopt` rejects an incomplete selection before writing anything, naming the component that carries the missing referent. `lib.spec.ts` re-derives that map from the links `AGENTS.md` actually makes, so it cannot drift.

The gate also exposed two scaffold defects, fixed here because a gate that fails the product's own output is not shippable:

- `applyRenames` rewrote Markdown link *targets*, so a scaffold pointed at `2026-09-15-create-smoke-installer.md` and `packages/create-smoke/README.md` while the files on disk kept their original names. Link targets are paths, not prose: they are now preserved, while link text is still renamed.
- A scaffold links the installer package it deliberately excludes. `pruneExcludedReferences` unwraps a link whose target the copy excludes, keeping the text and dropping the reference.

## Alternatives considered

- **Do nothing; review catches it.** Rejected: review had already missed both instances while `check:all` reported seven green gates, and the pairing gate is blind to content drift by construction.
- **Compare section titles in `verify-doc-pairing`.** Rejected: it would have caught the architecture-map drift only because both files shared the stale heading. It cannot validate a link target or an installed component subset, and widening that gate re-opens a scope the pairing README records as deliberate.
- **A full link checker including external URLs.** Deferred: it puts network dependence and flakiness into a gate that must stay deterministic and offline, and no observed defect involves an external URL.
- **Ship the cited Agent Notes so an adopted tree is green as well.** Deferred: adopters are already told to prune kit-history lines, and shipping kit decision records would change what `adopt` delivers — a product decision this change does not make. The consequence is recorded below.
- **Document the component referents in the installer README instead of gating them.** Rejected: the same review-only failure mode; `packages/AGENTS.md` already requires a component change to touch four places, and this would add a fifth unverified one.

## Consequences

Evidence. `pnpm run check:all` is green across eight gates; `doc-references` reports the references it checked in the paired corpus. `lib.spec.ts` (16 tests) re-derives the component dependency map from `AGENTS.md` and proves the `rules,docs` rejection; `verify-doc-references.spec.ts` (10 tests) proves the gate rejects a dangling reference, an escaping reference, and ignores code spans. A real adopt smoke shows `--only rules,docs` exiting 1 with `rules needs workflows, ci` and zero files written, a complete selection installing 51 files, and a fresh `new` scaffold passing the shipped gate where it previously failed on four references.

Costs and open boundaries:

- An adopted tree stays red on its kit-history links (the citations of individual Agent Notes in `docs/*.md`) until the adopter prunes them; the adopt next-steps and the installer README say so. Shipping the cited notes would remove that, at the price of delivering kit decision history into every adopter.
- Spark files, learning notes, and `AGENTS.md` are outside the corpus: the first two are deliberately ungated user content, and the instruction layer is owned by the component dependency instead. Repairing an inbound link after a note changes lifecycle is therefore still a manual obligation.
- The scaffold's architecture table still names the excluded installer package. It is prose in a table cell rather than a link, so no gate sees it; doc adaptation covers it.
- The skeleton is triplicated across the three kits, so this gate drifts at the kit level unless the siblings adopt it at their next tagged sync.
