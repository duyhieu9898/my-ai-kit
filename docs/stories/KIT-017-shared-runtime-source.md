# KIT-017 Shared Runtime Source

## Status

implemented

## Lane

normal

## Product Contract

Runtime files intentionally shared by Codex and Gemini have one canonical
source while both installable templates remain complete, committed mirror
trees.

## Relevant Product Docs

- `docs/product/toolkits.md`
- `docs/ARCHITECTURE.md`
- `shared/runtime/`
- `scripts/sync-shared-runtime.mjs`

## Acceptance Criteria

- All 41 executable script paths shared by Codex and Gemini are edited under
  `shared/runtime/` and synchronized to both templates.
- Shared Backlog runtime directories are canonical under `shared/runtime/`:
  `backlog_tool/`, `config/`, `references/`, `scripts/`, `tests/`, and
  `workflows/`.
- Backlog `SKILL.md`, Codex `agents/openai.yaml`, `.env`, and `logs/` remain
  target-specific and are not overwritten by synchronization.
- `npm run sync:shared-runtime` repairs target drift.
- `npm run check:shared-runtime` fails on drift without writing files.
- Installation remains a direct target-template mirror-copy.

## Design Notes

- Shared paths mirror their destination below `.agents/`.
- Generated target copies remain committed and packaged.
- Canonical source and sync tooling are repository development assets and are
  not included in the npm installer package.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Drift check fails after a controlled target mutation and sync repairs it. |
| Integration | Shared check covers all executable scripts, both targets, and Backlog directories. |
| E2E | Not required. |
| Platform | Template consistency and package dry-run pass. |
| Release | Not required. |

## Harness Delta

Replaces manual cross-target runtime copying with an executable canonical
source and drift check.

## Evidence

- `npm run test:shared-runtime` introduced controlled Gemini drift, confirmed
  check failure, repaired it, and preserved Gemini Backlog `SKILL.md` plus
  Codex `agents/openai.yaml`.
- `npm run check:shared-runtime` passed for all 41 shared executable scripts
  and six Backlog runtime directories across both targets.
- `python3 scripts/test-validator-regressions.py` passed 16 tests.
- `python3 scripts/test_api_validator.py` passed 5 tests.
- `python3 -m compileall -q shared/runtime/.agents` compiled the complete
  canonical Python script tree.
- Backlog tests passed 92 tests for Codex and 92 tests for Gemini.
- `config audit-workflows` passed 11 checks for each target.
- `npm run check:templates` passed 322 checks.
- `npm pack --dry-run --json` retained the existing 501-file installer shape,
  sampled generated copies from top-level, `.shared`, and skill scripts,
  excluded development-only shared source and sync scripts, and contained no
  Python cache artifacts.
- `git diff --check` passed.
