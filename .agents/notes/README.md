# Agent Notes

English | [中文](README.zh.md)

One kind of design doc lives here. An **Agent Note** records a decision that affects this repository — the *why* and *what we gave up*, the parts code and docs cannot carry. Session recaps and study notes do not belong here.

## Layout and naming

The path encodes two axes: `{lifecycle}/{class}/yyyy-mm-dd-topic.md`

- **lifecycle** (the top-level directory) is the status, and notes move between folders as it changes:
  - `proposed/` — reviewed proposals, not yet built.
  - `implemented/` — the decision shipped; the file records the decision and the rejected alternatives, and **stays current with what actually shipped**: when code later moves a file, renames a package, or changes a default, the same change updates the corresponding facts (facts only — never the decision itself).
  - `rejected/` — considered and declined; keep it only while its rationale prevents a plausible mistake, otherwise delete the pair.
- **class** (the nested directory) is the kind of decision, a closed set: `feature` / `bug-fix` / `simplification` / `architecture` / `process` / `testing`. Adding a class means updating this section first.

The date is when the topic was **first proposed** (per git history). Notes cross-reference through relative Markdown links, never bare filenames or numbers.

## When to write one

Every **non-trivial change** adds or updates at least one Agent Note in the same PR: changes to behavior, architecture, a contract shared across files or packages, process or tooling, testing strategy, an on-disk/wire/configuration format, or any decision a maintainer may reasonably revisit. Implemented notes sync with code moves, renames, and default changes in the same change. Purely mechanical or local edits are exempt. A note is never edited into a *different* decision: supersede it with a new note and cross-link.

## File format

The first three lines are exactly:

```markdown
# Agent Note: <title>

Status: <status>
```

`Status:` is `proposed`, `implemented`, or `rejected — <one-line why>`, and must agree with the lifecycle folder. The header tokens stay in English verbatim in both languages.

The body opens with `## Problem` (motivation only, readable without the solution):

- `proposed/`: `## Proposal` → bespoke sections → `## Alternatives considered` → `## Acceptance criteria` → `## Risks`.
- `implemented/`: `## Decision` (present tense, shipped reality) → bespoke sections → `## Alternatives considered` → `## Consequences` (both the cost and the benefit). Proposal-era headings (`## Proposal`, `## Acceptance criteria`) are not accepted under `implemented/`.
- `rejected/`: the proposal frozen as it was; the verdict lives on the `Status:` line.

Canonical section names stay English in both languages; the prose follows the file's language.

### Alternatives considered is mandatory

Every note carries an `## Alternatives considered` section: each genuine alternative and why it lost. A decision recorded without its opponents invites re-litigation — the failure notes exist to prevent.

The format gate (`verify-agent-note-format`) arrives when this repository sees its first format drift; until then review enforces this section.
