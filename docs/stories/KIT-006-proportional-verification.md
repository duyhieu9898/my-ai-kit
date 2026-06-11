# KIT-006 Proportional Change Verification

## Status

implemented

## Lane

normal

## Product Contract

The `verify-changes` skill must select executable evidence from repository
instructions, Harness risk lanes, story criteria, and project-native commands.
It must not turn every code change into an unconditional full-suite audit.

## Relevant Product Docs

- `docs/HARNESS.md`
- `docs/FEATURE_INTAKE.md`
- `docs/TEST_MATRIX.md`
- `templates/root/AGENTS.md`

## Acceptance Criteria

- Harness and explicit repository requirements take precedence over skill defaults.
- Tiny, normal, high-risk, and release work receive proportional validation.
- Existing project commands and nearby tests are preferred.
- Missing tests result in focused executable proof or an explicit proof gap.
- API, browser, database, edge-case, and full-suite checks are conditional.
- Codex and Antigravity guidance express the same verification contract.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Frontmatter and skill structure validation |
| Integration | Cross-template contract assertions |
| E2E | Not applicable |
| Platform | Antigravity `/verify` workflow alignment |
| Release | Package content remains covered by KIT-002 |

## Harness Delta

Adds a durable decision that makes proportional verification the toolkit
default while preserving stronger story and proof-matrix requirements.

## Evidence

- Skill validator passes for both toolkit variants.
- Source assertions confirm authority order, proportional lanes, narrow-first
  execution, and conditional edge-case guidance.
