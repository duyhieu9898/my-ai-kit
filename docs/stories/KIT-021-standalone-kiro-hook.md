# KIT-021 Standalone Kiro Harness Hook

## Status

retired

## Lane

normal

## Product Contract

The package must not ship the standalone Kiro `askAgent` guard because its
per-tool model calls add credit, token, and latency cost without providing the
deterministic boundary available in Codex and Gemini.

## Relevant Product Docs

- `docs/product/toolkits.md`
- `docs/stories/KIT-020-shared-codex-gemini-hooks.md`

## Acceptance Criteria

- Remove `templates/kiro/.kiro/hooks/harness-guard.kiro.hook`.
- Remove Kiro hook assertions and package documentation.
- Keep Kiro out of the installed runtime set.
- Preserve this story as the reason not to reintroduce an always-on
  `preToolUse` `askAgent` guard.
- Reconsider a deterministic Kiro adapter only after Kiro IDE command hooks
  expose complete structured tool arguments.

## Design Notes

- Kiro IDE `runCommand` hooks currently lack complete tool arguments.
- `askAgent` before common shell/write calls invokes another model loop and can
  be slower, noisier, and more expensive than the behavior it protects.
- Agent self-review is not an independent deterministic safety boundary.
- A future Kiro hook should use a command adapter only when structured tool
  payloads are available and verified.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Kiro-specific assertions removed without breaking template checks |
| Integration | Not required; no installer target is added |
| E2E | Not required |
| Platform | npm package contains no `templates/kiro/` artifact |
| Release | `git diff --check` |

## Harness Delta

The experimental Kiro hook was rolled back after review showed its
`askAgent` implementation worked against the kit's token and latency goals.

## Evidence

- Initial experiment: native Kiro hook schema and package checks passed.
- Review outcome: remove the hook because correctness depended on another LLM
  call for every matched tool invocation.
- `npm run check:templates` passed 327 checks after removal.
- `npm run test:hooks` passed 9 tests.
- `npm run test:installer` passed.
- `npm pack --dry-run --json` contains no `templates/kiro/` artifacts.
- `git diff --check` passed.
