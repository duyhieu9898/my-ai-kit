# KIT-018 Codex Lifecycle Hooks

## Status

implemented

## Lane

normal

## Product Contract

The Codex target installs warning-only lifecycle hooks without replacing
project-owned `.codex` configuration or unrelated custom hooks.

## Relevant Product Docs

- `docs/product/toolkits.md`

## Acceptance Criteria

- Codex installation includes `.codex/hooks.json` and
  `.codex/hooks/harness_guard.py`.
- Existing `.codex/config.toml` and custom hook groups are preserved.
- Updating the kit replaces the managed hook without duplicating it.
- Switching away from Codex removes the managed hook and preserves custom
  hooks.
- Hook behavior is documented outside `AGENTS.md` so every session does not pay
  context cost for implementation details.

## Design Notes

- `.agents/` remains an atomically replaced runtime directory.
- `.codex/` uses a structured merge.
- Managed hook ownership is identified by the
  `.codex/hooks/harness_guard.py` command marker.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Installer merge regression test |
| Integration | Template consistency and CLI syntax checks |
| E2E | Not required |
| Platform | npm package contains Codex hook files |
| Release | `git diff --check` |

## Harness Delta

Added warning-only Codex hooks that discourage broad Harness reads and flag
mechanical safety risks.

## Evidence

- `npm run test:installer`
- `npm run check:templates`
- `node --check bin/index.js`
- `npm pack --dry-run --json`
- `git diff --check`
