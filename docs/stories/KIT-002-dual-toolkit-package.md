# KIT-002 Dual Toolkit Package

## Status

implemented

## Lane

normal

## Product Contract

Publish both Codex and Gemini Antigravity templates, including their root
instruction sources.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/toolkits.md`

## Acceptance Criteria

- The npm package includes `templates/.codex/`.
- The npm package includes `templates/.antigravity/`.
- The npm package includes `templates/root/AGENTS.md`.
- Both mode-specific root instruction sources exist.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Not currently isolated |
| Integration | Inspect `npm pack --dry-run --json` |
| E2E | Not required |
| Platform | npm packaging |
| Release | Required template paths are present |

## Evidence

```bash
npm pack --dry-run --json
```
