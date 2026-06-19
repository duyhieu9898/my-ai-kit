# KIT-020 Shared Codex And Gemini Lifecycle Guards

## Status

implemented

## Lane

normal

## Product Contract

Codex and Gemini Antigravity install equivalent warning-only Harness lifecycle
guards from one shared policy source while retaining target-native hook
configuration and project-owned custom hooks.

## Relevant Product Docs

- `docs/product/toolkits.md`
- `docs/stories/KIT-018-codex-hooks.md`
- `docs/stories/KIT-019-evaluate-codex-hook-sessions.md`

## Acceptance Criteria

- `shared/hooks/harness_guard.py` is the canonical context and safety policy.
- Codex and Gemini use small adapters for their native payload and output
  contracts.
- Gemini installs a workspace `.agents/hooks.json` entry for `PreToolUse`.
- Repeated Codex or Gemini updates do not duplicate the managed hook.
- Existing Codex config/hooks and Gemini hook entries/scripts are preserved.
- The shared policy recognizes Codex shell payloads, Antigravity
  `run_command`, and Antigravity `view_file` ranges.
- Hook source drift and core behavior are checked mechanically.

## Design Notes

- Hooks remain warning-only.
- Codex surfaces warnings through `systemMessage`.
- Gemini returns `decision: allow` and includes warning context in `reason`.
- Gemini evaluates context-read scope before tool execution because its
  `PostToolUse` payload does not include the completed tool call or arguments.
- Gemini uses a `*` tool matcher and lets the shared policy classify tools so
  the adapter is resilient to supported-tool additions.
- Generated target copies remain committed because remote installs download
  one template subdirectory rather than the repository-level shared source.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Shared guard and adapter regression tests |
| Integration | Installer merge tests for Codex and Gemini |
| E2E | Not required until real Antigravity session evaluation |
| Platform | Template consistency and npm package contents |
| Release | Syntax checks and `git diff --check` |

## Harness Delta

The lifecycle guard is now a cross-target Harness component. Real-session
effectiveness remains tracked separately by `KIT-019`.

## Evidence

- `npm run test:hooks`
- `npm run test:installer`
- `npm run check:templates`
- `node --check bin/index.js`
- `python3 -m py_compile shared/hooks/*.py scripts/test-hooks.py`
- `npm pack --dry-run --json` (six generated hook assets included)
- `git diff --check`
