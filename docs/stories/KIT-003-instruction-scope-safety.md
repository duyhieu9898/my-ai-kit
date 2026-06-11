# KIT-003 Instruction Scope Safety

## Status

implemented

## Lane

normal

## Product Contract

Keep repository-wide instructions separate from `.agents/` maintenance rules,
and preserve existing root instructions during toolkit updates.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/cli.md`
- `docs/product/toolkits.md`
- `docs/ARCHITECTURE.md`

## Acceptance Criteria

- Codex root instructions come from `templates/root/AGENTS.md`.
- Codex nested instructions come from `templates/.codex/AGENTS.md`.
- The two files have different scopes.
- `update` refreshes `.agents/` without overwriting root instructions.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Source contract assertions |
| Integration | Temporary layout inspection |
| E2E | Not currently automated |
| Platform | Filesystem copy semantics |
| Release | Both instruction files are packaged |

## Evidence

```bash
node --check bin/index.js
npm pack --dry-run --json
```
