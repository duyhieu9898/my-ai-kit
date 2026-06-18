# KIT-012 Reliable API Patterns Skill

## Status

implemented

## Lane

normal

## Product Contract

The Codex and Gemini API-patterns skills provide scoped API design guidance and
a validator that rejects invalid targets and malformed OpenAPI contracts
without treating unrelated source or tests as API implementation.

## Relevant Product Docs

- `docs/product/toolkits.md`
- `templates/codex/.agents/skills/api-patterns/SKILL.md`
- `templates/gemini/.agents/skills/api-patterns/SKILL.md`

## Acceptance Criteria

- Both skill descriptions clearly trigger for API contract design and review,
  while routing routine implementation elsewhere.
- Security, rate limiting, pagination, documentation, and validation steps are
  conditional on the request and risk model.
- The validator fails for missing targets, empty scans, and malformed OpenAPI
  contracts.
- The validator excludes tests, generated directories, and its own source.
- Codex and Gemini validator behavior remains identical.
- Regression tests and template consistency checks pass.

## Design Notes

- Commands: `python3 scripts/test_api_validator.py`, `npm run check:templates`
- Domain rules: OpenAPI structural failures are critical; source-code
  heuristics remain advisory because framework behavior varies.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Regression tests exercise valid, invalid, empty, and filtered scans. |
| Integration | Both shipped validator copies pass the same test suite. |
| E2E | Not required. |
| Platform | Template consistency and Codex skill validation pass. |
| Release | Not required because package boundaries are unchanged. |

## Harness Delta

Adds direct executable proof for the API validator behavior.

## Evidence

- `python3 scripts/test_api_validator.py` passed 5 regression tests for both
  shipped validator copies.
- Both validator files and the regression test passed `python3 -m py_compile`.
- Both skills passed the skill-creator `quick_validate.py` check.
- `npm run check:templates` passed 311 template consistency checks.
