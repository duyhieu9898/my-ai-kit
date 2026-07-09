# KIT-023 Isolated Installer Integration Tests

## Status

implemented

## Lane

normal

## Product Contract

Installer behavior has network-free temporary-project regression tests covering
target detection, overwrite/update semantics, root instruction preservation,
and target-switch cleanup boundaries.

## Relevant Product Docs

- `docs/product/cli.md`
- `docs/product/overview.md`
- `docs/stories/backlog.md`

## Acceptance Criteria

- The installer test suite exercises Codex, Gemini, and Claude Code template
  installation in isolated temporary directories.
- Status detection is covered through required runtime folders, settings files,
  and root instruction presence.
- Update-style installs preserve existing root instructions.
- Force/init-style installs refresh root instructions while preserving marked
  project instruction blocks.
- Runtime refresh removes stale kit-owned files and preserves project-owned hook
  config.
- The tests run without downloading templates or mutating the repository root.

## Design Notes

- Commands: keep the coverage under `npm run test:installer`.
- Domain rules: use local `templates/` as fixtures and temporary directories as
  project roots.
- UI surfaces: CLI behavior only; no UI.

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

Closes backlog item 1 by turning installer behavior assumptions into
repeatable local regression coverage.

## Evidence

- `npm run test:installer` passed, covering isolated Codex/Gemini installs,
  marker and fallback target detection, update-style root preservation,
  force-style instruction refresh with marked block preservation, and
  target-switch cleanup.
- `npm run verify` passed.
- `scripts/bin/harness-cli story verify KIT-023` passed.
- `git diff --check` passed.
