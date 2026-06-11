# KIT-004 Installation Status

## Status

implemented

## Lane

tiny

## Product Contract

Report whether a toolkit is installed and identify Codex, Gemini Antigravity,
or obsolete installation directories.

## Relevant Product Docs

- `docs/product/cli.md`

## Acceptance Criteria

- Detect `.agents/`.
- Distinguish Gemini by `agents/` or `workflows/`.
- Report obsolete `.codex/` and `.agent/`.
- Return actionable install guidance when no toolkit exists.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Not currently isolated |
| Integration | `status --help` and source inspection |
| E2E | Not currently automated |
| Platform | Filesystem detection |
| Release | Not applicable |

## Evidence

```bash
node bin/index.js status --help
```
