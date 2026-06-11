# KIT-005 Backlog Skill

## Status

implemented

## Lane

normal

## Product Contract

Ship a Codex skill that reads and safely mutates configured Backlog projects
through one CLI with compact output and dry-run defaults.

## Relevant Product Docs

- `docs/product/toolkits.md`
- `templates/.codex/skills/backlog/SKILL.md`

## Acceptance Criteria

- The skill has valid metadata and UI configuration.
- Read and write workflows share one CLI entry point.
- Write commands default to dry-run.
- Offline tests cover configuration, API payloads, workflows, and presentation.
- Local credentials and runtime logs are ignored.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Backlog unittest suite |
| Integration | Mocked API and workflow tests |
| E2E | Live API use is optional and credential-dependent |
| Platform | Python 3 |
| Release | Skill files are included in npm package |

## Evidence

```bash
cd templates/.codex/skills/backlog
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests
```
