# KIT-009 Template Consistency Check

## Status

implemented

## Lane

normal

## Product Contract

The repository provides an executable check that detects drift between live
toolkit templates, product docs, architecture docs, and basic skill metadata.

## Relevant Product Docs

- `docs/product/toolkits.md`
- `templates/.agents/ARCHITECTURE.md`
- `templates/.agents/gemini/ARCHITECTURE.md`

## Acceptance Criteria

- The check compares documented Codex and Gemini template counts to the
  filesystem.
- The check verifies Codex skill directories have matching `agents/openai.yaml`
  sidecars.
- The check verifies each shipped Codex and Gemini skill has `SKILL.md`
  frontmatter with matching `name` and a `description`.
- The check verifies known layout contracts such as Gemini's empty rules
  placeholder.
- The check is available through a project-native command.

## Design Notes

- Commands: `npm run check:templates`
- Domain rules: keep the check deterministic and dependency-free.

## Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id <id> --unit 1 --integration 1 --e2e 0 --platform 0`.

| Layer | Expected proof |
| --- | --- |
| Unit | `node --check scripts/check-template-consistency.mjs` |
| Integration | `npm run check:templates` |
| E2E | Not required |
| Platform | Not required |
| Release | Optional package dry-run when release packaging changes |

## Harness Delta

Adds a reusable validation command for template/doc drift.

## Evidence

- `node --check scripts/check-template-consistency.mjs` passed.
- `scripts/bin/harness-cli story verify KIT-009` passed via
  `npm run check:templates`.
- `npm pack --dry-run --json` package inspection confirmed
  `scripts/check-template-consistency.mjs` is included in the npm payload.
