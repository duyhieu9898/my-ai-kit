# KIT-022 Verify Command And Instruction Preservation

## Status

implemented

## Lane

normal

## Product Contract

The repository exposes one project-native verification command for common local
checks, and Codex installs preserve project-specific marked instruction blocks
when refreshing the root `AGENTS.md`.

## Relevant Product Docs

- `docs/product/cli.md`
- `docs/product/overview.md`
- `docs/stories/backlog.md`

## Acceptance Criteria

- `npm run verify` runs the core local verification checks without requiring
  agents to remember several separate commands.
- Codex install refreshes the kit-managed root instruction content from the
  template.
- Codex install preserves an existing `<!-- HARNESS:BEGIN -->` /
  `<!-- HARNESS:END -->` block in `AGENTS.md`.
- The installer regression test covers the preservation behavior in an
  isolated temporary project.
- Existing Codex and Gemini hook merge behavior remains covered.

## Design Notes

- Commands: add `npm run verify`.
- Domain rules: preserve marked instruction blocks with HTML comment markers
  shaped as `NAME:BEGIN` and `NAME:END`.
- UI surfaces: CLI behavior only; no app UI.

## Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id <id> --unit 1 --integration 1 --e2e 0 --platform 0`.

| Layer | Expected proof |
| --- | --- |
| Unit | `node --check bin/index.js` |
| Integration | `npm run test:installer` and `npm run verify` |
| E2E | Not required |
| Platform | `npm run check:templates` |
| Release | `git diff --check` |

## Harness Delta

Closes the most direct parts of backlog items 2 and 4: a single verification
entrypoint and a regression-proven guard against losing Harness instruction
blocks during install.

## Evidence

- `node --check bin/index.js` passed.
- `npm run test:installer` passed and covers preserving the `HARNESS` block.
- `npm run verify` passed.
- `scripts/bin/harness-cli story verify KIT-022` passed.
- `git diff --check` passed.
