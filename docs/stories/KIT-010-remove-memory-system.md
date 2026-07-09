# KIT-010 Remove Memory System

## Status

implemented

## Lane

normal

## Product Contract

Codex and Gemini templates do not ship a separate persistent memory skill or
remember workflow. Durable project context belongs in Harness records such as
intake, stories, decisions, traces, and proof evidence.

## Relevant Product Docs

- `docs/product/toolkits.md`
- `templates/.agents/ARCHITECTURE.md`
- `templates/.agents/gemini/ARCHITECTURE.md`

## Acceptance Criteria

- Codex no longer ships `templates/.agents/skills/memory-system/`.
- Gemini no longer ships `templates/.agents/gemini/skills/memory-system/`.
- Gemini no longer ships `.agents/workflows/remember.md`.
- Toolkit docs and architecture docs report the current skill/workflow counts.
- Template consistency validation passes after removal.

## Design Notes

- Durable memory-like project records should use Harness rather than a parallel
  `.agents/memory/` mechanism.
- No install/update behavior changes are required because the removed files were
  part of the replaceable template payload.

## Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id <id> --unit 1 --integration 1 --e2e 0 --platform 0`.

| Layer | Expected proof |
| --- | --- |
| Unit | `node --check scripts/check-template-consistency.mjs` |
| Integration | `npm run check:templates` |
| E2E | Not required |
| Platform | `npm pack --dry-run --json` payload inspection |
| Release | Remote install smoke after push |

## Harness Delta

Keeps Harness as the durable record layer and removes the parallel memory
mechanism from shipped templates.

## Evidence

- `node --check scripts/check-template-consistency.mjs` passed.
- `scripts/bin/harness-cli story verify KIT-010` passed via
  `npm run check:templates` with `Template consistency check passed:
  311 checks.`
- `npm pack --dry-run --json` package inspection confirmed `memory-system` and
  `workflows/remember.md` are excluded from the npm payload.
