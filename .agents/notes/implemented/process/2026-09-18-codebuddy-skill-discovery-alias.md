# Agent Note: CodeBuddy Code skill discovery alias

Status: implemented

## Problem

The `kit-*` workflow skills live in `.agents/skills/<name>/SKILL.md`: one tree, one home, shared by every agent tool that reads this repository. CodeBuddy Code discovers project skills only under `.codebuddy/skills/<name>/SKILL.md`, so on this checkout it loaded none of them — the skills existed, were documented in `AGENTS.md` and the README pair, and were unreachable in the tool this kit is actually driven from. The bridge cannot move the skills or copy their content: both would give the same facts a second home and break the installer's `workflows` component.

## Decision

`.codebuddy/skills` is one relative symlink to `../.agents/skills`. Skills are authored and edited under `.agents/skills/` only; the alias is never edited, and it carries no files of its own. `packages/create-adlc-kit-ts/bin.ts` recreates the alias after both `new` and `adopt`, for the same reason it recreates `CLAUDE.md`: `fs.cp` materializes copied symlinks as absolute paths pointing back at the source checkout. `adopt` links only when the target actually has `.agents/skills` (never a dangling alias), replaces an existing symlink, and leaves a real directory alone, because a target may own skills the kit does not ship.

## Alternatives considered

- **Move the skills to `.codebuddy/skills/` and retire `.agents/skills/`.** Lost: the tree is tool-neutral, and everything already points at it — the skills' own relative links (`../../inbox/README.md`), `docs/release*.md`, `README.md`, and the installer's `workflows` component would all change, and the next tool with its own discovery directory would restart the same migration.
- **Per-skill symlinks (`.codebuddy/skills/<name>`).** Lost: adding a skill becomes two edits, and forgetting the second leaves it silently invisible. One directory link covers the whole family, present and future.
- **Thin forwarding `SKILL.md` files under `.codebuddy/`.** Lost: `name` and `description`, the fields the model matches on, would live in two places and drift — duplication the one-home rule exists to prevent.
- **Copy the `SKILL.md` files.** Same duplication, and worse: nothing would keep the copies in sync.
- **Document the gap instead and let each CodeBuddy user configure discovery.** Lost: the kit's own workflow skills stay unreachable in the tool that runs the kit.

## Consequences

CodeBuddy Code lists the four `kit-*` skills and skill authoring is unchanged. Two obligations follow. New skills go under `.agents/skills/` — the alias picks them up, and a real file added under `.codebuddy/` would be a second home that the alias then shadows. Any change to how the installer handles symlinks must keep recreating this alias, under the same relative-link rule that governs `CLAUDE.md`. Where symlinks are unavailable the installer falls back to a copied tree, which then stops tracking skills added later: a known cost of the fallback, not of the alias.
