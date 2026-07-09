# KIT-011 Sync Backlog Runtime

## Status

implemented

## Lane

normal

## Product Contract

Codex and Gemini ship the same shared Backlog runtime implementation while
preserving target-specific skill metadata. Codex keeps `agents/openai.yaml` and
Codex-style `SKILL.md` frontmatter.

## Relevant Product Docs

- `docs/product/toolkits.md`
- `templates/.agents/skills/backlog/SKILL.md`
- `templates/.agents/gemini/skills/backlog/SKILL.md`

## Acceptance Criteria

- Shared Backlog runtime directories are synchronized from Gemini to Codex:
  `backlog_tool/`, `config/`, `references/`, `scripts/`, `tests/`, and
  `workflows/`.
- Codex retains `templates/.agents/skills/backlog/agents/openai.yaml`.
- Codex retains Codex-style `SKILL.md` metadata.
- Python `__pycache__` and bytecode artifacts are absent from both Backlog
  templates.
- Backlog workflow audit passes for both templates.

## Design Notes

- Do not copy Gemini-only skill metadata over Codex metadata.
- Runtime logs and local `.env` files remain ignored by each Backlog skill's
  `.gitignore`.

## Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id <id> --unit 1 --integration 1 --e2e 0 --platform 1`.

| Layer | Expected proof |
| --- | --- |
| Unit | `uvx --with requests pytest <backlog tests>` in both templates |
| Integration | `python3 scripts/backlog.py config audit-workflows` in both templates |
| E2E | Not required |
| Platform | `npm run check:templates` |
| Release | Optional package dry-run |

## Harness Delta

Backlog runtime now has one canonical source under
`shared/runtime/.agents/skills/backlog/`. The sync command refreshes both
templates without overwriting target-specific skill metadata.

## Evidence

- `python3 scripts/backlog.py config audit-workflows` passed in both Codex and
  Gemini Backlog skill directories.
- `node --check scripts/check-template-consistency.mjs` passed.
- `scripts/bin/harness-cli story verify KIT-011` passed via
  `npm run check:templates` with `Template consistency check passed:
  311 checks.`
- `uvx --with requests pytest templates/.agents/skills/backlog/tests`
  passed with 92 tests.
- `uvx --with requests pytest templates/.agents/gemini/skills/backlog/tests`
  passed with 92 tests.
