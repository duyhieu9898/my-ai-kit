# KIT-026 Claude Code Runtime

## Status

implemented

## Lane

normal

## Product Contract

The installer ships Claude Code instructions and warning-only Harness guard
hooks alongside the existing Codex and Gemini runtimes.

## Relevant Product Docs

- `docs/product/cli.md`
- `docs/product/toolkits.md`

## Acceptance Criteria

- `init`, `update`, and `repair` install or refresh `CLAUDE.md` and Claude
  project settings without overwriting project-owned settings.
- Claude Code hooks use the shared Harness guard policy through a Claude
  adapter and remain warning-only.
- Status detection reports corruption when the Claude runtime files are
  missing.
- Package/template checks include the Claude Code files.

## Design Notes

- Commands: `init`, `update`, `repair`, `status`.
- Domain rules: reuse `.agents/skills`, `.agents/scripts`, and
  `shared/hooks/harness_guard.py`; do not copy all skills into `.claude/`.

## Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id KIT-026 --unit 1 --integration 1 --e2e 0 --platform 1`.

| Layer | Expected proof |
| --- | --- |
| Unit | hook adapter tests |
| Integration | installer regression and template consistency checks |
| E2E | not required |
| Platform | package dry-run or full verify |
| Release | `npm run verify` when practical |

## Harness Delta

Claude Code becomes a first-class installed runtime in the toolkit contract.

## Evidence

- `node --check bin/index.js` passed.
- `python3 scripts/test-hooks.py` passed 11 tests.
- `npm run check:shared-hooks` passed.
- `npm run test:installer` passed.
- `npm run check:templates` passed 768 checks.
- `npm run verify` passed.
- `npm pack --dry-run --json` included `templates/CLAUDE.md`,
  `templates/.claude/settings.json`, and
  `templates/.agents/claude/hooks/*`.
- `scripts/bin/harness-cli story verify KIT-026` passed using `npm run verify`.
