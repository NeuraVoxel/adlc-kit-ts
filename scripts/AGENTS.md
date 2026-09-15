# AGENTS.md — scripts

Rules for the gate infrastructure only; repo-wide conventions live in the root [AGENTS.md](../AGENTS.md) and are not restated here.

- **Language-agnostic by contract.** The runner spawns argv and schedules a graph; it never parses a toolchain, never imports business code, and never reads a file format that an individual gate owns. Gate scripts are infrastructure: adding a lane for a new stack must not require touching them beyond Gate definitions.
- **One verify, one invariant, one rejection.** Each `verify-*.ts` checks exactly one invariant, and its spec proves it rejects one invalid case. A gate without a rejection test is decoration, and decoration fails review.
- **Lanes are data.** Adding an aggregate means extending the `Mode` union and `gatesForMode`; scheduling code does not change.
- **The pairing corpus is enumerated.** `pairedDirs` walks and `pairedRootFiles` are explicit lists; a new paired surface joins a list with its counterpart policy, and every exemption carries its reason inline.
- **Entry guards compare URLs.** Script entry points check `process.argv` against `import.meta.url` — never `import.meta.main`, which loader-based TS execution leaves undefined outside the invoking project.
